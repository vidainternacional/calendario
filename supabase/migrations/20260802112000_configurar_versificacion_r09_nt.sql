-- FASE D · Bloque 4
-- Correspondencias verificadas entre TAGNT y la traducción HelloAO spa_r09.

with source as (
  select id
  from public.biblical_sources
  where slug='stepbible-lexical-pilot'
    and enabled and review_status='approved'
)
insert into public.biblical_versification_profiles(
  profile_key,name,source_id,translation_ids,translation_name_patterns,
  priority,review_status,enabled,metadata
)
select
  'r09-traditional-nt',
  'Reina Valera 1909 — correspondencias TAGNT',
  source.id,
  array['spa_r09']::text[],
  array['Santa Biblia — Reina Valera 1909','Reina Valera 1909','R09']::text[],
  10,'approved',true,
  jsonb_build_object(
    'translation_provider','HelloAO Bible API',
    'translation_id','spa_r09',
    'translation_sha256','94e154b2e6e56eda1702d9e9f664357a5f2aa82634b551111b0b698d124e97d5',
    'source_commit','b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',
    'verified_at','2026-08-02',
    'generated_by_ai',false
  )
from source
on conflict(profile_key) do update set
  name=excluded.name,
  source_id=excluded.source_id,
  translation_ids=excluded.translation_ids,
  translation_name_patterns=excluded.translation_name_patterns,
  priority=excluded.priority,
  review_status='approved',
  enabled=true,
  metadata=excluded.metadata,
  updated_at=now();

with source as (
  select id from public.biblical_sources where slug='stepbible-lexical-pilot'
), profile as (
  select id from public.biblical_versification_profiles where profile_key='r09-traditional-nt'
), mappings(
  source_book_code,source_chapter,source_verse,
  target_book_code,target_chapter,target_verse,
  sequence,mapping_kind,reason
) as (values
  ('2CO',13,13,'2CO',13,14,1,'relabel','HelloAO spa_r09 expone el marcador 13:14 vacío; el contenido de la bendición está en 13:13 y corresponde a TAGNT 13:13.'),
  ('3JN',1,14,'3JN',1,14,1,'merge','R09 reúne en 1:14 las dos referencias finales que TAGNT numera 1:14 y 1:15.'),
  ('3JN',1,15,'3JN',1,14,2,'merge','R09 reúne en 1:14 las dos referencias finales que TAGNT numera 1:14 y 1:15.'),
  ('REV',12,18,'REV',13,1,1,'merge','R09 integra la frase TAGNT 12:18 al inicio de Apocalipsis 13:1.'),
  ('REV',13,1,'REV',13,1,2,'merge','R09 integra TAGNT 12:18 y 13:1 dentro de Apocalipsis 13:1.')
)
insert into public.biblical_verse_mappings(
  profile_id,source_id,source_book_code,source_chapter,source_verse,
  target_book_code,target_chapter,target_verse,source_word_start,source_word_end,
  sequence,mapping_kind,source_locator,provider_version,content_hash,
  review_status,enabled,metadata
)
select
  profile.id,source.id,m.source_book_code,m.source_chapter,m.source_verse,
  m.target_book_code,m.target_chapter,m.target_verse,null,null,
  m.sequence,m.mapping_kind,
  'https://bible.helloao.org/api/spa_r09/'||m.target_book_code||'/'||m.target_chapter||'.json#verse-'||m.target_verse,
  'HelloAO spa_r09@94e154b2e6e56eda1702d9e9f664357a5f2aa82634b551111b0b698d124e97d5',
  encode(extensions.digest(convert_to(concat_ws('|',
    'r09-traditional-nt',m.source_book_code,m.source_chapter,m.source_verse,
    m.target_book_code,m.target_chapter,m.target_verse,m.sequence,m.mapping_kind,m.reason,
    '94e154b2e6e56eda1702d9e9f664357a5f2aa82634b551111b0b698d124e97d5',
    'b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39'
  ),'UTF8'),'sha256'),'hex'),
  'approved',true,
  jsonb_build_object(
    'reason',m.reason,
    'translation_id','spa_r09',
    'translation_sha256','94e154b2e6e56eda1702d9e9f664357a5f2aa82634b551111b0b698d124e97d5',
    'verified_against','HelloAO chapter JSON',
    'verified_at','2026-08-02',
    'generated_by_ai',false
  )
from mappings m cross join source cross join profile
on conflict(
  profile_id,source_id,source_book_code,source_chapter,source_verse,
  target_book_code,target_chapter,target_verse,
  (coalesce(source_word_start,0)),(coalesce(source_word_end,0)),sequence
) do update set
  mapping_kind=excluded.mapping_kind,
  source_locator=excluded.source_locator,
  provider_version=excluded.provider_version,
  content_hash=excluded.content_hash,
  review_status='approved',enabled=true,
  metadata=excluded.metadata,
  updated_at=now();
