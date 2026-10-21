-- Olheiros de clubes: um terceiro tipo de conta, separado da equipe da Pelé Academia.
-- Regras (no banco, não só na tela):
--   * entra só por convite de um administrador da academia, preso ao e-mail, com o clube informado;
--   * vê apenas atletas que ativaram a vitrine para clubes (menores só com autorização do responsável);
--   * não cria peneiras, não avalia, não conversa direto com atletas: pede contato, e a equipe decide.
-- Nada é apagado: a migration só acrescenta colunas, uma tabela e regras.

-- ---------- 1) Papel novo ----------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('player', 'staff', 'scout'));

create or replace function public.is_scout()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'scout' and active);
$$;

-- Atleta na vitrine: ativou (data.showcase) e, se for menor, tem a autorização do responsável em vigor.
create or replace function public.in_showcase(p_athlete uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select p.role = 'player' and (p.data ->> 'showcase') = 'true' and not public.needs_guardian(p.id)
    from public.profiles p where p.id = p_athlete
  ), false);
$$;

-- ---------- 2) Convite com tipo de acesso ----------
alter table public.staff_invites add column if not exists role text not null default 'staff';
alter table public.staff_invites drop constraint if exists staff_invites_role_check;
alter table public.staff_invites add constraint staff_invites_role_check check (role in ('staff', 'scout'));
alter table public.staff_invites add column if not exists club text check (club is null or char_length(btrim(club)) between 2 and 80);

create or replace function public.create_scout_invite(p_email text, p_club text)
returns table (id bigint, code text, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  e text := lower(btrim(coalesce(p_email, '')));
  k text := btrim(coalesce(p_club, ''));
  c text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  inv public.staff_invites;
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid_email'; end if;
  if char_length(k) not between 2 and 80 then raise exception 'invalid_club'; end if;
  if exists (select 1 from public.profiles p where lower(p.email) = e) then raise exception 'invite_email_taken'; end if;
  update public.staff_invites s set revoked_at = now(), revoked_by = auth.uid()
  where s.email = e and s.used_at is null and s.revoked_at is null;
  insert into public.staff_invites (email, code_hash, is_admin, role, club) values (e, public.invite_hash(c), false, 'scout', k)
  returning * into inv;
  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values (auth.uid(), 'create', 'staff_invite', inv.id::text, jsonb_build_object('email', e, 'role', 'scout', 'club', k));
  return query select inv.id, c, inv.expires_at;
end;
$$;

-- A tela do convite mostra também o tipo de acesso e o clube. Função nova (check_staff_invite continua igual).
create or replace function public.check_invite(p_code text)
returns table (email text, status text, expires_at timestamptz, is_admin boolean, invited_by text, role text, club text)
language sql stable security definer set search_path = public as $$
  select s.email,
         case when s.used_at is not null then 'used' when s.revoked_at is not null then 'revoked'
              when s.expires_at <= now() then 'expired' else 'valid' end,
         s.expires_at, s.is_admin, coalesce(p.name, ''), s.role, s.club
  from public.staff_invites s left join public.profiles p on p.id = s.created_by
  where s.code_hash = public.invite_hash(coalesce(p_code, ''));
$$;
grant execute on function public.check_invite(text) to anon, authenticated;

-- Criação da conta: o convite decide o papel (funcionário ou olheiro) e o clube do olheiro.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta  jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  code  text := nullif(btrim(meta ->> 'invite'), '');
  g     jsonb := meta -> 'guardian';
  inv   public.staff_invites;
  allow public.staff_allowlist;
  v_role  text := 'player';
  v_admin boolean := false;
  v_data  jsonb := coalesce(meta -> 'public', '{}'::jsonb);
begin
  select * into allow from public.staff_allowlist s where lower(s.email) = lower(new.email);
  if found then v_role := 'staff'; v_admin := allow.is_admin; end if;
  if code is not null then
    select * into inv from public.staff_invites s where s.code_hash = public.invite_hash(code) for update;
    if not found or inv.used_at is not null or inv.revoked_at is not null or inv.expires_at <= now()
       or inv.email <> lower(new.email) then
      raise exception 'invite_invalid';
    end if;
    v_role := inv.role; v_admin := inv.role = 'staff' and inv.is_admin;
    -- O clube vem do convite (não dá para trocar no cadastro); o cargo digitado vale, com 'Olheiro' se vier vazio.
    if inv.role = 'scout' then v_data := jsonb_build_object('position', 'Olheiro') || v_data || jsonb_build_object('org', inv.club); end if;
  end if;

  insert into public.profiles (id, email, role, is_admin, name, data)
  values (new.id, new.email, v_role, v_admin,
          coalesce(nullif(meta ->> 'name', ''), split_part(new.email, '@', 1)), v_data);
  insert into public.profile_private (id, data)
  values (new.id, coalesce(meta -> 'private', '{}'::jsonb));

  if v_role = 'player' and public.age_from(meta -> 'public' ->> 'birth') < 18 then
    if g is null or (g ->> 'consent') is distinct from 'true' then raise exception 'guardian_required'; end if;
    insert into public.guardians (athlete_id, name, relationship, email, phone, consent_at)
    values (new.id, btrim(g ->> 'name'), g ->> 'relationship', lower(btrim(g ->> 'email')), btrim(coalesce(g ->> 'phone', '')), now());
    insert into public.audit_log (actor_id, action, entity, entity_id, details)
    values (new.id, 'consent', 'guardian', new.id::text, jsonb_build_object('relationship', g ->> 'relationship', 'version', '2026-10'));
  end if;

  if code is not null then
    update public.staff_invites set used_at = now(), used_by = new.id where id = inv.id;
    insert into public.audit_log (actor_id, action, entity, entity_id, details)
    values (new.id, 'accept', 'staff_invite', inv.id::text, jsonb_build_object('email', inv.email, 'is_admin', v_admin, 'role', inv.role));
  end if;
  return new;
end;
$$;

-- ---------- 3) O que o olheiro enxerga ----------
-- Perfis: o próprio, a equipe ativa, (equipe vê tudo) e, para olheiros, só atletas na vitrine.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or (role = 'staff' and active) or public.is_staff()
         or (public.is_scout() and role = 'player' and public.in_showcase(id)));

-- Avaliações: o atleta, a equipe e olheiros, só de quem está na vitrine (a carta precisa das médias).
drop policy if exists evaluations_select on public.evaluations;
create policy evaluations_select on public.evaluations for select to authenticated
  using (athlete_id = auth.uid() or public.is_staff() or (public.is_scout() and public.in_showcase(athlete_id)));

-- Desativar um olheiro usa a mesma função da equipe, que passa a aceitar os dois papéis.
-- Igual à versão anterior, exceto: aceita role 'scout', e olheiro nunca vira administrador.
create or replace function public.update_staff(p_profile uuid, p_active boolean, p_admin boolean)
returns void language plpgsql security definer set search_path = public as $$
declare
  old_row public.profiles;
  changes jsonb := '{}'::jsonb;
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  if p_profile = auth.uid() then raise exception 'cannot_change_self'; end if;
  select * into old_row from public.profiles where id = p_profile for update;
  if not found or old_row.role not in ('staff', 'scout') then raise exception 'not_staff'; end if;
  if old_row.role = 'scout' then p_admin := false; end if;
  if old_row.active is distinct from p_active then changes := changes || jsonb_build_object('active', jsonb_build_object('de', old_row.active, 'para', p_active)); end if;
  if old_row.is_admin is distinct from p_admin then changes := changes || jsonb_build_object('is_admin', jsonb_build_object('de', old_row.is_admin, 'para', p_admin)); end if;
  if changes = '{}'::jsonb then return; end if;
  update public.profiles set active = p_active, is_admin = p_admin where id = p_profile;
  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values (auth.uid(),
          case when old_row.active and not p_active then 'deactivate' when not old_row.active and p_active then 'reactivate' else 'update' end,
          'staff', p_profile::text, changes || jsonb_build_object('email', old_row.email, 'role', old_row.role));
end;
$$;

-- A lista de convites do administrador mostra o tipo de acesso e o clube.
grant select (role, club) on public.staff_invites to authenticated;
-- A equipe vê os olheiros (ativos ou não) para gerenciar; atletas não veem olheiros.

-- ---------- 4) Pedido de contato: o olheiro pede, a equipe decide e fala com o atleta e a família ----------
create table if not exists public.scout_requests (
  id          bigint generated always as identity primary key,
  scout_id    uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  athlete_id  uuid not null references public.profiles (id) on delete cascade,
  message     text not null check (char_length(btrim(message)) between 10 and 600),
  status      text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at  timestamptz not null default now(),
  decided_at  timestamptz,
  decided_by  uuid references public.profiles (id) on delete set null
);
create unique index if not exists scout_requests_one_pending on public.scout_requests (scout_id, athlete_id) where status = 'pending';

alter table public.scout_requests enable row level security;
revoke all on public.scout_requests from anon, authenticated;
grant insert (athlete_id, message) on public.scout_requests to authenticated;
grant select on public.scout_requests to authenticated;
grant update (status, decided_at, decided_by) on public.scout_requests to authenticated;

drop policy if exists scout_requests_insert on public.scout_requests;
create policy scout_requests_insert on public.scout_requests for insert to authenticated
  with check (scout_id = auth.uid() and public.is_scout() and public.in_showcase(athlete_id) and status = 'pending' and decided_at is null);

drop policy if exists scout_requests_select on public.scout_requests;
create policy scout_requests_select on public.scout_requests for select to authenticated
  using (scout_id = auth.uid() or public.is_staff());

drop policy if exists scout_requests_update on public.scout_requests;
create policy scout_requests_update on public.scout_requests for update to authenticated
  using (public.is_staff() and status = 'pending')
  with check (public.is_staff() and status in ('accepted', 'declined') and decided_by = auth.uid());
