-- FASE D · Bloque 4
-- Una palabra hebrea puede contener varios morfemas con la misma posición fuente.

alter table public.biblical_word_occurrences
  drop constraint if exists biblical_word_occurrences_reference_word_key;

alter table public.biblical_word_occurrences
  add constraint biblical_word_occurrences_reference_morpheme_key
  unique (
    book_code,
    chapter,
    verse,
    source_id,
    word_index,
    morpheme_index
  );

comment on column public.biblical_word_occurrences.word_index is
  'Posición técnica de la palabra en la fuente; puede repetirse cuando la palabra contiene varios morfemas.';
comment on column public.biblical_word_occurrences.morpheme_index is
  'Orden único del morfema dentro de una misma posición técnica de palabra.';