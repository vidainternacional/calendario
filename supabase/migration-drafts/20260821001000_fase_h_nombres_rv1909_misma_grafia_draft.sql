-- BORRADOR NO ACTIVO — FASE H / Bloque 3.
-- Objetivo: cubrir únicamente nombres propios cuya grafía inglesa de TAHOT
-- coincide exactamente con la grafía encontrada en RV1909 en un versículo
-- donde aparece ESA MISMA entrada léxica hebrea.
--
-- RV1909 se usa SOLO como ancla de grafía española; nunca como significado léxico.
-- No se usa contexto para inferir significado.
-- No modifica biblical_lexical_entries ni filas editoriales existentes.
-- Política futura: insert-only + ON CONFLICT DO NOTHING.
--
-- Auditoría read-only 2026-08-20: 1,028 lexical_entry_id elegibles,
-- 680 nombres fuente distintos y 692 Strong base distintos.
--
-- Reversión exacta si se activa:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nombres_rv1909_misma_grafia_001_20260820';

with rv1909 as (
  select id
  from public.biblical_sources
  where slug = 'rv1909-ebible'
    and language = 'spa'
    and license_status = 'verified'
    and enabled = true
  limit 1
), pending_exact_names as (
  select
    l.id as lexical_entry_id,
    l.lexical_id,
    l.strong_number,
    l.source_gloss,
    btrim(split_part(l.source_gloss, '»', 1)) as source_name,
    btrim(regexp_replace(
      lower(split_part(l.source_gloss, '»', 1)),
      '[^[:alnum:]áéíóúüñ]+',
      ' ',
      'g'
    )) as source_name_norm
  from public.biblical_lexical_entries l
  left join public.biblical_hebrew_spanish_glosses g
    on g.lexical_entry_id = l.id
  where l.language = 'hebrew'
    and l.review_status = 'approved'
    and l.enabled = true
    and nullif(btrim(l.display_gloss_es), '') is null
    and g.lexical_entry_id is null
    and l.source_gloss like '%»%@%'
    and btrim(split_part(l.source_gloss, '»', 1)) =
        btrim(split_part(split_part(l.source_gloss, '@', 1), '»', 2))
), attested_same_surface as (
  select distinct
    p.lexical_entry_id,
    p.lexical_id,
    p.strong_number,
    p.source_gloss,
    p.source_name
  from pending_exact_names p
  join public.biblical_word_occurrences o
    on o.lexical_entry_id = p.lexical_entry_id
   and o.review_status = 'approved'
   and o.enabled = true
  join rv1909 s on true
  join public.biblical_verse_texts v
    on v.source_id = s.id
   and v.book_code = o.book_code
   and v.chapter = o.chapter
   and v.verse = o.verse
   and v.review_status = 'approved'
   and v.enabled = true
  where length(p.source_name_norm) >= 4
    and (
      ' ' || btrim(regexp_replace(
        lower(v.original_text),
        '[^[:alnum:]áéíóúüñ]+',
        ' ',
        'g'
      )) || ' '
    ) like ('% ' || p.source_name_norm || ' %')
)
insert into public.biblical_hebrew_spanish_glosses (
  lexical_entry_id,
  display_gloss_es,
  alternative_glosses_es,
  confidence,
  derivation_method,
  source_gloss_snapshot,
  status,
  provenance
)
select
  lexical_entry_id,
  source_name,
  '{}'::text[],
  99,
  'tahot_exact_entity_rv1909_same_surface_v1',
  source_gloss,
  'verified_derived',
  jsonb_build_object(
    'phase', 'FASE_H_BLOQUE_3',
    'batch_id', 'fase_h_es_nombres_rv1909_misma_grafia_001_20260820',
    'source_identity', 'STEPBible TAHOT',
    'source_identity_license', 'CC BY 4.0',
    'spanish_spelling_anchor', 'Reina-Valera 1909 / eBible.org',
    'spanish_spelling_anchor_license', 'public_domain',
    'same_lexical_occurrence_verse_required', true,
    'exact_source_entity_required', true,
    'exact_same_surface_required', true,
    'minimum_normalized_name_length', 4,
    'anchor_used_for_name_spelling_only', true,
    'context_used_as_meaning', false,
    'rv1909_used_as_meaning', false,
    'lexical_id', lexical_id,
    'strong_number', strong_number
  )
from attested_same_surface
on conflict (lexical_entry_id) do nothing;
