-- FASE D · Bloque 4
-- La variante y el texto base deben pertenecer obligatoriamente a la misma fuente.

alter table public.biblical_verse_texts
  add constraint biblical_verse_texts_id_source_key
  unique (id, source_id);

alter table public.biblical_textual_variants
  add constraint biblical_textual_variants_verse_source_fkey
  foreign key (verse_text_id, source_id)
  references public.biblical_verse_texts (id, source_id)
  on delete cascade;