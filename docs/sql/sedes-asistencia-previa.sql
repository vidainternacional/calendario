CREATE OR REPLACE FUNCTION public.asistencia_evento_visible_para(p_evento_id uuid, p_profile_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with event_calendars as (
    select e.calendar_id
    from public.eventos e
    where e.id = p_evento_id
    union
    select ec.calendar_id
    from public.evento_calendarios ec
    where ec.evento_id = p_evento_id
  )
  select exists (
    select 1
    from public.eventos e
    where e.id = p_evento_id
      and (
        exists (
          select 1
          from event_calendars x
          join public.calendars c on c.id = x.calendar_id
          where c.es_publico = true
        )
        or exists (
          select 1
          from event_calendars x
          join public.calendar_subscriptions cs on cs.calendar_id = x.calendar_id
          where cs.user_id = p_profile_id and cs.visible = true
        )
        or exists (
          select 1
          from public.evento_asignaciones ea
          where ea.evento_id = p_evento_id and ea.profile_id = p_profile_id
        )
      )
  );
$function$;

CREATE OR REPLACE FUNCTION public.asistencia_persona_esperada(p_evento_id uuid, p_profile_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_profile_id
      and p.activo = true
      and p.estado_cuenta = 'activo'
      and public.asistencia_evento_visible_para(p_evento_id, p_profile_id)
  );
$function$;

CREATE OR REPLACE FUNCTION public.asistencia_configurar_evento(p_evento_id uuid, p_latitud double precision, p_longitud double precision, p_radio_metros integer DEFAULT 150, p_minutos_antes integer DEFAULT 30, p_minutos_despues integer DEFAULT 90)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.asistencia_configurar_evento_principal(p_evento_id uuid, p_radio_metros integer DEFAULT NULL::integer, p_minutos_antes integer DEFAULT 30, p_minutos_despues integer DEFAULT 90)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.asistencia_confirmar_gps(p_evento_id uuid, p_latitud double precision, p_longitud double precision, p_precision_m double precision DEFAULT NULL::double precision)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.asistencia_consecutivos_sin_confirmar(p_profile_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with recientes as (
    select
      e.fecha_inicio,
      a.estado
    from public.evento_asistencia_config cfg
    join public.eventos e on e.id = cfg.evento_id
    left join public.evento_asistencias a
      on a.evento_id = e.id
     and a.profile_id = p_profile_id
    where cfg.activo = true
      and e.fecha_inicio <= now()
      and public.asistencia_persona_esperada(e.id, p_profile_id)
    order by e.fecha_inicio desc
    limit 20
  ), prefijo as (
    select
      estado,
      sum(case when estado is not null then 1 else 0 end)
        over (order by fecha_inicio desc rows between unbounded preceding and current row) as confirmados_hasta
    from recientes
  )
  select count(*)::integer
  from prefijo
  where estado is null
    and confirmados_hasta = 0;
$function$;

CREATE OR REPLACE FUNCTION public.asistencia_evento_estado(p_evento_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.asistencia_historial_persona(p_profile_id uuid)
 RETURNS TABLE(evento_id uuid, titulo text, fecha_inicio timestamp with time zone, estado text, confirmado_en timestamp with time zone, metodo text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.cuenta_activa() then raise exception 'Cuenta inactiva'; end if;
  if p_profile_id <> auth.uid() and not public.puede_gestionar_asistencia() then raise exception 'Sin permiso'; end if;

  return query
  select
    e.id,
    e.titulo,
    e.fecha_inicio,
    coalesce(a.estado, 'sin_confirmacion')::text,
    a.confirmado_en,
    a.metodo
  from public.evento_asistencia_config cfg
  join public.eventos e on e.id = cfg.evento_id
  left join public.evento_asistencias a
    on a.evento_id = e.id and a.profile_id = p_profile_id
  where cfg.activo = true
    and e.fecha_inicio <= now()
    and public.asistencia_persona_esperada(e.id, p_profile_id)
  order by e.fecha_inicio desc
  limit 40;
end;
$function$;

CREATE OR REPLACE FUNCTION public.es_asignacion_propia_intercambio(p_asignacion_origen_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.evento_asignaciones ea
    where ea.id = p_asignacion_origen_id
      and ea.profile_id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.puede_gestionar_intercambio(p_asignacion_origen_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    public.es_admin_o_pastor()
    or exists (
      select 1
      from public.evento_asignaciones ea
      where ea.id = p_asignacion_origen_id
        and ea.ministerio_id is not null
        and public.lidera(ea.ministerio_id)
    );
$function$;

CREATE OR REPLACE FUNCTION public.asistencia_desactivar_evento(p_evento_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.puede_gestionar_asistencia() then raise exception 'Sin permiso'; end if;
  update public.evento_asistencia_config
  set activo = false, configurado_por = auth.uid(), updated_at = now()
  where evento_id = p_evento_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.asistencia_justificar(p_evento_id uuid, p_profile_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.puede_gestionar_asistencia() then raise exception 'Sin permiso'; end if;
  if not public.asistencia_persona_esperada(p_evento_id, p_profile_id) then
    raise exception 'Persona no asociada a este evento';
  end if;

  if exists (
    select 1 from public.evento_asistencias a
    where a.evento_id = p_evento_id and a.profile_id = p_profile_id and a.estado = 'asistio'
  ) then return; end if;

  insert into public.evento_asistencias(evento_id, profile_id, estado, confirmado_en, metodo)
  values(p_evento_id, p_profile_id, 'justificado', now(), 'pastoral')
  on conflict (evento_id, profile_id) do update set
    estado = 'justificado', confirmado_en = now(), metodo = 'pastoral';
end;
$function$;

CREATE OR REPLACE FUNCTION public.asistencia_resumen_evento(p_evento_id uuid)
 RETURNS TABLE(profile_id uuid, nombre_completo text, avatar_url text, estado text, confirmado_en timestamp with time zone, metodo text, consecutivos_sin_confirmar integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.puede_gestionar_asistencia() then raise exception 'Sin permiso'; end if;
  if not exists (select 1 from public.evento_asistencia_config c where c.evento_id = p_evento_id) then
    raise exception 'Este evento no tiene control de asistencia';
  end if;

  return query
  select
    p.id,
    p.nombre_completo,
    p.avatar_url,
    coalesce(a.estado, 'sin_confirmacion')::text,
    a.confirmado_en,
    a.metodo,
    public.asistencia_consecutivos_sin_confirmar(p.id)
  from public.profiles p
  left join public.evento_asistencias a
    on a.evento_id = p_evento_id and a.profile_id = p.id
  where p.activo = true
    and p.estado_cuenta = 'activo'
    and public.asistencia_persona_esperada(p_evento_id, p.id)
  order by
    case coalesce(a.estado, 'sin_confirmacion') when 'sin_confirmacion' then 0 when 'justificado' then 1 else 2 end,
    p.nombre_completo;
end;
$function$;
