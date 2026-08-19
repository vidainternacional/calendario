create or replace function public.get_next_visible_calendar_item()
returns table (
  item_type text,
  id uuid,
  titulo text,
  fecha_inicio timestamptz,
  ubicacion text,
  calendar_id uuid,
  calendar_nombre text,
  estado text
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select p.id
    from public.profiles p
    where p.id = auth.uid()
      and p.activo = true
      and p.estado_cuenta = 'activo'
  ), visible_calendars as (
    select c.id, c.nombre
    from public.calendars c
    where c.es_publico = true
      and exists (select 1 from me)
    union
    select c.id, c.nombre
    from public.calendar_subscriptions s
    join public.calendars c on c.id = s.calendar_id
    where s.user_id = auth.uid()
      and s.visible = true
      and exists (select 1 from me)
  ), event_candidates as (
    select
      'event'::text as item_type,
      e.id,
      e.titulo,
      e.fecha_inicio,
      e.ubicacion,
      vc.id as calendar_id,
      vc.nombre as calendar_nombre,
      ea.estado::text as estado
    from public.evento_calendarios ec
    join visible_calendars vc on vc.id = ec.calendar_id
    join public.eventos e on e.id = ec.evento_id
    left join public.evento_asignaciones ea
      on ea.evento_id = e.id and ea.profile_id = auth.uid()
    where e.fecha_fin > now()
  ), reminder_candidates as (
    select
      'reminder'::text as item_type,
      r.id,
      r.title::text as titulo,
      r.remind_at as fecha_inicio,
      null::text as ubicacion,
      vc.id as calendar_id,
      vc.nombre as calendar_nombre,
      null::text as estado
    from public.calendar_reminders r
    join visible_calendars vc on vc.id = r.calendar_id
    where r.remind_at >= now()
  )
  select x.item_type, x.id, x.titulo, x.fecha_inicio, x.ubicacion, x.calendar_id, x.calendar_nombre, x.estado
  from (
    select * from event_candidates
    union all
    select * from reminder_candidates
  ) x
  order by x.fecha_inicio asc
  limit 1;
$$;

grant execute on function public.get_next_visible_calendar_item() to authenticated;
