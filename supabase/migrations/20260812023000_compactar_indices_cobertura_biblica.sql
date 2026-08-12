-- FASE D — Cobertura Bíblica Integral
-- Libera espacio sin eliminar datos bíblicos.
-- biblical_word_occurrences_reference_idx (book_code, chapter, verse)
-- está cubierto como prefijo por la clave única
-- (book_code, chapter, verse, source_id, word_index, morpheme_index).
-- No afecta constraints ni RLS.
-- Si FASE E demuestra necesidad específica, puede recrearse con:
-- create index biblical_word_occurrences_reference_idx
--   on public.biblical_word_occurrences(book_code, chapter, verse);

drop index if exists public.biblical_word_occurrences_reference_idx;
