-- Fale conosco: qualquer pessoa (com ou sem conta) envia uma mensagem; só a equipe lê e marca como respondida.
-- Coleta o mínimo para responder: nome, e-mail, assunto e a mensagem.
create table if not exists public.contact_messages (
  id          bigint generated always as identity primary key,
  name        text not null check (char_length(btrim(name)) between 2 and 120),
  email       text not null check (char_length(email) <= 254 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  topic       text not null check (topic in ('peneiras', 'cadastro', 'dados', 'parcerias', 'outro')),
  body        text not null check (char_length(btrim(body)) between 10 and 2000),
  sender_id   uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now(),
  handled_at  timestamptz,
  handled_by  uuid references public.profiles (id) on delete set null
);
create index if not exists contact_messages_open_idx on public.contact_messages (created_at desc) where handled_at is null;

alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;
-- Quem envia só escolhe estas quatro colunas; o resto vem do banco (id, data, autor logado).
grant insert (name, email, topic, body) on public.contact_messages to anon, authenticated;
grant select on public.contact_messages to authenticated;
grant update (handled_at, handled_by) on public.contact_messages to authenticated;

drop policy if exists contact_insert on public.contact_messages;
create policy contact_insert on public.contact_messages for insert to anon, authenticated
  with check (handled_at is null and handled_by is null and sender_id is not distinct from auth.uid());

drop policy if exists contact_select on public.contact_messages;
create policy contact_select on public.contact_messages for select to authenticated
  using (public.is_staff());

drop policy if exists contact_update on public.contact_messages;
create policy contact_update on public.contact_messages for update to authenticated
  using (public.is_staff())
  with check (public.is_staff() and (handled_by is null or handled_by = auth.uid()));
