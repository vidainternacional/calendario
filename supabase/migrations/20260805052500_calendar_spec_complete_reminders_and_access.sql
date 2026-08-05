-- Completa la especificación de calendario: recordatorios separados,
-- visibilidad segura y detalles de acceso por calendario.

create table if not exists public.calendar_reminders (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid not null references public.calendars(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 140),
  notes text,
  remind_at timestamptz not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calendar_reminders_calendar_time_idx
  on public.calendar_reminders(calendar_id, remind_at);

alter table public.calendar_reminders enable row level security;

drop policy if exists reminders_read_subscribed on public.calendar_reminders;
create policy reminders_read_subscribed
on public.calendar_reminders for select to authenticated
using (
  public.cuenta_activa()
  and (
    public.es_admin_o_pastor()
    or exists (
      select 1
      from public.calendar_subscriptions s
      where s.calendar_id = calendar_reminders.calendar_id
        and s.user_id = (select auth.uid())
    )
  )
);

drop policy if exists reminders_manage_editable on public.calendar_reminders;
create policy reminders_manage_editable
on public.calendar_reminders for all to authenticated
using (
  public.es_admin_o_pastor()
  or exists (
    select 1
    from public.calendar_subscriptions s
    where s.calendar_id = calendar_reminders.calendar_id
      and s.user_id = (select auth.uid())
      and s.can_edit
  )
)
with check (
  created_by = (select auth.uid())
  and (
    public.es_admin_o_pastor()
    or exists (
      select 1
      from public.calendar_subscriptions s
      where s.calendar_id = calendar_reminders.calendar_id
        and s.user_id = (select auth.uid())
        and s.can_edit
    )
  )
);

-- La visibilidad puede cambiarla el propio usuario, pero can_edit nunca debe
-- poder elevarse desde el cliente.
drop policy if exists subscriptions_update_own_visibility on public.calendar_subscriptions;

create or replace function public.set_calendar_visibility(
  p_calendar_id uuid,
  p_visible boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  update public.calendar_subscriptions
  set visible = p_visible,
      updated_at = now()
  where user_id = auth.uid()
    and calendar_id = p_calendar_id;

  if not found then
    raise exception 'calendar subscription not found';
  end if;
end;
$$;

revoke all on function public.set_calendar_visibility(uuid, boolean) from public, anon;
grant execute on function public.set_calendar_visibility(uuid, boolean) to authenticated;

-- Asigna propietarios funcionales sin IDs hardcodeados.
update public.calendars c
set owner_id = coalesce(
  (
    select mm.profile_id
    from public.ministerio_miembros mm
    where mm.ministerio_id = c.ministerio_id
      and mm.es_lider
    order by mm.created_at
    limit 1
  ),
  (
    select p.id
    from public.profiles p
    where p.activo
      and p.estado_cuenta = 'activo'
      and p.es_pastor_general
    order by p.created_at
    limit 1
  ),
  (
    select p.id
    from public.profiles p
    where p.activo
      and p.estado_cuenta = 'activo'
      and p.rol = 'administrador'::public.rol_app
    order by p.created_at
    limit 1
  )
)
where c.owner_id is null;

create or replace function public.get_calendar_access_details(p_calendar_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allowed boolean;
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select (
    public.es_admin_o_pastor()
    or exists (
      select 1
      from public.calendar_subscriptions s
      where s.calendar_id = p_calendar_id
        and s.user_id = auth.uid()
    )
  ) into v_allowed;

  if not coalesce(v_allowed, false) then
    raise exception 'calendar access denied';
  end if;

  select jsonb_build_object(
    'owner', case
      when owner.id is null then null
      else jsonb_build_object(
        'id', owner.id,
        'name', owner.nombre_completo,
        'avatar_url', owner.avatar_url
      )
    end,
    'members', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.nombre_completo,
          'avatar_url', p.avatar_url,
          'can_edit', s.can_edit
        )
        order by s.can_edit desc, p.nombre_completo
      )
      from public.calendar_subscriptions s
      join public.profiles p on p.id = s.user_id
      where s.calendar_id = c.id
        and p.activo
        and p.estado_cuenta = 'activo'
    ), '[]'::jsonb)
  )
  into v_result
  from public.calendars c
  left join public.profiles owner on owner.id = c.owner_id
  where c.id = p_calendar_id;

  return coalesce(v_result, jsonb_build_object('owner', null, 'members', '[]'::jsonb));
end;
$$;

revoke all on function public.get_calendar_access_details(uuid) from public, anon;
grant execute on function public.get_calendar_access_details(uuid) to authenticated;

create or replace function public.calendar_reminder_change_feed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_calendar_id uuid;
  v_calendar_name text;
  v_title text;
  v_type text;
begin
  if tg_op = 'DELETE' then
    v_calendar_id := old.calendar_id;
    v_title := old.title;
    v_type := 'deleted';
  elsif tg_op = 'INSERT' then
    v_calendar_id := new.calendar_id;
    v_title := new.title;
    v_type := 'created';
  else
    v_calendar_id := new.calendar_id;
    v_title := new.title;
    v_type := 'updated';
    new.updated_at := now();
  end if;

  select nombre into v_calendar_name
  from public.calendars
  where id = v_calendar_id;

  insert into public.calendar_changes(
    event_id,
    calendar_id,
    changed_by,
    change_type,
    summary
  ) values (
    null,
    v_calendar_id,
    auth.uid(),
    v_type,
    case v_type
      when 'created' then 'Se agregó el recordatorio “' || coalesce(v_title, 'Recordatorio') || '” a ' || coalesce(v_calendar_name, 'Calendario')
      when 'updated' then 'Se actualizó el recordatorio “' || coalesce(v_title, 'Recordatorio') || '” en ' || coalesce(v_calendar_name, 'Calendario')
      else 'Se eliminó el recordatorio “' || coalesce(v_title, 'Recordatorio') || '” de ' || coalesce(v_calendar_name, 'Calendario')
    end
  );

  return coalesce(new, old);
end;
$$;

revoke all on function public.calendar_reminder_change_feed() from public, anon, authenticated;

drop trigger if exists calendar_reminders_change_feed on public.calendar_reminders;
create trigger calendar_reminders_change_feed
before insert or update or delete on public.calendar_reminders
for each row execute function public.calendar_reminder_change_feed();
