-- Devocionales segmentados: almacenamiento aislado de los paquetes pastorales históricos.
-- Toda lectura y escritura se limita por RLS; no se modifica ninguna política existente.
create table if not exists public.vida_devocionales (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references public.profiles(id) on delete cascade,
  titulo text not null check (char_length(btrim(titulo)) between 1 and 140),
  descripcion text not null default '' check (char_length(descripcion) <= 2000),
  video_url text not null check (video_url ~ '^https://www[.]youtube[.]com/watch[?]v=[A-Za-z0-9_-]{11}$'),
  tipo text not null default 'mensaje' check (tipo in ('mensaje','devocional')),
  publicado boolean not null default false,
  audiencia_iglesia boolean not null default false,
  roles_destino text[] not null default '{}'::text[],
  ministerios_destino uuid[] not null default '{}'::uuid[],
  lideres_ministerio boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint vida_devocionales_roles_validos check (
    roles_destino <@ array['pastor','administrador','lider','servidor']::text[]
    and cardinality(roles_destino) <= 4
  ),
  constraint vida_devocionales_ministerios_limite check (cardinality(ministerios_destino) <= 40),
  constraint vida_devocionales_sin_publicacion_vacia check (
    not publicado or audiencia_iglesia
    or cardinality(roles_destino) > 0
    or cardinality(ministerios_destino) > 0
    or lideres_ministerio
  ),
  constraint vida_devocionales_fecha_publicacion check (not publicado or published_at is not null)
);
create index if not exists vida_devocionales_autor_fecha_idx on public.vida_devocionales(autor_id, updated_at desc);
create index if not exists vida_devocionales_publicados_fecha_idx on public.vida_devocionales(published_at desc) where publicado = true;
alter table public.vida_devocionales enable row level security;
revoke all on public.vida_devocionales from anon;
grant select, insert, update on public.vida_devocionales to authenticated;

-- Miembros activos reciben únicamente publicaciones cuya audiencia los incluye.
-- Los borradores solo son legibles por su autor activo pastor/administrador.
drop policy if exists vida_devocionales_leer on public.vida_devocionales;
create policy vida_devocionales_leer on public.vida_devocionales
  for select to authenticated using (
    exists (
      select 1 from public.profiles yo
      where yo.id = (select auth.uid())
        and yo.activo is true and yo.estado_cuenta = 'activo'
    )
    and (
      (
        autor_id = (select auth.uid())
        and exists (
          select 1 from public.profiles autor
          where autor.id = (select auth.uid())
            and autor.rol::text = any(array['pastor','administrador']::text[])
        )
      )
      or (
        publicado
        and (
          audiencia_iglesia
          or exists (
            select 1 from public.profiles lector
            where lector.id = (select auth.uid())
              and lector.rol::text = any(roles_destino)
          )
          or exists (
            select 1 from public.ministerio_miembros mm
            join public.ministerios m on m.id = mm.ministerio_id and m.activo is true
            where mm.profile_id = (select auth.uid())
              and (
                mm.ministerio_id = any(ministerios_destino)
                or (lideres_ministerio and mm.es_lider is true)
              )
          )
        )
      )
    )
  );

drop policy if exists vida_devocionales_crear on public.vida_devocionales;
create policy vida_devocionales_crear on public.vida_devocionales
  for insert to authenticated with check (
    autor_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.activo is true and p.estado_cuenta = 'activo'
        and p.rol::text = any(array['pastor','administrador']::text[])
    )
  );

drop policy if exists vida_devocionales_editar on public.vida_devocionales;
create policy vida_devocionales_editar on public.vida_devocionales
  for update to authenticated
  using (
    autor_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.activo is true and p.estado_cuenta = 'activo'
        and p.rol::text = any(array['pastor','administrador']::text[])
    )
  )
  with check (
    autor_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.activo is true and p.estado_cuenta = 'activo'
        and p.rol::text = any(array['pastor','administrador']::text[])
    )
  );
-- No se concede DELETE: el contenido existente se preserva.
