-- BLOQUE 3 — Experiencia para músicos
-- Aprobado explícitamente por el usuario el 2026-09-03.
-- Cambio aditivo: conserva repertorio, programación, asignaciones e historial existentes.

alter table public.ministerio_canciones
  add column if not exists tonalidad_base text,
  add column if not exists acordes text;

comment on column public.ministerio_canciones.tonalidad_base is
  'Tonalidad oficial base usada para interpretar/transponer los acordes guardados.';

comment on column public.ministerio_canciones.acordes is
  'Versión oficial de acordes preparada por el líder autorizado.';
