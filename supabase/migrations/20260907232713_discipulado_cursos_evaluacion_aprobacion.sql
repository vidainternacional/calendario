create table public.discipulado_gestores (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  asignado_por uuid references public.profiles(id) on delete set null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.discipulado_cursos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (length(trim(titulo)) > 0),
  descripcion text not null default '',
  estado text not null default 'borrador' check (estado in ('borrador','publicado','archivado')),
  creado_por uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.discipulado_lecciones (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references public.discipulado_cursos(id) on delete cascade,
  titulo text not null check (length(trim(titulo)) > 0),
  descripcion text not null default '',
  video_url text,
  contenido text not null default '',
  orden integer not null check (orden > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (curso_id, orden)
);

create table public.discipulado_preguntas (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references public.discipulado_cursos(id) on delete cascade,
  enunciado text not null check (length(trim(enunciado)) > 0),
  orden integer not null check (orden > 0),
  created_at timestamptz not null default now(),
  unique (curso_id, orden)
);

create table public.discipulado_opciones (
  id uuid primary key default gen_random_uuid(),
  pregunta_id uuid not null references public.discipulado_preguntas(id) on delete cascade,
  texto text not null check (length(trim(texto)) > 0),
  es_correcta boolean not null default false,
  orden integer not null check (orden > 0),
  unique (pregunta_id, orden)
);

create table public.discipulado_asignaciones (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references public.discipulado_cursos(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  asignado_por uuid references public.profiles(id) on delete set null,
  estado text not null default 'asignado' check (estado in ('asignado','en_progreso','revision','aprobado','rechazado')),
  calificacion numeric(5,2) check (calificacion is null or (calificacion >= 0 and calificacion <= 100)),
  enviado_en timestamptz,
  revisado_en timestamptz,
  revisado_por uuid references public.profiles(id) on delete set null,
  notas_revision text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (curso_id, profile_id)
);

create table public.discipulado_leccion_progreso (
  asignacion_id uuid not null references public.discipulado_asignaciones(id) on delete cascade,
  leccion_id uuid not null references public.discipulado_lecciones(id) on delete cascade,
  completado_en timestamptz not null default now(),
  primary key (asignacion_id, leccion_id)
);

create table public.discipulado_intentos (
  id uuid primary key default gen_random_uuid(),
  asignacion_id uuid not null references public.discipulado_asignaciones(id) on delete cascade,
  calificacion numeric(5,2) not null check (calificacion >= 0 and calificacion <= 100),
  correctas integer not null check (correctas >= 0),
  total integer not null check (total > 0),
  respuestas jsonb not null default '{}'::jsonb,
  enviado_en timestamptz not null default now()
);

create index discipulado_lecciones_curso_orden_idx on public.discipulado_lecciones(curso_id, orden);
create index discipulado_preguntas_curso_orden_idx on public.discipulado_preguntas(curso_id, orden);
create index discipulado_opciones_pregunta_orden_idx on public.discipulado_opciones(pregunta_id, orden);
create index discipulado_asignaciones_profile_idx on public.discipulado_asignaciones(profile_id, estado);
create index discipulado_asignaciones_curso_idx on public.discipulado_asignaciones(curso_id, estado);
create index discipulado_intentos_asignacion_idx on public.discipulado_intentos(asignacion_id, enviado_en desc);

alter table public.discipulado_gestores enable row level security;
alter table public.discipulado_cursos enable row level security;
alter table public.discipulado_lecciones enable row level security;
alter table public.discipulado_preguntas enable row level security;
alter table public.discipulado_opciones enable row level security;
alter table public.discipulado_asignaciones enable row level security;
alter table public.discipulado_leccion_progreso enable row level security;
alter table public.discipulado_intentos enable row level security;

create or replace function public.puede_gestionar_discipulado()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.activo = true and p.estado_cuenta = 'activo'
      and (p.rol::text in ('pastor','administrador') or exists (
        select 1 from public.discipulado_gestores g where g.profile_id = p.id and g.activo = true
      ))
  );
$$;

create or replace function public.discipulado_aprobado(p_profile_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.cuenta_activa() and exists (
    select 1 from public.discipulado_asignaciones a where a.profile_id = p_profile_id and a.estado = 'aprobado'
  );
$$;

create policy discipulado_gestores_select_manager on public.discipulado_gestores for select to authenticated using (public.puede_gestionar_discipulado());
create policy discipulado_gestores_insert_admin on public.discipulado_gestores for insert to authenticated with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.activo=true and p.estado_cuenta='activo' and p.rol::text='administrador'));
create policy discipulado_gestores_update_admin on public.discipulado_gestores for update to authenticated using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.activo=true and p.estado_cuenta='activo' and p.rol::text='administrador')) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.activo=true and p.estado_cuenta='activo' and p.rol::text='administrador'));
create policy discipulado_gestores_delete_admin on public.discipulado_gestores for delete to authenticated using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.activo=true and p.estado_cuenta='activo' and p.rol::text='administrador'));

create policy discipulado_cursos_select on public.discipulado_cursos for select to authenticated using (public.puede_gestionar_discipulado() or (estado='publicado' and exists (select 1 from public.discipulado_asignaciones a where a.curso_id=id and a.profile_id=auth.uid())));
create policy discipulado_cursos_manage on public.discipulado_cursos for all to authenticated using (public.puede_gestionar_discipulado()) with check (public.puede_gestionar_discipulado());
create policy discipulado_lecciones_select on public.discipulado_lecciones for select to authenticated using (public.puede_gestionar_discipulado() or exists (select 1 from public.discipulado_asignaciones a join public.discipulado_cursos c on c.id=a.curso_id where a.curso_id=discipulado_lecciones.curso_id and a.profile_id=auth.uid() and c.estado='publicado'));
create policy discipulado_lecciones_manage on public.discipulado_lecciones for all to authenticated using (public.puede_gestionar_discipulado()) with check (public.puede_gestionar_discipulado());
create policy discipulado_preguntas_select on public.discipulado_preguntas for select to authenticated using (public.puede_gestionar_discipulado() or exists (select 1 from public.discipulado_asignaciones a join public.discipulado_cursos c on c.id=a.curso_id where a.curso_id=discipulado_preguntas.curso_id and a.profile_id=auth.uid() and c.estado='publicado'));
create policy discipulado_preguntas_manage on public.discipulado_preguntas for all to authenticated using (public.puede_gestionar_discipulado()) with check (public.puede_gestionar_discipulado());
create policy discipulado_opciones_manager on public.discipulado_opciones for all to authenticated using (public.puede_gestionar_discipulado()) with check (public.puede_gestionar_discipulado());
create policy discipulado_asignaciones_select on public.discipulado_asignaciones for select to authenticated using (profile_id=auth.uid() or public.puede_gestionar_discipulado());
create policy discipulado_asignaciones_manage on public.discipulado_asignaciones for all to authenticated using (public.puede_gestionar_discipulado()) with check (public.puede_gestionar_discipulado());
create policy discipulado_progreso_select on public.discipulado_leccion_progreso for select to authenticated using (public.puede_gestionar_discipulado() or exists (select 1 from public.discipulado_asignaciones a where a.id=asignacion_id and a.profile_id=auth.uid()));
create policy discipulado_intentos_select on public.discipulado_intentos for select to authenticated using (public.puede_gestionar_discipulado() or exists (select 1 from public.discipulado_asignaciones a where a.id=asignacion_id and a.profile_id=auth.uid()));

create or replace function public.discipulado_iniciar(p_asignacion_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.cuenta_activa() then raise exception 'Cuenta inactiva'; end if;
  update public.discipulado_asignaciones set estado=case when estado='asignado' then 'en_progreso' else estado end, updated_at=now() where id=p_asignacion_id and profile_id=auth.uid();
  if not found then raise exception 'Asignación no disponible'; end if;
end; $$;

create or replace function public.discipulado_marcar_leccion(p_asignacion_id uuid, p_leccion_id uuid, p_completada boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_ok boolean;
begin
  if not public.cuenta_activa() then raise exception 'Cuenta inactiva'; end if;
  select exists (select 1 from public.discipulado_asignaciones a join public.discipulado_lecciones l on l.curso_id=a.curso_id where a.id=p_asignacion_id and a.profile_id=auth.uid() and l.id=p_leccion_id) into v_ok;
  if not v_ok then raise exception 'Lección no disponible'; end if;
  if p_completada then insert into public.discipulado_leccion_progreso(asignacion_id,leccion_id) values(p_asignacion_id,p_leccion_id) on conflict do nothing;
  else delete from public.discipulado_leccion_progreso where asignacion_id=p_asignacion_id and leccion_id=p_leccion_id; end if;
  update public.discipulado_asignaciones set estado=case when estado='asignado' then 'en_progreso' else estado end, updated_at=now() where id=p_asignacion_id and profile_id=auth.uid();
end; $$;

create or replace function public.discipulado_obtener_evaluacion(p_asignacion_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_curso uuid; v_result jsonb;
begin
  if not public.cuenta_activa() then raise exception 'Cuenta inactiva'; end if;
  select curso_id into v_curso from public.discipulado_asignaciones where id=p_asignacion_id and profile_id=auth.uid();
  if v_curso is null then raise exception 'Asignación no disponible'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',q.id,'enunciado',q.enunciado,'orden',q.orden,'opciones',(select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'texto',o.texto,'orden',o.orden) order by o.orden),'[]'::jsonb) from public.discipulado_opciones o where o.pregunta_id=q.id)) order by q.orden),'[]'::jsonb) into v_result from public.discipulado_preguntas q where q.curso_id=v_curso;
  return v_result;
end; $$;

create or replace function public.discipulado_enviar_intento(p_asignacion_id uuid, p_respuestas jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_curso uuid; v_total int; v_correctas int; v_lecciones int; v_completadas int; v_calificacion numeric(5,2);
begin
  if not public.cuenta_activa() then raise exception 'Cuenta inactiva'; end if;
  select a.curso_id into v_curso from public.discipulado_asignaciones a join public.discipulado_cursos c on c.id=a.curso_id where a.id=p_asignacion_id and a.profile_id=auth.uid() and c.estado='publicado';
  if v_curso is null then raise exception 'Asignación no disponible'; end if;
  select count(*) into v_lecciones from public.discipulado_lecciones where curso_id=v_curso;
  select count(*) into v_completadas from public.discipulado_leccion_progreso lp join public.discipulado_lecciones l on l.id=lp.leccion_id where lp.asignacion_id=p_asignacion_id and l.curso_id=v_curso;
  if v_completadas < v_lecciones then raise exception 'Completa todas las lecciones antes de la evaluación'; end if;
  select count(*) into v_total from public.discipulado_preguntas where curso_id=v_curso;
  if v_total=0 then raise exception 'Este curso todavía no tiene evaluación'; end if;
  select count(*) into v_correctas from public.discipulado_preguntas q join public.discipulado_opciones o on o.pregunta_id=q.id and o.es_correcta=true where q.curso_id=v_curso and (p_respuestas ->> q.id::text)=o.id::text;
  v_calificacion=round((v_correctas::numeric*100)/v_total,2);
  insert into public.discipulado_intentos(asignacion_id,calificacion,correctas,total,respuestas) values(p_asignacion_id,v_calificacion,v_correctas,v_total,p_respuestas);
  update public.discipulado_asignaciones set estado='revision', calificacion=v_calificacion, enviado_en=now(), revisado_en=null, revisado_por=null, notas_revision=null, updated_at=now() where id=p_asignacion_id;
  return jsonb_build_object('calificacion',v_calificacion,'correctas',v_correctas,'total',v_total);
end; $$;

create or replace function public.discipulado_revisar(p_asignacion_id uuid, p_decision text, p_notas text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.puede_gestionar_discipulado() then raise exception 'Sin permiso'; end if;
  if p_decision not in ('aprobado','rechazado') then raise exception 'Decisión inválida'; end if;
  update public.discipulado_asignaciones set estado=p_decision, revisado_en=now(), revisado_por=auth.uid(), notas_revision=nullif(trim(coalesce(p_notas,'')),''), updated_at=now() where id=p_asignacion_id and estado='revision';
  if not found then raise exception 'Asignación no disponible para revisión'; end if;
end; $$;

revoke all on table public.discipulado_gestores from anon, authenticated;
revoke all on table public.discipulado_cursos from anon, authenticated;
revoke all on table public.discipulado_lecciones from anon, authenticated;
revoke all on table public.discipulado_preguntas from anon, authenticated;
revoke all on table public.discipulado_opciones from anon, authenticated;
revoke all on table public.discipulado_asignaciones from anon, authenticated;
revoke all on table public.discipulado_leccion_progreso from anon, authenticated;
revoke all on table public.discipulado_intentos from anon, authenticated;

grant select,insert,update,delete on public.discipulado_gestores to authenticated;
grant select,insert,update,delete on public.discipulado_cursos to authenticated;
grant select,insert,update,delete on public.discipulado_lecciones to authenticated;
grant select,insert,update,delete on public.discipulado_preguntas to authenticated;
grant select,insert,update,delete on public.discipulado_opciones to authenticated;
grant select,insert,update,delete on public.discipulado_asignaciones to authenticated;
grant select on public.discipulado_leccion_progreso to authenticated;
grant select on public.discipulado_intentos to authenticated;
grant all on public.discipulado_gestores, public.discipulado_cursos, public.discipulado_lecciones, public.discipulado_preguntas, public.discipulado_opciones, public.discipulado_asignaciones, public.discipulado_leccion_progreso, public.discipulado_intentos to service_role;

grant execute on function public.puede_gestionar_discipulado() to authenticated;
grant execute on function public.discipulado_aprobado(uuid) to authenticated;
grant execute on function public.discipulado_iniciar(uuid) to authenticated;
grant execute on function public.discipulado_marcar_leccion(uuid,uuid,boolean) to authenticated;
grant execute on function public.discipulado_obtener_evaluacion(uuid) to authenticated;
grant execute on function public.discipulado_enviar_intento(uuid,jsonb) to authenticated;
grant execute on function public.discipulado_revisar(uuid,text,text) to authenticated;
revoke execute on function public.puede_gestionar_discipulado() from anon;
revoke execute on function public.discipulado_aprobado(uuid) from anon;
revoke execute on function public.discipulado_iniciar(uuid) from anon;
revoke execute on function public.discipulado_marcar_leccion(uuid,uuid,boolean) from anon;
revoke execute on function public.discipulado_obtener_evaluacion(uuid) from anon;
revoke execute on function public.discipulado_enviar_intento(uuid,jsonb) from anon;
revoke execute on function public.discipulado_revisar(uuid,text,text) from anon;
