-- FASE D · Bloque 4
-- Índice de cobertura para la clave foránea compuesta de variantes.

create index if not exists biblical_textual_variants_verse_source_idx
  on public.biblical_textual_variants (verse_text_id, source_id);