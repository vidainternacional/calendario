-- Solo ejecutar si se autoriza revertir este bloque, después de volver al código previo.
-- Conserva tablas, preferencias y asociaciones. No borra datos ni altera RLS anterior.
begin;
revoke execute on function public.vida_guardar_mis_sedes(uuid[],uuid[]) from authenticated;
revoke insert,update on public.vida_sedes,public.vida_sede_preferencias,public.vida_sede_selecciones,public.vida_ministerio_sedes,public.vida_sede_responsables from authenticated;
commit;
