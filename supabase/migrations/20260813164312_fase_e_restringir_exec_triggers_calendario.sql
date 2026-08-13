-- FASE E — Seguridad
-- Restringe la ejecución directa vía RPC de funciones SECURITY DEFINER
-- cuyo uso legítimo es exclusivamente como trigger interno.
-- No modifica las definiciones ni deshabilita los triggers.

revoke execute on function public.trg_sincronizar_nuevo_calendario_publico() from public;
revoke execute on function public.trg_sincronizar_nuevo_calendario_publico() from anon;
revoke execute on function public.trg_sincronizar_nuevo_calendario_publico() from authenticated;

revoke execute on function public.trg_sync_calendar_definition() from public;
revoke execute on function public.trg_sync_calendar_definition() from anon;
revoke execute on function public.trg_sync_calendar_definition() from authenticated;

revoke execute on function public.trg_sync_calendar_membership() from public;
revoke execute on function public.trg_sync_calendar_membership() from anon;
revoke execute on function public.trg_sync_calendar_membership() from authenticated;

revoke execute on function public.trg_sync_calendar_profile() from public;
revoke execute on function public.trg_sync_calendar_profile() from anon;
revoke execute on function public.trg_sync_calendar_profile() from authenticated;
