-- FASE D · Bloque 5
-- CANDIDATA DE RECUPERACIÓN NO AUTORIZADA PARA PRODUCCIÓN
-- Elimina únicamente filas pending/disabled del paquete rome-pilot-v1.

begin;

do $recovery$
declare
  v_package_key constant text := 'rome-pilot-v1';
  v_package_hash constant text := '67efcaa4e4cae2ec6f908f60a97850a1b7fd6ee223496fbc17438a87ea3a0550';
  v_count integer;
begin
  if exists (
    select 1 from public.biblical_places
    where metadata ->> 'package_key' = v_package_key
      and (metadata ->> 'package_hash') is distinct from v_package_hash
  ) or exists (
    select 1 from public.biblical_timeline_periods
    where metadata ->> 'package_key' = v_package_key
      and (metadata ->> 'package_hash') is distinct from v_package_hash
  ) or exists (
    select 1 from public.biblical_timeline_events
    where metadata ->> 'package_key' = v_package_key
      and (metadata ->> 'package_hash') is distinct from v_package_hash
  ) or exists (
    select 1 from public.biblical_timeline_event_places
    where metadata ->> 'package_key' = v_package_key
      and (metadata ->> 'package_hash') is distinct from v_package_hash
  ) then
    raise exception 'Se detectó una versión diferente del paquete; recuperación cancelada';
  end if;

  if exists (
    select 1 from public.biblical_places
    where metadata ->> 'package_key' = v_package_key
      and (review_status <> 'pending' or enabled)
  ) or exists (
    select 1 from public.biblical_timeline_periods
    where metadata ->> 'package_key' = v_package_key
      and (review_status <> 'pending' or enabled)
  ) or exists (
    select 1 from public.biblical_timeline_events
    where metadata ->> 'package_key' = v_package_key
      and (review_status <> 'pending' or enabled)
  ) or exists (
    select 1 from public.biblical_timeline_event_places
    where metadata ->> 'package_key' = v_package_key
      and (review_status <> 'pending' or enabled)
  ) then
    raise exception 'El paquete contiene filas aprobadas o habilitadas; recuperación automática cancelada';
  end if;

  delete from public.biblical_timeline_event_places
  where metadata @> jsonb_build_object('package_key', v_package_key, 'package_hash', v_package_hash);

  delete from public.biblical_timeline_events
  where metadata @> jsonb_build_object('package_key', v_package_key, 'package_hash', v_package_hash);

  delete from public.biblical_timeline_periods
  where metadata @> jsonb_build_object('package_key', v_package_key, 'package_hash', v_package_hash);

  delete from public.biblical_places
  where metadata @> jsonb_build_object('package_key', v_package_key, 'package_hash', v_package_hash);

  select
    (select count(*) from public.biblical_places where metadata ->> 'package_key' = v_package_key)
    + (select count(*) from public.biblical_timeline_periods where metadata ->> 'package_key' = v_package_key)
    + (select count(*) from public.biblical_timeline_events where metadata ->> 'package_key' = v_package_key)
    + (select count(*) from public.biblical_timeline_event_places where metadata ->> 'package_key' = v_package_key)
  into v_count;

  if v_count <> 0 then
    raise exception 'La recuperación dejó % filas del paquete', v_count;
  end if;
end
$recovery$;

commit;
