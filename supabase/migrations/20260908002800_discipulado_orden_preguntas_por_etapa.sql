alter table public.discipulado_preguntas
  drop constraint if exists discipulado_preguntas_curso_id_orden_key;

drop index if exists public.discipulado_preguntas_leccion_orden_unique_idx;
drop index if exists public.discipulado_preguntas_final_orden_unique_idx;

create unique index discipulado_preguntas_leccion_orden_unique_idx
  on public.discipulado_preguntas(leccion_id, orden)
  where tipo = 'leccion' and leccion_id is not null;

create unique index discipulado_preguntas_final_orden_unique_idx
  on public.discipulado_preguntas(curso_id, orden)
  where tipo = 'final' and leccion_id is null;
