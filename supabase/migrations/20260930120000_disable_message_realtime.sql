-- Mensagens são uma demonstração local no navegador. Remova a tabela da publicação
-- para encerrar entregas Realtime configuradas por migrations anteriores.
do $$
begin
  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime drop table public.messages;
  end if;
end $$;
