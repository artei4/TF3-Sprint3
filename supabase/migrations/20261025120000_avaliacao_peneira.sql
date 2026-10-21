-- Peneira ao vivo: cada avaliação pode dizer em qual peneira foi feita.
-- Coluna nova e opcional: avaliações antigas (e as feitas fora de peneira) continuam valendo, sem vínculo.
-- Se a peneira for apagada, a avaliação fica e só perde o vínculo.
alter table public.evaluations add column if not exists tryout_id bigint references public.tryouts (id) on delete set null;
create index if not exists evaluations_tryout_idx on public.evaluations (tryout_id) where tryout_id is not null;

-- Só dá para ligar a avaliação a uma peneira em que o atleta está inscrito.
drop policy if exists evaluations_insert on public.evaluations;
create policy evaluations_insert on public.evaluations for insert to authenticated
  with check (
    evaluator_id = auth.uid()
    and public.is_staff()
    and exists (select 1 from public.profiles p where p.id = athlete_id and p.role = 'player')
    and (tryout_id is null or exists (
      select 1 from public.tryout_enrollments e where e.tryout_id = evaluations.tryout_id and e.athlete_id = evaluations.athlete_id
    ))
  );
