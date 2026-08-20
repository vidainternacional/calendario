-- FASE H / Bloque 3 — nombres propios: alias español Wikidata + ancla exacta RV1909.
--
-- Este lote endurece el subconjunto descartado por el Batch 006. No publica una
-- etiqueta española de Wikidata solamente por existir: usa un alias marcado como
-- español y exige que esa misma grafía aparezca, conservando acentos, en el
-- versículo exacto que TIPNR usa como ancla.
--
-- Guardias adicionales:
-- - la grafía fuente antes de » debe coincidir con la identidad TIPNR antes de @;
--   así no se usa el alias de una entidad alternativa para traducir otro nombre;
-- - el alias debe ser una sola forma nominal con inicial mayúscula;
-- - por entrada léxica debe existir exactamente un alias candidato distinto;
-- - la revisión lastrevid de Wikidata debe coincidir con la revisión congelada;
-- - RV1909 valida superficie, nunca actúa como significado léxico por contexto.
--
-- Fuente congelada de candidatos:
-- commit: 78d7d9a5ed2aa5766b0c3145887eb9c97700fae8
-- archivo: supabase/migration-drafts/20260820233000_fase_h_glosas_nombres_propios_wikidata_draft.sql
-- sha256: e45bd7b1e317c9f152c7978b103811c6807841b0f9d895b82cfd0fcf607d7eb6
--
-- Batch id: fase_h_es_nombres_wikidata_alias_rv1909_anchor_002_20260820
-- Política: insert-only + ON CONFLICT DO NOTHING.
--
-- Reversión exacta:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' =
--   'fase_h_es_nombres_wikidata_alias_rv1909_anchor_002_20260820';

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
    replace(m[4], '''''', '''') as wikidata_spanish_label,
    replace(m[5], '''''', '''') as source_uri,
    replace(m[6], '''''', '''') as source_revision
  from parsed
  where m is not null
), eligible as (
  select
    e.id as lexical_entry_id,
    e.strong_number,
    e.source_gloss,
    map.tipnr_id,
    map.wikidata_id,
    map.english_label,
    map.wikidata_spanish_label,
    map.source_uri,
    map.source_revision,
    btrim(split_part(e.source_gloss, '»', 1)) as source_name,
    btrim(split_part(split_part(e.source_gloss, '»', 2), '@', 1)) as entity_name,
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
    and lower(btrim(split_part(e.source_gloss, '»', 1))) =
        lower(btrim(split_part(split_part(e.source_gloss, '»', 2), '@', 1)))
), qids as (
  select
    wikidata_id,
    row_number() over (order by wikidata_id) as rn
  from (select distinct wikidata_id from eligible) q
), batch_urls as (
  select
    ((rn - 1) / 50)::int as batch_no,
    'https://www.wikidata.org/w/api.php?action=wbgetentities&ids=' ||
      string_agg(wikidata_id, '%7C' order by wikidata_id) ||
      '&props=aliases%7Cinfo&languages=es&format=json&formatversion=2' as url
  from qids
  group by ((rn - 1) / 50)::int
), responses as (
  select
    batch_no,
    (http_get(url)).content::jsonb as payload
  from batch_urls
), entities as (
  select
    key as wikidata_id,
    value as entity
  from responses,
       lateral jsonb_each(payload->'entities')
), spanish_aliases as (
  select
    entities.wikidata_id,
    entities.entity->>'lastrevid' as lastrevid,
    alias_item->>'value' as alias_es
  from entities
  cross join lateral jsonb_array_elements(
    coalesce(entities.entity->'aliases'->'es', '[]'::jsonb)
  ) alias_item
), rv_source as (
  select id, provider_version
  from public.biblical_sources
  where slug = 'rv1909-ebible'
    and review_status = 'approved'
    and enabled = true
  limit 1
), anchored_aliases as (
  select
    eligible.*,
    spanish_aliases.alias_es,
    rv_source.provider_version as rv1909_provider_version,
    regexp_replace(
      btrim(regexp_replace(
        lower(spanish_aliases.alias_es),
        '[^[:alnum:]ÁÉÍÓÚÜÑáéíóúüñ-]+', ' ', 'g'
      )),
      '\s+', ' ', 'g'
    ) as alias_norm,
    regexp_replace(
      btrim(regexp_replace(
        lower(verse_text.original_text),
        '[^[:alnum:]ÁÉÍÓÚÜÑáéíóúüñ-]+', ' ', 'g'
      )),
      '\s+', ' ', 'g'
    ) as verse_norm
  from eligible
  join spanish_aliases
    on spanish_aliases.wikidata_id = eligible.wikidata_id
   and ('wikidata-lastrevid:' || spanish_aliases.lastrevid) = eligible.source_revision
  cross join rv_source
  join public.biblical_verse_texts verse_text
    on verse_text.source_id = rv_source.id
   and verse_text.book_code = eligible.book_code
   and verse_text.chapter = eligible.chapter
   and verse_text.verse = eligible.verse
   and verse_text.review_status = 'approved'
   and verse_text.enabled = true
  where spanish_aliases.alias_es !~ '\s'
    and left(spanish_aliases.alias_es, 1) = upper(left(spanish_aliases.alias_es, 1))
    and left(spanish_aliases.alias_es, 1) <> lower(left(spanish_aliases.alias_es, 1))
), exact_aliases as (
  select *
  from anchored_aliases
  where alias_norm <> ''
    and position(' ' || alias_norm || ' ' in ' ' || verse_norm || ' ') > 0
), verified as (
  select
    lexical_entry_id,
    strong_number,
    source_gloss,
    tipnr_id,
    wikidata_id,
    english_label,
    wikidata_spanish_label,
    source_uri,
    source_revision,
    rv1909_provider_version,
    min(alias_es) as display_gloss_es
  from exact_aliases
  group by
    lexical_entry_id,
    strong_number,
    source_gloss,
    tipnr_id,
    wikidata_id,
    english_label,
    wikidata_spanish_label,
    source_uri,
    source_revision,
    rv1909_provider_version
  having count(distinct alias_es) = 1
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
  'tipnr_wikidata_es_alias_rv1909_anchor_exact_v1',
  source_gloss,
  'verified_derived',
  jsonb_build_object(
    'phase', 'FASE_H_BLOQUE_3',
    'batch_id', 'fase_h_es_nombres_wikidata_alias_rv1909_anchor_002_20260820',
    'source_identity', 'STEPBible TIPNR',
    'source_identity_license', 'CC BY 4.0',
    'step_tipnr_revision', 'b83a3cf1224af5cf72606d86d6be1789adc69541',
    'tipnr_crosswalk_blob', 'abc3e21b9d08dc310066152f9b62858c4818f4eb',
    'tipnr_id', tipnr_id,
    'wikidata_id', wikidata_id,
    'wikidata_uri', source_uri,
    'wikidata_license', 'CC0-1.0',
    'wikidata_revision', source_revision,
    'wikidata_spanish_label_observed', wikidata_spanish_label,
    'spanish_display_source', 'Wikidata Spanish alias exact in RV1909 TIPNR anchor',
    'strong_number', strong_number,
    'english_identity_label', english_label,
    'identity_match', 'source name = TIPNR entity + frozen TIPNR/Wikidata identity',
    'rv1909_validation_source', 'rv1909-ebible',
    'rv1909_provider_version', rv1909_provider_version,
    'rv1909_anchor_validation', 'accent-preserving exact Spanish alias in exact TIPNR anchor verse',
    'context_used_as_meaning', false,
    'rv1909_used_as_meaning', false,
    'rv1909_used_as_validation', true,
    'frozen_candidate_sha256', 'e45bd7b1e317c9f152c7978b103811c6807841b0f9d895b82cfd0fcf607d7eb6'
  )
from verified
on conflict (lexical_entry_id) do nothing;
