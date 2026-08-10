-- Consolida el modelo de calendario base + capas ministeriales.
-- Esta migración documenta cambios ya validados en Supabase y es idempotente.

-- 1. Todo miembro activo recibe el calendario público y los calendarios de sus ministerios.
create or replace function public.sync_calendar_subscription_for_profile(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select p.rol::text
    into v_role
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
      when v_role in ('administrador', 'pastor') then true
      when c.owner_id = p_profile_id then true
      when c.ministerio_id is not null and exists (
        select 1
        from public.ministerio_miembros mm
        where mm.profile_id = p_profile_id
          and mm.ministerio_id = c.ministerio_id
          and mm.es_lider = true
      ) then true
      else false
    end
  from public.calendars c
  where c.es_publico = true
     or v_role in ('administrador', 'pastor')
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

  if v_role not in ('administrador', 'pastor') then
    delete from public.calendar_subscriptions s
    using public.calendars c
    where s.user_id = p_profile_id
      and s.calendar_id = c.id
      and c.ministerio_id is not null
      and c.owner_id is distinct from p_profile_id
      and not exists (
        select 1
        from public.ministerio_miembros mm
        where mm.profile_id = p_profile_id
          and mm.ministerio_id = c.ministerio_id
      );
  end if;
end;
$$;

create or replace function public.trg_sync_calendar_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.sync_calendar_subscription_for_profile(old.profile_id);
    return old;
  end if;

  perform public.sync_calendar_subscription_for_profile(new.profile_id);

  if tg_op = 'UPDATE' and old.profile_id is distinct from new.profile_id then
    perform public.sync_calendar_subscription_for_profile(old.profile_id);
  end if;

  return new;
end;
$$;

create or replace function public.trg_sync_calendar_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_calendar_subscription_for_profile(new.id);
  return new;
end;
$$;

create or replace function public.trg_sync_calendar_definition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile record;
begin
  for v_profile in
    select id
    from public.profiles
    where activo = true and estado_cuenta = 'activo'
  loop
    perform public.sync_calendar_subscription_for_profile(v_profile.id);
  end loop;
  return new;
end;
$$;

drop trigger if exists ministerio_miembros_sync_calendar on public.ministerio_miembros;
create trigger ministerio_miembros_sync_calendar
after insert or update or delete on public.ministerio_miembros
for each row execute function public.trg_sync_calendar_membership();

drop trigger if exists profiles_sync_public_calendars on public.profiles;
create trigger profiles_sync_public_calendars
after insert or update on public.profiles
for each row execute function public.trg_sync_calendar_profile();

drop trigger if exists calendars_sync_memberships on public.calendars;
create trigger calendars_sync_memberships
after insert or update on public.calendars
for each row execute function public.trg_sync_calendar_definition();

-- El calendario público es la agenda base de toda cuenta activa y no se puede ocultar.
create or replace function public.set_calendar_visibility(p_calendar_id uuid, p_visible boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_public boolean;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select c.es_publico into v_public
  from public.calendars c
  where c.id = p_calendar_id;

  if v_public is null then
    raise exception 'calendar not found';
  end if;

  if v_public = true and p_visible = false then
    update public.calendar_subscriptions
    set visible = true,
        updated_at = now()
    where user_id = auth.uid()
      and calendar_id = p_calendar_id;
    return;
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

-- 2. Una fecha real puede recibir programación independiente de varios ministerios.
alter table public.evento_asignaciones
  add column if not exists ministerio_id uuid null;

update public.evento_asignaciones ea
set ministerio_id = coalesce(
  (select mc.ministerio_id from public.ministerio_capacidades mc where mc.id = ea.capacidad_id),
  (select e.ministerio_id from public.eventos e where e.id = ea.evento_id)
)
where ea.ministerio_id is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'evento_asignaciones_ministerio_id_fkey'
      and conrelid = 'public.evento_asignaciones'::regclass
  ) then
    alter table public.evento_asignaciones
      add constraint evento_asignaciones_ministerio_id_fkey
      foreign key (ministerio_id) references public.ministerios(id) on delete set null;
  end if;
end;
$$;

alter table public.evento_asignaciones
  drop constraint if exists evento_asignaciones_evento_id_profile_id_key;
alter table public.evento_asignaciones
  drop constraint if exists evento_asignaciones_evento_ministerio_profile_key;
alter table public.evento_asignaciones
  add constraint evento_asignaciones_evento_ministerio_profile_key
  unique nulls not distinct (evento_id, ministerio_id, profile_id);

drop policy if exists lider_gestiona_asignaciones on public.evento_asignaciones;
create policy lider_gestiona_asignaciones
on public.evento_asignaciones
for all
to authenticated
using (
  (ministerio_id is not null and public.lidera(ministerio_id))
  or public.es_admin_o_pastor()
)
with check (
  (ministerio_id is not null and public.lidera(ministerio_id))
  or public.es_admin_o_pastor()
);

drop policy if exists ver_asignaciones on public.evento_asignaciones;
create policy ver_asignaciones
on public.evento_asignaciones
for select
to authenticated
using (
  profile_id = (select auth.uid())
  or (ministerio_id is not null and public.lidera(ministerio_id))
  or public.es_admin_o_pastor()
);

-- 3. Repertorio y paleta pertenecen a la preparación de un ministerio, no a la fecha global.
alter table public.evento_repertorio
  add column if not exists ministerio_id uuid null references public.ministerios(id) on delete cascade;
alter table public.evento_paletas
  add column if not exists ministerio_id uuid null references public.ministerios(id) on delete cascade;

update public.evento_repertorio er
set ministerio_id = coalesce(
  (select mc.ministerio_id from public.ministerio_canciones mc where mc.id = er.cancion_id),
  (select e.ministerio_id from public.eventos e where e.id = er.evento_id),
  (
    select c.ministerio_id
    from public.evento_calendarios ec
    join public.calendars c on c.id = ec.calendar_id
    where ec.evento_id = er.evento_id and c.ministerio_id is not null
    order by c.created_at
    limit 1
  )
)
where er.ministerio_id is null;

update public.evento_paletas ep
set ministerio_id = coalesce(
  (select e.ministerio_id from public.eventos e where e.id = ep.evento_id),
  (
    select c.ministerio_id
    from public.evento_calendarios ec
    join public.calendars c on c.id = ec.calendar_id
    where ec.evento_id = ep.evento_id and c.ministerio_id is not null
    order by c.created_at
    limit 1
  )
)
where ep.ministerio_id is null;

do $$
begin
  if not exists (select 1 from public.evento_repertorio where ministerio_id is null) then
    alter table public.evento_repertorio alter column ministerio_id set not null;
  end if;
  if not exists (select 1 from public.evento_paletas where ministerio_id is null) then
    alter table public.evento_paletas alter column ministerio_id set not null;
  end if;
end;
$$;

alter table public.evento_paletas
  drop constraint if exists evento_paletas_pkey;
alter table public.evento_paletas
  add constraint evento_paletas_pkey primary key (evento_id, ministerio_id);

create unique index if not exists ux_evento_repertorio_ministerio_cancion
  on public.evento_repertorio(evento_id, ministerio_id, cancion_id)
  where cancion_id is not null;
create index if not exists idx_evento_repertorio_ministerio_evento_orden
  on public.evento_repertorio(ministerio_id, evento_id, orden, created_at);
create index if not exists idx_evento_paletas_ministerio_evento
  on public.evento_paletas(ministerio_id, evento_id);

-- Sincroniza el estado actual al instalar la migración en otro entorno.
do $$
declare
  v_profile record;
begin
  for v_profile in
    select id from public.profiles where activo = true and estado_cuenta = 'activo'
  loop
    perform public.sync_calendar_subscription_for_profile(v_profile.id);
  end loop;
end;
$$;
