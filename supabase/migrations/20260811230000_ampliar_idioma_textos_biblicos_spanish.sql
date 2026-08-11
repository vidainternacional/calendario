-- FASE D — Cobertura Bíblica Integral
-- Amplía biblical_verse_texts para almacenar traducciones españolas por source_id.
-- No modifica RLS ni permisos existentes.

alter table public.biblical_verse_texts
  drop constraint if exists biblical_verse_texts_language_check;

alter table public.biblical_verse_texts
  add constraint biblical_verse_texts_language_check
  check (language = any (array['hebrew'::text, 'aramaic'::text, 'greek'::text, 'spanish'::text]));
