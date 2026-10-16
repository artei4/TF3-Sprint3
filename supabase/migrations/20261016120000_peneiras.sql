-- =====================================================================================
-- Pelé Academia — peneiras e inscrições (Sprint 4)
-- Como usar: Supabase → SQL Editor → cole este arquivo inteiro → Run.
-- Requer a migration 20260921120000_contas_e_conversas.sql (profiles, is_staff()).
-- Pode ser executado mais de uma vez sem quebrar nada.
-- =====================================================================================

create table if not exists public.tryouts (
  id            bigint generated always as identity primary key,
  created_by    uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  title         text not null check (char_length(btrim(title)) between 3 and 120),
  date          date not null,
  time          text not null default '',
  location      text not null,
  city          text not null,
  state         text not null,
  category      text not null default '',
  positions     text[] not null check (cardinality(positions) > 0),
  seats         int not null check (seats between 1 and 500),
  status        text not null default 'open' check (status in ('open', 'cancelled')),
  cancel_reason text,
  created_at    timestamptz not null default now()
);

create table if not exists public.tryout_enrollments (
  tryout_id  bigint not null references public.tryouts (id) on delete cascade,
  athlete_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (tryout_id, athlete_id)
);

-- Vagas ocupadas (security definer: o atleta não enxerga as inscrições dos outros, só a contagem).
create or replace function public.tryout_taken(tid bigint)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.tryout_enrollments where tryout_id = tid;
$$;

-- Lista para a tela de peneiras: abertas + canceladas em que o usuário estava inscrito.
-- Funcionários recebem os e-mails de todos os inscritos; atletas, só o próprio.
create or replace function public.list_tryouts()
returns table (
  id bigint, title text, date date, time text, location text, city text, state text, category text,
  positions text[], seats int, status text, cancel_reason text, created_by_email text, taken int, enrolled_emails text[]
) language sql stable security definer set search_path = public as $$
  select t.id, t.title, t.date, t.time, t.location, t.city, t.state, t.category, t.positions, t.seats, t.status,
         t.cancel_reason, c.email, public.tryout_taken(t.id),
         coalesce(array(
           select p.email from public.tryout_enrollments e join public.profiles p on p.id = e.athlete_id
           where e.tryout_id = t.id and (public.is_staff() or e.athlete_id = auth.uid())
           order by e.created_at
         ), '{}')
  from public.tryouts t join public.profiles c on c.id = t.created_by
  where auth.uid() is not null
    and (t.status = 'open' or exists (select 1 from public.tryout_enrollments e where e.tryout_id = t.id and e.athlete_id = auth.uid()) or public.is_staff())
  order by t.date, t.time;
$$;

alter table public.tryouts            enable row level security;
alter table public.tryout_enrollments enable row level security;
revoke all on public.tryouts, public.tryout_enrollments from anon, authenticated;
grant select, insert on public.tryouts to authenticated;
grant update (status, cancel_reason) on public.tryouts to authenticated;
grant select, insert, delete on public.tryout_enrollments to authenticated;
grant execute on function public.list_tryouts() to authenticated;

drop policy if exists tryouts_select on public.tryouts;
create policy tryouts_select on public.tryouts for select to authenticated using (true);

drop policy if exists tryouts_insert on public.tryouts;
create policy tryouts_insert on public.tryouts for insert to authenticated
  with check (created_by = auth.uid() and public.is_staff());

drop policy if exists tryouts_cancel on public.tryouts;
create policy tryouts_cancel on public.tryouts for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists enrollments_select on public.tryout_enrollments;
create policy enrollments_select on public.tryout_enrollments for select to authenticated
  using (athlete_id = auth.uid() or public.is_staff());

-- Inscrição: só o próprio atleta, em peneira aberta e com vaga.
-- ponytail: a checagem de vaga não trava concorrência; duas inscrições simultâneas na última vaga podem passar.
-- Se isso importar, trocar por uma função com "select ... for update".
drop policy if exists enrollments_insert on public.tryout_enrollments;
create policy enrollments_insert on public.tryout_enrollments for insert to authenticated
  with check (
    athlete_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'player')
    and exists (select 1 from public.tryouts t where t.id = tryout_id and t.status = 'open' and public.tryout_taken(t.id) < t.seats)
  );

drop policy if exists enrollments_delete on public.tryout_enrollments;
create policy enrollments_delete on public.tryout_enrollments for delete to authenticated
  using (athlete_id = auth.uid());
