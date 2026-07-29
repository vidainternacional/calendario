alter function public.tiene_acceso_pastoral() security invoker;

revoke all on function public.tiene_acceso_pastoral() from public, anon;
grant execute on function public.tiene_acceso_pastoral() to authenticated, service_role;

revoke all on function public.proteger_asignacion_acceso_pastoral() from public, anon, authenticated;
grant execute on function public.proteger_asignacion_acceso_pastoral() to service_role;
