-- =====================================================================================
-- Academia Pelé — contas, perfis e conversas (Supabase)
-- Como usar: Supabase → SQL Editor → cole este arquivo inteiro → Run.
-- (ou, pelo terminal: supabase link --project-ref delhjdfecknikusehrga && supabase db push)
-- Pode ser executado mais de uma vez sem quebrar nada.
-- =====================================================================================

-- ---------- 1) Quem pode ser FUNCIONÁRIO ----------
-- O papel é decidido aqui, no servidor. Só e-mails desta lista viram "staff" ao criar a conta.
create table if not exists public.staff_allowlist (email text primary key);
insert into public.staff_allowlist (email) values
  ('funcionario@academiapele.com'),
  ('treinador@academiapele.com')
on conflict do nothing;
alter table public.staff_allowlist enable row level security;   -- sem policies: ninguém acessa pela API

-- ---------- 2) Perfis ----------
create sequence if not exists public.athlete_num_seq start 1000;

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  role        text not null default 'player' check (role in ('player', 'staff')),
  athlete_num bigint not null default nextval('public.athlete_num_seq') unique,
  name        text not null,
  data        jsonb not null default '{}'::jsonb,    -- dados visíveis à equipe (posição, cidade, perna...)
  created_at  timestamptz not null default now()
);
create unique index if not exists profiles_email_key on public.profiles (lower(email));

-- Dados sensíveis (CPF, telefone, endereço): só o próprio dono enxerga.
create table if not exists public.profile_private (
  id   uuid primary key references public.profiles (id) on delete cascade,
  data jsonb not null default '{}'::jsonb
);
create unique index if not exists profile_private_cpf_key
  on public.profile_private ((data ->> 'cpf'))
  where coalesce(data ->> 'cpf', '') <> '';

-- ---------- 3) Conversas ----------
create table if not exists public.messages (
  id         bigint generated always as identity primary key,
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  staff_id   uuid not null references public.profiles (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists messages_thread_idx on public.messages (athlete_id, staff_id, created_at);

-- ---------- 4) Avaliações ----------
create table if not exists public.evaluations (
  id           bigint generated always as identity primary key,
  athlete_id   uuid not null references public.profiles (id) on delete cascade,
  evaluator_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  position     text not null,
  ratings      jsonb not null default '{}'::jsonb,
  rating       numeric(3,1) not null check (rating between 0 and 10),
  base_rating  numeric(3,1) not null check (base_rating between 0 and 10),
  adjustment   numeric(3,1) not null default 0,
  stats        jsonb not null default '{}'::jsonb,
  strengths    jsonb not null default '[]'::jsonb,
  comment      text not null check (char_length(btrim(comment)) between 10 and 2000),
  created_at   timestamptz not null default now()
);
create index if not exists evaluations_athlete_idx on public.evaluations (athlete_id, created_at desc);

-- ---------- 4) Funções ----------
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'staff');
$$;

-- Cria o perfil automaticamente quando alguém cria a conta (com os dados enviados pelo site).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, email, role, name, data)
  values (
    new.id,
    new.email,
    case when exists (select 1 from public.staff_allowlist s where lower(s.email) = lower(new.email))
         then 'staff' else 'player' end,
    coalesce(nullif(meta ->> 'name', ''), split_part(new.email, '@', 1)),
    coalesce(meta -> 'public', '{}'::jsonb)
  );
  insert into public.profile_private (id, data)
  values (new.id, coalesce(meta -> 'private', '{}'::jsonb));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 5) Segurança (RLS) ----------
alter table public.profiles        enable row level security;
alter table public.profile_private enable row level security;
alter table public.messages        enable row level security;
alter table public.evaluations    enable row level security;

revoke all on public.profiles, public.profile_private, public.messages, public.evaluations, public.staff_allowlist from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (name, data) on public.profiles to authenticated;      -- não dá para alterar o próprio "role"
grant select, update on public.profile_private to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert, delete on public.evaluations to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or role = 'staff' or public.is_staff());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists private_select_own on public.profile_private;
create policy private_select_own on public.profile_private for select to authenticated
  using (id = auth.uid());

drop policy if exists private_update_own on public.profile_private;
create policy private_update_own on public.profile_private for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages for select to authenticated
  using (auth.uid() in (athlete_id, staff_id));

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and auth.uid() in (athlete_id, staff_id)
    and exists (select 1 from public.profiles p where p.id = athlete_id and p.role = 'player')
    and exists (select 1 from public.profiles p where p.id = staff_id   and p.role = 'staff')
  );

drop policy if exists evaluations_select on public.evaluations;
create policy evaluations_select on public.evaluations for select to authenticated
  using (athlete_id = auth.uid() or public.is_staff());

drop policy if exists evaluations_insert on public.evaluations;
create policy evaluations_insert on public.evaluations for insert to authenticated
  with check (
    evaluator_id = auth.uid()
    and public.is_staff()
    and exists (select 1 from public.profiles p where p.id = athlete_id and p.role = 'player')
  );

drop policy if exists evaluations_delete on public.evaluations;
create policy evaluations_delete on public.evaluations for delete to authenticated
  using (evaluator_id = auth.uid() and public.is_staff());

-- ---------- 6) Tempo real ----------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
