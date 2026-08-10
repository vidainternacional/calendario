create or replace function public.sincronizar_calendarios_publicos_usuario(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.calendar_subscriptions (user_id, calendar_id, visible, can_edit)
  select p_user_id, c.id, true, false
  from public.calendars c
  where c.es_publico = true
  on conflict (user_id, calendar_id)
  do update set visible = true, updated_at = now();
end;
$$;

insert into public.calendar_subscriptions (user_id, calendar_id, visible, can_edit)
select p.id, c.id, true, false
from public.profiles p
cross join public.calendars c
where p.activo = true
  and p.estado_cuenta = 'activo'
  and c.es_publico = true
on conflict (user_id, calendar_id)
do update set visible = true, updated_at = now();

create or replace function public.trg_sincronizar_calendarios_publicos_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.activo = true and new.estado_cuenta = 'activo' then
    perform public.sincronizar_calendarios_publicos_usuario(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_sync_public_calendars on public.profiles;
create trigger profiles_sync_public_calendars
after insert or update of activo, estado_cuenta on public.profiles
for each row execute function public.trg_sincronizar_calendarios_publicos_profile();

create or replace function public.trg_sincronizar_nuevo_calendario_publico()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.es_publico = true then
    insert into public.calendar_subscriptions (user_id, calendar_id, visible, can_edit)
    select p.id, new.id, true, false
    from public.profiles p
    where p.activo = true and p.estado_cuenta = 'activo'
    on conflict (user_id, calendar_id)
    do update set visible = true, updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists calendars_sync_public_users on public.calendars;
create trigger calendars_sync_public_users
after insert or update of es_publico on public.calendars
for each row execute function public.trg_sincronizar_nuevo_calendario_publico();

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
    where e.fecha_inicio >= now()
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
