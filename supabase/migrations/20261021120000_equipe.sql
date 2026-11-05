-- =====================================================================================
-- Pelé Academia — funcionários por convite e administradores (Sprint 4)
-- Como usar: Supabase → SQL Editor → cole este arquivo inteiro → Run.
-- Requer as migrations anteriores. Pode rodar mais de uma vez. Não apaga dados.
--
-- Antes: só os e-mails da staff_allowlist viravam funcionário (lista fixa no SQL).
-- Agora: um ADMINISTRADOR gera um convite para um e-mail; quem cria a conta com esse
-- convite vira funcionário. A lista antiga continua valendo para as duas contas de teste.
-- =====================================================================================

-- ---------- 1) Administrador e conta desativada ----------
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists active   boolean not null default true;
alter table public.staff_allowlist add column if not exists is_admin boolean not null default false;

-- Primeiro administrador: a conta de teste da coordenação. Para promover outra pessoa pelo
-- SQL Editor: update public.profiles set is_admin = true where lower(email) = 'nome@dominio';
update public.staff_allowlist set is_admin = true where email = 'funcionario@academiapele.com';
update public.profiles p set is_admin = true
from public.staff_allowlist s
where lower(s.email) = lower(p.email) and s.is_admin and p.role = 'staff' and not p.is_admin;

-- Funcionário desativado perde todas as permissões de funcionário (as policies usam is_staff()).
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'staff' and active);
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'staff' and active and is_admin);
$$;

-- Atletas deixam de ver (e de escrever para) funcionários desativados.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or (role = 'staff' and active) or public.is_staff());

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and auth.uid() in (athlete_id, staff_id)
    and exists (select 1 from public.profiles p where p.id = athlete_id and p.role = 'player')
    and exists (select 1 from public.profiles p where p.id = staff_id   and p.role = 'staff' and p.active)
  );

-- ---------- 2) Convites ----------
-- O código vai só no link; o banco guarda o hash (como um token de acesso: quem lê a tabela não consegue usar).
create table if not exists public.staff_invites (
  id          bigint generated always as identity primary key,
  email       text not null check (email = lower(btrim(email)) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  code_hash   text not null unique,
  is_admin    boolean not null default false,
  created_by  uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '7 days',
  used_by     uuid references public.profiles (id) on delete set null,
  used_at     timestamptz,
  revoked_by  uuid references public.profiles (id) on delete set null,
  revoked_at  timestamptz
);
create index if not exists staff_invites_email_idx on public.staff_invites (email);

create or replace function public.invite_hash(p_code text)
returns text language sql immutable as $$
  select encode(sha256(convert_to(btrim(p_code), 'UTF8')), 'hex');
$$;

-- Gera o convite e devolve o código UMA vez. Um convite novo para o mesmo e-mail cancela o anterior.
create or replace function public.create_staff_invite(p_email text, p_admin boolean default false)
returns table (id bigint, code text, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  e text := lower(btrim(coalesce(p_email, '')));
  c text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  inv public.staff_invites;
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid_email'; end if;
  if exists (select 1 from public.profiles p where lower(p.email) = e) then raise exception 'invite_email_taken'; end if;
  update public.staff_invites s set revoked_at = now(), revoked_by = auth.uid()
  where s.email = e and s.used_at is null and s.revoked_at is null;
  insert into public.staff_invites (email, code_hash, is_admin) values (e, public.invite_hash(c), coalesce(p_admin, false))
  returning * into inv;
  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values (auth.uid(), 'create', 'staff_invite', inv.id::text, jsonb_build_object('email', e, 'is_admin', inv.is_admin));
  return query select inv.id, c, inv.expires_at;
end;
$$;

create or replace function public.revoke_staff_invite(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare inv public.staff_invites;
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  update public.staff_invites set revoked_at = now(), revoked_by = auth.uid()
  where id = p_id and used_at is null and revoked_at is null
  returning * into inv;
  if not found then raise exception 'invite_not_pending'; end if;
  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values (auth.uid(), 'revoke', 'staff_invite', inv.id::text, jsonb_build_object('email', inv.email));
end;
$$;

-- Tela "aceitar convite" (ainda sem conta): diz se o link vale, para qual e-mail e até quando.
-- Código errado não devolve nada; o código tem 256 bits aleatórios, então não dá para adivinhar.
create or replace function public.check_staff_invite(p_code text)
returns table (email text, status text, expires_at timestamptz, is_admin boolean, invited_by text)
language sql stable security definer set search_path = public as $$
  select s.email,
         case when s.used_at is not null then 'used' when s.revoked_at is not null then 'revoked'
              when s.expires_at <= now() then 'expired' else 'valid' end,
         s.expires_at, s.is_admin, coalesce(p.name, '')
  from public.staff_invites s left join public.profiles p on p.id = s.created_by
  where s.code_hash = public.invite_hash(coalesce(p_code, ''));
$$;

-- ---------- 3) Criação da conta: convite vira funcionário ----------
-- O papel continua decidido aqui, no servidor. Convite inválido derruba a criação da conta
-- (o site confere o convite antes, com check_staff_invite, para mostrar o motivo).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta  jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  code  text := nullif(btrim(meta ->> 'invite'), '');
  inv   public.staff_invites;
  allow public.staff_allowlist;
  v_role  text := 'player';
  v_admin boolean := false;
begin
  select * into allow from public.staff_allowlist s where lower(s.email) = lower(new.email);
  if found then v_role := 'staff'; v_admin := allow.is_admin; end if;
  if code is not null then
    select * into inv from public.staff_invites s where s.code_hash = public.invite_hash(code) for update;
    if not found or inv.used_at is not null or inv.revoked_at is not null or inv.expires_at <= now()
       or inv.email <> lower(new.email) then
      raise exception 'invite_invalid';
    end if;
    v_role := 'staff'; v_admin := inv.is_admin;
  end if;

  insert into public.profiles (id, email, role, is_admin, name, data)
  values (new.id, new.email, v_role, v_admin,
          coalesce(nullif(meta ->> 'name', ''), split_part(new.email, '@', 1)),
          coalesce(meta -> 'public', '{}'::jsonb));
  insert into public.profile_private (id, data)
  values (new.id, coalesce(meta -> 'private', '{}'::jsonb));

  if code is not null then
    update public.staff_invites set used_at = now(), used_by = new.id where id = inv.id;
    insert into public.audit_log (actor_id, action, entity, entity_id, details)
    values (new.id, 'accept', 'staff_invite', inv.id::text, jsonb_build_object('email', inv.email, 'is_admin', inv.is_admin));
  end if;
  return new;
end;
$$;

-- ---------- 4) Administrador altera funcionários ----------
-- Só pela função: ninguém altera role/is_admin/active direto (o grant de update de profiles é só name e data).
-- Ninguém altera a própria conta, então sempre sobra pelo menos um administrador ativo (quem fez a ação).
create or replace function public.update_staff(p_profile uuid, p_active boolean, p_admin boolean)
returns void language plpgsql security definer set search_path = public as $$
declare
  old_row public.profiles;
  changes jsonb := '{}'::jsonb;
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  if p_profile = auth.uid() then raise exception 'cannot_change_self'; end if;
  select * into old_row from public.profiles where id = p_profile for update;
  if not found or old_row.role <> 'staff' then raise exception 'not_staff'; end if;
  if old_row.active is distinct from p_active then changes := changes || jsonb_build_object('active', jsonb_build_object('de', old_row.active, 'para', p_active)); end if;
  if old_row.is_admin is distinct from p_admin then changes := changes || jsonb_build_object('is_admin', jsonb_build_object('de', old_row.is_admin, 'para', p_admin)); end if;
  if changes = '{}'::jsonb then return; end if;
  update public.profiles set active = p_active, is_admin = p_admin where id = p_profile;
  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values (auth.uid(),
          case when old_row.active and not p_active then 'deactivate' when not old_row.active and p_active then 'reactivate' else 'update' end,
          'staff', p_profile::text, changes || jsonb_build_object('email', old_row.email));
end;
$$;

-- ---------- 5) Permissões ----------
alter table public.staff_invites enable row level security;
revoke all on public.staff_invites from anon, authenticated;
-- Sem code_hash: nem o administrador lê o hash pela API.
grant select (id, email, is_admin, created_by, created_at, expires_at, used_by, used_at, revoked_by, revoked_at) on public.staff_invites to authenticated;
drop policy if exists invites_select on public.staff_invites;
create policy invites_select on public.staff_invites for select to authenticated using (public.is_admin());

revoke all on function public.create_staff_invite(text, boolean), public.revoke_staff_invite(bigint),
               public.update_staff(uuid, boolean, boolean), public.check_staff_invite(text) from public;
grant execute on function public.create_staff_invite(text, boolean), public.revoke_staff_invite(bigint),
                          public.update_staff(uuid, boolean, boolean) to authenticated;
grant execute on function public.check_staff_invite(text) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;
