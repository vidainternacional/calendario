-- VIDA · Biblioteca de cursos y separación de Discipulado principal.
-- Migración aditiva. No elimina datos ni cambia políticas RLS.
-- Reversión controlada: suspender creación de temáticos, restaurar definiciones
-- anteriores de los RPC y conservar la columna tipo hasta migrar cualquier curso nuevo.
alter table public.discipulado_cursos
  add column if not exists tipo text not null default 'discipulado';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conrelid='public.discipulado_cursos'::regclass
    and conname='discipulado_cursos_tipo_check'
  ) then
    alter table public.discipulado_cursos
      add constraint discipulado_cursos_tipo_check check(tipo in ('discipulado','tematico'));
  end if;
end $$;

create unique index if not exists discipulado_un_principal_publicado
  on public.discipulado_cursos ((1))
  where tipo='discipulado' and estado='publicado';

-- Proteger el distintivo de Discipulado: un curso temático no cuenta como el principal.
do $$
declare src text;
begin
  select pg_get_functiondef('public.discipulado_aprobado(uuid)'::regprocedure) into src;
  if position('from public.discipulado_asignaciones a' in src)=0
    or position('where a.profile_id = p_profile_id' in src)=0 then
    raise exception 'Definición discipulado_aprobado distinta de la auditada';
  end if;
  src := replace(src,
    'from public.discipulado_asignaciones a'||chr(10)||'        where a.profile_id = p_profile_id',
    'from public.discipulado_asignaciones a'||chr(10)||
    '        join public.discipulado_cursos c on c.id = a.curso_id'||chr(10)||
    '        where a.profile_id = p_profile_id'||chr(10)||
    '          and c.tipo = ''discipulado''');
  execute src;
end $$;

-- La inscripción automática solo selecciona el Discipulado principal publicado.
do $$
declare src text;
begin
  select pg_get_functiondef('public.discipulado_autoinscribir()'::regprocedure) into src;
  if position('and c.estado = ''publicado''' in src)=0
    or position('where c.estado = ''publicado''' in src)=0 then
    raise exception 'Definición discipulado_autoinscribir distinta de la auditada';
  end if;
  src := replace(src, 'and c.estado = ''publicado''',
    'and c.estado = ''publicado'''||chr(10)||'    and c.tipo = ''discipulado''');
  src := replace(src, 'where c.estado = ''publicado''',
    'where c.estado = ''publicado'''||chr(10)||'    and c.tipo = ''discipulado''');
  execute src;
end $$;

-- Los resúmenes y las mejoras conservan únicamente notas del Discipulado principal.
do $$
declare src text;
begin
  select pg_get_functiondef('public.discipulado_resumen_personal()'::regprocedure) into src;
  if position('where a.profile_id = auth.uid()' in src)=0 then
    raise exception 'Definición discipulado_resumen_personal distinta de la auditada';
  end if;
  src := replace(src,
    'where a.profile_id = auth.uid()'||chr(10)||'      and a.estado = ''aprobado''',
    'where a.profile_id = auth.uid()'||chr(10)||'      and c.tipo = ''discipulado'''||chr(10)||'      and a.estado = ''aprobado''');
  src := replace(src, 'where c.estado = ''publicado''',
    'where c.estado = ''publicado'''||chr(10)||'    and c.tipo = ''discipulado''');
  src := replace(src,
    'from public.discipulado_intentos i'||chr(10)||
    '    join public.discipulado_asignaciones a on a.id = i.asignacion_id'||chr(10)||
    '    where a.profile_id = auth.uid()',
    'from public.discipulado_intentos i'||chr(10)||
    '    join public.discipulado_asignaciones a on a.id = i.asignacion_id'||chr(10)||
    '    join public.discipulado_cursos c on c.id = a.curso_id'||chr(10)||
    '    where a.profile_id = auth.uid() and c.tipo = ''discipulado''');
  src := replace(src,
    'from public.discipulado_intentos_mejora m'||chr(10)||'    where m.profile_id = auth.uid()',
    'from public.discipulado_intentos_mejora m'||chr(10)||
    '    join public.discipulado_cursos c on c.id = m.curso_id'||chr(10)||
    '    where m.profile_id = auth.uid() and c.tipo = ''discipulado''');
  execute src;
end $$;

do $$
declare name text; src text;
begin
  foreach name in array array['discipulado_repaso_contenido','discipulado_obtener_evaluacion_mejora','discipulado_enviar_mejora']
  loop
    select pg_get_functiondef(p.oid) into src from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname=name limit 1;
    if src is null or position('where c.estado = ''publicado''' in src)=0 then
      raise exception 'Definición % distinta de la auditada', name;
    end if;
    src := replace(src, 'where c.estado = ''publicado''',
      'where c.estado = ''publicado'''||chr(10)||'    and c.tipo = ''discipulado''');
    execute src;
  end loop;
end $$;

-- Eliminar exclusivamente carpetas sin historial. Las que tengan usuarios se archivan.
create or replace function public.discipulado_retirar_curso(p_curso_id uuid)
returns text language plpgsql security definer set search_path=public
as $$
declare v_exists boolean;
begin
  if not public.puede_gestionar_discipulado() then
    raise exception 'No tienes permiso para gestionar Discipulado';
  end if;
  perform 1 from public.discipulado_cursos where id=p_curso_id for update;
  if not found then raise exception 'Curso no encontrado'; end if;
  select exists(select 1 from public.discipulado_asignaciones a where a.curso_id=p_curso_id)
    or exists(select 1 from public.discipulado_intentos_mejora i where i.curso_id=p_curso_id)
  into v_exists;
  if v_exists then
    update public.discipulado_cursos set estado='archivado',updated_at=now() where id=p_curso_id;
    return 'archivado';
  end if;
  delete from public.discipulado_cursos where id=p_curso_id;
  return 'eliminado';
end;
$$;
revoke all on function public.discipulado_retirar_curso(uuid) from public,anon;
grant execute on function public.discipulado_retirar_curso(uuid) to authenticated;

-- La API antigua tampoco puede borrar accidentalmente historiales.
create or replace function public.discipulado_eliminar_curso(p_curso_id uuid)
returns void language plpgsql security definer set search_path=public
as $$
begin
  perform public.discipulado_retirar_curso(p_curso_id);
end;
$$;
revoke all on function public.discipulado_eliminar_curso(uuid) from public,anon;
grant execute on function public.discipulado_eliminar_curso(uuid) to authenticated;

-- Catálogo de temas: expone solo títulos y descripciones de cursos publicados.
create or replace function public.discipulado_catalogo_temas()
returns jsonb language plpgsql stable security definer set search_path=public
as $$
declare result jsonb;
begin
  if not public.cuenta_activa() then raise exception 'Cuenta inactiva'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'titulo',c.titulo,'descripcion',c.descripcion,'estado',c.estado)
    order by c.created_at desc), '[]'::jsonb) into result
  from public.discipulado_cursos c where c.tipo='tematico' and c.estado='publicado';
  return result;
end;
$$;
revoke all on function public.discipulado_catalogo_temas() from public,anon;
grant execute on function public.discipulado_catalogo_temas() to authenticated;

-- Inscripción voluntaria por tema. Nunca altera la asignación del principal.
create or replace function public.discipulado_inscribir_tema(p_curso_id uuid)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare v_curso public.discipulado_cursos%rowtype; v_asignacion public.discipulado_asignaciones%rowtype;
begin
  if not public.cuenta_activa() then raise exception 'Cuenta inactiva'; end if;
  select * into v_curso from public.discipulado_cursos
  where id=p_curso_id and tipo='tematico' and estado='publicado';
  if v_curso.id is null then raise exception 'Curso no disponible'; end if;
  insert into public.discipulado_asignaciones(curso_id,profile_id,asignado_por,estado)
  values(v_curso.id,auth.uid(),null,'asignado') on conflict(curso_id,profile_id) do nothing;
  select * into v_asignacion from public.discipulado_asignaciones
  where curso_id=v_curso.id and profile_id=auth.uid();
  return jsonb_build_object('curso_id',v_curso.id,'titulo',v_curso.titulo,'descripcion',v_curso.descripcion,
    'asignacion_id',v_asignacion.id,'estado',v_asignacion.estado);
end;
$$;
revoke all on function public.discipulado_inscribir_tema(uuid) from public,anon;
grant execute on function public.discipulado_inscribir_tema(uuid) to authenticated;
