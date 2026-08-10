-- Permite que una misma persona tenga varias funciones dentro del mismo servicio.
-- La combinación exacta persona + evento + ministerio + función continúa siendo única.
alter table public.evento_asignaciones
  drop constraint if exists evento_asignaciones_evento_ministerio_profile_key;

alter table public.evento_asignaciones
  drop constraint if exists evento_asignaciones_evento_ministerio_profile_capacidad_key;

alter table public.evento_asignaciones
  add constraint evento_asignaciones_evento_ministerio_profile_capacidad_key
  unique nulls not distinct (evento_id, ministerio_id, profile_id, capacidad_id);

-- Recupera paletas ya guardadas en servicios hacia la biblioteca reutilizable.
-- No altera evento_paletas ni cambia servicios anteriores.
insert into public.ministerio_paletas (
  ministerio_id,
  nombre,
  colores,
  observaciones,
  referencia_url,
  activo,
  creado_por,
  created_at,
  updated_at
)
select
  ep.ministerio_id,
  left(
    'Paleta · ' || coalesce(nullif(btrim(e.titulo), ''), 'Servicio') || ' · ' ||
    to_char(e.fecha_inicio at time zone 'America/El_Salvador', 'YYYY-MM-DD'),
    80
  ),
  to_jsonb(ep.colores),
  ep.observaciones,
  ep.referencia_url,
  true,
  ep.actualizado_por,
  coalesce(ep.updated_at, now()),
  coalesce(ep.updated_at, now())
from public.evento_paletas ep
join public.eventos e on e.id = ep.evento_id
where ep.ministerio_id is not null
  and cardinality(ep.colores) >= 2
  and not exists (
    select 1
    from public.ministerio_paletas mp
    where mp.ministerio_id = ep.ministerio_id
      and mp.activo = true
      and mp.colores = to_jsonb(ep.colores)
  )
on conflict do nothing;

notify pgrst, 'reload schema';
