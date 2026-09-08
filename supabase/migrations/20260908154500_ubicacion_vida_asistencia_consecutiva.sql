create or replace function public.asistencia_consecutivos_sin_confirmar(p_profile_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
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
      and e.fecha_inicio <= now()
      and public.asistencia_persona_esperada(e.id, p_profile_id)
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
$$;

revoke execute on function public.asistencia_consecutivos_sin_confirmar(uuid) from public, anon, authenticated;

drop function public.asistencia_resumen_evento(uuid);

create function public.asistencia_resumen_evento(p_evento_id uuid)
returns table (
  profile_id uuid,
  nombre_completo text,
  avatar_url text,
  estado text,
  confirmado_en timestamptz,
  metodo text,
  consecutivos_sin_confirmar integer
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
    public.asistencia_consecutivos_sin_confirmar(p.id)
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

revoke execute on function public.asistencia_resumen_evento(uuid) from public, anon;
grant execute on function public.asistencia_resumen_evento(uuid) to authenticated;
