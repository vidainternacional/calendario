create or replace function public.sync_calendar_subscription_for_profile(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_es_pastor_general boolean;
begin
  select p.rol::text, coalesce(p.es_pastor_general, false)
    into v_role, v_es_pastor_general
  from public.profiles p
  where p.id = p_profile_id
    and p.activo = true
    and p.estado_cuenta = 'activo';

  if v_role is null then
    return;
  end if;

  insert into public.calendar_subscriptions (user_id, calendar_id, visible, can_edit)
  select
    p_profile_id,
    c.id,
    true,
    case
      when v_role = 'administrador' then true
      when c.ministerio_id is not null then exists (
        select 1
        from public.ministerio_miembros mm
        where mm.profile_id = p_profile_id
          and mm.ministerio_id = c.ministerio_id
          and mm.es_lider = true
      )
      when c.owner_id = p_profile_id then true
      when (v_role = 'pastor' or v_es_pastor_general = true)
        and (c.es_publico = true or lower(trim(c.nombre)) = 'pastores') then true
      else false
    end
  from public.calendars c
  where c.es_publico = true
     or v_role = 'administrador'
     or v_role = 'pastor'
     or v_es_pastor_general = true
     or c.owner_id = p_profile_id
     or (
       c.ministerio_id is not null
       and exists (
         select 1
         from public.ministerio_miembros mm
         where mm.profile_id = p_profile_id
           and mm.ministerio_id = c.ministerio_id
       )
     )
  on conflict (user_id, calendar_id)
  do update set
    visible = true,
    can_edit = excluded.can_edit,
    updated_at = now();
end;
$$;

update public.calendar_subscriptions s
set
  can_edit = case
    when c.ministerio_id is not null then exists (
      select 1
      from public.ministerio_miembros mm
      where mm.profile_id = p.id
        and mm.ministerio_id = c.ministerio_id
        and mm.es_lider = true
    )
    when c.owner_id = p.id then true
    when c.es_publico = true or lower(trim(c.nombre)) = 'pastores' then true
    else false
  end,
  updated_at = now()
from public.profiles p,
     public.calendars c
where s.user_id = p.id
  and s.calendar_id = c.id
  and p.activo = true
  and p.estado_cuenta = 'activo'
  and (
    p.rol = 'pastor'
    or coalesce(p.es_pastor_general, false) = true
  );

drop policy if exists subscriptions_manage_admin on public.calendar_subscriptions;
create policy subscriptions_manage_admin
on public.calendar_subscriptions
for all
to authenticated
using (public.mi_rol() = 'administrador')
with check (public.mi_rol() = 'administrador');

drop policy if exists calendars_manage_authorized on public.calendars;
create policy calendars_manage_authorized
on public.calendars
for all
to authenticated
using (
  public.mi_rol() = 'administrador'
  or (
    exists (
      select 1
      from public.calendar_subscriptions s
      where s.calendar_id = calendars.id
        and s.user_id = auth.uid()
        and s.can_edit = true
    )
    and (
      calendars.ministerio_id is null
      or public.lidera(calendars.ministerio_id)
    )
  )
)
with check (
  public.mi_rol() = 'administrador'
  or (
    exists (
      select 1
      from public.calendar_subscriptions s
      where s.calendar_id = calendars.id
        and s.user_id = auth.uid()
        and s.can_edit = true
    )
    and (
      calendars.ministerio_id is null
      or public.lidera(calendars.ministerio_id)
    )
  )
);

drop policy if exists reminders_insert_editable on public.calendar_reminders;
drop policy if exists reminders_update_editable on public.calendar_reminders;
drop policy if exists reminders_delete_editable on public.calendar_reminders;

create policy reminders_insert_editable
on public.calendar_reminders
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    public.mi_rol() = 'administrador'
    or exists (
      select 1
      from public.calendar_subscriptions s
      join public.calendars c on c.id = s.calendar_id
      where s.calendar_id = calendar_reminders.calendar_id
        and s.user_id = auth.uid()
        and s.can_edit = true
        and (
          c.ministerio_id is null
          or public.lidera(c.ministerio_id)
        )
    )
  )
);

create policy reminders_update_editable
on public.calendar_reminders
for update
to authenticated
using (
  public.mi_rol() = 'administrador'
  or exists (
    select 1
    from public.calendar_subscriptions s
    join public.calendars c on c.id = s.calendar_id
    where s.calendar_id = calendar_reminders.calendar_id
      and s.user_id = auth.uid()
      and s.can_edit = true
      and (
        c.ministerio_id is null
        or public.lidera(c.ministerio_id)
      )
  )
)
with check (
  public.mi_rol() = 'administrador'
  or exists (
    select 1
    from public.calendar_subscriptions s
    join public.calendars c on c.id = s.calendar_id
    where s.calendar_id = calendar_reminders.calendar_id
      and s.user_id = auth.uid()
      and s.can_edit = true
      and (
        c.ministerio_id is null
        or public.lidera(c.ministerio_id)
      )
  )
);

create policy reminders_delete_editable
on public.calendar_reminders
for delete
to authenticated
using (
  public.mi_rol() = 'administrador'
  or exists (
    select 1
    from public.calendar_subscriptions s
    join public.calendars c on c.id = s.calendar_id
    where s.calendar_id = calendar_reminders.calendar_id
      and s.user_id = auth.uid()
      and s.can_edit = true
      and (
        c.ministerio_id is null
        or public.lidera(c.ministerio_id)
      )
  )
);

drop policy if exists evento_calendarios_insert on public.evento_calendarios;
drop policy if exists evento_calendarios_delete on public.evento_calendarios;

create policy evento_calendarios_insert
on public.evento_calendarios
for insert
to authenticated
with check (
  public.mi_rol() = 'administrador'
  or exists (
    select 1
    from public.calendars c
    join public.calendar_subscriptions s on s.calendar_id = c.id
    where c.id = evento_calendarios.calendar_id
      and s.user_id = auth.uid()
      and s.can_edit = true
      and (
        c.ministerio_id is null
        or public.lidera(c.ministerio_id)
      )
  )
);

create policy evento_calendarios_delete
on public.evento_calendarios
for delete
to authenticated
using (
  public.mi_rol() = 'administrador'
  or exists (
    select 1
    from public.calendars c
    join public.calendar_subscriptions s on s.calendar_id = c.id
    where c.id = evento_calendarios.calendar_id
      and s.user_id = auth.uid()
      and s.can_edit = true
      and (
        c.ministerio_id is null
        or public.lidera(c.ministerio_id)
      )
  )
);

drop policy if exists lider_gestiona_eventos on public.eventos;
drop policy if exists editor_autorizado_gestiona_eventos on public.eventos;

create policy editor_autorizado_gestiona_eventos
on public.eventos
for all
to authenticated
using (
  public.mi_rol() = 'administrador'
  or (
    exists (
      select 1
      from public.calendar_subscriptions s
      join public.calendars c on c.id = s.calendar_id
      where s.calendar_id = eventos.calendar_id
        and s.user_id = auth.uid()
        and s.can_edit = true
        and (
          c.ministerio_id is null
          or public.lidera(c.ministerio_id)
        )
    )
    and (
      eventos.ministerio_id is null
      or public.lidera(eventos.ministerio_id)
    )
  )
)
with check (
  public.mi_rol() = 'administrador'
  or (
    exists (
      select 1
      from public.calendar_subscriptions s
      join public.calendars c on c.id = s.calendar_id
      where s.calendar_id = eventos.calendar_id
        and s.user_id = auth.uid()
        and s.can_edit = true
        and (
          c.ministerio_id is null
          or public.lidera(c.ministerio_id)
        )
    )
    and (
      eventos.ministerio_id is null
      or public.lidera(eventos.ministerio_id)
    )
  )
);
