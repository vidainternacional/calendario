-- FASE E — seguridad de sincronización de calendarios públicos
-- Aplicada en Supabase el 2026-08-12 como migración
-- fase_e_restringir_rpc_sincronizacion_calendarios.
--
-- Objetivo:
-- impedir que clientes anon/authenticated invoquen directamente una función
-- SECURITY DEFINER que acepta un user_id arbitrario y escribe suscripciones.
--
-- No cambia la lógica de la función, sus datos, triggers ni tablas.
-- La sincronización interna sigue disponible para postgres/service_role.
--
-- Validación posterior:
-- - PUBLIC: sin EXECUTE;
-- - anon: sin EXECUTE;
-- - authenticated: sin EXECUTE;
-- - postgres: conserva EXECUTE;
-- - service_role: conserva EXECUTE;
-- - el trigger interno conserva capacidad de ejecutar la función.
--
-- Reversión, únicamente si fuera necesaria:
-- GRANT EXECUTE ON FUNCTION public.sincronizar_calendarios_publicos_usuario(uuid) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.sincronizar_calendarios_publicos_usuario(uuid) TO anon;
-- GRANT EXECUTE ON FUNCTION public.sincronizar_calendarios_publicos_usuario(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.sincronizar_calendarios_publicos_usuario(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sincronizar_calendarios_publicos_usuario(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.sincronizar_calendarios_publicos_usuario(uuid) FROM authenticated;