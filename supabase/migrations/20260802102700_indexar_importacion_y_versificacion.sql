-- FASE D · Bloque 4
-- Índices de cobertura para las claves foráneas añadidas en el incremento textual.

create index if not exists biblical_textual_import_batches_book_code_idx
  on internal.biblical_textual_import_batches(book_code);

create index if not exists biblical_versification_profiles_source_id_idx
  on public.biblical_versification_profiles(source_id);

create index if not exists biblical_verse_mappings_source_book_code_idx
  on public.biblical_verse_mappings(source_book_code);

create index if not exists biblical_verse_mappings_target_book_code_idx
  on public.biblical_verse_mappings(target_book_code);
