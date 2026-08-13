-- FASE E — Seguridad
-- La aceptación de solicitudes de contacto requiere una sesión autenticada.
-- La función conserva su validación interna por auth.uid().

revoke execute on function public.aceptar_solicitud_contacto(uuid) from public;
revoke execute on function public.aceptar_solicitud_contacto(uuid) from anon;
grant execute on function public.aceptar_solicitud_contacto(uuid) to authenticated;
grant execute on function public.aceptar_solicitud_contacto(uuid) to service_role;
