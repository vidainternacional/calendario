-- Autorizado por el usuario el 18-11-2026: guardado del orden. No reordena datos al crearla.
-- Solo callable por service_role desde la action que comprueba sesión, rol y evento.
begin;
create function public.vida_reordenar_repertorio(p_ministerio uuid, p_evento uuid, p_esperado uuid[], p_nuevo uuid[])
returns void language plpgsql security invoker set search_path=pg_catalog,public as $$
declare actual uuid[];
begin
 if p_esperado is null or p_nuevo is null or cardinality(p_esperado) not between 1 and 300 or cardinality(p_nuevo) <> cardinality(p_esperado) or array_position(p_nuevo,null) is not null or array_position(p_esperado,null) is not null then
  raise exception 'Listado inválido' using errcode='22023';
 end if;
 perform 1 from public.evento_repertorio where ministerio_id=p_ministerio and evento_id=p_evento for update;
 select coalesce(array_agg(id order by orden,created_at,id),'{}'::uuid[]) into actual from public.evento_repertorio where ministerio_id=p_ministerio and evento_id=p_evento;
 if actual is distinct from p_esperado then raise exception 'Listado modificado por otra persona' using errcode='40001'; end if;
 if (select count(distinct v) from unnest(p_nuevo) v) <> cardinality(actual) or (select array_agg(v order by v) from unnest(p_nuevo) v) is distinct from (select array_agg(v order by v) from unnest(actual) v) then
  raise exception 'Las canciones no coinciden' using errcode='22023';
 end if;
 update public.evento_repertorio set orden=array_position(p_nuevo,id)-1 where ministerio_id=p_ministerio and evento_id=p_evento and id=any(p_nuevo);
end;
$$;
revoke all on function public.vida_reordenar_repertorio(uuid,uuid,uuid[],uuid[]) from public,anon,authenticated;
grant execute on function public.vida_reordenar_repertorio(uuid,uuid,uuid[],uuid[]) to service_role;
commit;
-- Reversión: drop function public.vida_reordenar_repertorio(uuid,uuid,uuid[],uuid[]);
-- No borra filas ni cambia letras, acordes, notas o permisos RLS.
