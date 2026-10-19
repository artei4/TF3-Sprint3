-- =====================================================================================
-- Pelé Academia — locais de peneira, horário real e registro de alterações (Sprint 4)
-- Como usar: Supabase → SQL Editor → cole este arquivo inteiro → Run.
-- Requer as migrations anteriores. Pode rodar mais de uma vez. Não apaga dados.
-- =====================================================================================

-- ---------- 1) Locais ----------
create table if not exists public.venues (
  id         bigint generated always as identity primary key,
  name       text not null check (char_length(btrim(name)) between 3 and 120),
  address    text not null check (char_length(btrim(address)) between 5 and 200),  -- rua e número
  district   text not null default '' check (char_length(district) <= 80),
  city       text not null check (char_length(btrim(city)) between 2 and 80),
  state      text not null check (state ~ '^[A-Z]{2}$'),
  zip        text not null default '' check (zip = '' or zip ~ '^\d{5}-?\d{3}$'),
  reference  text not null default '' check (char_length(reference) <= 300),       -- complemento, ponto de referência
  active     boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  updated_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Mesmo nome na mesma cidade = mesmo local (ignora maiúsculas e espaços nas pontas).
create unique index if not exists venues_name_city_key on public.venues (lower(btrim(name)), lower(btrim(city)), state);

-- Peneira aponta para o local. "restrict": um local com peneiras nunca é apagado (só desativado),
-- e a peneira guarda uma cópia do nome/cidade para o histórico continuar legível.
alter table public.tryouts add column if not exists venue_id bigint references public.venues (id) on delete restrict;
create index if not exists tryouts_venue_idx on public.tryouts (venue_id);

-- Horário no formato HH:MM (ou vazio). "not valid" não reavalia linhas antigas.
do $$ begin
  alter table public.tryouts add constraint tryouts_time_format check ("time" = '' or "time" ~ '^([01]\d|2[0-3]):[0-5]\d$') not valid;
exception when duplicate_object then null; end $$;

-- ---------- 2) Registro de alterações (quem fez o quê) ----------
create table if not exists public.audit_log (
  id         bigint generated always as identity primary key,
  actor_id   uuid references public.profiles (id) on delete set null,
  action     text not null,
  entity     text not null,
  entity_id  text not null,
  details    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_entity_idx on public.audit_log (entity, entity_id, created_at desc);

create or replace function public.audit_venue()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  changes jsonb := '{}'::jsonb;
  col text;
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (actor_id, action, entity, entity_id, details)
    values (auth.uid(), 'create', 'venue', new.id::text, to_jsonb(new) - 'created_by' - 'updated_by' - 'created_at' - 'updated_at');
    return new;
  end if;
  foreach col in array array['name', 'address', 'district', 'city', 'state', 'zip', 'reference', 'active'] loop
    if to_jsonb(old) -> col is distinct from to_jsonb(new) -> col then
      changes := changes || jsonb_build_object(col, jsonb_build_object('de', to_jsonb(old) -> col, 'para', to_jsonb(new) -> col));
    end if;
  end loop;
  if changes <> '{}'::jsonb then
    insert into public.audit_log (actor_id, action, entity, entity_id, details)
    values (auth.uid(),
            case when old.active and not new.active then 'deactivate' when not old.active and new.active then 'reactivate' else 'update' end,
            'venue', new.id::text, changes);
  end if;
  return new;
end;
$$;

create or replace function public.touch_venue()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists venues_touch on public.venues;
create trigger venues_touch before update on public.venues for each row execute function public.touch_venue();
drop trigger if exists venues_audit on public.venues;
create trigger venues_audit after insert or update on public.venues for each row execute function public.audit_venue();

-- Peneiras: criação e cancelamento também entram no registro.
create or replace function public.audit_tryout()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_log (actor_id, action, entity, entity_id, details)
    values (auth.uid(), 'create', 'tryout', new.id::text, jsonb_build_object('title', new.title, 'date', new.date, 'venue_id', new.venue_id));
  elsif old.status = 'open' and new.status = 'cancelled' then
    insert into public.audit_log (actor_id, action, entity, entity_id, details)
    values (auth.uid(), 'cancel', 'tryout', new.id::text, jsonb_build_object('reason', new.cancel_reason));
  end if;
  return new;
end;
$$;
drop trigger if exists tryouts_audit on public.tryouts;
create trigger tryouts_audit after insert or update on public.tryouts for each row execute function public.audit_tryout();

-- A peneira copia nome, cidade e UF do local escolhido (o que o navegador mandar nesses campos é ignorado).
create or replace function public.tryout_copy_venue()
returns trigger language plpgsql security definer set search_path = public as $$
declare v public.venues;
begin
  if new.venue_id is null then return new; end if;
  select * into v from public.venues where id = new.venue_id;
  if not found or not v.active then raise exception 'venue_inactive'; end if;
  new.location := v.name; new.city := v.city; new.state := v.state;
  return new;
end;
$$;
drop trigger if exists tryouts_copy_venue on public.tryouts;
create trigger tryouts_copy_venue before insert on public.tryouts for each row execute function public.tryout_copy_venue();

-- ---------- 3) Permissões ----------
alter table public.venues    enable row level security;
alter table public.audit_log enable row level security;
revoke all on public.venues, public.audit_log from anon, authenticated;
grant select on public.venues to authenticated;
grant insert (name, address, district, city, state, zip, reference) on public.venues to authenticated;
grant update (name, address, district, city, state, zip, reference, active) on public.venues to authenticated;
grant select on public.audit_log to authenticated;   -- sem insert/update/delete: só os gatilhos escrevem

drop policy if exists venues_select on public.venues;
create policy venues_select on public.venues for select to authenticated using (active or public.is_staff());
drop policy if exists venues_insert on public.venues;
create policy venues_insert on public.venues for insert to authenticated with check (public.is_staff());
drop policy if exists venues_update on public.venues;
create policy venues_update on public.venues for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists audit_select on public.audit_log;
create policy audit_select on public.audit_log for select to authenticated using (public.is_staff());

-- Peneira nova também precisa do campo venue_id.
grant insert (title, date, "time", location, city, state, category, positions, seats, venue_id) on public.tryouts to authenticated;

-- ---------- 4) Inscrição fecha no horário de início (não só no fim do dia) ----------
create or replace function public.tryout_starts_at(t public.tryouts)
returns timestamptz language sql stable as $$
  select (t.date + coalesce(nullif(t."time", '')::time, time '00:00')) at time zone 'America/Sao_Paulo';
$$;

create or replace function public.enroll_tryout(p_tryout bigint)
returns void language plpgsql security definer set search_path = public as $$
declare
  t public.tryouts;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'player') then
    raise exception 'not_player';
  end if;
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

-- ---------- 5) Lista de peneiras com o endereço do local ----------
drop function if exists public.list_tryouts();
create function public.list_tryouts()
returns table (
  id bigint, title text, date date, "time" text, location text, city text, state text, category text,
  positions text[], seats int, status text, cancel_reason text, created_by_email text, taken int, enrolled_emails text[],
  venue_id bigint, address text, district text, reference text
) language sql stable security definer set search_path = public as $$
  select t.id, t.title, t.date, t.time, t.location, t.city, t.state, t.category, t.positions, t.seats, t.status,
         t.cancel_reason, c.email, public.tryout_taken(t.id),
         coalesce(array(
           select p.email from public.tryout_enrollments e join public.profiles p on p.id = e.athlete_id
           where e.tryout_id = t.id and (public.is_staff() or e.athlete_id = auth.uid())
           order by e.created_at
         ), '{}'),
         t.venue_id, coalesce(v.address, ''), coalesce(v.district, ''), coalesce(v.reference, '')
  from public.tryouts t
  join public.profiles c on c.id = t.created_by
  left join public.venues v on v.id = t.venue_id
  where auth.uid() is not null
    and (t.status = 'open' or exists (select 1 from public.tryout_enrollments e where e.tryout_id = t.id and e.athlete_id = auth.uid()) or public.is_staff())
  order by t.date, t.time;
$$;
grant execute on function public.list_tryouts() to authenticated;
