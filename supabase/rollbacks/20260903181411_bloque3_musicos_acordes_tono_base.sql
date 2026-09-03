-- Reversión BLOQUE 3 — Experiencia para músicos.
-- Advertencia: al retirar estas columnas se perderían únicamente los nuevos valores
-- de tono base y acordes oficiales; repertorio, eventos y programación permanecen intactos.

alter table public.ministerio_canciones
  drop column if exists acordes,
  drop column if exists tonalidad_base;
