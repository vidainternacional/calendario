revoke all on function public.marcar_ayuda_solidaria_leida(text, uuid) from authenticated;
revoke all on function public.ayuda_solidaria_no_leidos() from authenticated;

drop function if exists public.marcar_ayuda_solidaria_leida(text, uuid);
drop function if exists public.ayuda_solidaria_no_leidos();
drop table if exists public.ayuda_solidaria_lecturas;
