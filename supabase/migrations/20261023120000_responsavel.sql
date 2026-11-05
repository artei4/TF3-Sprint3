-- =====================================================================================
-- Pelé Academia — atletas menores de 18 anos e responsável legal (Sprint 4)
-- Como usar: Supabase → SQL Editor → cole este arquivo inteiro → Run.
-- Requer as migrations anteriores. Pode rodar mais de uma vez. Não apaga dados.
--
-- Regra: atleta com menos de 18 anos só cria a conta e só se inscreve em peneiras com a
-- autorização de um responsável legal registrada aqui. É uma declaração feita no cadastro
-- (o banco guarda quando foi dada e a versão do texto); o banco não confere a identidade de quem marcou.
-- Isto não é uma avaliação jurídica de conformidade com a LGPD.
-- =====================================================================================

-- ---------- 1) Idade ----------
-- Data inválida ou ausente devolve null (não trava nada).
create or replace function public.age_from(p_birth text)
returns int language plpgsql stable as $$
begin
  if p_birth is null or p_birth !~ '^\d{4}-\d{2}-\d{2}$' then return null; end if;
  return date_part('year', age(public.today_sp(), p_birth::date))::int;
exception when others then return null;
end;
$$;

-- ---------- 2) Responsável ----------
create table if not exists public.guardians (
  athlete_id      uuid primary key references public.profiles (id) on delete cascade,
  name            text not null check (char_length(btrim(name)) between 3 and 120),
  relationship    text not null check (relationship in ('mae', 'pai', 'avo', 'tutor', 'outro')),
  email           text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 160),
  phone           text not null default '' check (char_length(phone) <= 30),
  consent_at      timestamptz,                    -- null = autorização revogada
  consent_version text not null default '2026-10',
  revoked_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create or replace function public.needs_guardian(p_athlete uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select public.age_from(p.data ->> 'birth') < 18
           and not exists (select 1 from public.guardians g where g.athlete_id = p.id and g.consent_at is not null)
    from public.profiles p where p.id = p_athlete and p.role = 'player'
  ), false);
$$;

-- O atleta (com o responsável) grava ou atualiza os dados e a autorização. Chamar = autorizar de novo.
create or replace function public.save_guardian(p_name text, p_relationship text, p_email text, p_phone text, p_consent boolean)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare at timestamptz := now();
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'player') then raise exception 'not_player'; end if;
  if p_consent is not true then raise exception 'consent_required'; end if;
  insert into public.guardians (athlete_id, name, relationship, email, phone, consent_at)
  values (auth.uid(), btrim(p_name), p_relationship, lower(btrim(p_email)), btrim(coalesce(p_phone, '')), at)
  on conflict (athlete_id) do update
    set name = excluded.name, relationship = excluded.relationship, email = excluded.email, phone = excluded.phone,
        consent_at = at, consent_version = excluded.consent_version, revoked_at = null, updated_at = at;
  -- Sem nome, e-mail ou telefone no registro: só o que aconteceu.
  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values (auth.uid(), 'consent', 'guardian', auth.uid()::text, jsonb_build_object('relationship', p_relationship, 'version', '2026-10'));
  return at;
end;
$$;

create or replace function public.revoke_guardian_consent()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.guardians set consent_at = null, revoked_at = now(), updated_at = now()
  where athlete_id = auth.uid() and consent_at is not null;
  if not found then raise exception 'no_consent'; end if;
  insert into public.audit_log (actor_id, action, entity, entity_id) values (auth.uid(), 'revoke_consent', 'guardian', auth.uid()::text);
end;
$$;

-- ---------- 3) Criação da conta ----------
-- Igual à versão da migration de equipe, mais: atleta menor precisa vir com o responsável e a autorização.
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
    values (new.id, 'accept', 'staff_invite', inv.id::text, jsonb_build_object('email', inv.email, 'is_admin', inv.is_admin));
  end if;
  return new;
end;
$$;

-- ---------- 4) Data de nascimento fixa depois do cadastro ----------
-- Senão daria para "fazer 18 anos" no perfil e pular a autorização (ou trocar de categoria).
-- Correção: pelo SQL Editor, com a conta de serviço (o gatilho só vale para quem usa o site).
create or replace function public.lock_birth()
returns trigger language plpgsql as $$
begin
  if auth.uid() is not null and old.role = 'player'
     and coalesce(old.data ->> 'birth', '') <> ''
     and (new.data ->> 'birth') is distinct from (old.data ->> 'birth') then
    raise exception 'birth_locked';
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_lock_birth on public.profiles;
create trigger profiles_lock_birth before update on public.profiles for each row execute function public.lock_birth();

-- ---------- 5) Inscrição: menor sem autorização é recusado ----------
create or replace function public.enroll_tryout(p_tryout bigint)
returns void language plpgsql security definer set search_path = public as $$
declare
  t public.tryouts;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'player') then
    raise exception 'not_player';
  end if;
  if public.needs_guardian(auth.uid()) then raise exception 'guardian_required'; end if;
  select * into t from public.tryouts where id = p_tryout for update;
  if not found or t.status <> 'open' then raise exception 'tryout_closed'; end if;
  if now() >= public.tryout_starts_at(t) then raise exception 'tryout_past'; end if;
  if exists (select 1 from public.tryout_enrollments where tryout_id = p_tryout and athlete_id = auth.uid()) then
    return;
  end if;
  if public.tryout_taken(p_tryout) >= t.seats then raise exception 'tryout_full'; end if;
  insert into public.tryout_enrollments (tryout_id, athlete_id) values (p_tryout, auth.uid());
end;
$$;

-- ---------- 6) Permissões ----------
-- O próprio atleta e a equipe (para falar com a família) leem; só as funções acima escrevem.
alter table public.guardians enable row level security;
revoke all on public.guardians from anon, authenticated;
grant select on public.guardians to authenticated;
drop policy if exists guardians_select on public.guardians;
create policy guardians_select on public.guardians for select to authenticated using (athlete_id = auth.uid() or public.is_staff());

-- needs_guardian fica fechada: diria a qualquer um se outro atleta é menor (enroll_tryout a usa por dentro).
revoke all on function public.save_guardian(text, text, text, text, boolean), public.revoke_guardian_consent(), public.needs_guardian(uuid) from public;
grant execute on function public.save_guardian(text, text, text, text, boolean), public.revoke_guardian_consent() to authenticated;
