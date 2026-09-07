alter table public.solicitudes_ayuda_solidaria
  add column if not exists detalle_adicional text null;

alter table public.solicitudes_ayuda_solidaria
  alter column hogar_personas drop not null,
  alter column hogar_personas drop default;

alter table public.solicitudes_ayuda_solidaria
  drop constraint if exists solicitudes_ayuda_solidaria_necesidad_check;

alter table public.solicitudes_ayuda_solidaria
  add constraint solicitudes_ayuda_solidaria_necesidad_check
  check (char_length(trim(necesidad)) between 1 and 3000);

alter table public.solicitudes_ayuda_solidaria
  drop constraint if exists solicitudes_ayuda_solidaria_detalle_adicional_check;

alter table public.solicitudes_ayuda_solidaria
  add constraint solicitudes_ayuda_solidaria_detalle_adicional_check
  check (detalle_adicional is null or char_length(detalle_adicional) <= 3000);

alter table public.aportes_ayuda_solidaria
  drop constraint if exists aportes_ayuda_solidaria_detalle_check;

alter table public.aportes_ayuda_solidaria
  add constraint aportes_ayuda_solidaria_detalle_check
  check (char_length(trim(detalle)) between 1 and 2000);

comment on column public.solicitudes_ayuda_solidaria.hogar_personas is
  'Dato opcional de coordinación logística; no es requisito de elegibilidad.';
comment on column public.solicitudes_ayuda_solidaria.detalle_adicional is
  'Contexto opcional compartido voluntariamente por la persona; no es requisito para pedir ayuda.';
