-- Mantiene evento_paletas como entidad de programación, no como tabla puente.
-- PostgREST interpreta una PK compuesta solo por dos FKs como relación many-to-many
-- entre eventos y ministerios, lo que vuelve ambiguo el embed ministerios(...) usado
-- por el Calendario. La PK técnica conserva la relación directa eventos.ministerio_id.

alter table public.evento_paletas
  add column if not exists id uuid default gen_random_uuid();

update public.evento_paletas
set id = gen_random_uuid()
where id is null;

alter table public.evento_paletas
  alter column id set not null;

alter table public.evento_paletas
  drop constraint if exists evento_paletas_pkey;

alter table public.evento_paletas
  add constraint evento_paletas_pkey primary key (id);

-- La programación sigue permitiendo una paleta independiente por ministerio y evento.
alter table public.evento_paletas
  drop constraint if exists evento_paletas_evento_ministerio_key;

alter table public.evento_paletas
  add constraint evento_paletas_evento_ministerio_key unique (evento_id, ministerio_id);

-- El flujo nuevo usa (evento_id, ministerio_id); se retira la unicidad heredada por evento.
alter table public.evento_paletas
  drop constraint if exists evento_paletas_evento_id_key;

notify pgrst, 'reload schema';
