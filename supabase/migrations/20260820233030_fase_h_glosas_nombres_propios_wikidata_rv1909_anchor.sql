-- FASE H / Bloque 3 — nombres propios: TIPNR + Wikidata, validados en la referencia exacta RV1909.
--
-- Motivo del endurecimiento:
-- el crosswalk TIPNR -> Wikidata puede enlazar una grafía compartida con una entidad distinta
-- (p. ej. homónimos bíblicos). La etiqueta española NO se publica solo por existir el Q-ID.
-- Se exige además que la superficie española completa de Wikidata aparezca en el versículo
-- exacto que TIPNR usa como ancla para esa identidad, dentro de RV1909 (dominio público).
-- RV1909 se usa únicamente como evidencia de validación de superficie, nunca como significado léxico.
--
-- Fuente congelada de candidatos:
-- commit: 78d7d9a5ed2aa5766b0c3145887eb9c97700fae8
-- archivo: supabase/migration-drafts/20260820233000_fase_h_glosas_nombres_propios_wikidata_draft.sql
-- sha256 del contenido: e45bd7b1e317c9f152c7978b103811c6807841b0f9d895b82cfd0fcf607d7eb6
--
-- Batch id: fase_h_es_nombres_wikidata_rv1909_anchor_001_20260820
-- Política: insert-only + ON CONFLICT DO NOTHING.
--
-- Reversión exacta:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nombres_wikidata_rv1909_anchor_001_20260820';

with frozen_http as (
  select content
  from http_get(
    'https://raw.githubusercontent.com/vidainternacional/calendario/78d7d9a5ed2aa5766b0c3145887eb9c97700fae8/supabase/migration-drafts/20260820233000_fase_h_glosas_nombres_propios_wikidata_draft.sql'
  )
), frozen as (
  select content
  from frozen_http
  where encode(digest(content, 'sha256'), 'hex') =
    'e45bd7b1e317c9f152c7978b103811c6807841b0f9d895b82cfd0fcf607d7eb6'
), lines as (
  select unnest(string_to_array(content, E'\n')) as line
  from frozen
), parsed as (
  select regexp_match(
    line,
    $re$^\s*\('((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)'\),?$re$
  ) as m
  from lines
), map as (
  select
    replace(m[1], '''''', '''') as tipnr_id,
    replace(m[2], '''''', '''') as wikidata_id,
    replace(m[3], '''''', '''') as english_label,
    replace(m[4], '''''', '''') as display_gloss_es,
    replace(m[5], '''''', '''') as source_uri,
    replace(m[6], '''''', '''') as source_revision
  from parsed
  where m is not null
), rv_source as (
  select id, provider_version
  from public.biblical_sources
  where slug = 'rv1909-ebible'
    and review_status = 'approved'
    and enabled = true
  limit 1
), eligible as (
  select
    e.id as lexical_entry_id,
    e.strong_number,
    e.source_gloss,
    map.tipnr_id,
    map.wikidata_id,
    map.english_label,
    map.display_gloss_es,
    map.source_uri,
    map.source_revision,
    upper(substring(map.tipnr_id from '_([123]?[A-Za-z]{2,3})\.[0-9]+\.[0-9]+$')) as book_code,
    substring(map.tipnr_id from '_[123]?[A-Za-z]{2,3}\.([0-9]+)\.[0-9]+$')::int as chapter,
    substring(map.tipnr_id from '_[123]?[A-Za-z]{2,3}\.[0-9]+\.([0-9]+)$')::int as verse
  from public.biblical_lexical_entries e
  join map on map.tipnr_id =
    btrim(split_part(split_part(e.source_gloss, '»', 2), '@', 1)) || '_' ||
    substring(split_part(e.source_gloss, '@', 2) from '[123]?[A-Za-z]{2,3}[.][0-9]+[.][0-9]+')
  left join public.biblical_hebrew_spanish_glosses g
    on g.lexical_entry_id = e.id
  where e.language = 'hebrew'
    and e.review_status = 'approved'
    and e.enabled = true
    and e.display_gloss_es is null
    and g.lexical_entry_id is null
), anchored as (
  select
    el.*,
    rv.provider_version as rv1909_provider_version,
    regexp_replace(
      btrim(regexp_replace(
        translate(lower(el.display_gloss_es), 'áéíóúüñ', 'aeiouun'),
        '[^[:alnum:]]+', ' ', 'g'
      )),
      '\s+', ' ', 'g'
    ) as label_norm,
    regexp_replace(
      btrim(regexp_replace(
        translate(lower(v.original_text), 'áéíóúüñ', 'aeiouun'),
        '[^[:alnum:]]+', ' ', 'g'
      )),
      '\s+', ' ', 'g'
    ) as verse_norm
  from eligible el
  cross join rv_source rv
  join public.biblical_verse_texts v
    on v.source_id = rv.id
   and v.book_code = el.book_code
   and v.chapter = el.chapter
   and v.verse = el.verse
   and v.review_status = 'approved'
   and v.enabled = true
), verified as (
  select *
  from anchored
  where label_norm <> ''
    and position(' ' || label_norm || ' ' in ' ' || verse_norm || ' ') > 0
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
  display_gloss_es,
  '{}'::text[],
  99,
  'tipnr_wikidata_rv1909_anchor_exact_v1',
  source_gloss,
  'verified_derived',
  jsonb_build_object(
    'phase', 'FASE_H_BLOQUE_3',
    'batch_id', 'fase_h_es_nombres_wikidata_rv1909_anchor_001_20260820',
    'source_identity', 'STEPBible TIPNR',
    'source_identity_license', 'CC BY 4.0',
    'step_tipnr_revision', 'b83a3cf1224af5cf72606d86d6be1789adc69541',
    'tipnr_crosswalk_blob', 'abc3e21b9d08dc310066152f9b62858c4818f4eb',
    'tipnr_id', tipnr_id,
    'wikidata_id', wikidata_id,
    'wikidata_uri', source_uri,
    'wikidata_license', 'CC0-1.0',
    'wikidata_revision', source_revision,
    'strong_number', strong_number,
    'english_identity_label', english_label,
    'identity_match', 'TIPNR_ID exact + Wikidata English label/alias exact',
    'rv1909_validation_source', 'rv1909-ebible',
    'rv1909_provider_version', rv1909_provider_version,
    'rv1909_anchor_validation', 'exact normalized Spanish surface in exact TIPNR anchor verse',
    'context_used_as_meaning', false,
    'rv1909_used_as_meaning', false,
    'rv1909_used_as_validation', true,
    'frozen_candidate_sha256', 'e45bd7b1e317c9f152c7978b103811c6807841b0f9d895b82cfd0fcf607d7eb6'
  )
from verified
on conflict (lexical_entry_id) do nothing;
