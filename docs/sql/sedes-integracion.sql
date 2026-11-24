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
commit;
