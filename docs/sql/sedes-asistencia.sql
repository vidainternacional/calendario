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
