-- Reversión operativa del rediseño de Ayuda Solidaria.
-- Se conserva detalle_adicional para no perder contenido ya compartido por usuarios.

update public.solicitudes_ayuda_solidaria
set hogar_personas = 1
where hogar_personas is null;

alter table public.solicitudes_ayuda_solidaria
  alter column hogar_personas set default 1,
  alter column hogar_personas set not null;

alter table public.solicitudes_ayuda_solidaria
  drop constraint if exists solicitudes_ayuda_solidaria_necesidad_check;

alter table public.solicitudes_ayuda_solidaria
  add constraint solicitudes_ayuda_solidaria_necesidad_check
  check (char_length(trim(necesidad)) between 10 and 3000);

alter table public.aportes_ayuda_solidaria
  drop constraint if exists aportes_ayuda_solidaria_detalle_check;

alter table public.aportes_ayuda_solidaria
  add constraint aportes_ayuda_solidaria_detalle_check
  check (char_length(trim(detalle)) between 5 and 2000);
