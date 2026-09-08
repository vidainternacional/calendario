revoke execute on function public.puede_gestionar_discipulado() from public, anon;
revoke execute on function public.discipulado_aprobado(uuid) from public, anon;
revoke execute on function public.discipulado_iniciar(uuid) from public, anon;
revoke execute on function public.discipulado_marcar_leccion(uuid,uuid,boolean) from public, anon;
revoke execute on function public.discipulado_obtener_evaluacion(uuid) from public, anon;
revoke execute on function public.discipulado_enviar_intento(uuid,jsonb) from public, anon;
revoke execute on function public.discipulado_revisar(uuid,text,text) from public, anon;

grant execute on function public.puede_gestionar_discipulado() to authenticated;
grant execute on function public.discipulado_aprobado(uuid) to authenticated;
grant execute on function public.discipulado_iniciar(uuid) to authenticated;
grant execute on function public.discipulado_marcar_leccion(uuid,uuid,boolean) to authenticated;
grant execute on function public.discipulado_obtener_evaluacion(uuid) to authenticated;
grant execute on function public.discipulado_enviar_intento(uuid,jsonb) to authenticated;
grant execute on function public.discipulado_revisar(uuid,text,text) to authenticated;
