-- PROPUESTA: NO APLICAR sin aprobación específica del dueño.
-- Permite borrar solo videos propios de pastor/administrador activo.
-- No modifica SELECT/INSERT/UPDATE, audiencia, roles ni datos existentes.
-- DELETE ya está concedido a authenticated en ccvida; RLS es la barrera faltante.
-- Reversión de permiso (no recupera filas que un autor haya borrado):
-- drop policy if exists vida_devocionales_eliminar_autor on public.vida_devocionales;
begin;
create policy vida_devocionales_eliminar_autor on public.vida_devocionales
  for delete to authenticated using (
    autor_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.activo is true and p.estado_cuenta = 'activo'
        and p.rol::text = any(array['pastor','administrador']::text[])
    )
  );
commit;
