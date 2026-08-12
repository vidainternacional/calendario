-- FASE D — Cobertura bíblica integral: versificación completa de RV1909.
--
-- Objetivo:
-- Resolver únicamente las divergencias verificadas entre spaRV1909 y las referencias
-- estándar ya usadas por TAHOT/TAGNT en VIDA. No se aplica una tradición global al AT:
-- el corpus RV1909 combina convenciones distintas según el bloque.
--
-- Fuentes fijadas:
-- - eBible.org spaRV1909 (dominio público), corpus importado en VIDA.
-- - STEPBible TVTMS 2.1.0, CC BY, commit
--   b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39.
-- - TVTMS SHA-256:
--   cdde3bd5b49e6469f3ac68877b03c74a2feb260dc2e39a02f8633beaad867146
--
-- Importante:
-- biblical_verse_mappings.source_id sigue apuntando al corpus textual STEPBible,
-- porque el resolver usa ese source_id para recuperar TAHOT/TAGNT. La procedencia
-- versificacional TVTMS se conserva en metadata del perfil y de cada mapping.

do $block$
declare
  v_profile_id uuid;
  v_text_source_id uuid;
  v_rv_source_id uuid;
  v_tvtms_url constant text := 'https://raw.githubusercontent.com/STEPBible/STEPBible-Data/b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39/Older%20Formats/TVTMS%20-%20till%20Mar%202025%20KJV-based%20with%20old%20formats%20for%20subverses%20-%20STEPBible.org%20CC%20BY.txt';
  v_tvtms_sha_expected constant text := 'cdde3bd5b49e6469f3ac68877b03c74a2feb260dc2e39a02f8633beaad867146';
  v_rv_sha_expected constant text := '3d58a5530329a35821acff4d8cb983fe35e46afee01202da91e35c400ac065f6';
  v_tvtms_response extensions.http_response;
  v_tvtms_content text;
  v_tvtms_sha text;
  v_existing_count integer;
  v_new_count integer;
  v_job_count integer;
  v_final_count integer;
  v_bad integer;
begin
  select id into v_profile_id
  from public.biblical_versification_profiles
  where profile_key='r09-traditional-nt'
    and enabled
    and review_status='approved';

  if v_profile_id is null then
    raise exception 'Perfil RV1909 aprobado no encontrado';
  end if;

  select id into v_text_source_id
  from public.biblical_sources
  where slug='stepbible-lexical-pilot'
    and enabled
    and review_status='approved';

  if v_text_source_id is null then
    raise exception 'Corpus textual STEPBible aprobado no encontrado';
  end if;

  select id into v_rv_source_id
  from public.biblical_sources
  where slug='rv1909-ebible'
    and enabled
    and review_status='approved'
    and content_hash=v_rv_sha_expected;

  if v_rv_source_id is null then
    raise exception 'Corpus RV1909 aprobado/hash esperado no encontrado';
  end if;

  select count(*) into v_existing_count
  from public.biblical_verse_mappings
  where profile_id=v_profile_id
    and enabled
    and review_status='approved';

  if v_existing_count<>5 then
    raise exception 'El perfil RV1909 no está en el estado base esperado de 5 mappings: %',v_existing_count;
  end if;

  v_tvtms_response := extensions.http_get(v_tvtms_url);
  if v_tvtms_response.status<>200 then
    raise exception 'No se pudo descargar TVTMS: HTTP %',v_tvtms_response.status;
  end if;

  v_tvtms_content := v_tvtms_response.content;
  v_tvtms_sha := encode(extensions.digest(convert_to(v_tvtms_content,'UTF8'),'sha256'),'hex');
  if v_tvtms_sha<>v_tvtms_sha_expected then
    raise exception 'SHA TVTMS inesperado: %',v_tvtms_sha;
  end if;

  drop table if exists pg_temp.vida_r09_new_map;
  create temporary table vida_r09_new_map(
    source_book_code text not null,
    source_chapter integer not null,
    source_verse integer not null,
    target_book_code text not null,
    target_chapter integer not null,
    target_verse integer not null,
    sequence integer not null,
    mapping_kind text not null,
    reason text not null,
    evidence_kind text not null,
    source_locator text not null
  ) on commit drop;

  -- NÚMEROS 13: RV1909 13:1 = estándar 12:16; 13:33 fusiona estándar 13:32-33.
  insert into vida_r09_new_map values
    ('NUM',12,16,'NUM',13,1,1,'relabel','RV1909 inicia Números 13 con la unidad estándar 12:16.','corpus_audit','https://ebible.org/spaRV1909/');

  insert into vida_r09_new_map
  select 'NUM',13,g,'NUM',13,g+1,1,'relabel',
         'RV1909 Números 13:'||(g+1)||' corresponde a la unidad estándar 13:'||g||'.',
         'corpus_audit','https://ebible.org/spaRV1909/'
  from generate_series(1,31) g;

  insert into vida_r09_new_map values
    ('NUM',13,32,'NUM',13,33,1,'merge','RV1909 Números 13:33 reúne las unidades estándar 13:32 y 13:33.','corpus_audit','https://ebible.org/spaRV1909/'),
    ('NUM',13,33,'NUM',13,33,2,'merge','RV1909 Números 13:33 reúne las unidades estándar 13:32 y 13:33.','corpus_audit','https://ebible.org/spaRV1909/');

  -- NÚMEROS 30: RV1909 30:1 = estándar 29:40; 30:16 fusiona estándar 30:15-16.
  insert into vida_r09_new_map values
    ('NUM',29,40,'NUM',30,1,1,'relabel','RV1909 inicia Números 30 con la unidad estándar 29:40.','corpus_audit','https://ebible.org/spaRV1909/');

  insert into vida_r09_new_map
  select 'NUM',30,g,'NUM',30,g+1,1,'relabel',
         'RV1909 Números 30:'||(g+1)||' corresponde a la unidad estándar 30:'||g||'.',
         'corpus_audit','https://ebible.org/spaRV1909/'
  from generate_series(1,14) g;

  insert into vida_r09_new_map values
    ('NUM',30,15,'NUM',30,16,1,'merge','RV1909 Números 30:16 reúne las unidades estándar 30:15 y 30:16.','corpus_audit','https://ebible.org/spaRV1909/'),
    ('NUM',30,16,'NUM',30,16,2,'merge','RV1909 Números 30:16 reúne las unidades estándar 30:15 y 30:16.','corpus_audit','https://ebible.org/spaRV1909/');

  -- 1 SAMUEL 24: RV1909 24:1 = estándar 23:29; 24:22 fusiona estándar 24:21-22.
  insert into vida_r09_new_map values
    ('1SA',23,29,'1SA',24,1,1,'relabel','RV1909 1 Samuel 24:1 corresponde a la unidad estándar 23:29.','corpus_audit','https://ebible.org/spaRV1909/');

  insert into vida_r09_new_map
  select '1SA',24,g,'1SA',24,g+1,1,'relabel',
         'RV1909 1 Samuel 24:'||(g+1)||' corresponde a la unidad estándar 24:'||g||'.',
         'corpus_audit','https://ebible.org/spaRV1909/'
  from generate_series(1,20) g;

  insert into vida_r09_new_map values
    ('1SA',24,21,'1SA',24,22,1,'merge','RV1909 1 Samuel 24:22 reúne las unidades estándar 24:21 y 24:22.','corpus_audit','https://ebible.org/spaRV1909/'),
    ('1SA',24,22,'1SA',24,22,2,'merge','RV1909 1 Samuel 24:22 reúne las unidades estándar 24:21 y 24:22.','corpus_audit','https://ebible.org/spaRV1909/');

  -- 2 SAMUEL 20:25 fusiona estándar 20:25-26.
  insert into vida_r09_new_map values
    ('2SA',20,25,'2SA',20,25,1,'merge','RV1909 2 Samuel 20:25 reúne las unidades estándar 20:25 y 20:26.','corpus_audit','https://ebible.org/spaRV1909/'),
    ('2SA',20,26,'2SA',20,25,2,'merge','RV1909 2 Samuel 20:25 reúne las unidades estándar 20:25 y 20:26.','corpus_audit','https://ebible.org/spaRV1909/');

  -- 2 CRÓNICAS 33:10 fusiona estándar 33:10-11; 33:11-24 quedan corridos +1.
  insert into vida_r09_new_map values
    ('2CH',33,10,'2CH',33,10,1,'merge','RV1909 2 Crónicas 33:10 reúne las unidades estándar 33:10 y 33:11.','corpus_audit','https://ebible.org/spaRV1909/'),
    ('2CH',33,11,'2CH',33,10,2,'merge','RV1909 2 Crónicas 33:10 reúne las unidades estándar 33:10 y 33:11.','corpus_audit','https://ebible.org/spaRV1909/');

  insert into vida_r09_new_map
  select '2CH',33,g+1,'2CH',33,g,1,'relabel',
         'RV1909 2 Crónicas 33:'||g||' corresponde a la unidad estándar 33:'||(g+1)||'.',
         'corpus_audit','https://ebible.org/spaRV1909/'
  from generate_series(11,24) g;

  -- JOB 35:15 fusiona estándar 35:15-16.
  insert into vida_r09_new_map values
    ('JOB',35,15,'JOB',35,15,1,'merge','RV1909 Job 35:15 reúne las unidades estándar 35:15 y 35:16.','corpus_audit','https://ebible.org/spaRV1909/'),
    ('JOB',35,16,'JOB',35,15,2,'merge','RV1909 Job 35:15 reúne las unidades estándar 35:15 y 35:16.','corpus_audit','https://ebible.org/spaRV1909/');

  -- JOB 39-40: derivación directa de las reglas SpanishRV de TVTMS.
  with expanded as (
    select substring(v_tvtms_content from strpos(v_tvtms_content,'#DataStart(Expanded)')) as body
  ), lines as (
    select line
    from expanded, regexp_split_to_table(body,E'\r?\n') line
  ), rows as (
    select
      split_part(line,E'\t',2) as r09_ref,
      split_part(line,E'\t',3) as standard_ref,
      split_part(line,E'\t',4) as action,
      line
    from lines
    where split_part(line,E'\t',1)='SpanishRV'
  ), parsed as (
    select
      r09_ref,
      standard_ref,
      action,
      line,
      regexp_match(r09_ref,'^Job\.([0-9]+):([0-9]+)$') as target_match,
      regexp_match(standard_ref,'^Job\.([0-9]+):([0-9]+)$') as source_match
    from rows
    where r09_ref<>standard_ref
  )
  insert into vida_r09_new_map(
    source_book_code,source_chapter,source_verse,
    target_book_code,target_chapter,target_verse,
    sequence,mapping_kind,reason,evidence_kind,source_locator
  )
  select
    'JOB',source_match[1]::integer,source_match[2]::integer,
    'JOB',target_match[1]::integer,target_match[2]::integer,
    1,'relabel',
    'TVTMS SpanishRV: '||r09_ref||' corresponde a la referencia estándar '||standard_ref||'.',
    'tvtms_spanishrv',
    v_tvtms_url||'#SpanishRV-'||replace(r09_ref,':','-')
  from parsed
  where target_match is not null and source_match is not null;

  select count(*) into v_job_count
  from vida_r09_new_map
  where evidence_kind='tvtms_spanishrv';

  if v_job_count<>57 then
    raise exception 'TVTMS SpanishRV produjo % mappings Job; se esperaban 57',v_job_count;
  end if;

  -- OSEAS 12: RV1909 12:1 = estándar 11:12; 12:14 fusiona estándar 12:13-14.
  insert into vida_r09_new_map values
    ('HOS',11,12,'HOS',12,1,1,'relabel','RV1909 Oseas 12:1 corresponde a la unidad estándar 11:12.','corpus_audit','https://ebible.org/spaRV1909/');

  insert into vida_r09_new_map
  select 'HOS',12,g,'HOS',12,g+1,1,'relabel',
         'RV1909 Oseas 12:'||(g+1)||' corresponde a la unidad estándar 12:'||g||'.',
         'corpus_audit','https://ebible.org/spaRV1909/'
  from generate_series(1,12) g;

  insert into vida_r09_new_map values
    ('HOS',12,13,'HOS',12,14,1,'merge','RV1909 Oseas 12:14 reúne las unidades estándar 12:13 y 12:14.','corpus_audit','https://ebible.org/spaRV1909/'),
    ('HOS',12,14,'HOS',12,14,2,'merge','RV1909 Oseas 12:14 reúne las unidades estándar 12:13 y 12:14.','corpus_audit','https://ebible.org/spaRV1909/');

  -- JONÁS 2: RV1909 2:1 = estándar 1:17; 2:10 fusiona estándar 2:9-10.
  insert into vida_r09_new_map values
    ('JON',1,17,'JON',2,1,1,'relabel','RV1909 Jonás 2:1 corresponde a la unidad estándar 1:17.','corpus_audit','https://ebible.org/spaRV1909/');

  insert into vida_r09_new_map
  select 'JON',2,g,'JON',2,g+1,1,'relabel',
         'RV1909 Jonás 2:'||(g+1)||' corresponde a la unidad estándar 2:'||g||'.',
         'corpus_audit','https://ebible.org/spaRV1909/'
  from generate_series(1,8) g;

  insert into vida_r09_new_map values
    ('JON',2,9,'JON',2,10,1,'merge','RV1909 Jonás 2:10 reúne las unidades estándar 2:9 y 2:10.','corpus_audit','https://ebible.org/spaRV1909/'),
    ('JON',2,10,'JON',2,10,2,'merge','RV1909 Jonás 2:10 reúne las unidades estándar 2:9 y 2:10.','corpus_audit','https://ebible.org/spaRV1909/');

  -- HECHOS 19:40 reúne TAGNT 19:40-41.
  insert into vida_r09_new_map values
    ('ACT',19,40,'ACT',19,40,1,'merge','RV1909 Hechos 19:40 reúne TAGNT 19:40 y 19:41.','corpus_audit','https://ebible.org/spaRV1909/'),
    ('ACT',19,41,'ACT',19,40,2,'merge','RV1909 Hechos 19:40 reúne TAGNT 19:40 y 19:41.','corpus_audit','https://ebible.org/spaRV1909/');

  select count(*) into v_new_count from vida_r09_new_map;
  if v_new_count<>179 then
    raise exception 'Conteo de nuevos mappings RV1909 inesperado: % (esperado 179)',v_new_count;
  end if;

  select count(*) into v_bad
  from (
    select source_book_code,source_chapter,source_verse,
           target_book_code,target_chapter,target_verse,sequence,count(*)
    from vida_r09_new_map
    group by 1,2,3,4,5,6,7
    having count(*)>1
  ) d;
  if v_bad<>0 then
    raise exception 'La matriz nueva RV1909 contiene mappings duplicados: %',v_bad;
  end if;

  -- Todas las referencias fuente deben existir realmente en TAHOT/TAGNT aprobado.
  select count(*) into v_bad
  from vida_r09_new_map m
  where not exists(
    select 1
    from public.biblical_verse_texts v
    where v.source_id=v_text_source_id
      and v.book_code=m.source_book_code
      and v.chapter=m.source_chapter
      and v.verse=m.source_verse
      and v.enabled
      and v.review_status='approved'
  );
  if v_bad<>0 then
    raise exception 'Mappings RV1909 con referencia original inexistente: %',v_bad;
  end if;

  -- Todas las referencias destino deben existir como texto visible de RV1909.
  select count(*) into v_bad
  from vida_r09_new_map m
  where not exists(
    select 1
    from public.biblical_verse_texts v
    where v.source_id=v_rv_source_id
      and v.book_code=m.target_book_code
      and v.chapter=m.target_chapter
      and v.verse=m.target_verse
      and v.enabled
      and v.review_status='approved'
      and nullif(btrim(v.original_text),'') is not null
  );
  if v_bad<>0 then
    raise exception 'Mappings RV1909 con referencia destino sin texto: %',v_bad;
  end if;

  insert into public.biblical_verse_mappings(
    profile_id,source_id,
    source_book_code,source_chapter,source_verse,source_word_start,source_word_end,
    target_book_code,target_chapter,target_verse,sequence,mapping_kind,
    source_locator,provider_version,content_hash,review_status,enabled,metadata
  )
  select
    v_profile_id,v_text_source_id,
    m.source_book_code,m.source_chapter::smallint,m.source_verse::smallint,null,null,
    m.target_book_code,m.target_chapter::smallint,m.target_verse::smallint,m.sequence::smallint,m.mapping_kind,
    m.source_locator,
    'RV1909 versification audit + TVTMS 2.1.0@b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',
    encode(extensions.digest(convert_to(concat_ws(E'\x1f',
      'vida-rv1909-mapping-v2',
      m.source_book_code,m.source_chapter::text,m.source_verse::text,
      m.target_book_code,m.target_chapter::text,m.target_verse::text,
      m.sequence::text,m.mapping_kind,m.evidence_kind,m.reason,
      v_tvtms_sha,v_rv_sha_expected
    ),'UTF8'),'sha256'),'hex'),
    'approved',true,
    jsonb_build_object(
      'translation_id','spa_r09',
      'reason',m.reason,
      'evidence_kind',m.evidence_kind,
      'verified_at','2026-08-11',
      'generated_by_ai',false,
      'rv1909_source','eBible.org spaRV1909',
      'rv1909_sha256',v_rv_sha_expected,
      'original_source','STEPBible TAHOT/TAGNT standardized references',
      'stepbible_commit','b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',
      'tvtms_version','2.1.0',
      'tvtms_sha256',v_tvtms_sha,
      'tvtms_license','CC BY',
      'mapping_scope','verified_rv1909_divergence_only'
    )
  from vida_r09_new_map m
  where not exists(
    select 1
    from public.biblical_verse_mappings x
    where x.profile_id=v_profile_id
      and x.source_id=v_text_source_id
      and x.source_book_code=m.source_book_code
      and x.source_chapter=m.source_chapter
      and x.source_verse=m.source_verse
      and x.target_book_code=m.target_book_code
      and x.target_chapter=m.target_chapter
      and x.target_verse=m.target_verse
      and coalesce(x.source_word_start,0)=0
      and coalesce(x.source_word_end,0)=0
      and x.sequence=m.sequence
  );

  select count(*) into v_final_count
  from public.biblical_verse_mappings
  where profile_id=v_profile_id
    and enabled
    and review_status='approved';

  if v_final_count<>184 then
    raise exception 'Conteo final de mappings RV1909 inesperado: % (esperado 184)',v_final_count;
  end if;

  select count(*) into v_bad
  from public.biblical_verse_mappings
  where profile_id=v_profile_id
    and enabled
    and review_status='approved'
    and content_hash !~ '^[0-9a-f]{64}$';
  if v_bad<>0 then
    raise exception 'Persisten mappings RV1909 con hash no SHA-256: %',v_bad;
  end if;

  select count(*) into v_bad
  from (
    select target_book_code,target_chapter,target_verse,sequence,count(*)
    from public.biblical_verse_mappings
    where profile_id=v_profile_id
      and enabled
      and review_status='approved'
    group by 1,2,3,4
    having count(*)>1
  ) d;
  if v_bad<>0 then
    raise exception 'Secuencias destino duplicadas en perfil RV1909: %',v_bad;
  end if;

  update public.biblical_versification_profiles
  set name='Reina Valera 1909 — correspondencias TAHOT/TAGNT completas',
      metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
        'scope','bible_wide_rv1909',
        'translation_id','spa_r09',
        'generated_by_ai',false,
        'mapping_count',184,
        'original_reference_system','TAHOT/TAGNT standardized references used by VIDA',
        'mapping_policy','Only verified RV1909 divergences are mapped; unmatched references use identity/fallback.',
        'rv1909_source','eBible.org spaRV1909',
        'rv1909_sha256',v_rv_sha_expected,
        'tvtms_repository','STEPBible/STEPBible-Data',
        'tvtms_commit','b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',
        'tvtms_version','2.1.0',
        'tvtms_file','Older Formats/TVTMS - till Mar 2025 KJV-based with old formats for subverses - STEPBible.org CC BY.txt',
        'tvtms_sha256',v_tvtms_sha,
        'tvtms_license','CC BY',
        'manual_corpus_audit_blocks',jsonb_build_array('NUM 13','NUM 30','1SA 24','2SA 20','2CH 33','JOB 35','HOS 12','JON 2','ACT 19'),
        'tvtms_spanishrv_job_mappings',57,
        'existing_nt_mappings_preserved',5,
        'completed_at',now()
      ),
      updated_at=now()
  where id=v_profile_id;
end
$block$;
