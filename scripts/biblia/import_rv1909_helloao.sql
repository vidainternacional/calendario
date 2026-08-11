-- FASE D — Cobertura Bíblica Integral
-- Importa Reina-Valera 1909 desde HelloAO, cuya licencia apunta a eBible.org (dominio público).
-- Requiere extensión http y pgcrypto disponibles en Supabase.
-- Es idempotente por (source_id, book_code, chapter, verse, language).

with raw as (
  select
    response.content::jsonb as payload,
    encode(digest(response.content, 'sha256'), 'hex') as raw_response_sha256
  from http_get('https://bible.helloao.org/api/spa_r09/complete.json') response
  where response.status = 200
), verified as (
  select payload, raw_response_sha256
  from raw
  where payload #>> '{translation,id}' = 'spa_r09'
    and payload #>> '{translation,sha256}' = '94e154b2e6e56eda1702d9e9f664357a5f2aa82634b551111b0b698d124e97d5'
    and (payload #>> '{translation,numberOfBooks}')::int = 66
    and (payload #>> '{translation,totalNumberOfChapters}')::int = 1189
    and (payload #>> '{translation,totalNumberOfVerses}')::int = 31102
), source_row as (
  select id
  from public.biblical_sources
  where slug = 'rv1909-ebible'
    and license_status = 'verified'
    and review_status = 'approved'
), verse_rows as (
  select
    source_row.id as source_id,
    book ->> 'id' as book_code,
    (chapter -> 'chapter' ->> 'number')::smallint as chapter_number,
    (verse ->> 'number')::smallint as verse_number,
    coalesce(verse -> 'content' ->> 0, '') as verse_text,
    verified.raw_response_sha256,
    verified.payload #>> '{translation,sha256}' as advertised_sha256
  from verified
  cross join source_row
  cross join lateral jsonb_array_elements(verified.payload -> 'books') book
  cross join lateral jsonb_array_elements(book -> 'chapters') chapter
  cross join lateral jsonb_array_elements(chapter -> 'chapter' -> 'content') verse
  where verse ->> 'type' = 'verse'
), upserted as (
  insert into public.biblical_verse_texts (
    source_id,
    book_code,
    chapter,
    verse,
    language,
    original_text,
    normalized_text,
    transliteration,
    literal_translation_es,
    text_direction,
    token_count,
    analysis_status,
    source_locator,
    provider_version,
    content_hash,
    review_status,
    enabled,
    approved_at,
    approved_by,
    metadata
  )
  select
    source_id,
    book_code,
    chapter_number,
    verse_number,
    'spanish',
    verse_text,
    null,
    null,
    null,
    'ltr',
    case
      when btrim(verse_text) = '' then 0
      else cardinality(regexp_split_to_array(btrim(verse_text), E'\\s+'))
    end::smallint,
    'verified',
    format('helloao:spa_r09:%s.%s.%s', book_code, chapter_number, verse_number),
    advertised_sha256,
    encode(digest(verse_text, 'sha256'), 'hex'),
    'approved',
    btrim(verse_text) <> '',
    now(),
    null,
    jsonb_build_object(
      'text_role', 'translation',
      'translation_id', 'spa_r09',
      'translation_abbreviation', 'RV1909',
      'public_domain', true,
      'primary_source', 'eBible.org spaRV1909',
      'delivery_provider', 'HelloAO Bible API',
      'placeholder', btrim(verse_text) = '',
      'payload_sha256', raw_response_sha256,
      'advertised_sha256', advertised_sha256
    )
  from verse_rows
  on conflict (source_id, book_code, chapter, verse, language)
  do update set
    original_text = excluded.original_text,
    normalized_text = excluded.normalized_text,
    transliteration = excluded.transliteration,
    literal_translation_es = excluded.literal_translation_es,
    text_direction = excluded.text_direction,
    token_count = excluded.token_count,
    analysis_status = excluded.analysis_status,
    source_locator = excluded.source_locator,
    provider_version = excluded.provider_version,
    content_hash = excluded.content_hash,
    review_status = excluded.review_status,
    enabled = excluded.enabled,
    approved_at = excluded.approved_at,
    metadata = excluded.metadata,
    updated_at = now()
  returning enabled, (metadata ->> 'placeholder')::boolean as placeholder
), summary as (
  select
    count(*) as imported_rows,
    count(*) filter (where enabled) as visible_rows,
    count(*) filter (where placeholder) as placeholder_rows
  from upserted
)
update public.biblical_sources source
set
  content_hash = verified.raw_response_sha256,
  provider_version = verified.payload #>> '{translation,sha256}',
  metadata = source.metadata || jsonb_build_object(
    'content_imported', true,
    'translation_id', 'spa_r09',
    'books', 66,
    'chapters', 1189,
    'verse_slots', 31102,
    'visible_verses', summary.visible_rows,
    'placeholder_verses', summary.placeholder_rows,
    'helloao_advertised_sha256', verified.payload #>> '{translation,sha256}',
    'raw_response_sha256', verified.raw_response_sha256,
    'delivery_provider', 'HelloAO Bible API',
    'primary_source', 'eBible.org spaRV1909',
    'imported_at', now()
  ),
  updated_at = now()
from verified, summary
where source.slug = 'rv1909-ebible'
returning source.slug, summary.imported_rows, summary.visible_rows, summary.placeholder_rows, source.content_hash, source.provider_version;
