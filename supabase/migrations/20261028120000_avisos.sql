-- Avisos no servidor: chegam em qualquer aparelho de quem recebe.
-- Ninguém insere aviso direto pela API: quem cria são gatilhos do próprio banco, a partir do que aconteceu
-- (avaliação, inscrição, cancelamento, contato, pedido de olheiro, decisão, convite aceito). Assim não há
-- como usar os avisos para mandar texto a outra pessoa. Cada um lê e apaga só os próprios.
create table if not exists public.notifications (
  id            bigint generated always as identity primary key,
  recipient_id  uuid not null references public.profiles (id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 80),
  body          text not null check (char_length(body) between 1 and 400),
  created_at    timestamptz not null default now()
);
create index if not exists notifications_recipient_idx on public.notifications (recipient_id, created_at desc);

alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select, delete on public.notifications to authenticated;
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select to authenticated using (recipient_id = auth.uid());
drop policy if exists notifications_delete on public.notifications;
create policy notifications_delete on public.notifications for delete to authenticated using (recipient_id = auth.uid());

-- Grava um aviso (texto cortado no limite da coluna). Só os gatilhos chamam.
create or replace function public.push_notice(p_to uuid, p_title text, p_body text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (recipient_id, title, body)
  select p_to, left(p_title, 80), left(p_body, 400) where p_to is not null;
$$;
create or replace function public.push_notice_staff(p_title text, p_body text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (recipient_id, title, body)
  select p.id, left(p_title, 80), left(p_body, 400) from public.profiles p where p.role = 'staff' and p.active;
$$;
revoke execute on function public.push_notice(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.push_notice_staff(text, text) from public, anon, authenticated;

create or replace function public.name_of(p_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select name from public.profiles where id = p_id), 'Alguém');
$$;
revoke execute on function public.name_of(uuid) from public, anon, authenticated;

-- ---------- Gatilhos ----------
-- Avaliação nova: o atleta fica sabendo.
create or replace function public.notice_evaluation() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.push_notice(new.athlete_id, 'Nova avaliação', 'Um olheiro avaliou seu desempenho como ' || new.position || ' (nota ' || replace(new.rating::text, '.', ',') || ').');
  return new;
end;
$$;
drop trigger if exists evaluations_notice on public.evaluations;
create trigger evaluations_notice after insert on public.evaluations for each row execute function public.notice_evaluation();

-- Inscrição e cancelamento: quem criou a peneira fica sabendo.
create or replace function public.notice_enrollment() returns trigger language plpgsql security definer set search_path = public as $$
declare tr public.tryouts;
begin
  select * into tr from public.tryouts where id = coalesce(new.tryout_id, old.tryout_id);
  if not found then return coalesce(new, old); end if;
  if tg_op = 'INSERT' then
    perform public.push_notice(tr.created_by, 'Nova inscrição', public.name_of(new.athlete_id) || ' se inscreveu em "' || tr.title || '".');
  else
    perform public.push_notice(tr.created_by, 'Vaga liberada', public.name_of(old.athlete_id) || ' cancelou a inscrição em "' || tr.title || '".');
  end if;
  return coalesce(new, old);
end;
$$;
drop trigger if exists enrollments_notice on public.tryout_enrollments;
create trigger enrollments_notice after insert or delete on public.tryout_enrollments for each row execute function public.notice_enrollment();

-- Peneira cancelada: todos os inscritos ficam sabendo, com o motivo.
create or replace function public.notice_tryout_cancel() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    insert into public.notifications (recipient_id, title, body)
    select e.athlete_id, 'Peneira cancelada', left('"' || new.title || '" (' || to_char(new.date, 'DD/MM/YYYY') || ') foi cancelada. Motivo: ' || coalesce(nullif(btrim(new.cancel_reason), ''), 'não informado') || '.', 400)
    from public.tryout_enrollments e where e.tryout_id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists tryouts_cancel_notice on public.tryouts;
create trigger tryouts_cancel_notice after update of status on public.tryouts for each row execute function public.notice_tryout_cancel();

-- Fale conosco: a equipe fica sabendo (sem copiar o e-mail nem o texto da mensagem para o aviso).
create or replace function public.notice_contact() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.push_notice_staff('Fale conosco', 'Nova mensagem de ' || new.name || ' no Fale conosco.');
  return new;
end;
$$;
drop trigger if exists contact_notice on public.contact_messages;
create trigger contact_notice after insert on public.contact_messages for each row execute function public.notice_contact();

-- Pedido de olheiro: a equipe fica sabendo; na decisão, o olheiro (e, se aceito, o atleta) ficam sabendo.
create or replace function public.notice_scout_request() returns trigger language plpgsql security definer set search_path = public as $$
declare
  scout  public.profiles;
  target text;
begin
  select * into scout from public.profiles where id = new.scout_id;
  target := case when new.athlete_id is null then 'um perfil de exemplo' else public.name_of(new.athlete_id) end;
  if tg_op = 'INSERT' then
    perform public.push_notice_staff('Pedido de olheiro', coalesce(scout.name, 'Um olheiro') || ' (' || coalesce(scout.data ->> 'org', 'clube') || ') quer contato com ' || target || '.');
  elsif new.status is distinct from old.status then
    if new.status = 'accepted' then
      perform public.push_notice(new.scout_id, 'Pedido de contato aceito', 'A equipe da Pelé Academia vai falar com ' || target || ' e a família e retorna com o próximo passo.');
      perform public.push_notice(new.athlete_id, 'Um clube quer conhecer você', coalesce(scout.name, 'Um olheiro') || ' (' || coalesce(scout.data ->> 'org', 'clube') || ') pediu contato. A equipe da Pelé Academia vai conversar com você e com a sua família antes de qualquer passo.');
    elsif new.status = 'declined' then
      perform public.push_notice(new.scout_id, 'Pedido de contato não aceito', 'A equipe da Pelé Academia não seguiu com o pedido sobre ' || target || '.');
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists scout_requests_notice on public.scout_requests;
create trigger scout_requests_notice after insert or update of status on public.scout_requests for each row execute function public.notice_scout_request();

-- Convite aceito: quem convidou fica sabendo.
create or replace function public.notice_invite_used() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.used_at is not null and old.used_at is null then
    perform public.push_notice(new.created_by, 'Convite aceito', public.name_of(new.used_by) || ' entrou ' || case when new.role = 'scout' then 'como olheiro de clube.' else 'na equipe.' end);
  end if;
  return new;
end;
$$;
drop trigger if exists invites_used_notice on public.staff_invites;
create trigger invites_used_notice after update of used_at on public.staff_invites for each row execute function public.notice_invite_used();
