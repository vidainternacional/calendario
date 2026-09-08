alter table public.discipulado_preguntas
  add column if not exists tipo text not null default 'final',
  add column if not exists leccion_id uuid references public.discipulado_lecciones(id) on delete cascade;

alter table public.discipulado_preguntas
  drop constraint if exists discipulado_preguntas_tipo_check;
alter table public.discipulado_preguntas
  add constraint discipulado_preguntas_tipo_check check (tipo in ('leccion','final'));

alter table public.discipulado_preguntas
  drop constraint if exists discipulado_preguntas_tipo_leccion_check;
alter table public.discipulado_preguntas
  add constraint discipulado_preguntas_tipo_leccion_check check (
    (tipo = 'final' and leccion_id is null)
    or (tipo = 'leccion' and leccion_id is not null)
  );

create index if not exists discipulado_preguntas_leccion_orden_idx
  on public.discipulado_preguntas(leccion_id, orden)
  where leccion_id is not null;

create table if not exists public.discipulado_video_progreso (
  asignacion_id uuid not null references public.discipulado_asignaciones(id) on delete cascade,
  leccion_id uuid not null references public.discipulado_lecciones(id) on delete cascade,
  visto_completo_en timestamptz not null default now(),
  primary key (asignacion_id, leccion_id)
);

create table if not exists public.discipulado_aprobaciones_previas (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  aprobado_por uuid not null references public.profiles(id) on delete restrict,
  notas text,
  aprobado_en timestamptz not null default now()
);

alter table public.discipulado_video_progreso enable row level security;
alter table public.discipulado_aprobaciones_previas enable row level security;

create policy discipulado_video_progreso_select
  on public.discipulado_video_progreso
  for select to authenticated
  using (
    public.puede_gestionar_discipulado()
    or exists (
      select 1
      from public.discipulado_asignaciones a
      where a.id = asignacion_id
        and a.profile_id = auth.uid()
    )
  );

create policy discipulado_previas_select_manager
  on public.discipulado_aprobaciones_previas
  for select to authenticated
  using (public.puede_gestionar_discipulado());

create policy discipulado_previas_insert_manager
  on public.discipulado_aprobaciones_previas
  for insert to authenticated
  with check (public.puede_gestionar_discipulado());

create policy discipulado_previas_update_manager
  on public.discipulado_aprobaciones_previas
  for update to authenticated
  using (public.puede_gestionar_discipulado())
  with check (public.puede_gestionar_discipulado());

create policy discipulado_previas_delete_manager
  on public.discipulado_aprobaciones_previas
  for delete to authenticated
  using (public.puede_gestionar_discipulado());

create or replace function public.discipulado_aprobado(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.cuenta_activa()
    and (
      exists (
        select 1
        from public.discipulado_aprobaciones_previas ap
        where ap.profile_id = p_profile_id
      )
      or exists (
        select 1
        from public.discipulado_asignaciones a
        where a.profile_id = p_profile_id
          and a.estado = 'aprobado'
      )
    );
$$;

create or replace function public.discipulado_estado_personal()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_asignacion public.discipulado_asignaciones%rowtype;
begin
  if not public.cuenta_activa() then
    raise exception 'Cuenta inactiva';
  end if;

  if exists (
    select 1
    from public.discipulado_aprobaciones_previas ap
    where ap.profile_id = auth.uid()
  ) then
    return jsonb_build_object(
      'aprobado', true,
      'estado', 'aprobado_previo',
      'asignacion_id', null,
      'curso_id', null
    );
  end if;

  select a.*
    into v_asignacion
  from public.discipulado_asignaciones a
  where a.profile_id = auth.uid()
  order by
    case when a.estado = 'aprobado' then 0 else 1 end,
    a.updated_at desc
  limit 1;

  if v_asignacion.id is null then
    return jsonb_build_object(
      'aprobado', false,
      'estado', 'sin_iniciar',
      'asignacion_id', null,
      'curso_id', null
    );
  end if;

  return jsonb_build_object(
    'aprobado', v_asignacion.estado = 'aprobado',
    'estado', v_asignacion.estado,
    'asignacion_id', v_asignacion.id,
    'curso_id', v_asignacion.curso_id
  );
end;
$$;

create or replace function public.discipulado_autoinscribir()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_asignacion public.discipulado_asignaciones%rowtype;
  v_curso uuid;
begin
  if not public.cuenta_activa() then
    raise exception 'Cuenta inactiva';
  end if;

  if public.discipulado_aprobado(auth.uid()) then
    return jsonb_build_object('aprobado', true, 'estado', 'aprobado');
  end if;

  select a.*
    into v_asignacion
  from public.discipulado_asignaciones a
  join public.discipulado_cursos c on c.id = a.curso_id
  where a.profile_id = auth.uid()
    and c.estado = 'publicado'
    and a.estado in ('asignado','en_progreso','revision','rechazado')
  order by a.updated_at desc
  limit 1;

  if v_asignacion.id is not null then
    return jsonb_build_object(
      'aprobado', false,
      'estado', v_asignacion.estado,
      'asignacion_id', v_asignacion.id,
      'curso_id', v_asignacion.curso_id
    );
  end if;

  select c.id
    into v_curso
  from public.discipulado_cursos c
  where c.estado = 'publicado'
  order by c.updated_at desc, c.created_at desc
  limit 1;

  if v_curso is null then
    return jsonb_build_object(
      'aprobado', false,
      'estado', 'sin_curso',
      'asignacion_id', null,
      'curso_id', null
    );
  end if;

  insert into public.discipulado_asignaciones(curso_id, profile_id, asignado_por, estado)
  values(v_curso, auth.uid(), null, 'asignado')
  on conflict (curso_id, profile_id)
  do update set updated_at = now()
  returning * into v_asignacion;

  return jsonb_build_object(
    'aprobado', false,
    'estado', v_asignacion.estado,
    'asignacion_id', v_asignacion.id,
    'curso_id', v_asignacion.curso_id
  );
end;
$$;

create or replace function public.discipulado_marcar_video_visto(
  p_asignacion_id uuid,
  p_leccion_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean;
begin
  if not public.cuenta_activa() then
    raise exception 'Cuenta inactiva';
  end if;

  select exists (
    select 1
    from public.discipulado_asignaciones a
    join public.discipulado_cursos c on c.id = a.curso_id
    join public.discipulado_lecciones l on l.curso_id = a.curso_id
    where a.id = p_asignacion_id
      and a.profile_id = auth.uid()
      and c.estado = 'publicado'
      and l.id = p_leccion_id
  ) into v_ok;

  if not v_ok then
    raise exception 'Lección no disponible';
  end if;

  insert into public.discipulado_video_progreso(asignacion_id, leccion_id, visto_completo_en)
  values(p_asignacion_id, p_leccion_id, now())
  on conflict (asignacion_id, leccion_id)
  do update set visto_completo_en = excluded.visto_completo_en;

  update public.discipulado_asignaciones
  set estado = case when estado = 'asignado' then 'en_progreso' else estado end,
      updated_at = now()
  where id = p_asignacion_id
    and profile_id = auth.uid();
end;
$$;

create or replace function public.discipulado_obtener_quiz_leccion(
  p_asignacion_id uuid,
  p_leccion_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.cuenta_activa() then
    raise exception 'Cuenta inactiva';
  end if;

  if not exists (
    select 1
    from public.discipulado_video_progreso vp
    join public.discipulado_asignaciones a on a.id = vp.asignacion_id
    where vp.asignacion_id = p_asignacion_id
      and vp.leccion_id = p_leccion_id
      and a.profile_id = auth.uid()
  ) then
    raise exception 'Termina el video antes de responder';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', q.id,
        'enunciado', q.enunciado,
        'orden', q.orden,
        'opciones', (
          select coalesce(
            jsonb_agg(
              jsonb_build_object('id', o.id, 'texto', o.texto, 'orden', o.orden)
              order by o.orden
            ),
            '[]'::jsonb
          )
          from public.discipulado_opciones o
          where o.pregunta_id = q.id
        )
      )
      order by q.orden
    ),
    '[]'::jsonb
  ) into v_result
  from public.discipulado_preguntas q
  where q.leccion_id = p_leccion_id
    and q.tipo = 'leccion';

  return v_result;
end;
$$;

create or replace function public.discipulado_responder_quiz_leccion(
  p_asignacion_id uuid,
  p_leccion_id uuid,
  p_respuestas jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_correctas integer;
  v_calificacion numeric(5,2);
begin
  if not public.cuenta_activa() then
    raise exception 'Cuenta inactiva';
  end if;

  if not exists (
    select 1
    from public.discipulado_video_progreso vp
    join public.discipulado_asignaciones a on a.id = vp.asignacion_id
    where vp.asignacion_id = p_asignacion_id
      and vp.leccion_id = p_leccion_id
      and a.profile_id = auth.uid()
  ) then
    raise exception 'Termina el video antes de responder';
  end if;

  select count(*)
    into v_total
  from public.discipulado_preguntas q
  where q.leccion_id = p_leccion_id
    and q.tipo = 'leccion';

  if v_total = 0 then
    raise exception 'Esta lección todavía no tiene preguntas de comprobación';
  end if;

  select count(*)
    into v_correctas
  from public.discipulado_preguntas q
  join public.discipulado_opciones o
    on o.pregunta_id = q.id
   and o.es_correcta = true
  where q.leccion_id = p_leccion_id
    and q.tipo = 'leccion'
    and (p_respuestas ->> q.id::text) = o.id::text;

  v_calificacion := round((v_correctas::numeric * 100) / v_total, 2);

  if v_correctas = v_total then
    insert into public.discipulado_leccion_progreso(asignacion_id, leccion_id, completado_en)
    values(p_asignacion_id, p_leccion_id, now())
    on conflict (asignacion_id, leccion_id)
    do update set completado_en = excluded.completado_en;

    update public.discipulado_asignaciones
    set estado = case when estado = 'asignado' then 'en_progreso' else estado end,
        updated_at = now()
    where id = p_asignacion_id
      and profile_id = auth.uid();
  end if;

  return jsonb_build_object(
    'aprobado', v_correctas = v_total,
    'calificacion', v_calificacion,
    'correctas', v_correctas,
    'total', v_total
  );
end;
$$;

create or replace function public.discipulado_obtener_evaluacion(p_asignacion_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_curso uuid;
  v_lecciones integer;
  v_completadas integer;
  v_result jsonb;
begin
  if not public.cuenta_activa() then
    raise exception 'Cuenta inactiva';
  end if;

  select a.curso_id
    into v_curso
  from public.discipulado_asignaciones a
  join public.discipulado_cursos c on c.id = a.curso_id
  where a.id = p_asignacion_id
    and a.profile_id = auth.uid()
    and c.estado = 'publicado';

  if v_curso is null then
    raise exception 'Asignación no disponible';
  end if;

  select count(*) into v_lecciones
  from public.discipulado_lecciones
  where curso_id = v_curso;

  select count(*) into v_completadas
  from public.discipulado_leccion_progreso lp
  join public.discipulado_lecciones l on l.id = lp.leccion_id
  where lp.asignacion_id = p_asignacion_id
    and l.curso_id = v_curso;

  if v_completadas < v_lecciones then
    raise exception 'Completa todas las lecciones antes de la evaluación';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', q.id,
        'enunciado', q.enunciado,
        'orden', q.orden,
        'opciones', (
          select coalesce(
            jsonb_agg(
              jsonb_build_object('id', o.id, 'texto', o.texto, 'orden', o.orden)
              order by o.orden
            ),
            '[]'::jsonb
          )
          from public.discipulado_opciones o
          where o.pregunta_id = q.id
        )
      )
      order by q.orden
    ),
    '[]'::jsonb
  ) into v_result
  from public.discipulado_preguntas q
  where q.curso_id = v_curso
    and q.tipo = 'final'
    and q.leccion_id is null;

  return v_result;
end;
$$;

create or replace function public.discipulado_enviar_intento(
  p_asignacion_id uuid,
  p_respuestas jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_curso uuid;
  v_total integer;
  v_correctas integer;
  v_lecciones integer;
  v_completadas integer;
  v_calificacion numeric(5,2);
begin
  if not public.cuenta_activa() then
    raise exception 'Cuenta inactiva';
  end if;

  select a.curso_id
    into v_curso
  from public.discipulado_asignaciones a
  join public.discipulado_cursos c on c.id = a.curso_id
  where a.id = p_asignacion_id
    and a.profile_id = auth.uid()
    and c.estado = 'publicado';

  if v_curso is null then
    raise exception 'Asignación no disponible';
  end if;

  select count(*) into v_lecciones
  from public.discipulado_lecciones
  where curso_id = v_curso;

  select count(*) into v_completadas
  from public.discipulado_leccion_progreso lp
  join public.discipulado_lecciones l on l.id = lp.leccion_id
  where lp.asignacion_id = p_asignacion_id
    and l.curso_id = v_curso;

  if v_completadas < v_lecciones then
    raise exception 'Completa todas las lecciones antes de la evaluación';
  end if;

  select count(*) into v_total
  from public.discipulado_preguntas
  where curso_id = v_curso
    and tipo = 'final'
    and leccion_id is null;

  if v_total = 0 then
    raise exception 'Este curso todavía no tiene evaluación final';
  end if;

  select count(*) into v_correctas
  from public.discipulado_preguntas q
  join public.discipulado_opciones o
    on o.pregunta_id = q.id
   and o.es_correcta = true
  where q.curso_id = v_curso
    and q.tipo = 'final'
    and q.leccion_id is null
    and (p_respuestas ->> q.id::text) = o.id::text;

  v_calificacion := round((v_correctas::numeric * 100) / v_total, 2);

  insert into public.discipulado_intentos(asignacion_id, calificacion, correctas, total, respuestas)
  values(p_asignacion_id, v_calificacion, v_correctas, v_total, p_respuestas);

  update public.discipulado_asignaciones
  set estado = 'revision',
      calificacion = v_calificacion,
      enviado_en = now(),
      revisado_en = null,
      revisado_por = null,
      notas_revision = null,
      updated_at = now()
  where id = p_asignacion_id;

  return jsonb_build_object(
    'calificacion', v_calificacion,
    'correctas', v_correctas,
    'total', v_total
  );
end;
$$;

create or replace function public.discipulado_reconocer_previo(
  p_profile_id uuid,
  p_notas text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.puede_gestionar_discipulado() then
    raise exception 'Sin permiso';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = p_profile_id
      and p.activo = true
      and p.estado_cuenta = 'activo'
  ) then
    raise exception 'Persona no disponible';
  end if;

  insert into public.discipulado_aprobaciones_previas(profile_id, aprobado_por, notas, aprobado_en)
  values(p_profile_id, auth.uid(), nullif(trim(coalesce(p_notas, '')), ''), now())
  on conflict (profile_id)
  do update set
    aprobado_por = excluded.aprobado_por,
    notas = excluded.notas,
    aprobado_en = excluded.aprobado_en;
end;
$$;

revoke all on table public.discipulado_video_progreso from anon, authenticated;
revoke all on table public.discipulado_aprobaciones_previas from anon, authenticated;
grant select on table public.discipulado_video_progreso to authenticated;
grant select, insert, update, delete on table public.discipulado_aprobaciones_previas to authenticated;

revoke execute on function public.discipulado_marcar_leccion(uuid,uuid,boolean) from public, anon, authenticated;

revoke execute on function public.discipulado_estado_personal() from public, anon;
revoke execute on function public.discipulado_autoinscribir() from public, anon;
revoke execute on function public.discipulado_marcar_video_visto(uuid,uuid) from public, anon;
revoke execute on function public.discipulado_obtener_quiz_leccion(uuid,uuid) from public, anon;
revoke execute on function public.discipulado_responder_quiz_leccion(uuid,uuid,jsonb) from public, anon;
revoke execute on function public.discipulado_reconocer_previo(uuid,text) from public, anon;

grant execute on function public.discipulado_estado_personal() to authenticated;
grant execute on function public.discipulado_autoinscribir() to authenticated;
grant execute on function public.discipulado_marcar_video_visto(uuid,uuid) to authenticated;
grant execute on function public.discipulado_obtener_quiz_leccion(uuid,uuid) to authenticated;
grant execute on function public.discipulado_responder_quiz_leccion(uuid,uuid,jsonb) to authenticated;
grant execute on function public.discipulado_reconocer_previo(uuid,text) to authenticated;
