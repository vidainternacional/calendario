alter table public.profiles
  add column if not exists acceso_centro_pastoral boolean not null default false;

comment on column public.profiles.acceso_centro_pastoral is
  'Permiso explícito asignado por un administrador para utilizar el Centro Pastoral sin cambiar el rol global.';

create or replace function public.tiene_acceso_pastoral()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and coalesce(p.estado_cuenta, 'pendiente') = 'activo'
      and (
        p.rol in ('pastor'::public.rol_app, 'administrador'::public.rol_app)
        or coalesce(p.acceso_centro_pastoral, false)
      )
  );
$$;

revoke all on function public.tiene_acceso_pastoral() from public;
grant execute on function public.tiene_acceso_pastoral() to authenticated, service_role;

create or replace function public.proteger_asignacion_acceso_pastoral()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.acceso_centro_pastoral is distinct from old.acceso_centro_pastoral then
    if auth.role() <> 'service_role'
      and not exists (
        select 1
        from public.profiles administrador
        where administrador.id = auth.uid()
          and administrador.rol = 'administrador'::public.rol_app
          and coalesce(administrador.estado_cuenta, 'pendiente') = 'activo'
      ) then
      raise exception 'Solo un administrador activo puede cambiar el acceso al Centro Pastoral.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists proteger_asignacion_acceso_pastoral on public.profiles;
create trigger proteger_asignacion_acceso_pastoral
before update of acceso_centro_pastoral on public.profiles
for each row execute function public.proteger_asignacion_acceso_pastoral();

-- Colecciones pastorales

drop policy if exists pastoral_colecciones_select_own on public.pastoral_colecciones;
create policy pastoral_colecciones_select_own
on public.pastoral_colecciones
for select to authenticated
using (profile_id = auth.uid() and public.tiene_acceso_pastoral());

drop policy if exists pastoral_colecciones_insert_own on public.pastoral_colecciones;
create policy pastoral_colecciones_insert_own
on public.pastoral_colecciones
for insert to authenticated
with check (profile_id = auth.uid() and public.tiene_acceso_pastoral());

drop policy if exists pastoral_colecciones_update_own on public.pastoral_colecciones;
create policy pastoral_colecciones_update_own
on public.pastoral_colecciones
for update to authenticated
using (profile_id = auth.uid() and public.tiene_acceso_pastoral())
with check (profile_id = auth.uid() and public.tiene_acceso_pastoral());

drop policy if exists pastoral_colecciones_delete_own on public.pastoral_colecciones;
create policy pastoral_colecciones_delete_own
on public.pastoral_colecciones
for delete to authenticated
using (profile_id = auth.uid() and public.tiene_acceso_pastoral());

-- Versículos pastorales

drop policy if exists pastoral_versiculos_select_own on public.pastoral_versiculos;
create policy pastoral_versiculos_select_own
on public.pastoral_versiculos
for select to authenticated
using (
  profile_id = auth.uid()
  and public.tiene_acceso_pastoral()
  and exists (
    select 1 from public.pastoral_colecciones c
    where c.id = pastoral_versiculos.coleccion_id
      and c.profile_id = auth.uid()
  )
);

drop policy if exists pastoral_versiculos_insert_own on public.pastoral_versiculos;
create policy pastoral_versiculos_insert_own
on public.pastoral_versiculos
for insert to authenticated
with check (
  profile_id = auth.uid()
  and public.tiene_acceso_pastoral()
  and exists (
    select 1 from public.pastoral_colecciones c
    where c.id = pastoral_versiculos.coleccion_id
      and c.profile_id = auth.uid()
  )
);

drop policy if exists pastoral_versiculos_update_own on public.pastoral_versiculos;
create policy pastoral_versiculos_update_own
on public.pastoral_versiculos
for update to authenticated
using (profile_id = auth.uid() and public.tiene_acceso_pastoral())
with check (profile_id = auth.uid() and public.tiene_acceso_pastoral());

drop policy if exists pastoral_versiculos_delete_own on public.pastoral_versiculos;
create policy pastoral_versiculos_delete_own
on public.pastoral_versiculos
for delete to authenticated
using (profile_id = auth.uid() and public.tiene_acceso_pastoral());

-- Bosquejos

drop policy if exists "pastores ven sus bosquejos" on public.pastoral_bosquejos;
create policy "pastores ven sus bosquejos"
on public.pastoral_bosquejos
for select to authenticated
using (profile_id = auth.uid() and public.tiene_acceso_pastoral());

drop policy if exists "pastores crean sus bosquejos" on public.pastoral_bosquejos;
create policy "pastores crean sus bosquejos"
on public.pastoral_bosquejos
for insert to authenticated
with check (profile_id = auth.uid() and public.tiene_acceso_pastoral());

drop policy if exists "pastores actualizan sus bosquejos" on public.pastoral_bosquejos;
create policy "pastores actualizan sus bosquejos"
on public.pastoral_bosquejos
for update to authenticated
using (profile_id = auth.uid() and public.tiene_acceso_pastoral())
with check (profile_id = auth.uid() and public.tiene_acceso_pastoral());

drop policy if exists "pastores eliminan sus bosquejos" on public.pastoral_bosquejos;
create policy "pastores eliminan sus bosquejos"
on public.pastoral_bosquejos
for delete to authenticated
using (profile_id = auth.uid() and public.tiene_acceso_pastoral());

-- Biblioteca pastoral

drop policy if exists pastoral_library_select_own on public.pastoral_biblioteca;
create policy pastoral_library_select_own
on public.pastoral_biblioteca
for select to authenticated
using (profile_id = auth.uid() and public.tiene_acceso_pastoral());

drop policy if exists pastoral_library_insert_own on public.pastoral_biblioteca;
create policy pastoral_library_insert_own
on public.pastoral_biblioteca
for insert to authenticated
with check (profile_id = auth.uid() and public.tiene_acceso_pastoral());

drop policy if exists pastoral_library_update_own on public.pastoral_biblioteca;
create policy pastoral_library_update_own
on public.pastoral_biblioteca
for update to authenticated
using (profile_id = auth.uid() and public.tiene_acceso_pastoral())
with check (profile_id = auth.uid() and public.tiene_acceso_pastoral());

drop policy if exists pastoral_library_delete_own on public.pastoral_biblioteca;
create policy pastoral_library_delete_own
on public.pastoral_biblioteca
for delete to authenticated
using (profile_id = auth.uid() and public.tiene_acceso_pastoral());

-- Paquetes y materiales

drop policy if exists pastoral_paquetes_select_own on public.pastoral_paquetes;
create policy pastoral_paquetes_select_own
on public.pastoral_paquetes
for select to authenticated
using (profile_id = auth.uid() and public.tiene_acceso_pastoral());

drop policy if exists pastoral_paquetes_insert_own on public.pastoral_paquetes;
create policy pastoral_paquetes_insert_own
on public.pastoral_paquetes
for insert to authenticated
with check (profile_id = auth.uid() and public.tiene_acceso_pastoral());

drop policy if exists pastoral_paquetes_update_own on public.pastoral_paquetes;
create policy pastoral_paquetes_update_own
on public.pastoral_paquetes
for update to authenticated
using (profile_id = auth.uid() and public.tiene_acceso_pastoral())
with check (profile_id = auth.uid() and public.tiene_acceso_pastoral());

drop policy if exists pastoral_paquetes_delete_own on public.pastoral_paquetes;
create policy pastoral_paquetes_delete_own
on public.pastoral_paquetes
for delete to authenticated
using (profile_id = auth.uid() and public.tiene_acceso_pastoral());

-- Archivos privados de la Biblioteca Pastoral

drop policy if exists pastoral_library_storage_select on storage.objects;
create policy pastoral_library_storage_select
on storage.objects
for select to authenticated
using (
  bucket_id = 'pastoral-library'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.tiene_acceso_pastoral()
);

drop policy if exists pastoral_library_storage_insert on storage.objects;
create policy pastoral_library_storage_insert
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'pastoral-library'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.tiene_acceso_pastoral()
);

drop policy if exists pastoral_library_storage_update on storage.objects;
create policy pastoral_library_storage_update
on storage.objects
for update to authenticated
using (
  bucket_id = 'pastoral-library'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.tiene_acceso_pastoral()
)
with check (
  bucket_id = 'pastoral-library'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.tiene_acceso_pastoral()
);

drop policy if exists pastoral_library_storage_delete on storage.objects;
create policy pastoral_library_storage_delete
on storage.objects
for delete to authenticated
using (
  bucket_id = 'pastoral-library'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.tiene_acceso_pastoral()
);
