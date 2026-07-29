-- Evalúa identidad y autorización una sola vez por consulta para evitar
-- recalcular funciones de autenticación en cada fila protegida por RLS.

-- Colecciones pastorales

drop policy if exists pastoral_colecciones_select_own on public.pastoral_colecciones;
create policy pastoral_colecciones_select_own
on public.pastoral_colecciones
for select to authenticated
using (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
);

drop policy if exists pastoral_colecciones_insert_own on public.pastoral_colecciones;
create policy pastoral_colecciones_insert_own
on public.pastoral_colecciones
for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
);

drop policy if exists pastoral_colecciones_update_own on public.pastoral_colecciones;
create policy pastoral_colecciones_update_own
on public.pastoral_colecciones
for update to authenticated
using (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
)
with check (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
);

drop policy if exists pastoral_colecciones_delete_own on public.pastoral_colecciones;
create policy pastoral_colecciones_delete_own
on public.pastoral_colecciones
for delete to authenticated
using (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
);

-- Versículos pastorales

drop policy if exists pastoral_versiculos_select_own on public.pastoral_versiculos;
create policy pastoral_versiculos_select_own
on public.pastoral_versiculos
for select to authenticated
using (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
  and exists (
    select 1
    from public.pastoral_colecciones c
    where c.id = pastoral_versiculos.coleccion_id
      and c.profile_id = (select auth.uid())
  )
);

drop policy if exists pastoral_versiculos_insert_own on public.pastoral_versiculos;
create policy pastoral_versiculos_insert_own
on public.pastoral_versiculos
for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
  and exists (
    select 1
    from public.pastoral_colecciones c
    where c.id = pastoral_versiculos.coleccion_id
      and c.profile_id = (select auth.uid())
  )
);

drop policy if exists pastoral_versiculos_update_own on public.pastoral_versiculos;
create policy pastoral_versiculos_update_own
on public.pastoral_versiculos
for update to authenticated
using (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
)
with check (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
);

drop policy if exists pastoral_versiculos_delete_own on public.pastoral_versiculos;
create policy pastoral_versiculos_delete_own
on public.pastoral_versiculos
for delete to authenticated
using (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
);

-- Bosquejos

drop policy if exists "pastores ven sus bosquejos" on public.pastoral_bosquejos;
create policy "pastores ven sus bosquejos"
on public.pastoral_bosquejos
for select to authenticated
using (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
);

drop policy if exists "pastores crean sus bosquejos" on public.pastoral_bosquejos;
create policy "pastores crean sus bosquejos"
on public.pastoral_bosquejos
for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
);

drop policy if exists "pastores actualizan sus bosquejos" on public.pastoral_bosquejos;
create policy "pastores actualizan sus bosquejos"
on public.pastoral_bosquejos
for update to authenticated
using (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
)
with check (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
);

drop policy if exists "pastores eliminan sus bosquejos" on public.pastoral_bosquejos;
create policy "pastores eliminan sus bosquejos"
on public.pastoral_bosquejos
for delete to authenticated
using (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
);

-- Biblioteca pastoral

drop policy if exists pastoral_library_select_own on public.pastoral_biblioteca;
create policy pastoral_library_select_own
on public.pastoral_biblioteca
for select to authenticated
using (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
);

drop policy if exists pastoral_library_insert_own on public.pastoral_biblioteca;
create policy pastoral_library_insert_own
on public.pastoral_biblioteca
for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
);

drop policy if exists pastoral_library_update_own on public.pastoral_biblioteca;
create policy pastoral_library_update_own
on public.pastoral_biblioteca
for update to authenticated
using (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
)
with check (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
);

drop policy if exists pastoral_library_delete_own on public.pastoral_biblioteca;
create policy pastoral_library_delete_own
on public.pastoral_biblioteca
for delete to authenticated
using (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
);

-- Paquetes y materiales

drop policy if exists pastoral_paquetes_select_own on public.pastoral_paquetes;
create policy pastoral_paquetes_select_own
on public.pastoral_paquetes
for select to authenticated
using (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
);

drop policy if exists pastoral_paquetes_insert_own on public.pastoral_paquetes;
create policy pastoral_paquetes_insert_own
on public.pastoral_paquetes
for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
);

drop policy if exists pastoral_paquetes_update_own on public.pastoral_paquetes;
create policy pastoral_paquetes_update_own
on public.pastoral_paquetes
for update to authenticated
using (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
)
with check (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
);

drop policy if exists pastoral_paquetes_delete_own on public.pastoral_paquetes;
create policy pastoral_paquetes_delete_own
on public.pastoral_paquetes
for delete to authenticated
using (
  profile_id = (select auth.uid())
  and (select public.tiene_acceso_pastoral())
);

-- Archivos privados de la Biblioteca Pastoral

drop policy if exists pastoral_library_storage_select on storage.objects;
create policy pastoral_library_storage_select
on storage.objects
for select to authenticated
using (
  bucket_id = 'pastoral-library'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.tiene_acceso_pastoral())
);

drop policy if exists pastoral_library_storage_insert on storage.objects;
create policy pastoral_library_storage_insert
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'pastoral-library'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.tiene_acceso_pastoral())
);

drop policy if exists pastoral_library_storage_update on storage.objects;
create policy pastoral_library_storage_update
on storage.objects
for update to authenticated
using (
  bucket_id = 'pastoral-library'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.tiene_acceso_pastoral())
)
with check (
  bucket_id = 'pastoral-library'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.tiene_acceso_pastoral())
);

drop policy if exists pastoral_library_storage_delete on storage.objects;
create policy pastoral_library_storage_delete
on storage.objects
for delete to authenticated
using (
  bucket_id = 'pastoral-library'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.tiene_acceso_pastoral())
);
