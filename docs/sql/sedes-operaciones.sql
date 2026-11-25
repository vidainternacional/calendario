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
