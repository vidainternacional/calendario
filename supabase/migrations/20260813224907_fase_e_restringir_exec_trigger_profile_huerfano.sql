-- FASE E — Seguridad
-- Restringe la ejecución directa vía RPC de una función SECURITY DEFINER
-- sin trigger activo ni referencias de aplicación. Conserva la función para
-- evitar cambios destructivos y mantiene acceso de service_role/postgres.

revoke execute on function public.trg_sincronizar_calendarios_publicos_profile() from public;
revoke execute on function public.trg_sincronizar_calendarios_publicos_profile() from anon;
revoke execute on function public.trg_sincronizar_calendarios_publicos_profile() from authenticated;
