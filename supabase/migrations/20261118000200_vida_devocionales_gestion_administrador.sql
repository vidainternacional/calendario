-- Autorizado por el usuario: gestión de mensajes ajenos solo por administradores activos.
-- Pastores conservan lectura/escritura propia existentes; no se concede DELETE a pastores.
begin;
create policy vida_devocionales_admin_leer on public.vida_devocionales for select to authenticated using (
 exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.activo is true and p.estado_cuenta='activo' and p.rol::text='administrador')
);
create policy vida_devocionales_admin_editar on public.vida_devocionales for update to authenticated using (
 exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.activo is true and p.estado_cuenta='activo' and p.rol::text='administrador')
) with check (
 exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.activo is true and p.estado_cuenta='activo' and p.rol::text='administrador')
);
create policy vida_devocionales_admin_eliminar on public.vida_devocionales for delete to authenticated using (
 exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.activo is true and p.estado_cuenta='activo' and p.rol::text='administrador')
);
create function public.vida_devocionales_conservar_autoria() returns trigger language plpgsql security invoker set search_path=pg_catalog,public as $$
begin
 if new.id is distinct from old.id or new.autor_id is distinct from old.autor_id then
  raise exception 'La identidad y autoría del mensaje no se pueden cambiar.';
 end if;
 return new;
end;
$$;
revoke all on function public.vida_devocionales_conservar_autoria() from public,anon,authenticated;
create trigger vida_devocionales_autoria_inmutable before update on public.vida_devocionales for each row execute function public.vida_devocionales_conservar_autoria();
commit;
-- Reversión: retirar las tres políticas admin, el trigger y su función.
-- No elimina contenido. Retirar permisos no recupera filas que un administrador haya eliminado.
