-- FASE D — Cobertura Bíblica Integral
-- Santa Biblia libre para el mundo (BLM), dominio público.
-- HelloAO incluye 81 libros en complete.json aunque su catálogo canónico anuncia 66.
-- VIDA importa exclusivamente los 66 book_code presentes en public.biblical_books.

with raw as (
  select h.content::jsonb payload,
         encode(extensions.digest(h.content,'sha256'),'hex') raw_response_sha256
  from extensions.http_get('https://bible.helloao.org/api/spa_blm/complete.json') h
  where h.status=200
), verified as (
  select * from raw
  where payload#>>'{translation,id}'='spa_blm'
    and payload#>>'{translation,sha256}'='13d53356247bbee736a96febeb3467a3f370d23a8bebce12f4d838bd7928f409'
), source_row as (
  select id from public.biblical_sources
  where slug='blm-ebible' and license_status='verified' and review_status='approved' and enabled
), verses as (
  select
    source_row.id source_id,
    b->>'id' book_code,
    (c->'chapter'->>'number')::smallint chapter,
    (v->>'number')::smallint verse,
    coalesce(v->'content'->>0,'') verse_text,
    verified.raw_response_sha256
  from verified
  cross join source_row
  cross join lateral jsonb_array_elements(verified.payload->'books') b
  join public.biblical_books bb on bb.code=b->>'id'
  cross join lateral jsonb_array_elements(b->'chapters') c
  cross join lateral jsonb_array_elements(c->'chapter'->'content') v
  where v->>'type'='verse'
), validated as (
  select *,
    count(*) over() total_verses,
    count(distinct book_code) over() total_books
  from verses
), upserted as (
  insert into public.biblical_verse_texts(
    source_id,book_code,chapter,verse,language,original_text,normalized_text,transliteration,literal_translation_es,
    text_direction,token_count,analysis_status,source_locator,provider_version,content_hash,review_status,enabled,
    approved_at,approved_by,metadata
  )
  select
    source_id,book_code,chapter,verse,'spanish',verse_text,null,null,null,'ltr',
    cardinality(regexp_split_to_array(btrim(verse_text),E'\s+'))::smallint,
    'verified',format('helloao:spa_blm:%s.%s.%s',book_code,chapter,verse),
    '13d53356247bbee736a96febeb3467a3f370d23a8bebce12f4d838bd7928f409',
    encode(extensions.digest(verse_text,'sha256'),'hex'),'approved',true,now(),null,
    jsonb_build_object(
      'text_role','translation','translation_id','spa_blm','license','Public Domain',
      'delivery_provider','HelloAO Bible API','payload_sha256',raw_response_sha256,
      'advertised_sha256','13d53356247bbee736a96febeb3467a3f370d23a8bebce12f4d838bd7928f409',
      'canon_filter','VIDA-66','text_unmodified',true,'generated_by_ai',false
    )
  from validated
  where total_verses=31103 and total_books=66 and btrim(verse_text)<>''
  on conflict(source_id,book_code,chapter,verse,language) do update set
    original_text=excluded.original_text,normalized_text=excluded.normalized_text,transliteration=excluded.transliteration,
    literal_translation_es=excluded.literal_translation_es,text_direction=excluded.text_direction,
    token_count=excluded.token_count,analysis_status=excluded.analysis_status,source_locator=excluded.source_locator,
    provider_version=excluded.provider_version,content_hash=excluded.content_hash,review_status=excluded.review_status,
    enabled=excluded.enabled,approved_at=excluded.approved_at,metadata=excluded.metadata,updated_at=now()
  returning source_id
), summary as (
  select count(*) rows_upserted from upserted
), raw_meta as (
  select raw_response_sha256 from verified
)
update public.biblical_sources s
set content_hash=raw_meta.raw_response_sha256,
    provider_version='13d53356247bbee736a96febeb3467a3f370d23a8bebce12f4d838bd7928f409',
    metadata=s.metadata||jsonb_build_object(
      'content_imported',true,'books',66,'chapters',1189,'verse_slots',31103,'visible_verses',31103,
      'placeholder_verses',0,'canon_filter','VIDA-66','extra_source_books_excluded',15,
      'helloao_advertised_sha256','13d53356247bbee736a96febeb3467a3f370d23a8bebce12f4d838bd7928f409',
      'raw_response_sha256',raw_meta.raw_response_sha256,'delivery_provider','HelloAO Bible API',
      'importer','blm-canon66-v1','text_unmodified',true,'imported_at',now()
    ),updated_at=now()
from summary,raw_meta
where s.slug='blm-ebible' and summary.rows_upserted=31103
returning s.slug,summary.rows_upserted,s.content_hash,s.provider_version;
