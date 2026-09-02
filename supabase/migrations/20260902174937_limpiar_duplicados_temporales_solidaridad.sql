drop table if exists public.solidaridad_mensajes;
drop table if exists public.cuentas_transferencia_iglesia;
alter table public.solicitudes_ayuda_solidaria drop column if exists tipo_solicitud;
