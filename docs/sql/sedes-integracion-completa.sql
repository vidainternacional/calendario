-- SEGUNDO PAQUETE: PREPARADO, NO APLICADO. Requiere aprobación del alcance/impacto/reversión.
begin;
create schema vida_privado;
revoke all on schema vida_privado from public,anon;
grant usage on schema vida_privado to authenticated,service_role;
create table vida_privado.config(id boolean primary key default true check(id), activa boolean not null default true, exigir_sedes_legacy boolean not null default false);
alter table vida_privado.config enable row level security;
insert into vida_privado.config(id,activa) values(true,true);
revoke all on vida_privado.config from public,anon,authenticated;
grant all on vida_privado.config to service_role;
alter table public.publicaciones add column vida_audiencia jsonb;
alter table public.vida_devocionales add column vida_audiencia jsonb;
alter table public.pastoral_paquetes add column vida_audiencia jsonb;
create table public.vida_grupos_destino (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
 nombre text not null check(length(trim(nombre)) between 1 and 80), audiencia jsonb not null,
 activo boolean not null default true, updated_at timestamptz not null default now()
);
create index vida_grupos_destino_owner on public.vida_grupos_destino(owner_id);
create table public.vida_evento_invitados (
 evento_id uuid not null references public.eventos(id) on delete cascade,
 ministerio_id uuid not null references public.ministerios(id) on delete cascade,
 profile_id uuid not null references public.profiles(id) on delete cascade,
 invitado_por uuid not null references public.profiles(id), activo boolean not null default true,
 created_at timestamptz not null default now(), primary key(evento_id,ministerio_id,profile_id)
);
create index vida_evento_invitados_profile on public.vida_evento_invitados(profile_id,evento_id) where activo;
create function vida_privado.global() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=auth.uid() and p.activo and p.estado_cuenta='activo' and (p.rol::text='administrador' or p.es_pastor_general is true));
$$;
create function vida_privado.activa() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=auth.uid() and p.activo and p.estado_cuenta='activo');
$$;
create function vida_privado.sedes_gestionables() returns uuid[] language sql stable security definer set search_path='' as $$
 select coalesce(array_agg(s.id),'{}'::uuid[]) from public.vida_sedes s where s.activa and vida_privado.activa() and
 (vida_privado.global() or exists(select 1 from public.vida_sede_responsables r where r.sede_id=s.id and r.profile_id=auth.uid() and exists(select 1 from public.profiles rp where rp.id=r.profile_id and rp.activo and rp.estado_cuenta='activo' and rp.rol::text=r.responsabilidad))
 or exists(select 1 from public.vida_ministerio_sedes ms join public.ministerio_miembros mm on mm.ministerio_id=ms.ministerio_id where ms.sede_id=s.id and mm.profile_id=auth.uid() and mm.es_lider));
$$;
create function vida_privado.puede_ministerio(p_id uuid,p_gestion boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select vida_privado.activa() and (vida_privado.global() or exists(select 1 from public.ministerio_miembros mm where mm.profile_id=auth.uid() and mm.ministerio_id=p_id and (not p_gestion or mm.es_lider))
 or (not p_gestion and exists(select 1 from public.vida_ministerio_sedes ms join public.vida_sede_responsables r on r.sede_id=ms.sede_id where ms.ministerio_id=p_id and r.profile_id=auth.uid() and exists(select 1 from public.profiles rp where rp.id=r.profile_id and rp.activo and rp.estado_cuenta='activo' and rp.rol::text=r.responsabilidad)))
 or (not p_gestion and not exists(select 1 from public.vida_ministerio_sedes ms where ms.ministerio_id=p_id) and exists(select 1 from public.profiles p where p.id=auth.uid() and p.rol::text='pastor')));
$$;
create function vida_privado.audiencia_formato(a jsonb) returns boolean language plpgsql immutable security invoker set search_path='' as $$
declare k text; v text;
begin
 if a is null then return true; end if;
 if jsonb_typeof(a) is distinct from 'object' or a->'version' is distinct from '1'::jsonb or jsonb_typeof(a->'todos') is distinct from 'boolean' or jsonb_typeof(a->'lideres') is distinct from 'boolean' then return false; end if;
 foreach k in array array['sedes','ministerios','personas','roles'] loop
  if jsonb_typeof(a->k) is distinct from 'array' or jsonb_array_length(a->k)>(case when k='personas' then 500 when k='roles' then 4 else 100 end) then return false; end if;
  for v in select jsonb_array_elements_text(a->k) loop
   if k='roles' then if v not in ('administrador','pastor','lider','servidor') then return false; end if;
   elsif v is null or v !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return false; end if;
  end loop;
 end loop;
 return jsonb_array_length(a->'sedes')>0 and ((a->>'todos')::boolean or (a->>'lideres')::boolean or jsonb_array_length(a->'roles')+jsonb_array_length(a->'ministerios')+jsonb_array_length(a->'personas')>0);
exception when others then return false;
end;
$$;
create function vida_privado.audiencia_coincide(a jsonb,p_uid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=p_uid and p.activo and p.estado_cuenta='activo') and a is not null and (
 (a->>'todos')::boolean or a->'personas' ? p_uid::text or
 exists(select 1 from public.ministerio_miembros mm join public.ministerios m on m.id=mm.ministerio_id and m.activo join public.vida_ministerio_sedes ms on ms.ministerio_id=mm.ministerio_id
  where mm.profile_id=p_uid and a->'sedes' ? ms.sede_id::text and (a->'ministerios' ? mm.ministerio_id::text or ((a->>'lideres')::boolean and mm.es_lider) or a->'roles' ? 'servidor' or (a->'roles' ? 'lider' and mm.es_lider))) or
 exists(select 1 from public.vida_sede_responsables r where r.profile_id=p_uid and exists(select 1 from public.profiles rp where rp.id=r.profile_id and rp.activo and rp.estado_cuenta='activo' and rp.rol::text=r.responsabilidad) and a->'sedes' ? r.sede_id::text and a->'roles' ? r.responsabilidad) or
 exists(select 1 from public.profiles p where p.id=p_uid and (p.rol::text='administrador' or p.es_pastor_general is true) and a->'roles' ? p.rol::text));
$$;
create function vida_privado.audiencia_visible(a jsonb) returns boolean language sql stable security definer set search_path='' as $$
 select vida_privado.activa() and (a is null or vida_privado.global() or vida_privado.audiencia_coincide(a,auth.uid()));
$$;
create function vida_privado.audiencia_inicio(a jsonb) returns boolean language sql stable security definer set search_path='' as $$
 select a is null or not (a->>'todos')::boolean or not exists(select 1 from public.vida_sede_selecciones x where x.profile_id=auth.uid() and x.visible)
 or exists(select 1 from public.vida_sede_selecciones x where x.profile_id=auth.uid() and x.visible and a->'sedes' ? x.sede_id::text);
$$;
create function vida_privado.audiencia_autorizada(a jsonb) returns boolean language plpgsql stable security definer set search_path='' as $$
declare v uuid; es_pastor boolean;
begin
 if a is null then return true; end if;
 if not (select activa from vida_privado.config where id) or not vida_privado.activa() or not vida_privado.audiencia_formato(a) then return false; end if;
 for v in select jsonb_array_elements_text(a->'sedes')::uuid loop
  if not (v=any(vida_privado.sedes_gestionables())) then return false; end if;
 end loop;
 select vida_privado.global() or not exists(select 1 from jsonb_array_elements_text(a->'sedes') x(id) where not exists(select 1 from public.vida_sede_responsables r where r.profile_id=auth.uid() and exists(select 1 from public.profiles rp where rp.id=r.profile_id and rp.activo and rp.estado_cuenta='activo' and rp.rol::text=r.responsabilidad) and r.sede_id=x.id::uuid)) into es_pastor;
 for v in select jsonb_array_elements_text(a->'ministerios')::uuid loop
  if not exists(select 1 from public.ministerios m join public.vida_ministerio_sedes ms on ms.ministerio_id=m.id where m.id=v and m.activo and a->'sedes' ? ms.sede_id::text and (es_pastor or vida_privado.puede_ministerio(v,true))) then return false; end if;
 end loop;
 if not es_pastor and ((a->>'todos')::boolean or (a->>'lideres')::boolean or jsonb_array_length(a->'roles')>0 or jsonb_array_length(a->'personas')>0 or jsonb_array_length(a->'ministerios')=0) then return false; end if;
 for v in select jsonb_array_elements_text(a->'personas')::uuid loop
  if not exists(select 1 from public.profiles p where p.id=v and p.activo and p.estado_cuenta='activo') then return false; end if;
  if not vida_privado.global() and not exists(select 1 from public.vida_sede_selecciones x where x.profile_id=v and x.pertenece and exists(select 1 from public.vida_sede_responsables r join public.profiles rp on rp.id=r.profile_id and rp.activo and rp.estado_cuenta='activo' and rp.rol::text=r.responsabilidad where r.profile_id=auth.uid() and r.sede_id=x.sede_id))
   and not exists(select 1 from public.ministerio_miembros mm join public.vida_ministerio_sedes ms on ms.ministerio_id=mm.ministerio_id where mm.profile_id=v and exists(select 1 from public.vida_sede_responsables r join public.profiles rp on rp.id=r.profile_id and rp.activo and rp.estado_cuenta='activo' and rp.rol::text=r.responsabilidad where r.profile_id=auth.uid() and r.sede_id=ms.sede_id)) then return false; end if;
 end loop;
 return true;
exception when others then return false;
end;
$$;
create function vida_privado.puede_programacion(p_evento uuid,p_ministerio uuid) returns boolean language sql stable security definer set search_path='' as $$
 select vida_privado.activa() and (vida_privado.global() or (p_ministerio is not null and exists(select 1 from public.eventos e where e.id=p_evento and (e.ministerio_id=p_ministerio or exists(select 1 from public.evento_calendarios ec join public.calendars c on c.id=ec.calendar_id where ec.evento_id=e.id and c.ministerio_id=p_ministerio)))
 and (vida_privado.puede_ministerio(p_ministerio) or exists(select 1 from public.vida_evento_invitados i where i.evento_id=p_evento and i.ministerio_id=p_ministerio and i.profile_id=auth.uid() and i.activo))));
$$;
create function vida_privado.puede_evento(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select vida_privado.activa() and exists(select 1 from public.eventos e join public.calendars c on c.id=e.calendar_id where e.id=p_id and (
 c.es_publico or vida_privado.global() or (e.ministerio_id is not null and vida_privado.puede_programacion(e.id,e.ministerio_id))
 or (e.ministerio_id is null and (c.ministerio_id is not null and vida_privado.puede_programacion(e.id,c.ministerio_id)))
 or (e.ministerio_id is null and c.ministerio_id is null and (c.owner_id=auth.uid() or exists(select 1 from public.calendar_subscriptions cs where cs.calendar_id=c.id and cs.user_id=auth.uid())))
 or exists(select 1 from public.vida_evento_invitados i where i.evento_id=e.id and i.profile_id=auth.uid() and i.activo)));
$$;
create function vida_privado.validar_contenido() returns trigger language plpgsql security definer set search_path='' as $$
declare autor uuid; anterior_autor uuid;
begin
 if auth.uid() is null then raise exception 'Sesión requerida' using errcode='42501'; end if;
 if not vida_privado.activa() then raise exception 'Cuenta no autorizada' using errcode='42501'; end if;
 autor:=coalesce(to_jsonb(new)->>'autor_id',to_jsonb(new)->>'profile_id')::uuid;
 if tg_op='INSERT' and autor is distinct from auth.uid() then raise exception 'No puedes publicar como otra persona' using errcode='42501'; end if;
 if tg_op='UPDATE' then
  anterior_autor:=coalesce(to_jsonb(old)->>'autor_id',to_jsonb(old)->>'profile_id')::uuid;
  if autor is distinct from anterior_autor then raise exception 'El autor no se puede cambiar' using errcode='42501'; end if;
  if old.vida_audiencia is not null and new.vida_audiencia is null then raise exception 'Conserva una audiencia explícita para este contenido' using errcode='42501'; end if;
 end if;
 if not vida_privado.audiencia_formato(new.vida_audiencia) then raise exception 'Audiencia no válida'; end if;
 if not (select activa from vida_privado.config where id) then
  if new.vida_audiencia is not null or (tg_op='UPDATE' and old.vida_audiencia is not null) then raise exception 'La edición por sede está desactivada'; end if;
  return new;
 end if;
 -- Revalida el alcance actual también al editar contenido sin cambiar destinatarios.
 if new.vida_audiencia is not null then
  if not vida_privado.audiencia_autorizada(new.vida_audiencia) then raise exception 'Destinatarios fuera de tu alcance' using errcode='42501'; end if;
 end if;
 -- Un pastor ya asignado a sedes no publica por la ruta antigua para evadir su alcance.
 if new.vida_audiencia is null and not vida_privado.global() and (select exigir_sedes_legacy from vida_privado.config where id) and exists(select 1 from public.profiles p where p.id=auth.uid() and p.rol::text='pastor')
 and (tg_op='INSERT' or to_jsonb(new)->>'publicado'='true' or to_jsonb(new)->>'estado'='aprobado') then raise exception 'Selecciona sede y destinatarios antes de publicar' using errcode='42501'; end if;
 return new;
end;
$$;
create trigger vida_publicacion_audiencia before insert or update on public.publicaciones for each row execute function vida_privado.validar_contenido();
create trigger vida_devocional_audiencia before insert or update on public.vida_devocionales for each row execute function vida_privado.validar_contenido();
create trigger vida_paquete_audiencia before insert or update on public.pastoral_paquetes for each row execute function vida_privado.validar_contenido();
create policy vida_publicaciones_sedes on public.publicaciones as restrictive for select to authenticated using
 (vida_privado.activa() and (autor_id=auth.uid() or vida_privado.global() or ((vida_audiencia is not null or ministerio_id is null or vida_privado.puede_ministerio(ministerio_id)) and vida_privado.audiencia_visible(vida_audiencia))));
create policy vida_devocionales_sedes on public.vida_devocionales as restrictive for select to authenticated using
 (vida_privado.activa() and (autor_id=auth.uid() or vida_privado.audiencia_visible(vida_audiencia)));
create policy vida_paquetes_sedes on public.pastoral_paquetes as restrictive for select to authenticated using
 (vida_privado.activa() and (profile_id=auth.uid() or vida_privado.audiencia_visible(vida_audiencia)));
create policy vida_eventos_sedes on public.eventos as restrictive for select to authenticated using (vida_privado.puede_evento(id));
-- Permisiva adicional solo para la nueva audiencia: las restrictivas y publicado siguen siendo obligatorios.
create policy vida_devocionales_receptores on public.vida_devocionales for select to authenticated using
 (publicado and vida_audiencia is not null and vida_privado.audiencia_visible(vida_audiencia));
alter table public.vida_grupos_destino enable row level security;
revoke all on public.vida_grupos_destino from public,anon,authenticated;
grant select,insert,update on public.vida_grupos_destino to authenticated;
grant all on public.vida_grupos_destino to service_role;
create policy vida_grupos_lectura on public.vida_grupos_destino for select to authenticated using (owner_id=auth.uid() and vida_privado.activa());
create policy vida_grupos_crear on public.vida_grupos_destino for insert to authenticated with check (owner_id=auth.uid() and vida_privado.audiencia_autorizada(audiencia));
create policy vida_grupos_actualizar on public.vida_grupos_destino for update to authenticated using (owner_id=auth.uid() and vida_privado.activa()) with check (owner_id=auth.uid() and vida_privado.activa() and (not activo or vida_privado.audiencia_autorizada(audiencia)));
alter table public.vida_evento_invitados enable row level security;
revoke all on public.vida_evento_invitados from public,anon,authenticated;
grant select on public.vida_evento_invitados to authenticated;
grant all on public.vida_evento_invitados to service_role;
create policy vida_invitados_lectura on public.vida_evento_invitados for select to authenticated using (vida_privado.activa() and (profile_id=auth.uid() or vida_privado.puede_ministerio(ministerio_id,true)));
create function public.vida_avisos_inicio() returns setof public.publicaciones language sql stable security invoker set search_path='' as $$
 select p.* from public.publicaciones p where p.estado='aprobado' and vida_privado.audiencia_inicio(p.vida_audiencia);
$$;
create function public.vida_devocionales_visibles() returns setof public.vida_devocionales language sql stable security invoker set search_path='' as $$
 select d.* from public.vida_devocionales d where d.publicado and vida_privado.audiencia_inicio(d.vida_audiencia);
$$;
create function vida_privado.contenido(p_tipo text,p_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare r jsonb;
begin
 case p_tipo
 when 'aviso' then select jsonb_build_object('autor',p.autor_id,'publicado',p.estado='aprobado','audiencia',p.vida_audiencia,'ministerio',p.ministerio_id) into r from public.publicaciones p where p.id=p_id;
 when 'devocional' then select jsonb_build_object('autor',p.autor_id,'publicado',p.publicado,'audiencia',p.vida_audiencia) into r from public.vida_devocionales p where p.id=p_id;
 when 'paquete' then select jsonb_build_object('autor',p.profile_id,'publicado',p.publicado,'audiencia',p.vida_audiencia) into r from public.pastoral_paquetes p where p.id=p_id;
 else return null; end case;
 return r;
end;
$$;
create function vida_privado.destinatarios(p_tipo text,p_id uuid) returns table(profile_id uuid) language plpgsql stable security definer set search_path='' as $$
declare c jsonb; a jsonb;
begin
 if not vida_privado.activa() then raise exception 'No autorizado' using errcode='42501'; end if;
 c:=vida_privado.contenido(p_tipo,p_id); a:=c->'audiencia';
 if c is null or not (c->>'publicado')::boolean or a is null or a='null'::jsonb then return; end if;
 if not vida_privado.global() and (c->>'autor')::uuid<>auth.uid() then raise exception 'No autorizado' using errcode='42501'; end if;
 -- Revalida alcance actual incluso al reenviar un mensaje antiguo o grupo guardado.
 if not vida_privado.audiencia_autorizada(a) then raise exception 'La audiencia ya no pertenece a tu alcance' using errcode='42501'; end if;
 return query select p.id from public.profiles p where p.activo and p.estado_cuenta='activo' and vida_privado.audiencia_coincide(a,p.id)
 and not exists(select 1 from public.notificaciones_preferencias n where n.profile_id=p.id and n.ministerio_id is null and not n.activo)
 and (not (a->>'todos')::boolean or not exists(select 1 from public.vida_sede_selecciones x where x.profile_id=p.id and x.visible)
   or exists(select 1 from public.vida_sede_selecciones x where x.profile_id=p.id and x.visible and a->'sedes' ? x.sede_id::text))
 and ((a->>'todos')::boolean or (a->>'lideres')::boolean or jsonb_array_length(a->'roles')>0 or a->'personas' ? p.id::text or exists(
   select 1 from public.ministerio_miembros mm where mm.profile_id=p.id and a->'ministerios' ? mm.ministerio_id::text
   and not exists(select 1 from public.notificaciones_preferencias n where n.profile_id=p.id and n.ministerio_id=mm.ministerio_id and not n.activo)));
end;
$$;
create function public.vida_destinatarios_contenido(p_tipo text,p_id uuid) returns table(profile_id uuid) language sql stable security invoker set search_path='' as $$
 select * from vida_privado.destinatarios(p_tipo,p_id);
$$;
create function public.vida_validar_audiencia(p_audiencia jsonb) returns boolean language sql stable security invoker set search_path='' as $$
 select vida_privado.audiencia_autorizada(p_audiencia);
$$;
create function vida_privado.opciones() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare scope uuid[]; global boolean;
begin
 if not vida_privado.activa() then raise exception 'No autorizado' using errcode='42501'; end if;
 scope:=vida_privado.sedes_gestionables(); global:=vida_privado.global();
 return jsonb_build_object('owner',auth.uid(),'global',global,
 'sedes',(select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'nombre',s.nombre,'slug',s.slug) order by s.nombre),'[]'::jsonb) from public.vida_sedes s where s.id=any(scope) and s.activa),
 'pastorales',(select coalesce(jsonb_agg(r.sede_id),'[]'::jsonb) from public.vida_sede_responsables r where r.profile_id=auth.uid() and exists(select 1 from public.profiles rp where rp.id=r.profile_id and rp.activo and rp.estado_cuenta='activo' and rp.rol::text=r.responsabilidad)),
 'ministerios',(select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'nombre',m.nombre,'sede',ms.sede_id) order by m.nombre),'[]'::jsonb) from public.ministerios m join public.vida_ministerio_sedes ms on ms.ministerio_id=m.id where m.activo and ms.sede_id=any(scope) and
 (global or vida_privado.puede_ministerio(m.id,true) or exists(select 1 from public.vida_sede_responsables r where r.profile_id=auth.uid() and exists(select 1 from public.profiles rp where rp.id=r.profile_id and rp.activo and rp.estado_cuenta='activo' and rp.rol::text=r.responsabilidad) and r.sede_id=ms.sede_id))),
 'personas',(select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'nombre',p.nombre_completo) order by p.nombre_completo),'[]'::jsonb) from public.profiles p where p.activo and p.estado_cuenta='activo' and
 (global or exists(select 1 from public.vida_sede_selecciones x join public.vida_sede_responsables r on r.sede_id=x.sede_id and r.profile_id=auth.uid() and exists(select 1 from public.profiles rp where rp.id=r.profile_id and rp.activo and rp.estado_cuenta='activo' and rp.rol::text=r.responsabilidad) where x.profile_id=p.id and x.pertenece)
 or exists(select 1 from public.ministerio_miembros mm join public.vida_ministerio_sedes ms on ms.ministerio_id=mm.ministerio_id join public.vida_sede_responsables r on r.sede_id=ms.sede_id and r.profile_id=auth.uid() and exists(select 1 from public.profiles rp where rp.id=r.profile_id and rp.activo and rp.estado_cuenta='activo' and rp.rol::text=r.responsabilidad) where mm.profile_id=p.id)))
 );
end;
$$;
create function public.vida_opciones_destinatarios() returns jsonb language sql stable security invoker set search_path='' as $$ select vida_privado.opciones(); $$;
-- Ningún helper permite elegir un UID para consultar como otra persona desde la API.
revoke all on all functions in schema vida_privado from public,anon,authenticated;
grant execute on function vida_privado.global(),vida_privado.activa(),vida_privado.sedes_gestionables(),vida_privado.puede_ministerio(uuid,boolean),vida_privado.puede_evento(uuid),vida_privado.puede_programacion(uuid,uuid),vida_privado.audiencia_visible(jsonb),vida_privado.audiencia_inicio(jsonb),vida_privado.audiencia_autorizada(jsonb),vida_privado.destinatarios(text,uuid),vida_privado.opciones() to authenticated;
revoke all on function public.vida_avisos_inicio(),public.vida_devocionales_visibles(),public.vida_destinatarios_contenido(text,uuid),public.vida_validar_audiencia(jsonb),public.vida_opciones_destinatarios() from public,anon;
grant execute on function public.vida_avisos_inicio(),public.vida_devocionales_visibles(),public.vida_destinatarios_contenido(text,uuid),public.vida_validar_audiencia(jsonb),public.vida_opciones_destinatarios() to authenticated;

CREATE OR REPLACE FUNCTION public.get_internal_pastoral_package(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  resultado jsonb;
  paquete_record record;
  viewer_role text;
  viewer_status text;
  allowed boolean := false;
begin
  if auth.uid() is null then
    return jsonb_build_object('access', 'login_required');
  end if;

  select pr.rol, coalesce(pr.estado_cuenta, 'pendiente')
    into viewer_role, viewer_status
  from public.profiles pr
  where pr.id = auth.uid();

  select p.id, p.profile_id, p.titulo, p.descripcion_publica, p.instrucciones,
         p.audiencia, p.published_at, p.bosquejo_id, p.coleccion_id
    into paquete_record
  from public.pastoral_paquetes p
  where p.id = p_id
    and p.publicado = true
    and vida_privado.audiencia_visible(p.vida_audiencia)
  limit 1;

  if paquete_record.id is null then
    return null;
  end if;

  allowed := case paquete_record.audiencia
    when 'publico' then viewer_status = 'activo'
    when 'iglesia' then viewer_status = 'activo'
    when 'servidores' then viewer_status = 'activo' and viewer_role in ('servidor', 'lider', 'pastor', 'administrador')
    when 'lideres' then viewer_status = 'activo' and viewer_role in ('lider', 'pastor', 'administrador')
    else false
  end;

  if not allowed then
    return jsonb_build_object('access', 'forbidden', 'audiencia', paquete_record.audiencia);
  end if;

  select jsonb_build_object(
    'access', 'granted',
    'id', p.id,
    'titulo', p.titulo,
    'descripcion_publica', p.descripcion_publica,
    'instrucciones', p.instrucciones,
    'audiencia', p.audiencia,
    'published_at', p.published_at,
    'bosquejo', case when b.id is null then null else jsonb_build_object(
      'titulo', b.titulo,
      'tema', b.tema,
      'pasaje_base', b.pasaje_base,
      'proposito', b.proposito,
      'introduccion', b.introduccion,
      'puntos', coalesce(b.puntos, '[]'::jsonb),
      'conclusion', b.conclusion
    ) end,
    'coleccion', case when c.id is null then null else jsonb_build_object(
      'nombre', c.nombre,
      'descripcion', c.descripcion,
      'versiculos', coalesce((
        select jsonb_agg(jsonb_build_object(
          'referencia', v.referencia,
          'texto', v.texto,
          'traduccion', v.traduccion
        ) order by v.created_at)
        from public.pastoral_versiculos v
        where v.coleccion_id = c.id and v.profile_id = p.profile_id
      ), '[]'::jsonb)
    ) end
  ) into resultado
  from public.pastoral_paquetes p
  left join public.pastoral_bosquejos b on b.id = p.bosquejo_id and b.profile_id = p.profile_id
  left join public.pastoral_colecciones c on c.id = p.coleccion_id and c.profile_id = p.profile_id
  where p.id = paquete_record.id
    and p.publicado and vida_privado.audiencia_visible(p.vida_audiencia)
  limit 1;

  return resultado;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_next_visible_calendar_item()
 RETURNS TABLE(item_type text, id uuid, titulo text, fecha_inicio timestamp with time zone, ubicacion text, calendar_id uuid, calendar_nombre text, estado text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with me as (
    select p.id
    from public.profiles p
    where p.id = auth.uid()
      and p.activo = true
      and p.estado_cuenta = 'activo'
  ), visible_calendars as (
    select c.id, c.nombre
    from public.calendars c
    where c.es_publico = true
      and exists (select 1 from me)
    union
    select c.id, c.nombre
    from public.calendar_subscriptions s
    join public.calendars c on c.id = s.calendar_id
    where s.user_id = auth.uid()
      and s.visible = true
      and exists (select 1 from me)
  ), event_candidates as (
    select
      'event'::text as item_type,
      e.id,
      e.titulo,
      e.fecha_inicio,
      e.ubicacion,
      vc.id as calendar_id,
      vc.nombre as calendar_nombre,
      ea.estado::text as estado
    from public.evento_calendarios ec
    join visible_calendars vc on vc.id = ec.calendar_id
    join public.eventos e on e.id = ec.evento_id
    left join public.evento_asignaciones ea
      on ea.evento_id = e.id and ea.profile_id = auth.uid()
    where e.fecha_fin > now()
      and vida_privado.puede_evento(e.id)
  ), reminder_candidates as (
    select
      'reminder'::text as item_type,
      r.id,
      r.title::text as titulo,
      r.remind_at as fecha_inicio,
      null::text as ubicacion,
      vc.id as calendar_id,
      vc.nombre as calendar_nombre,
      null::text as estado
    from public.calendar_reminders r
    join visible_calendars vc on vc.id = r.calendar_id
    where r.remind_at >= now()
  )
  select x.item_type, x.id, x.titulo, x.fecha_inicio, x.ubicacion, x.calendar_id, x.calendar_nombre, x.estado
  from (
    select * from event_candidates
    union all
    select * from reminder_candidates
  ) x
  order by x.fecha_inicio asc
  limit 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_pastoral_package(p_slug uuid)
 RETURNS jsonb
 LANGUAGE plpgsql STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  resultado jsonb;
  paquete_record record;
  viewer_role text;
  viewer_status text;
  allowed boolean := false;
begin
  select p.id, p.profile_id, p.titulo, p.descripcion_publica, p.instrucciones,
         p.audiencia, p.published_at, p.bosquejo_id, p.coleccion_id
    into paquete_record
  from public.pastoral_paquetes p
  where (p.public_slug = p_slug or p.id = p_slug)
    and p.publicado = true
    and vida_privado.audiencia_visible(p.vida_audiencia)
  limit 1;

  if paquete_record.id is null then
    return null;
  end if;

  if auth.uid() is not null then
    select pr.rol, coalesce(pr.estado_cuenta, 'activo')
      into viewer_role, viewer_status
    from public.profiles pr
    where pr.id = auth.uid();
  end if;

  allowed := case paquete_record.audiencia
    when 'publico' then auth.uid() is not null and viewer_status = 'activo'
    when 'iglesia' then auth.uid() is not null and viewer_status = 'activo'
    when 'servidores' then auth.uid() is not null and viewer_status = 'activo' and viewer_role in ('servidor', 'lider', 'pastor', 'administrador')
    when 'lideres' then auth.uid() is not null and viewer_status = 'activo' and viewer_role in ('lider', 'pastor', 'administrador')
    else false
  end;

  if not allowed then
    return jsonb_build_object(
      'access', case when auth.uid() is null then 'login_required' else 'forbidden' end,
      'audiencia', paquete_record.audiencia
    );
  end if;

  select jsonb_build_object(
    'access', 'granted',
    'id', p.id,
    'titulo', p.titulo,
    'descripcion_publica', p.descripcion_publica,
    'instrucciones', p.instrucciones,
    'audiencia', p.audiencia,
    'published_at', p.published_at,
    'presentacion_diapositivas', coalesce(p.presentacion_diapositivas, '[]'::jsonb),
    'bosquejo', case when b.id is null then null else jsonb_build_object(
      'titulo', b.titulo,
      'tema', b.tema,
      'pasaje_base', b.pasaje_base,
      'proposito', b.proposito,
      'introduccion', b.introduccion,
      'puntos', coalesce(b.puntos, '[]'::jsonb),
      'conclusion', b.conclusion
    ) end,
    'coleccion', case when c.id is null then null else jsonb_build_object(
      'nombre', c.nombre,
      'descripcion', c.descripcion,
      'versiculos', coalesce((
        select jsonb_agg(jsonb_build_object(
          'referencia', concat_ws(' ', v.libro_nombre, concat(v.capitulo, ':', v.verso)),
          'texto', v.texto,
          'traduccion', v.traduccion
        ) order by v.created_at)
        from public.pastoral_versiculos v
        where v.coleccion_id = c.id and v.profile_id = p.profile_id
      ), '[]'::jsonb)
    ) end
  ) into resultado
  from public.pastoral_paquetes p
  left join public.pastoral_bosquejos b on b.id = p.bosquejo_id and b.profile_id = p.profile_id
  left join public.pastoral_colecciones c on c.id = p.coleccion_id and c.profile_id = p.profile_id
  where p.id = paquete_record.id
    and p.publicado and vida_privado.audiencia_visible(p.vida_audiencia)
  limit 1;

  return resultado;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_received_pastoral_packages()
 RETURNS TABLE(id uuid, titulo text, descripcion_publica text, audiencia text, published_at timestamp with time zone, public_slug uuid, destacado boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with viewer as (
    select p.rol, p.estado_cuenta
    from public.profiles p
    where p.id = auth.uid()
  )
  select
    pp.id,
    pp.titulo,
    pp.descripcion_publica,
    pp.audiencia,
    pp.published_at,
    pp.public_slug,
    pp.destacado
  from public.pastoral_paquetes pp
  cross join viewer v
  where pp.publicado = true
    and vida_privado.audiencia_visible(pp.vida_audiencia)
    and vida_privado.audiencia_inicio(pp.vida_audiencia)
    and v.estado_cuenta = 'activo'
    and (
      pp.audiencia = 'publico'
      or pp.audiencia = 'iglesia'
      or (pp.audiencia = 'servidores' and v.rol in ('servidor','lider','pastor','administrador'))
      or (pp.audiencia = 'lideres' and v.rol in ('lider','pastor','administrador'))
    )
  order by pp.published_at desc nulls last;
$function$;

CREATE OR REPLACE FUNCTION public.get_unread_publication_ids(p_publication_ids uuid[])
 RETURNS TABLE(publicacion_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select p.id
  from public.publicaciones p
  join public.profiles pr on pr.id = auth.uid()
  where p.id = any(coalesce(p_publication_ids, array[]::uuid[]))
    and pr.estado_cuenta = 'activo'
    and p.estado = 'aprobado'
    and vida_privado.audiencia_visible(p.vida_audiencia)
    and (p.vida_audiencia is not null or p.ministerio_id is null or vida_privado.puede_ministerio(p.ministerio_id))
    and vida_privado.audiencia_inicio(p.vida_audiencia)
    and (
      p.vida_audiencia is not null or pr.rol::text in ('pastor', 'administrador')
      or p.ministerio_id is null
      or exists (
        select 1
        from public.ministerio_miembros mm
        where mm.profile_id = auth.uid()
          and mm.ministerio_id = p.ministerio_id
      )
    )
    and not exists (
      select 1
      from public.publicacion_lecturas pl
      where pl.publicacion_id = p.id
        and pl.profile_id = auth.uid()
    );
$function$;

CREATE OR REPLACE FUNCTION public.get_unread_publications_count()
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select count(*)::integer
  from public.publicaciones p
  join public.profiles pr on pr.id = auth.uid()
  where pr.estado_cuenta = 'activo'
    and p.estado = 'aprobado'
    and vida_privado.audiencia_visible(p.vida_audiencia)
    and (p.vida_audiencia is not null or p.ministerio_id is null or vida_privado.puede_ministerio(p.ministerio_id))
    and vida_privado.audiencia_inicio(p.vida_audiencia)
    and (
      p.vida_audiencia is not null or pr.rol::text in ('pastor', 'administrador')
      or p.ministerio_id is null
      or exists (
        select 1
        from public.ministerio_miembros mm
        where mm.profile_id = auth.uid()
          and mm.ministerio_id = p.ministerio_id
      )
    )
    and not exists (
      select 1
      from public.publicacion_lecturas pl
      where pl.publicacion_id = p.id
        and pl.profile_id = auth.uid()
    );
$function$;

CREATE OR REPLACE FUNCTION public.get_visible_pastoral_packages()
 RETURNS TABLE(id uuid, titulo text, descripcion_publica text, audiencia text, published_at timestamp with time zone, public_slug uuid, destacado boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with viewer as (
    select p.rol, p.estado_cuenta
    from public.profiles p
    where p.id = auth.uid()
  )
  select pp.id,
         pp.titulo,
         pp.descripcion_publica,
         pp.audiencia,
         pp.published_at,
         pp.public_slug,
         pp.destacado
  from public.pastoral_paquetes pp
  cross join viewer v
  where pp.publicado = true
    and vida_privado.audiencia_visible(pp.vida_audiencia)
    and vida_privado.audiencia_inicio(pp.vida_audiencia)
    and v.estado_cuenta = 'activo'
    and (
      pp.audiencia = 'publico'
      or pp.audiencia = 'iglesia'
      or (pp.audiencia = 'servidores' and v.rol in ('servidor','lider','pastor','administrador'))
      or (pp.audiencia = 'lideres' and v.rol in ('lider','pastor','administrador'))
    )
  order by pp.destacado desc, pp.published_at desc nulls last
  limit 6;
$function$;

CREATE OR REPLACE FUNCTION public.mark_publication_read(p_publicacion_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if exists (
    select 1
    from public.publicaciones p
    join public.profiles pr on pr.id = auth.uid()
    where p.id = p_publicacion_id
      and pr.estado_cuenta = 'activo'
      and p.estado = 'aprobado'
    and vida_privado.audiencia_visible(p.vida_audiencia)
    and (p.vida_audiencia is not null or p.ministerio_id is null or vida_privado.puede_ministerio(p.ministerio_id))
      and (
        p.vida_audiencia is not null or pr.rol::text in ('pastor', 'administrador')
        or p.ministerio_id is null
        or exists (
          select 1
          from public.ministerio_miembros mm
          where mm.profile_id = auth.uid()
            and mm.ministerio_id = p.ministerio_id
        )
      )
  ) then
    insert into public.publicacion_lecturas(publicacion_id, profile_id)
    values (p_publicacion_id, auth.uid())
    on conflict (publicacion_id, profile_id) do nothing;
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.resolve_visible_calendar_item_at(p_fecha timestamp with time zone)
 RETURNS TABLE(item_type text, id uuid, fecha_inicio timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with me as (
    select p.id
    from public.profiles p
    where p.id = auth.uid()
      and p.activo = true
      and p.estado_cuenta = 'activo'
  ), visible_calendars as (
    select c.id
    from public.calendars c
    where c.es_publico = true
      and exists (select 1 from me)
    union
    select c.id
    from public.calendar_subscriptions s
    join public.calendars c on c.id = s.calendar_id
    where s.user_id = auth.uid()
      and s.visible = true
      and exists (select 1 from me)
  ), candidates as (
    select distinct
      'event'::text as item_type,
      e.id,
      e.fecha_inicio
    from public.evento_calendarios ec
    join visible_calendars vc on vc.id = ec.calendar_id
    join public.eventos e on e.id = ec.evento_id
    where vida_privado.puede_evento(e.id)
      and e.fecha_inicio between p_fecha - interval '1 minute' and p_fecha + interval '1 minute'

    union all

    select
      'reminder'::text,
      r.id,
      r.remind_at
    from public.calendar_reminders r
    join visible_calendars vc on vc.id = r.calendar_id
    where r.remind_at between p_fecha - interval '1 minute' and p_fecha + interval '1 minute'
  )
  select c.item_type, c.id, c.fecha_inicio
  from candidates c
  order by abs(extract(epoch from (c.fecha_inicio - p_fecha))) asc,
           case when c.item_type = 'event' then 0 else 1 end,
           c.id
  limit 1;
$function$;



-- Guardas restrictivas en filas hijas: no conceden permisos que no existían.
create policy vida_evento_sede on public.evento_asignaciones as restrictive for select to authenticated using (vida_privado.activa() and (profile_id=auth.uid() or vida_privado.puede_programacion(evento_id,ministerio_id)));
create policy vida_evento_sede on public.evento_asistencia_config as restrictive for select to authenticated using (vida_privado.puede_evento(evento_id));
create policy vida_evento_sede on public.evento_asistencias as restrictive for select to authenticated using (vida_privado.puede_evento(evento_id));
create policy vida_evento_sede on public.evento_calendarios as restrictive for select to authenticated using (vida_privado.puede_evento(evento_id));
create policy vida_evento_sede on public.evento_paletas as restrictive for select to authenticated using (vida_privado.puede_programacion(evento_id,ministerio_id));
create policy vida_evento_sede on public.evento_repertorio as restrictive for select to authenticated using (vida_privado.puede_programacion(evento_id,ministerio_id));
create policy vida_evento_sede on public.evento_repertorio_compartidos as restrictive for select to authenticated using (vida_privado.puede_programacion(evento_id,ministerio_origen_id) or vida_privado.puede_ministerio(ministerio_destino_id));
-- Operaciones nuevas: actor derivado de auth.uid; solo RPC invoker de entrada.
create function vida_privado.administracion() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not vida_privado.global() then raise exception 'Solo administración general' using errcode='42501'; end if;
 return jsonb_build_object(
 'ministerios',(select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'nombre',m.nombre,'sede',ms.sede_id) order by m.nombre),'[]'::jsonb) from public.ministerios m left join public.vida_ministerio_sedes ms on ms.ministerio_id=m.id where m.activo),
 'pastores',(select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'nombre',p.nombre_completo) order by p.nombre_completo),'[]'::jsonb) from public.profiles p where p.activo and p.estado_cuenta='activo' and p.rol::text='pastor'),
 'responsables',(select coalesce(jsonb_agg(jsonb_build_object('profile_id',r.profile_id,'sede_id',r.sede_id,'responsabilidad',r.responsabilidad)),'[]'::jsonb) from public.vida_sede_responsables r));
end;
$$;
create function vida_privado.clasificar(p_ministerio uuid,p_sede uuid,p_anterior uuid) returns void language plpgsql security definer set search_path='' as $$
declare actual uuid;
begin
 if not vida_privado.global() or not (select activa from vida_privado.config where id) then raise exception 'No autorizado' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_sede::text,0));
 perform 1 from public.ministerios where id=p_ministerio and activo for update;
 if not found then raise exception 'Ministerio no disponible'; end if;
 if not exists(select 1 from public.vida_sedes where id=p_sede and activa) then raise exception 'Sede no disponible'; end if;
 select sede_id into actual from public.vida_ministerio_sedes where ministerio_id=p_ministerio;
 if actual is distinct from p_anterior then raise exception 'La asignación cambió; vuelve a cargar'; end if;
 if exists(select 1 from public.ministerios m join public.vida_ministerio_sedes ms on ms.ministerio_id=m.id where m.id=(select ministerio_padre_id from public.ministerios where id=p_ministerio) and ms.sede_id<>p_sede)
 or exists(select 1 from public.ministerios m join public.vida_ministerio_sedes ms on ms.ministerio_id=m.id where m.ministerio_padre_id=p_ministerio and ms.sede_id<>p_sede) then raise exception 'Un ministerio y sus áreas deben conservar la misma sede'; end if;
 if exists(select 1 from public.vida_ministerio_sedes ms join public.ministerios m on m.id=ms.ministerio_id where ms.sede_id=p_sede and m.id<>p_ministerio and lower(trim(m.nombre))=(select lower(trim(nombre)) from public.ministerios where id=p_ministerio)) then raise exception 'Ya existe un ministerio con ese nombre en la sede'; end if;
 insert into public.vida_ministerio_sedes values(p_ministerio,p_sede) on conflict(ministerio_id) do update set sede_id=excluded.sede_id;
end;
$$;
create function vida_privado.crear_ministerio(p_sede uuid,p_nombre text,p_descripcion text) returns uuid language plpgsql security definer set search_path='' as $$
declare resultado uuid;
begin
 if not vida_privado.global() or not (select activa from vida_privado.config where id) then raise exception 'No autorizado' using errcode='42501'; end if;
 if length(trim(p_nombre)) not between 2 and 100 or length(coalesce(p_descripcion,''))>2000 then raise exception 'Revisa el nombre y descripción'; end if;
 if not exists(select 1 from public.vida_sedes where id=p_sede and activa) then raise exception 'Sede no disponible'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_sede::text,0));
 if exists(select 1 from public.vida_ministerio_sedes ms join public.ministerios m on m.id=ms.ministerio_id where ms.sede_id=p_sede and lower(trim(m.nombre))=lower(trim(p_nombre))) then raise exception 'Ya existe un ministerio con ese nombre en la sede'; end if;
 insert into public.ministerios(nombre,descripcion,emoji,color_primario,color_secundario,orden,activo) values(trim(p_nombre),trim(p_descripcion),'⛪','#C0392B','#8e2d23',99,true) returning id into resultado;
 insert into public.vida_ministerio_sedes values(resultado,p_sede);
 insert into public.calendars(nombre,color,owner_id,ministerio_id,es_publico) select trim(p_nombre)||' · '||s.nombre,'#C0392B',auth.uid(),resultado,false from public.vida_sedes s where s.id=p_sede;
 return resultado;
end;
$$;
create function vida_privado.responsable(p_profile uuid,p_sede uuid,p_activo boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if not vida_privado.global() or not (select activa from vida_privado.config where id) then raise exception 'No autorizado' using errcode='42501'; end if;
 if p_activo then
  if not exists(select 1 from public.profiles p where p.id=p_profile and p.activo and p.estado_cuenta='activo' and p.rol::text='pastor') then raise exception 'Selecciona una cuenta pastoral activa'; end if;
  if not exists(select 1 from public.vida_sedes where id=p_sede and activa) then raise exception 'Sede no disponible'; end if;
  insert into public.vida_sede_responsables values(p_profile,p_sede,'pastor') on conflict do nothing;
 else delete from public.vida_sede_responsables where profile_id=p_profile and sede_id=p_sede and responsabilidad='pastor'; end if;
end;
$$;
create function vida_privado.evento_del_ministerio(p_evento uuid,p_ministerio uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.eventos e where e.id=p_evento and (e.ministerio_id=p_ministerio or exists(select 1 from public.evento_calendarios ec join public.calendars c on c.id=ec.calendar_id where ec.evento_id=e.id and c.ministerio_id=p_ministerio)));
$$;
create function vida_privado.directorio_musicos(p_evento uuid,p_ministerio uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not vida_privado.puede_ministerio(p_ministerio,true) or not vida_privado.evento_del_ministerio(p_evento,p_ministerio) then raise exception 'No autorizado' using errcode='42501'; end if;
 return jsonb_build_object('personas',(
  select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'nombre',p.nombre_completo,'sedes',(
    select coalesce(jsonb_agg(distinct s.nombre),'[]'::jsonb) from public.ministerio_miembros mm join public.ministerios m on m.id=mm.ministerio_id and m.activo
    join public.vida_ministerio_sedes ms on ms.ministerio_id=m.id join public.vida_sedes s on s.id=ms.sede_id where mm.profile_id=p.id and lower(trim(m.nombre))='alabanza')) order by p.nombre_completo),'[]'::jsonb)
  from public.profiles p where p.activo and p.estado_cuenta='activo' and exists(select 1 from public.ministerio_miembros mm join public.ministerios m on m.id=mm.ministerio_id where mm.profile_id=p.id and m.activo and lower(trim(m.nombre))='alabanza')),
 'invitados',(select coalesce(jsonb_agg(jsonb_build_object('id',i.profile_id,'nombre',p.nombre_completo)),'[]'::jsonb) from public.vida_evento_invitados i join public.profiles p on p.id=i.profile_id where i.evento_id=p_evento and i.ministerio_id=p_ministerio and i.activo));
end;
$$;
create function vida_privado.invitar(p_evento uuid,p_ministerio uuid,p_profile uuid,p_activo boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if not (select activa from vida_privado.config where id) or not vida_privado.puede_ministerio(p_ministerio,true) or not vida_privado.evento_del_ministerio(p_evento,p_ministerio) then raise exception 'No autorizado' using errcode='42501'; end if;
 if p_activo then
  if not exists(select 1 from public.profiles p join public.ministerio_miembros mm on mm.profile_id=p.id join public.ministerios m on m.id=mm.ministerio_id where p.id=p_profile and p.activo and p.estado_cuenta='activo' and m.activo and lower(trim(m.nombre))='alabanza') then raise exception 'La persona ya no está disponible en Alabanza'; end if;
  insert into public.vida_evento_invitados(evento_id,ministerio_id,profile_id,invitado_por) values(p_evento,p_ministerio,p_profile,auth.uid())
  on conflict(evento_id,ministerio_id,profile_id) do update set activo=true,invitado_por=auth.uid();
 else update public.vida_evento_invitados set activo=false where evento_id=p_evento and ministerio_id=p_ministerio and profile_id=p_profile; end if;
end;
$$;
create function vida_privado.servicio_invitado(p_evento uuid,p_ministerio uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not vida_privado.activa() or not vida_privado.evento_del_ministerio(p_evento,p_ministerio) or not (vida_privado.global() or exists(select 1 from public.ministerio_miembros mm where mm.profile_id=auth.uid() and mm.ministerio_id=p_ministerio) or exists(select 1 from public.vida_ministerio_sedes ms join public.vida_sede_responsables r on r.sede_id=ms.sede_id where ms.ministerio_id=p_ministerio and r.profile_id=auth.uid() and exists(select 1 from public.profiles rp where rp.id=r.profile_id and rp.activo and rp.estado_cuenta='activo' and rp.rol::text=r.responsabilidad)) or exists(select 1 from public.vida_evento_invitados i where i.evento_id=p_evento and i.ministerio_id=p_ministerio and i.profile_id=auth.uid() and i.activo)) then raise exception 'No autorizado' using errcode='42501'; end if;
 return jsonb_build_object('evento',(select jsonb_build_object('id',e.id,'titulo',e.titulo,'fecha',e.fecha_inicio,'ubicacion',e.ubicacion) from public.eventos e where e.id=p_evento),
 'canciones',(select coalesce(jsonb_agg(jsonb_build_object('rowId',r.id,'songId',r.cancion_id,'title',r.titulo,'artist',c.artista,'serviceTone',coalesce(r.tonalidad,''),'baseTone',coalesce(c.tonalidad_base,r.tonalidad,''),'chords',coalesce(c.acordes,''),'lyrics',coalesce(c.letra,''),'permanentNotes',coalesce(c.notas_permanentes,''),'notes',coalesce(r.notas,'')) order by r.orden,r.id),'[]'::jsonb)
 from public.evento_repertorio r left join public.ministerio_canciones c on c.id=r.cancion_id and c.ministerio_id=r.ministerio_id where r.evento_id=p_evento and r.ministerio_id=p_ministerio));
end;
$$;
create function public.vida_sedes_administracion() returns jsonb language sql stable security invoker set search_path='' as $$select vida_privado.administracion();$$;
create function public.vida_clasificar_ministerio(p_ministerio uuid,p_sede uuid,p_anterior uuid default null) returns void language sql security invoker set search_path='' as $$select vida_privado.clasificar(p_ministerio,p_sede,p_anterior);$$;
create function public.vida_crear_ministerio_sede(p_sede uuid,p_nombre text,p_descripcion text) returns uuid language sql security invoker set search_path='' as $$select vida_privado.crear_ministerio(p_sede,p_nombre,p_descripcion);$$;
create function public.vida_asignar_pastor_sede(p_profile uuid,p_sede uuid,p_activo boolean) returns void language sql security invoker set search_path='' as $$select vida_privado.responsable(p_profile,p_sede,p_activo);$$;
create function public.vida_directorio_musicos(p_evento uuid,p_ministerio uuid) returns jsonb language sql stable security invoker set search_path='' as $$select vida_privado.directorio_musicos(p_evento,p_ministerio);$$;
create function public.vida_invitar_musico(p_evento uuid,p_ministerio uuid,p_profile uuid,p_activo boolean) returns void language sql security invoker set search_path='' as $$select vida_privado.invitar(p_evento,p_ministerio,p_profile,p_activo);$$;
create function public.vida_servicio_invitado(p_evento uuid,p_ministerio uuid) returns jsonb language sql stable security invoker set search_path='' as $$select vida_privado.servicio_invitado(p_evento,p_ministerio);$$;
revoke all on function vida_privado.administracion(),vida_privado.clasificar(uuid,uuid,uuid),vida_privado.crear_ministerio(uuid,text,text),vida_privado.responsable(uuid,uuid,boolean),vida_privado.evento_del_ministerio(uuid,uuid),vida_privado.directorio_musicos(uuid,uuid),vida_privado.invitar(uuid,uuid,uuid,boolean),vida_privado.servicio_invitado(uuid,uuid) from public,anon,authenticated;
grant execute on function vida_privado.administracion(),vida_privado.clasificar(uuid,uuid,uuid),vida_privado.crear_ministerio(uuid,text,text),vida_privado.responsable(uuid,uuid,boolean),vida_privado.directorio_musicos(uuid,uuid),vida_privado.invitar(uuid,uuid,uuid,boolean),vida_privado.servicio_invitado(uuid,uuid) to authenticated;
revoke all on function public.vida_sedes_administracion(),public.vida_clasificar_ministerio(uuid,uuid,uuid),public.vida_crear_ministerio_sede(uuid,text,text),public.vida_asignar_pastor_sede(uuid,uuid,boolean),public.vida_directorio_musicos(uuid,uuid),public.vida_invitar_musico(uuid,uuid,uuid,boolean),public.vida_servicio_invitado(uuid,uuid) from public,anon;
grant execute on function public.vida_sedes_administracion(),public.vida_clasificar_ministerio(uuid,uuid,uuid),public.vida_crear_ministerio_sede(uuid,text,text),public.vida_asignar_pastor_sede(uuid,uuid,boolean),public.vida_directorio_musicos(uuid,uuid),public.vida_invitar_musico(uuid,uuid,uuid,boolean),public.vida_servicio_invitado(uuid,uuid) to authenticated;

create function vida_privado.mensajes_legado(p_tope integer) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not vida_privado.activa() then raise exception 'No autorizado' using errcode='42501'; end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'profile_id',x.profile_id,'titulo',x.titulo,'descripcion_publica',x.descripcion_publica,'instrucciones',x.instrucciones,'publicado',true,'published_at',x.published_at,'updated_at',x.updated_at,'audiencia',x.audiencia,'bosquejo_id',null,'coleccion_id',null,'recurso_ids','[]'::jsonb,'vida_audiencia',x.vida_audiencia,'autor',x.autor) order by x.published_at desc,x.id),'[]'::jsonb)
 from (select p.id,p.profile_id,p.titulo,p.descripcion_publica,p.instrucciones,p.published_at,p.updated_at,p.audiencia,p.vida_audiencia,pr.nombre_completo autor
 from public.pastoral_paquetes p join public.profiles pr on pr.id=p.profile_id
 where p.publicado and p.audiencia='iglesia' and p.bosquejo_id is null and p.coleccion_id is null and p.recurso_ids='{}' and p.instrucciones like 'https://www.youtube.com/watch?v=%'
 and vida_privado.audiencia_visible(p.vida_audiencia) and vida_privado.audiencia_inicio(p.vida_audiencia)
 order by p.published_at desc,p.id limit least(greatest(coalesce(p_tope,13),1),1201)) x);
end;
$$;
create function public.vida_mensajes_legado_visibles(p_tope integer default 13) returns jsonb language sql stable security invoker set search_path='' as $$select vida_privado.mensajes_legado(p_tope);$$;
revoke all on function vida_privado.mensajes_legado(integer) from public,anon,authenticated;
grant execute on function vida_privado.mensajes_legado(integer) to authenticated;
revoke all on function public.vida_mensajes_legado_visibles(integer) from public,anon;
grant execute on function public.vida_mensajes_legado_visibles(integer) to authenticated;
create function vida_privado.aviso_invitado(p_evento uuid,p_ministerio uuid,p_profile uuid) returns boolean language sql stable security definer set search_path='' as $$
 select vida_privado.puede_ministerio(p_ministerio,true) and exists(select 1 from public.vida_evento_invitados i join public.profiles p on p.id=i.profile_id where i.evento_id=p_evento and i.ministerio_id=p_ministerio and i.profile_id=p_profile and i.activo and p.activo and p.estado_cuenta='activo')
 and not exists(select 1 from public.notificaciones_preferencias n where n.profile_id=p_profile and not n.activo and (n.ministerio_id is null or n.ministerio_id=p_ministerio));
$$;
create function public.vida_invitar_aviso_permitido(p_evento uuid,p_ministerio uuid,p_profile uuid) returns boolean language sql stable security invoker set search_path='' as $$select vida_privado.aviso_invitado(p_evento,p_ministerio,p_profile);$$;
create function vida_privado.asignar_invitado(p_evento uuid,p_ministerio uuid,p_profile uuid,p_capacidad uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if not (select activa from vida_privado.config where id) or not vida_privado.puede_ministerio(p_ministerio,true) or not vida_privado.evento_del_ministerio(p_evento,p_ministerio) then raise exception 'No autorizado' using errcode='42501'; end if;
 perform 1 from public.vida_evento_invitados where evento_id=p_evento and ministerio_id=p_ministerio and profile_id=p_profile and activo for update;
 if not found then return false; end if;
 if not exists(select 1 from public.profiles where id=p_profile and activo and estado_cuenta='activo') or not exists(select 1 from public.ministerio_capacidades where id=p_capacidad and ministerio_id=p_ministerio and activo) then raise exception 'La persona o función ya no está disponible'; end if;
 insert into public.evento_asignaciones(evento_id,ministerio_id,profile_id,capacidad_id,asignado_por,estado) values(p_evento,p_ministerio,p_profile,p_capacidad,auth.uid(),'asignado') on conflict do nothing;
 return true;
end;
$$;
create function public.vida_asignar_invitado(p_evento uuid,p_ministerio uuid,p_profile uuid,p_capacidad uuid) returns boolean language sql security invoker set search_path='' as $$select vida_privado.asignar_invitado(p_evento,p_ministerio,p_profile,p_capacidad);$$;
revoke all on function vida_privado.aviso_invitado(uuid,uuid,uuid),vida_privado.asignar_invitado(uuid,uuid,uuid,uuid),public.vida_invitar_aviso_permitido(uuid,uuid,uuid),public.vida_asignar_invitado(uuid,uuid,uuid,uuid) from public,anon;
grant execute on function vida_privado.aviso_invitado(uuid,uuid,uuid),vida_privado.asignar_invitado(uuid,uuid,uuid,uuid),public.vida_invitar_aviso_permitido(uuid,uuid,uuid),public.vida_asignar_invitado(uuid,uuid,uuid,uuid) to authenticated;
-- Registro: solo nombres/identificadores de sedes activas, nunca personas ni permisos.
grant select(id,nombre,slug,activa) on public.vida_sedes to anon;
create policy vida_sedes_registro on public.vida_sedes for select to anon using (activa);
create function public.vida_catalogo_registro() returns table(id uuid,nombre text,slug text) language sql stable security invoker set search_path='' as $$select s.id,s.nombre,s.slug from public.vida_sedes s where s.activa order by s.nombre;$$;
revoke all on function public.vida_catalogo_registro() from public;
grant execute on function public.vida_catalogo_registro() to anon,authenticated;
create function public.vida_aplicar_registro_sedes(p_seleccion uuid[]) returns void language plpgsql security invoker set search_path='' as $$
declare definida boolean;
begin
 if not public.vida_sedes_cuenta_activa() then raise exception 'No autorizado' using errcode='42501'; end if;
 insert into public.vida_sede_preferencias(profile_id) values(auth.uid()) on conflict do nothing;
 select congregacion_definida into definida from public.vida_sede_preferencias where profile_id=auth.uid() for update;
 if not definida then perform public.vida_guardar_mis_sedes(p_seleccion,null); end if;
end;
$$;
revoke all on function public.vida_aplicar_registro_sedes(uuid[]) from public,anon;
grant execute on function public.vida_aplicar_registro_sedes(uuid[]) to authenticated;
create function vida_privado.ministerios_accesibles() returns table(id uuid) language sql stable security definer set search_path='' as $$
 select m.id from public.ministerios m where m.activo and vida_privado.activa() and (vida_privado.global() or exists(select 1 from public.ministerio_miembros mm where mm.ministerio_id=m.id and mm.profile_id=auth.uid())
 or exists(select 1 from public.vida_ministerio_sedes ms join public.vida_sede_responsables r on r.sede_id=ms.sede_id join public.profiles rp on rp.id=r.profile_id and rp.activo and rp.estado_cuenta='activo' and rp.rol::text=r.responsabilidad where ms.ministerio_id=m.id and r.profile_id=auth.uid()));
$$;
create function public.vida_ministerios_accesibles() returns table(id uuid) language sql stable security invoker set search_path='' as $$select * from vida_privado.ministerios_accesibles();$$;
revoke all on function vida_privado.ministerios_accesibles(),public.vida_ministerios_accesibles() from public,anon;
grant execute on function vida_privado.ministerios_accesibles(),public.vida_ministerios_accesibles() to authenticated;

-- Ubicaciones de templos, no seguimiento de ubicación personal.
alter table public.vida_sedes add column ubicacion jsonb;
alter table public.evento_asistencia_config add column sede_id uuid references public.vida_sedes(id);
create function vida_privado.gestiona_sede(p_sede uuid) returns boolean language sql stable security definer set search_path='' as $$
 select vida_privado.activa() and (vida_privado.global() or exists(select 1 from public.vida_sede_responsables r join public.profiles p on p.id=r.profile_id and p.activo and p.estado_cuenta='activo' and p.rol::text=r.responsabilidad where r.profile_id=auth.uid() and r.sede_id=p_sede));
$$;
create function vida_privado.gestiona_evento(p_evento uuid) returns boolean language sql stable security definer set search_path='' as $$
 select vida_privado.activa() and (vida_privado.global() or exists(select 1 from public.eventos e join public.calendars c on c.id=e.calendar_id where e.id=p_evento and (
 exists(select 1 from public.vida_ministerio_sedes ms where ms.ministerio_id=coalesce(e.ministerio_id,c.ministerio_id) and vida_privado.gestiona_sede(ms.sede_id))
 or (coalesce(e.ministerio_id,c.ministerio_id) is not null and vida_privado.puede_ministerio(coalesce(e.ministerio_id,c.ministerio_id),true))
 or (not (select exigir_sedes_legacy from vida_privado.config where id) and not exists(select 1 from public.vida_ministerio_sedes ms where ms.ministerio_id=coalesce(e.ministerio_id,c.ministerio_id)) and exists(select 1 from public.profiles p where p.id=auth.uid() and p.rol::text='pastor')))));
$$;
create function vida_privado.puede_ver_persona(p_profile uuid) returns boolean language sql stable security definer set search_path='' as $$
 select vida_privado.activa() and (p_profile=auth.uid() or vida_privado.global() or exists(select 1 from public.evento_asistencias ea where ea.profile_id=p_profile and vida_privado.gestiona_evento(ea.evento_id)) or exists(select 1 from public.ministerio_miembros mm join public.vida_ministerio_sedes ms on ms.ministerio_id=mm.ministerio_id where mm.profile_id=p_profile and (vida_privado.gestiona_sede(ms.sede_id) or vida_privado.puede_ministerio(mm.ministerio_id,true))));
$$;
create function vida_privado.tarea_interna() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is null and ((auth.jwt()->>'role')='service_role' or (session_user in ('postgres','supabase_admin') and coalesce(auth.jwt()->>'role','')=''));
$$;
create function vida_privado.ubicacion_evento(p_evento uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_sede uuid; u jsonb; central boolean;
begin
 select coalesce(cfg.sede_id,ms.sede_id) into v_sede from public.eventos e join public.calendars c on c.id=e.calendar_id left join public.vida_ministerio_sedes ms on ms.ministerio_id=coalesce(e.ministerio_id,c.ministerio_id) left join public.evento_asistencia_config cfg on cfg.evento_id=e.id where e.id=p_evento;
 if v_sede is not null then
  select s.ubicacion,s.central into u,central from public.vida_sedes s where s.id=v_sede and s.activa;
  if u is not null then return u; end if;
  if not coalesce(central,false) then return null; end if; -- Chalchuapa nunca usa Santa Ana por defecto.
 end if;
 return (select valor from public.app_settings where clave='ubicacion_principal_iglesia');
end;
$$;
create function vida_privado.guardar_ubicacion(p_sede uuid,p_latitud double precision,p_longitud double precision,p_radio integer,p_anterior jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
 if not vida_privado.gestiona_sede(p_sede) or not (select activa from vida_privado.config where id) then raise exception 'No autorizado' using errcode='42501'; end if;
 if p_latitud is null or p_longitud is null or p_radio is null or p_latitud not between -90 and 90 or p_longitud not between -180 and 180 or p_radio not between 25 and 1000 then raise exception 'Revisa las coordenadas y el radio'; end if;
 update public.vida_sedes set ubicacion=jsonb_build_object('latitud',p_latitud,'longitud',p_longitud,'radio_metros',p_radio) where id=p_sede and activa and ubicacion is not distinct from p_anterior;
 if not found then raise exception 'La ubicación cambió o la sede no está disponible. Vuelve a cargar'; end if;
end;
$$;
create function vida_privado.ubicacion_servicio(p_evento uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not vida_privado.puede_evento(p_evento) then raise exception 'No autorizado' using errcode='42501'; end if;
 return jsonb_build_object('sede_id',(select sede_id from public.evento_asistencia_config where evento_id=p_evento),'puede_configurar',public.puede_gestionar_asistencia() and vida_privado.gestiona_evento(p_evento));
end;
$$;
create function vida_privado.fijar_sede_evento(p_evento uuid,p_sede uuid) returns void language plpgsql security definer set search_path='' as $$
declare u jsonb; cfg public.evento_asistencia_config%rowtype;
begin
 if not (select activa from vida_privado.config where id) or not vida_privado.gestiona_evento(p_evento) or not public.puede_gestionar_asistencia() then raise exception 'No autorizado' using errcode='42501'; end if;
 select ubicacion into u from public.vida_sedes where id=p_sede and activa;
 if u is null and exists(select 1 from public.vida_sedes where id=p_sede and central and activa) then select valor into u from public.app_settings where clave='ubicacion_principal_iglesia'; end if;
 if u is null then raise exception 'Configura primero la ubicación del templo de esa sede o usa una ubicación específica del evento'; end if;
 select * into cfg from public.evento_asistencia_config where evento_id=p_evento;
 perform public.asistencia_configurar_evento(p_evento,(u->>'latitud')::double precision,(u->>'longitud')::double precision,coalesce(cfg.radio_metros,(u->>'radio_metros')::integer,150),coalesce(cfg.minutos_antes,30),coalesce(cfg.minutos_despues,90));
 update public.evento_asistencia_config set sede_id=p_sede,ubicacion_tipo='principal' where evento_id=p_evento;
end;
$$;
create function public.vida_guardar_ubicacion_sede(p_sede uuid,p_latitud double precision,p_longitud double precision,p_radio integer,p_anterior jsonb default null) returns void language sql security invoker set search_path='' as $$select vida_privado.guardar_ubicacion(p_sede,p_latitud,p_longitud,p_radio,p_anterior);$$;
create function public.vida_ubicacion_servicio(p_evento uuid) returns jsonb language sql stable security invoker set search_path='' as $$select vida_privado.ubicacion_servicio(p_evento);$$;
create function public.vida_fijar_sede_evento(p_evento uuid,p_sede uuid) returns void language sql security invoker set search_path='' as $$select vida_privado.fijar_sede_evento(p_evento,p_sede);$$;
revoke all on function vida_privado.gestiona_sede(uuid),vida_privado.gestiona_evento(uuid),vida_privado.puede_ver_persona(uuid),vida_privado.tarea_interna(),vida_privado.ubicacion_evento(uuid),vida_privado.guardar_ubicacion(uuid,double precision,double precision,integer,jsonb),vida_privado.ubicacion_servicio(uuid),vida_privado.fijar_sede_evento(uuid,uuid) from public,anon,authenticated;
grant execute on function vida_privado.guardar_ubicacion(uuid,double precision,double precision,integer,jsonb),vida_privado.ubicacion_servicio(uuid),vida_privado.fijar_sede_evento(uuid,uuid) to authenticated;
revoke all on function public.vida_guardar_ubicacion_sede(uuid,double precision,double precision,integer,jsonb),public.vida_ubicacion_servicio(uuid),public.vida_fijar_sede_evento(uuid,uuid) from public,anon;
grant execute on function public.vida_guardar_ubicacion_sede(uuid,double precision,double precision,integer,jsonb),public.vida_ubicacion_servicio(uuid),public.vida_fijar_sede_evento(uuid,uuid) to authenticated;
create function vida_privado.persona_esperada(p_evento uuid,p_profile uuid) returns boolean language plpgsql stable security definer set search_path='' as $$
declare publico boolean; ministerios uuid[]; sedes uuid[];
begin
 if not exists(select 1 from public.profiles p where p.id=p_profile and p.activo and p.estado_cuenta='activo') then return false; end if;
 if exists(select 1 from public.evento_asignaciones a where a.evento_id=p_evento and a.profile_id=p_profile) or exists(select 1 from public.vida_evento_invitados i where i.evento_id=p_evento and i.profile_id=p_profile and i.activo) then return true; end if;
 select coalesce(bool_or(c.es_publico),false),coalesce(array_agg(distinct c.ministerio_id) filter(where c.ministerio_id is not null),'{}'::uuid[]) into publico,ministerios from public.calendars c where c.id in (select calendar_id from public.eventos where id=p_evento union select calendar_id from public.evento_calendarios where evento_id=p_evento);
 ministerios:=ministerios||coalesce((select array[ministerio_id] from public.eventos where id=p_evento and ministerio_id is not null),'{}'::uuid[]);
 select coalesce(array_agg(distinct ms.sede_id),'{}'::uuid[]) into sedes from public.vida_ministerio_sedes ms where ms.ministerio_id=any(ministerios);
 if publico then
  if cardinality(sedes)=0 then return public.asistencia_evento_visible_para(p_evento,p_profile); end if;
  return exists(select 1 from public.vida_sede_selecciones x where x.profile_id=p_profile and x.pertenece and x.sede_id=any(sedes));
 end if;
 if cardinality(ministerios)>0 then return exists(select 1 from public.ministerio_miembros mm where mm.profile_id=p_profile and mm.ministerio_id=any(ministerios)); end if;
 return public.asistencia_evento_visible_para(p_evento,p_profile);
end;
$$;
revoke all on function vida_privado.persona_esperada(uuid,uuid) from public,anon,authenticated;
create policy vida_config_insert_sede on public.evento_asistencia_config as restrictive for insert to authenticated with check (vida_privado.gestiona_evento(evento_id) and configurado_por=auth.uid());
create policy vida_config_update_sede on public.evento_asistencia_config as restrictive for update to authenticated using (vida_privado.gestiona_evento(evento_id)) with check (vida_privado.gestiona_evento(evento_id) and configurado_por=auth.uid());
create policy vida_config_delete_sede on public.evento_asistencia_config as restrictive for delete to authenticated using (vida_privado.gestiona_evento(evento_id));
grant execute on function vida_privado.gestiona_evento(uuid) to authenticated;

CREATE OR REPLACE FUNCTION public.asistencia_configurar_evento(p_evento_id uuid, p_latitud double precision, p_longitud double precision, p_radio_metros integer DEFAULT 150, p_minutos_antes integer DEFAULT 30, p_minutos_despues integer DEFAULT 90)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.puede_gestionar_asistencia() or not vida_privado.gestiona_evento(p_evento_id) then raise exception 'Sin permiso'; end if;
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
    ubicacion_tipo = 'especifica', sede_id = null;
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
  if not public.puede_gestionar_asistencia() or not vida_privado.gestiona_evento(p_evento_id) then raise exception 'Sin permiso'; end if;
  if not exists (select 1 from public.eventos e where e.id = p_evento_id) then
    raise exception 'Evento no disponible';
  end if;

  select vida_privado.ubicacion_evento(p_evento_id) into v_valor;

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
  if not vida_privado.activa() then raise exception 'Cuenta inactiva'; end if;
  if not vida_privado.puede_evento(p_evento_id) then raise exception 'Evento no disponible'; end if;
  if not public.asistencia_evento_visible_para(p_evento_id, auth.uid()) and not exists(select 1 from public.vida_evento_invitados i where i.evento_id=p_evento_id and i.profile_id=auth.uid() and i.activo) then raise exception 'Evento no disponible'; end if;
  if p_latitud not between -90 and 90 or p_longitud not between -180 and 180 then raise exception 'Ubicación inválida'; end if;
  if p_precision_m is not null and (p_precision_m < 0 or p_precision_m > 200) then
    raise exception 'La ubicación todavía no tiene suficiente precisión. Intenta nuevamente.';
  end if;

  select * into v_cfg
  from public.evento_asistencia_config
  where evento_id = p_evento_id and activo = true;
  if v_cfg.evento_id is null then raise exception 'Este evento no tiene confirmación de asistencia activa'; end if;

  if v_cfg.ubicacion_tipo = 'principal' then
    select vida_privado.ubicacion_evento(p_evento_id) into v_valor;
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
      and (p_profile_id=auth.uid() or vida_privado.global() or vida_privado.gestiona_evento(e.id) or vida_privado.tarea_interna())
      and e.fecha_inicio <= now()
      and (public.asistencia_persona_esperada(e.id, p_profile_id) or a.evento_id is not null)
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
  if not vida_privado.activa() then raise exception 'Cuenta inactiva'; end if;
  if not vida_privado.puede_evento(p_evento_id) then raise exception 'Evento no disponible'; end if;
  v_gestiona := public.puede_gestionar_asistencia() and vida_privado.gestiona_evento(p_evento_id);

  if not v_gestiona and not public.asistencia_evento_visible_para(p_evento_id, auth.uid()) and not exists(select 1 from public.vida_evento_invitados i where i.evento_id=p_evento_id and i.profile_id=auth.uid() and i.activo) then
    raise exception 'Evento no disponible';
  end if;

  select * into v_cfg from public.evento_asistencia_config where evento_id = p_evento_id;
  select e.fecha_inicio, e.fecha_fin into v_inicio, v_fin from public.eventos e where e.id = p_evento_id;
  if v_inicio is null then raise exception 'Evento no disponible'; end if;

  select vida_privado.ubicacion_evento(p_evento_id) into v_principal;

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
  if not vida_privado.activa() then raise exception 'Cuenta inactiva'; end if;
  if not vida_privado.puede_ver_persona(p_profile_id) then raise exception 'Sin permiso'; end if;

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
      and (p_profile_id=auth.uid() or vida_privado.global() or vida_privado.gestiona_evento(e.id) or vida_privado.tarea_interna())
    and e.fecha_inicio <= now()
    and (public.asistencia_persona_esperada(e.id, p_profile_id) or a.evento_id is not null)
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
  select vida_privado.activa() and exists (
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
    (public.es_admin_o_pastor() and exists(select 1 from public.evento_asignaciones origin where origin.id=p_asignacion_origen_id and vida_privado.gestiona_evento(origin.evento_id)))
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
  if not public.puede_gestionar_asistencia() or not vida_privado.gestiona_evento(p_evento_id) then raise exception 'Sin permiso'; end if;
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
  if not public.puede_gestionar_asistencia() or not vida_privado.gestiona_evento(p_evento_id) then raise exception 'Sin permiso'; end if;
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

CREATE OR REPLACE FUNCTION public.asistencia_persona_esperada(p_evento_id uuid, p_profile_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 select (vida_privado.tarea_interna() or p_profile_id=auth.uid() or vida_privado.puede_ver_persona(p_profile_id) or vida_privado.gestiona_evento(p_evento_id)) and vida_privado.persona_esperada(p_evento_id,p_profile_id);
$function$;

CREATE OR REPLACE FUNCTION public.asistencia_resumen_evento(p_evento_id uuid)
 RETURNS TABLE(profile_id uuid, nombre_completo text, avatar_url text, estado text, confirmado_en timestamp with time zone, metodo text, consecutivos_sin_confirmar integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.puede_gestionar_asistencia() or not vida_privado.gestiona_evento(p_evento_id) then raise exception 'Sin permiso'; end if;
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
    and (public.asistencia_persona_esperada(p_evento_id, p.id) or a.evento_id is not null)
  order by
    case coalesce(a.estado, 'sin_confirmacion') when 'sin_confirmacion' then 0 when 'justificado' then 1 else 2 end,
    p.nombre_completo;
end;
$function$;

notify pgrst, 'reload schema';
commit;
