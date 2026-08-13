-- FASE F — Biblia → Notas
-- Expansión aditiva de public.notas_estudio para evolucionarla hacia el cuaderno canónico.
-- Esta migración ya fue aplicada en Supabase antes de versionarse en el repositorio.
-- No modifica RLS, grants ni datos existentes.

alter table public.notas_estudio
  add column if not exists titulo text,
  add column if not exists tipo text,
  add column if not exists referencia text,
  add column if not exists origen text,
  add column if not exists origen_key text,
  add column if not exists paquete_id uuid,
  add column if not exists numero_predicacion integer,
  add column if not exists fecha_predicacion date,
  add column if not exists serie text,
  add column if not exists lugar text,
  add column if not exists predicador text,
  add column if not exists estado text,
  add column if not exists contexto jsonb;

create unique index if not exists notas_estudio_profile_origen_key_unique
  on public.notas_estudio (profile_id, origen_key)
  where origen_key is not null;

create index if not exists notas_estudio_profile_updated_idx
  on public.notas_estudio (profile_id, updated_at desc);
