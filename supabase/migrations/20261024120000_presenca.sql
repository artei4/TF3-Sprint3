-- =====================================================================================
-- Pelé Academia — presença no dia da peneira (check-in) (Sprint 4)
-- Como usar: Supabase → SQL Editor → cole este arquivo inteiro → Run.
-- Requer as migrations anteriores. Pode rodar mais de uma vez. Não apaga dados.
--
-- A equipe marca quem chegou, pela lista de inscritos. A chamada abre no dia da peneira
-- e continua aberta depois (para corrigir um esquecimento). Peneira cancelada não tem chamada.
-- =====================================================================================

alter table public.tryout_enrollments
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_in_by uuid references public.profiles (id) on delete set null;

-- p_present = false desfaz. Marcar de novo quem já está presente mantém a hora da chegada.
create or replace function public.set_attendance(p_tryout bigint, p_email text, p_present boolean)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare
  t   public.tryouts;
  aid uuid;
  at  timestamptz;
begin
  if not public.is_staff() then raise exception 'not_staff'; end if;
  select * into t from public.tryouts where id = p_tryout;
  if not found or t.status <> 'open' then raise exception 'tryout_closed'; end if;
  if public.today_sp() < t.date then raise exception 'checkin_not_open'; end if;
  select id into aid from public.profiles where lower(email) = lower(btrim(p_email)) and role = 'player';
  update public.tryout_enrollments
     set checked_in_at = case when p_present then coalesce(checked_in_at, now()) end,
         checked_in_by = case when p_present then coalesce(checked_in_by, auth.uid()) end
   where tryout_id = p_tryout and athlete_id = aid
  returning checked_in_at into at;
  if not found then raise exception 'not_enrolled'; end if;
  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values (auth.uid(), case when p_present then 'checkin' else 'undo_checkin' end, 'tryout', p_tryout::text, jsonb_build_object('athlete', aid));
  return at;
end;
$$;

-- Quem já teve a presença marcada não some da lista cancelando a inscrição.
drop policy if exists enrollments_delete on public.tryout_enrollments;
create policy enrollments_delete on public.tryout_enrollments for delete to authenticated
  using (athlete_id = auth.uid() and checked_in_at is null);

-- Lista de peneiras agora traz as presenças: e-mail → hora (a equipe vê todas; o atleta, só a dele).
drop function if exists public.list_tryouts();
create function public.list_tryouts()
returns table (
  id bigint, title text, date date, "time" text, location text, city text, state text, category text,
  positions text[], seats int, status text, cancel_reason text, created_by_email text, taken int, enrolled_emails text[],
  venue_id bigint, address text, district text, reference text, description text, checkins jsonb
) language sql stable security definer set search_path = public as $$
  select t.id, t.title, t.date, t.time, t.location, t.city, t.state, t.category, t.positions, t.seats, t.status,
         t.cancel_reason, c.email, public.tryout_taken(t.id),
         coalesce(array(
           select p.email from public.tryout_enrollments e join public.profiles p on p.id = e.athlete_id
           where e.tryout_id = t.id and (public.is_staff() or e.athlete_id = auth.uid())
           order by e.created_at
         ), '{}'),
         t.venue_id, coalesce(v.address, ''), coalesce(v.district, ''), coalesce(v.reference, ''), t.description,
         coalesce((
           select jsonb_object_agg(p.email, e.checked_in_at) from public.tryout_enrollments e join public.profiles p on p.id = e.athlete_id
           where e.tryout_id = t.id and e.checked_in_at is not null and (public.is_staff() or e.athlete_id = auth.uid())
         ), '{}'::jsonb)
  from public.tryouts t
  join public.profiles c on c.id = t.created_by
  left join public.venues v on v.id = t.venue_id
  where auth.uid() is not null
    and (t.status = 'open' or exists (select 1 from public.tryout_enrollments e where e.tryout_id = t.id and e.athlete_id = auth.uid()) or public.is_staff())
  order by t.date, t.time;
$$;

-- Ninguém escreve a presença direto na tabela (não há grant de update); só pela função.
revoke all on function public.set_attendance(bigint, text, boolean) from public;
grant execute on function public.set_attendance(bigint, text, boolean) to authenticated;
grant execute on function public.list_tryouts() to authenticated;
