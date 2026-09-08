alter table public.evento_asistencia_config
  add column if not exists ubicacion_tipo text not null default 'especifica';

alter table public.evento_asistencia_config
  drop constraint if exists evento_asistencia_config_ubicacion_tipo_check;

alter table public.evento_asistencia_config
  add constraint evento_asistencia_config_ubicacion_tipo_check
  check (ubicacion_tipo in ('principal','especifica'));

drop policy if exists "Lectura pública de settings" on public.app_settings;
create policy "Lectura pública de settings"
on public.app_settings
for select
to public
using (
  clave <> 'ubicacion_principal_iglesia'
  or (
    auth.uid() is not null
    and public.mi_rol() = 'administrador'::public.rol_app
  )
);

create or replace function public.ubicacion_iglesia_guardar(
  p_latitud double precision,
  p_longitud double precision,
  p_radio_metros integer default 150
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.activo = true
      and p.estado_cuenta = 'activo'
      and p.rol::text = 'administrador'
  ) then
    raise exception 'Solo un administrador activo puede modificar la ubicación principal de la iglesia';
  end if;

  if p_latitud not between -90 and 90
    or p_longitud not between -180 and 180
    or p_radio_metros not between 25 and 1000 then
    raise exception 'Configuración de ubicación inválida';
  end if;

  insert into public.app_settings(clave, valor, updated_at)
  values (
    'ubicacion_principal_iglesia',
    jsonb_build_object(
      'latitud', p_latitud,
      'longitud', p_longitud,
      'radio_metros', p_radio_metros
    ),
    now()
  )
  on conflict (clave) do update set
    valor = excluded.valor,
    updated_at = now();
end;
$$;

revoke all on function public.ubicacion_iglesia_guardar(double precision, double precision, integer) from public, anon;
grant execute on function public.ubicacion_iglesia_guardar(double precision, double precision, integer) to authenticated, service_role;

create or replace function public.asistencia_configurar_evento(
  p_evento_id uuid,
  p_latitud double precision,
  p_longitud double precision,
  p_radio_metros integer default 150,
  p_minutos_antes integer default 30,
  p_minutos_despues integer default 90
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.puede_gestionar_asistencia() then raise exception 'Sin permiso'; end if;
  if not exists (select 1 from public.eventos e where e.id = p_evento_id) then
    raise exception 'Evento no disponible';
  end if;

  if p_latitud not between -90 and 90
    or p_longitud not between -180 and 180
    or p_radio_metros not between 25 and 1000
    or p_minutos_antes not between 0 and 360
    or p_minutos_despues not between 0 and 720 then
    raise exception 'Configuración de ubicación inválida';
  end if;

  insert into public.evento_asistencia_config(
    evento_id, activo, latitud, longitud, radio_metros,
    minutos_antes, minutos_despues, configurado_por, updated_at, ubicacion_tipo
  ) values (
    p_evento_id, true, p_latitud, p_longitud, p_radio_metros,
    p_minutos_antes, p_minutos_despues, auth.uid(), now(), 'especifica'
  )
  on conflict (evento_id) do update set
    activo = true,
    latitud = excluded.latitud,
    longitud = excluded.longitud,
    radio_metros = excluded.radio_metros,
    minutos_antes = excluded.minutos_antes,
    minutos_despues = excluded.minutos_despues,
    configurado_por = excluded.configurado_por,
    updated_at = now(),
    ubicacion_tipo = 'especifica';
end;
$$;

create or replace function public.asistencia_configurar_evento_principal(
  p_evento_id uuid,
  p_radio_metros integer default null,
  p_minutos_antes integer default 30,
  p_minutos_despues integer default 90
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_valor jsonb;
  v_latitud double precision;
  v_longitud double precision;
  v_radio integer;
begin
  if not public.puede_gestionar_asistencia() then raise exception 'Sin permiso'; end if;
  if not exists (select 1 from public.eventos e where e.id = p_evento_id) then
    raise exception 'Evento no disponible';
  end if;

  select valor into v_valor
  from public.app_settings
  where clave = 'ubicacion_principal_iglesia';

  if v_valor is null then
    raise exception 'La ubicación principal de la iglesia todavía no está configurada';
  end if;

  v_latitud := (v_valor->>'latitud')::double precision;
  v_longitud := (v_valor->>'longitud')::double precision;
  v_radio := coalesce(p_radio_metros, (v_valor->>'radio_metros')::integer, 150);

  if v_latitud not between -90 and 90
    or v_longitud not between -180 and 180
    or v_radio not between 25 and 1000
    or p_minutos_antes not between 0 and 360
    or p_minutos_despues not between 0 and 720 then
    raise exception 'Configuración de ubicación inválida';
  end if;

  insert into public.evento_asistencia_config(
    evento_id, activo, latitud, longitud, radio_metros,
    minutos_antes, minutos_despues, configurado_por, updated_at, ubicacion_tipo
  ) values (
    p_evento_id, true, v_latitud, v_longitud, v_radio,
    p_minutos_antes, p_minutos_despues, auth.uid(), now(), 'principal'
  )
  on conflict (evento_id) do update set
    activo = true,
    latitud = excluded.latitud,
    longitud = excluded.longitud,
    radio_metros = excluded.radio_metros,
    minutos_antes = excluded.minutos_antes,
    minutos_despues = excluded.minutos_despues,
    configurado_por = excluded.configurado_por,
    updated_at = now(),
    ubicacion_tipo = 'principal';
end;
$$;

revoke all on function public.asistencia_configurar_evento_principal(uuid, integer, integer, integer) from public, anon;
grant execute on function public.asistencia_configurar_evento_principal(uuid, integer, integer, integer) to authenticated, service_role;

create or replace function public.asistencia_confirmar_gps(
  p_evento_id uuid,
  p_latitud double precision,
  p_longitud double precision,
  p_precision_m double precision default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg public.evento_asistencia_config%rowtype;
  v_inicio timestamptz;
  v_h double precision;
  v_distancia double precision;
  v_target_lat double precision;
  v_target_lon double precision;
  v_valor jsonb;
begin
  if not public.cuenta_activa() then raise exception 'Cuenta inactiva'; end if;
  if not public.asistencia_evento_visible_para(p_evento_id, auth.uid()) then raise exception 'Evento no disponible'; end if;
  if p_latitud not between -90 and 90 or p_longitud not between -180 and 180 then raise exception 'Ubicación inválida'; end if;
  if p_precision_m is not null and (p_precision_m < 0 or p_precision_m > 200) then
    raise exception 'La ubicación todavía no tiene suficiente precisión. Intenta nuevamente.';
  end if;

  select * into v_cfg
  from public.evento_asistencia_config
  where evento_id = p_evento_id and activo = true;
  if v_cfg.evento_id is null then raise exception 'Este evento no tiene confirmación de asistencia activa'; end if;

  if v_cfg.ubicacion_tipo = 'principal' then
    select valor into v_valor
    from public.app_settings
    where clave = 'ubicacion_principal_iglesia';
    if v_valor is null then raise exception 'La ubicación principal de la iglesia todavía no está configurada'; end if;
    v_target_lat := (v_valor->>'latitud')::double precision;
    v_target_lon := (v_valor->>'longitud')::double precision;
  else
    v_target_lat := v_cfg.latitud;
    v_target_lon := v_cfg.longitud;
  end if;

  select e.fecha_inicio into v_inicio from public.eventos e where e.id = p_evento_id;
  if now() < v_inicio - make_interval(mins => v_cfg.minutos_antes)
    or now() > v_inicio + make_interval(mins => v_cfg.minutos_despues) then
    raise exception 'La confirmación de llegada no está disponible en este momento';
  end if;

  v_h := power(sin(radians(p_latitud - v_target_lat) / 2), 2)
    + cos(radians(v_target_lat)) * cos(radians(p_latitud))
    * power(sin(radians(p_longitud - v_target_lon) / 2), 2);
  v_distancia := 6371000 * 2 * asin(least(1, sqrt(greatest(0, v_h))));
  if v_distancia > v_cfg.radio_metros then raise exception 'Aún no estás dentro del área de check-in'; end if;

  insert into public.evento_asistencias(evento_id, profile_id, estado, confirmado_en, metodo)
  values(p_evento_id, auth.uid(), 'asistio', now(), 'gps')
  on conflict (evento_id, profile_id) do update set
    estado = 'asistio', confirmado_en = now(), metodo = 'gps';

  return jsonb_build_object(
    'confirmado', true,
    'distancia_metros', round(v_distancia::numeric, 0),
    'confirmado_en', now()
  );
end;
$$;

create or replace function public.asistencia_evento_estado(p_evento_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cfg public.evento_asistencia_config%rowtype;
  v_asistencia public.evento_asistencias%rowtype;
  v_inicio timestamptz;
  v_fin timestamptz;
  v_gestiona boolean;
  v_principal jsonb;
begin
  if not public.cuenta_activa() then raise exception 'Cuenta inactiva'; end if;
  v_gestiona := public.puede_gestionar_asistencia();

  if not v_gestiona and not public.asistencia_evento_visible_para(p_evento_id, auth.uid()) then
    raise exception 'Evento no disponible';
  end if;

  select * into v_cfg from public.evento_asistencia_config where evento_id = p_evento_id;
  select e.fecha_inicio, e.fecha_fin into v_inicio, v_fin from public.eventos e where e.id = p_evento_id;
  if v_inicio is null then raise exception 'Evento no disponible'; end if;

  select valor into v_principal
  from public.app_settings
  where clave = 'ubicacion_principal_iglesia';

  select * into v_asistencia
  from public.evento_asistencias
  where evento_id = p_evento_id and profile_id = auth.uid();

  return jsonb_build_object(
    'configurado', v_cfg.evento_id is not null,
    'activo', coalesce(v_cfg.activo, false),
    'radio_metros', v_cfg.radio_metros,
    'minutos_antes', v_cfg.minutos_antes,
    'minutos_despues', v_cfg.minutos_despues,
    'ubicacion_tipo', v_cfg.ubicacion_tipo,
    'ubicacion_principal_disponible', v_principal is not null,
    'radio_principal_metros', case when v_principal is null then null else coalesce((v_principal->>'radio_metros')::integer, 150) end,
    'puede_gestionar', v_gestiona,
    'estado', v_asistencia.estado,
    'confirmado_en', v_asistencia.confirmado_en,
    'metodo', v_asistencia.metodo,
    'ventana_abierta', case
      when v_cfg.evento_id is null or not v_cfg.activo then false
      else now() between (v_inicio - make_interval(mins => v_cfg.minutos_antes))
        and (v_inicio + make_interval(mins => v_cfg.minutos_despues))
    end,
    'fecha_inicio', v_inicio,
    'fecha_fin', v_fin
  );
end;
$$;
