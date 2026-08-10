create or replace function public.resolve_visible_calendar_item_at(p_fecha timestamptz)
returns table(item_type text, id uuid, fecha_inicio timestamptz)
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
    select c.id
    from public.calendars c
    where c.es_publico = true
      and exists (select 1 from me)
    union
    select c.id
    from public.calendar_subscriptions s
    join public.calendars c on c.id = s.calendar_id
    where s.user_id = auth.uid()
      and s.visible = true
      and exists (select 1 from me)
  ), candidates as (
    select distinct
      'event'::text as item_type,
      e.id,
      e.fecha_inicio
    from public.evento_calendarios ec
    join visible_calendars vc on vc.id = ec.calendar_id
    join public.eventos e on e.id = ec.evento_id
    where e.fecha_inicio between p_fecha - interval '1 minute' and p_fecha + interval '1 minute'

    union all

    select
      'reminder'::text,
      r.id,
      r.remind_at
    from public.calendar_reminders r
    join visible_calendars vc on vc.id = r.calendar_id
    where r.remind_at between p_fecha - interval '1 minute' and p_fecha + interval '1 minute'
  )
  select c.item_type, c.id, c.fecha_inicio
  from candidates c
  order by abs(extract(epoch from (c.fecha_inicio - p_fecha))) asc,
           case when c.item_type = 'event' then 0 else 1 end,
           c.id
  limit 1;
$$;
