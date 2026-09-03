drop trigger if exists trg_descontar_paquete_despensa_entregado on public.solicitudes_ayuda_solidaria;
drop function if exists public.descontar_paquete_despensa_entregado();
alter table public.aportes_ayuda_solidaria drop column if exists necesidad_servicio_id;
drop table if exists public.despensa_salidas_paquetes;
drop table if exists public.despensa_paquete_items;
drop table if exists public.despensa_paquetes;
drop table if exists public.ayuda_necesidades_servicio;
