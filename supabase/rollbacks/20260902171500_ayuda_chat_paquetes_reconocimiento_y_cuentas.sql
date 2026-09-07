drop table if exists public.ayuda_solidaria_mensajes cascade;
drop table if exists public.cuentas_bancarias_iglesia cascade;

alter table public.aportes_ayuda_solidaria
  drop column if exists agradecido_por,
  drop column if exists agradecido_at;

alter table public.solicitudes_ayuda_solidaria
  drop constraint if exists solicitudes_ayuda_solidaria_tipo_ayuda_check,
  drop column if exists tipo_ayuda;
