CREATE OR REPLACE FUNCTION public.get_internal_pastoral_package(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
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
 LANGUAGE plpgsql
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
    and (
      pr.rol::text in ('pastor', 'administrador')
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
    and (
      pr.rol::text in ('pastor', 'administrador')
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
      and (
        pr.rol::text in ('pastor', 'administrador')
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
    where e.fecha_inicio between p_fecha - interval '1 minute' and p_fecha + interval '1 minute'

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
