alter table public.discipulado_cursos
  add column if not exists nota_minima_aprobacion numeric(5,2) not null default 80
  check (nota_minima_aprobacion >= 0 and nota_minima_aprobacion <= 100);

create table if not exists public.discipulado_intentos_mejora (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  curso_id uuid not null references public.discipulado_cursos(id) on delete cascade,
  calificacion numeric(5,2) not null check (calificacion >= 0 and calificacion <= 100),
  correctas integer not null check (correctas >= 0),
  total integer not null check (total > 0),
  respuestas jsonb not null default '{}'::jsonb,
  enviado_en timestamptz not null default now()
);

create index if not exists discipulado_intentos_mejora_profile_idx
  on public.discipulado_intentos_mejora(profile_id, enviado_en desc);
create index if not exists discipulado_intentos_mejora_curso_idx
  on public.discipulado_intentos_mejora(curso_id, enviado_en desc);

alter table public.discipulado_intentos_mejora enable row level security;

drop policy if exists discipulado_intentos_mejora_select on public.discipulado_intentos_mejora;
create policy discipulado_intentos_mejora_select
  on public.discipulado_intentos_mejora
  for select to authenticated
  using (profile_id = auth.uid() or public.puede_gestionar_discipulado());

create or replace function public.discipulado_resumen_personal()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_aprobado boolean := false;
  v_fuente text := null;
  v_aprobado_en timestamptz := null;
  v_curso_id uuid := null;
  v_curso_titulo text := null;
  v_nota_minima numeric(5,2) := 80;
  v_mejor numeric(5,2) := null;
begin
  if not public.cuenta_activa() then
    raise exception 'Cuenta inactiva';
  end if;

  select ap.aprobado_en
    into v_aprobado_en
  from public.discipulado_aprobaciones_previas ap
  where ap.profile_id = auth.uid();

  if v_aprobado_en is not null then
    v_aprobado := true;
    v_fuente := 'previo';
  else
    select a.curso_id, c.titulo, c.nota_minima_aprobacion, a.revisado_en
      into v_curso_id, v_curso_titulo, v_nota_minima, v_aprobado_en
    from public.discipulado_asignaciones a
    join public.discipulado_cursos c on c.id = a.curso_id
    where a.profile_id = auth.uid()
      and a.estado = 'aprobado'
    order by coalesce(a.revisado_en, a.updated_at) desc
    limit 1;

    if v_curso_id is not null then
      v_aprobado := true;
      v_fuente := 'curso';
    end if;
  end if;

  if v_fuente = 'previo' then
    select c.id, c.titulo, c.nota_minima_aprobacion
      into v_curso_id, v_curso_titulo, v_nota_minima
    from public.discipulado_cursos c
    where c.estado = 'publicado'
    order by c.updated_at desc, c.created_at desc
    limit 1;
  end if;

  select max(score)
    into v_mejor
  from (
    select i.calificacion as score
    from public.discipulado_intentos i
    join public.discipulado_asignaciones a on a.id = i.asignacion_id
    where a.profile_id = auth.uid()
    union all
    select m.calificacion as score
    from public.discipulado_intentos_mejora m
    where m.profile_id = auth.uid()
  ) s;

  return jsonb_build_object(
    'aprobado', v_aprobado,
    'fuente', v_fuente,
    'aprobado_en', v_aprobado_en,
    'curso_id', v_curso_id,
    'curso_titulo', v_curso_titulo,
    'nota_minima', v_nota_minima,
    'mejor_calificacion', v_mejor
  );
end;
$$;

create or replace function public.discipulado_repaso_contenido()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_curso public.discipulado_cursos%rowtype;
  v_lecciones jsonb;
  v_mejor numeric(5,2);
begin
  if not public.cuenta_activa() then
    raise exception 'Cuenta inactiva';
  end if;

  if not public.discipulado_aprobado(auth.uid()) then
    raise exception 'Completa primero tu discipulado';
  end if;

  select c.*
    into v_curso
  from public.discipulado_cursos c
  where c.estado = 'publicado'
  order by c.updated_at desc, c.created_at desc
  limit 1;

  if v_curso.id is null then
    return jsonb_build_object(
      'curso', null,
      'lecciones', '[]'::jsonb,
      'mejor_calificacion', null
    );
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', l.id,
        'titulo', l.titulo,
        'descripcion', l.descripcion,
        'video_url', l.video_url,
        'contenido', l.contenido,
        'orden', l.orden
      ) order by l.orden
    ),
    '[]'::jsonb
  ) into v_lecciones
  from public.discipulado_lecciones l
  where l.curso_id = v_curso.id;

  select max(score)
    into v_mejor
  from (
    select i.calificacion as score
    from public.discipulado_intentos i
    join public.discipulado_asignaciones a on a.id = i.asignacion_id
    where a.profile_id = auth.uid()
      and a.curso_id = v_curso.id
    union all
    select m.calificacion as score
    from public.discipulado_intentos_mejora m
    where m.profile_id = auth.uid()
      and m.curso_id = v_curso.id
  ) s;

  return jsonb_build_object(
    'curso', jsonb_build_object(
      'id', v_curso.id,
      'titulo', v_curso.titulo,
      'descripcion', v_curso.descripcion,
      'nota_minima', v_curso.nota_minima_aprobacion
    ),
    'lecciones', v_lecciones,
    'mejor_calificacion', v_mejor
  );
end;
$$;

create or replace function public.discipulado_obtener_evaluacion_mejora()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_curso uuid;
  v_result jsonb;
begin
  if not public.cuenta_activa() then
    raise exception 'Cuenta inactiva';
  end if;

  if not public.discipulado_aprobado(auth.uid()) then
    raise exception 'Completa primero tu discipulado';
  end if;

  select c.id
    into v_curso
  from public.discipulado_cursos c
  where c.estado = 'publicado'
  order by c.updated_at desc, c.created_at desc
  limit 1;

  if v_curso is null then
    raise exception 'No hay un curso publicado para repasar';
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
      ) order by q.orden
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

create or replace function public.discipulado_enviar_mejora(p_respuestas jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_curso public.discipulado_cursos%rowtype;
  v_total integer;
  v_correctas integer;
  v_calificacion numeric(5,2);
  v_mejor numeric(5,2);
begin
  if not public.cuenta_activa() then
    raise exception 'Cuenta inactiva';
  end if;

  if not public.discipulado_aprobado(auth.uid()) then
    raise exception 'Completa primero tu discipulado';
  end if;

  select c.*
    into v_curso
  from public.discipulado_cursos c
  where c.estado = 'publicado'
  order by c.updated_at desc, c.created_at desc
  limit 1;

  if v_curso.id is null then
    raise exception 'No hay un curso publicado para mejorar tu calificación';
  end if;

  select count(*)
    into v_total
  from public.discipulado_preguntas q
  where q.curso_id = v_curso.id
    and q.tipo = 'final'
    and q.leccion_id is null;

  if v_total = 0 then
    raise exception 'Este curso todavía no tiene evaluación final';
  end if;

  select count(*)
    into v_correctas
  from public.discipulado_preguntas q
  join public.discipulado_opciones o
    on o.pregunta_id = q.id
   and o.es_correcta = true
  where q.curso_id = v_curso.id
    and q.tipo = 'final'
    and q.leccion_id is null
    and (p_respuestas ->> q.id::text) = o.id::text;

  v_calificacion := round((v_correctas::numeric * 100) / v_total, 2);

  insert into public.discipulado_intentos_mejora(
    profile_id, curso_id, calificacion, correctas, total, respuestas
  ) values (
    auth.uid(), v_curso.id, v_calificacion, v_correctas, v_total, p_respuestas
  );

  select max(score)
    into v_mejor
  from (
    select i.calificacion as score
    from public.discipulado_intentos i
    join public.discipulado_asignaciones a on a.id = i.asignacion_id
    where a.profile_id = auth.uid()
      and a.curso_id = v_curso.id
    union all
    select m.calificacion as score
    from public.discipulado_intentos_mejora m
    where m.profile_id = auth.uid()
      and m.curso_id = v_curso.id
  ) s;

  return jsonb_build_object(
    'calificacion', v_calificacion,
    'correctas', v_correctas,
    'total', v_total,
    'mejor_calificacion', v_mejor,
    'nota_minima', v_curso.nota_minima_aprobacion
  );
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
  v_nota_minima numeric(5,2);
  v_total integer;
  v_correctas integer;
  v_lecciones integer;
  v_completadas integer;
  v_calificacion numeric(5,2);
  v_mejor numeric(5,2);
begin
  if not public.cuenta_activa() then
    raise exception 'Cuenta inactiva';
  end if;

  select a.curso_id, c.nota_minima_aprobacion
    into v_curso, v_nota_minima
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

  select max(i.calificacion)
    into v_mejor
  from public.discipulado_intentos i
  where i.asignacion_id = p_asignacion_id;

  update public.discipulado_asignaciones
  set estado = 'revision',
      calificacion = v_mejor,
      enviado_en = now(),
      revisado_en = null,
      revisado_por = null,
      notas_revision = null,
      updated_at = now()
  where id = p_asignacion_id;

  return jsonb_build_object(
    'calificacion', v_calificacion,
    'mejor_calificacion', v_mejor,
    'correctas', v_correctas,
    'total', v_total,
    'nota_minima', v_nota_minima
  );
end;
$$;

create or replace function public.discipulado_revisar(
  p_asignacion_id uuid,
  p_decision text,
  p_notas text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_calificacion numeric(5,2);
  v_nota_minima numeric(5,2);
begin
  if not public.puede_gestionar_discipulado() then
    raise exception 'Sin permiso';
  end if;

  if p_decision not in ('aprobado','rechazado') then
    raise exception 'Decisión inválida';
  end if;

  select a.calificacion, c.nota_minima_aprobacion
    into v_calificacion, v_nota_minima
  from public.discipulado_asignaciones a
  join public.discipulado_cursos c on c.id = a.curso_id
  where a.id = p_asignacion_id
    and a.estado = 'revision';

  if v_nota_minima is null then
    raise exception 'Asignación no disponible para revisión';
  end if;

  if p_decision = 'aprobado' and coalesce(v_calificacion, 0) < v_nota_minima then
    raise exception 'La calificación no alcanza la nota mínima de aprobación (%)', trim(to_char(v_nota_minima, 'FM990.##'));
  end if;

  update public.discipulado_asignaciones
  set estado = p_decision,
      revisado_en = now(),
      revisado_por = auth.uid(),
      notas_revision = nullif(trim(coalesce(p_notas,'')),''),
      updated_at = now()
  where id = p_asignacion_id
    and estado = 'revision';

  if not found then
    raise exception 'Asignación no disponible para revisión';
  end if;
end;
$$;

revoke all on table public.discipulado_intentos_mejora from anon, authenticated;
grant select on table public.discipulado_intentos_mejora to authenticated;
grant all on table public.discipulado_intentos_mejora to service_role;

revoke execute on function public.discipulado_resumen_personal() from public, anon;
revoke execute on function public.discipulado_repaso_contenido() from public, anon;
revoke execute on function public.discipulado_obtener_evaluacion_mejora() from public, anon;
revoke execute on function public.discipulado_enviar_mejora(jsonb) from public, anon;

grant execute on function public.discipulado_resumen_personal() to authenticated;
grant execute on function public.discipulado_repaso_contenido() to authenticated;
grant execute on function public.discipulado_obtener_evaluacion_mejora() to authenticated;
grant execute on function public.discipulado_enviar_mejora(jsonb) to authenticated;

revoke execute on function public.discipulado_enviar_intento(uuid,jsonb) from public, anon;
revoke execute on function public.discipulado_revisar(uuid,text,text) from public, anon;
grant execute on function public.discipulado_enviar_intento(uuid,jsonb) to authenticated;
grant execute on function public.discipulado_revisar(uuid,text,text) to authenticated;
