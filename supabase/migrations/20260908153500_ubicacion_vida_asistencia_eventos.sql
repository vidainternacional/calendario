create table public.evento_asistencia_config (
  evento_id uuid primary key references public.eventos(id) on delete cascade,
  activo boolean not null default true,
  latitud double precision not null check (latitud between -90 and 90),
  longitud double precision not null check (longitud between -180 and 180),
  radio_metros integer not null default 150 check (radio_metros between 25 and 1000),
  minutos_antes integer not null default 30 check (minutos_antes between 0 and 360),
  minutos_despues integer not null default 90 check (minutos_despues between 0 and 720),
  configurado_por uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evento_asistencias (
  evento_id uuid not null references public.eventos(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  estado text not null check (estado in ('asistio','justificado')),
  confirmado_en timestamptz not null default now(),
  metodo text not null check (metodo in ('gps','pastoral')),
  primary key (evento_id, profile_id)
);

create index evento_asistencias_profile_idx
  on public.evento_asistencias(profile_id, confirmado_en desc);

alter table public.evento_asistencia_config enable row level security;
alter table public.evento_asistencias enable row level security;

create or replace function public.puede_gestionar_asistencia()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.activo = true
      and p.estado_cuenta = 'activo'
      and p.rol::text in ('pastor','administrador')
  );
$$;

create or replace function public.asistencia_evento_visible_para(p_evento_id uuid, p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
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
$$;

create or replace function public.asistencia_persona_esperada(p_evento_id uuid, p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_profile_id
      and p.activo = true
      and p.estado_cuenta = 'activo'
      and public.asistencia_evento_visible_para(p_evento_id, p_profile_id)
  );
$$;

create policy evento_asistencia_config_select
  on public.evento_asistencia_config
  for select to authenticated
  using (
    public.puede_gestionar_asistencia()
    or exists (select 1 from public.eventos e where e.id = evento_id)
  );

create policy evento_asistencias_select
  on public.evento_asistencias
  for select to authenticated
  using (profile_id = auth.uid() or public.puede_gestionar_asistencia());

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
begin
  if not public.cuenta_activa() then raise exception 'Cuenta inactiva'; end if;
  v_gestiona := public.puede_gestionar_asistencia();

  if not v_gestiona and not public.asistencia_evento_visible_para(p_evento_id, auth.uid()) then
    raise exception 'Evento no disponible';
  end if;

  select * into v_cfg from public.evento_asistencia_config where evento_id = p_evento_id;
  select e.fecha_inicio, e.fecha_fin into v_inicio, v_fin from public.eventos e where e.id = p_evento_id;
  if v_inicio is null then raise exception 'Evento no disponible'; end if;

  select * into v_asistencia
  from public.evento_asistencias
  where evento_id = p_evento_id and profile_id = auth.uid();

  return jsonb_build_object(
    'configurado', v_cfg.evento_id is not null,
    'activo', coalesce(v_cfg.activo, false),
    'radio_metros', v_cfg.radio_metros,
    'minutos_antes', v_cfg.minutos_antes,
    'minutos_despues', v_cfg.minutos_despues,
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
    minutos_antes, minutos_despues, configurado_por, updated_at
  ) values (
    p_evento_id, true, p_latitud, p_longitud, p_radio_metros,
    p_minutos_antes, p_minutos_despues, auth.uid(), now()
  )
  on conflict (evento_id) do update set
    activo = true,
    latitud = excluded.latitud,
    longitud = excluded.longitud,
    radio_metros = excluded.radio_metros,
    minutos_antes = excluded.minutos_antes,
    minutos_despues = excluded.minutos_despues,
    configurado_por = excluded.configurado_por,
    updated_at = now();
end;
$$;

create or replace function public.asistencia_desactivar_evento(p_evento_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.puede_gestionar_asistencia() then raise exception 'Sin permiso'; end if;
  update public.evento_asistencia_config
  set activo = false, configurado_por = auth.uid(), updated_at = now()
  where evento_id = p_evento_id;
end;
$$;

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

  select e.fecha_inicio into v_inicio from public.eventos e where e.id = p_evento_id;
  if now() < v_inicio - make_interval(mins => v_cfg.minutos_antes)
    or now() > v_inicio + make_interval(mins => v_cfg.minutos_despues) then
    raise exception 'La confirmación de llegada no está disponible en este momento';
  end if;

  v_h := power(sin(radians(p_latitud - v_cfg.latitud) / 2), 2)
    + cos(radians(v_cfg.latitud)) * cos(radians(p_latitud))
    * power(sin(radians(p_longitud - v_cfg.longitud) / 2), 2);
  v_distancia := 6371000 * 2 * asin(least(1, sqrt(greatest(0, v_h))));
  if v_distancia > v_cfg.radio_metros then raise exception 'Aún no estás dentro del área del evento'; end if;

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

create or replace function public.asistencia_justificar(p_evento_id uuid, p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
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
$$;

create or replace function public.asistencia_resumen_evento(p_evento_id uuid)
returns table (
  profile_id uuid,
  nombre_completo text,
  avatar_url text,
  estado text,
  confirmado_en timestamptz,
  metodo text,
  sin_confirmar_ultimos3 integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
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
    (
      select count(*)::integer
      from (
        select e2.id
        from public.evento_asistencia_config c2
        join public.eventos e2 on e2.id = c2.evento_id
        left join public.evento_asistencias a2
          on a2.evento_id = e2.id and a2.profile_id = p.id
        where c2.activo = true
          and e2.fecha_inicio <= now()
          and public.asistencia_persona_esperada(e2.id, p.id)
          and a2.evento_id is null
        order by e2.fecha_inicio desc
        limit 3
      ) faltas
    )
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
$$;

create or replace function public.asistencia_historial_persona(p_profile_id uuid)
returns table (
  evento_id uuid,
  titulo text,
  fecha_inicio timestamptz,
  estado text,
  confirmado_en timestamptz,
  metodo text
)
language plpgsql
stable
security definer
set search_path = public
as $$
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
$$;

revoke all on table public.evento_asistencia_config from anon, authenticated;
revoke all on table public.evento_asistencias from anon, authenticated;
grant select on table public.evento_asistencia_config to authenticated;
grant select on table public.evento_asistencias to authenticated;
grant all on table public.evento_asistencia_config to service_role;
grant all on table public.evento_asistencias to service_role;

revoke execute on function public.puede_gestionar_asistencia() from public, anon;
revoke execute on function public.asistencia_evento_visible_para(uuid,uuid) from public, anon, authenticated;
revoke execute on function public.asistencia_persona_esperada(uuid,uuid) from public, anon, authenticated;
revoke execute on function public.asistencia_evento_estado(uuid) from public, anon;
revoke execute on function public.asistencia_configurar_evento(uuid,double precision,double precision,integer,integer,integer) from public, anon;
revoke execute on function public.asistencia_desactivar_evento(uuid) from public, anon;
revoke execute on function public.asistencia_confirmar_gps(uuid,double precision,double precision,double precision) from public, anon;
revoke execute on function public.asistencia_justificar(uuid,uuid) from public, anon;
revoke execute on function public.asistencia_resumen_evento(uuid) from public, anon;
revoke execute on function public.asistencia_historial_persona(uuid) from public, anon;

grant execute on function public.puede_gestionar_asistencia() to authenticated;
grant execute on function public.asistencia_evento_estado(uuid) to authenticated;
grant execute on function public.asistencia_configurar_evento(uuid,double precision,double precision,integer,integer,integer) to authenticated;
grant execute on function public.asistencia_desactivar_evento(uuid) to authenticated;
grant execute on function public.asistencia_confirmar_gps(uuid,double precision,double precision,double precision) to authenticated;
grant execute on function public.asistencia_justificar(uuid,uuid) to authenticated;
grant execute on function public.asistencia_resumen_evento(uuid) to authenticated;
grant execute on function public.asistencia_historial_persona(uuid) to authenticated;
