create or replace function public.get_received_pastoral_packages()
returns table(
  id uuid,
  titulo text,
  descripcion_publica text,
  audiencia text,
  published_at timestamptz,
  public_slug uuid,
  destacado boolean
)
language sql
security definer
set search_path = public
as $$
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
$$;

revoke execute on function public.get_received_pastoral_packages() from public, anon;
grant execute on function public.get_received_pastoral_packages() to authenticated;
