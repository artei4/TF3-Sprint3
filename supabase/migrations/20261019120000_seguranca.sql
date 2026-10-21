-- =====================================================================================
-- Pelé Academia — reforço de segurança (Sprint 4)
-- Como usar: Supabase → SQL Editor → cole este arquivo inteiro → Run.
-- Requer as migrations anteriores (contas_e_conversas e peneiras). Pode rodar mais de uma vez.
-- Não apaga dados: só troca regras (policies), cria funções e um gatilho.
-- =====================================================================================

-- "Hoje" no fuso da academia, para que todos vejam a mesma data limite.
create or replace function public.today_sp()
returns date language sql stable as $$
  select (now() at time zone 'America/Sao_Paulo')::date;
$$;

-- ---------- 1) Inscrição em peneira: só pela função, com trava na última vaga ----------
-- Antes: o insert direto checava vagas sem trava (duas pessoas podiam pegar a última vaga)
-- e não checava a data (dava para se inscrever em peneira que já passou).
create or replace function public.enroll_tryout(p_tryout bigint)
returns void language plpgsql security definer set search_path = public as $$
declare
  t public.tryouts;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'player') then
    raise exception 'not_player';
  end if;
  -- "for update" trava a peneira até o fim da transação: a contagem abaixo não muda no meio.
  select * into t from public.tryouts where id = p_tryout for update;
  if not found or t.status <> 'open' then raise exception 'tryout_closed'; end if;
  if t.date < public.today_sp() then raise exception 'tryout_past'; end if;
  if exists (select 1 from public.tryout_enrollments where tryout_id = p_tryout and athlete_id = auth.uid()) then
    return; -- já inscrito: nada a fazer
  end if;
  if public.tryout_taken(p_tryout) >= t.seats then raise exception 'tryout_full'; end if;
  insert into public.tryout_enrollments (tryout_id, athlete_id) values (p_tryout, auth.uid());
end;
$$;

revoke insert on public.tryout_enrollments from authenticated;
drop policy if exists enrollments_insert on public.tryout_enrollments;
grant execute on function public.enroll_tryout(bigint) to authenticated;

-- ---------- 2) Peneiras: sem data no passado, e cancelamento é só de ida ----------
drop policy if exists tryouts_insert on public.tryouts;
create policy tryouts_insert on public.tryouts for insert to authenticated
  with check (created_by = auth.uid() and public.is_staff() and date >= public.today_sp());

-- Antes o "with check" aceitava qualquer status, então dava para reabrir uma peneira cancelada.
drop policy if exists tryouts_cancel on public.tryouts;
create policy tryouts_cancel on public.tryouts for update to authenticated
  using (public.is_staff() and status = 'open')
  with check (public.is_staff() and status = 'cancelled');

-- ---------- 3) Conversas: limite contra spam ----------
-- ponytail: limite fixo por remetente (8 mensagens/minuto). Se precisar por conversa, filtrar também por athlete_id/staff_id.
create or replace function public.limit_message_rate()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.messages
      where sender_id = new.sender_id and created_at > now() - interval '1 minute') >= 8 then
    raise exception 'message_rate_limit';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_rate_limit on public.messages;
create trigger messages_rate_limit
  before insert on public.messages
  for each row execute function public.limit_message_rate();

create index if not exists messages_sender_idx on public.messages (sender_id, created_at desc);
