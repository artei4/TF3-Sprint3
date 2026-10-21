-- =====================================================================================
-- Pelé Academia — descrição da peneira (Sprint 4)
-- Como usar: Supabase → SQL Editor → cole este arquivo inteiro → Run.
-- Requer as migrations anteriores. Pode rodar mais de uma vez. Não apaga dados.
-- =====================================================================================

-- Texto livre de quem cria a peneira: como vai ser, o que levar, a que horas chegar.
alter table public.tryouts add column if not exists description text not null default '';
do $$ begin
  alter table public.tryouts add constraint tryouts_description_len check (char_length(description) <= 1000);
exception when duplicate_object then null; end $$;

grant insert (description) on public.tryouts to authenticated;

-- Lista de peneiras agora traz a descrição.
drop function if exists public.list_tryouts();
create function public.list_tryouts()
returns table (
  id bigint, title text, date date, "time" text, location text, city text, state text, category text,
  positions text[], seats int, status text, cancel_reason text, created_by_email text, taken int, enrolled_emails text[],
  venue_id bigint, address text, district text, reference text, description text
) language sql stable security definer set search_path = public as $$
  select t.id, t.title, t.date, t.time, t.location, t.city, t.state, t.category, t.positions, t.seats, t.status,
         t.cancel_reason, c.email, public.tryout_taken(t.id),
         coalesce(array(
           select p.email from public.tryout_enrollments e join public.profiles p on p.id = e.athlete_id
           where e.tryout_id = t.id and (public.is_staff() or e.athlete_id = auth.uid())
           order by e.created_at
         ), '{}'),
         t.venue_id, coalesce(v.address, ''), coalesce(v.district, ''), coalesce(v.reference, ''), t.description
  from public.tryouts t
  join public.profiles c on c.id = t.created_by
  left join public.venues v on v.id = t.venue_id
  where auth.uid() is not null
    and (t.status = 'open' or exists (select 1 from public.tryout_enrollments e where e.tryout_id = t.id and e.athlete_id = auth.uid()) or public.is_staff())
  order by t.date, t.time;
$$;
grant execute on function public.list_tryouts() to authenticated;
