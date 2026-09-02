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
