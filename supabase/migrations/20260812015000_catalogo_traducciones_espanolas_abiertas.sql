-- FASE D — Cobertura Bíblica Integral
-- Catálogo e importador restringido para traducciones españolas con licencia verificada.
-- El texto se almacena sin alteraciones; la atribución/licencia queda en biblical_sources.
-- No modifica RLS.

insert into public.biblical_sources(
  slug,name,source_type,language,website,license_url,license_notes,license_status,
  provider,provider_ref,provider_version,content_hash,attribution,review_status,enabled,metadata
) values
(
  'pdpt-ebible','Palabra de Dios para ti','translation','spa',
  'https://ebible.org/spapddpt/','https://ebible.org/spapddpt/copyright.htm',
  'Creative Commons Attribution 4.0. Redistribución permitida con atribución; VIDA conserva el texto sin alteraciones.',
  'verified','eBible.org','spapddpt','helloao:spa_bltl',null,
  'Palabra de Dios para ti © 2020 Asociación Bíblica Latinoamericana. CC BY 4.0. Fuente: eBible.org.',
  'approved',true,jsonb_build_object('content_imported',false,'license','CC BY 4.0','delivery_provider','HelloAO Bible API','helloao_id','spa_bltl')
),
(
  'bes-ebible','La Biblia en Español Sencillo','translation','spa',
  'https://ebible.org/spabes/','https://ebible.org/spabes/copyright.htm',
  'Creative Commons Attribution 4.0. Redistribución permitida con atribución; VIDA conserva el texto sin alteraciones.',
  'verified','eBible.org','spabes','helloao:spa_bes',null,
  'La Biblia en Español Sencillo © 2018, 2019 AudioBiblia.org / Irma Flores. CC BY 4.0. Fuente: eBible.org.',
  'approved',true,jsonb_build_object('content_imported',false,'license','CC BY 4.0','delivery_provider','HelloAO Bible API','helloao_id','spa_bes')
),
(
  'blm-ebible','Santa Biblia libre para el mundo','translation','spa',
  'https://ebible.org/spablm/','https://ebible.org/spablm/copyright.htm',
  'Dominio público según eBible.org. VIDA conserva el texto fuente sin alteraciones.',
  'verified','eBible.org','spablm','helloao:spa_lsv',null,
  'Santa Biblia libre para el mundo. Dominio público. Traducción: David Williams & Michael Paul Johnson. Fuente: eBible.org.',
  'approved',true,jsonb_build_object('content_imported',false,'license','Public Domain','delivery_provider','HelloAO Bible API','helloao_id','spa_lsv')
)
on conflict(slug) do update set
  name=excluded.name,website=excluded.website,license_url=excluded.license_url,
  license_notes=excluded.license_notes,license_status=excluded.license_status,
  provider=excluded.provider,provider_ref=excluded.provider_ref,provider_version=excluded.provider_version,
  attribution=excluded.attribution,review_status=excluded.review_status,enabled=excluded.enabled,
  metadata=public.biblical_sources.metadata||excluded.metadata,updated_at=now();

create table if not exists internal.open_spanish_translation_catalog(
  catalog_key text primary key,
  source_slug text not null unique references public.biblical_sources(slug) on delete restrict,
  helloao_id text not null unique,
  expected_sha256 text not null check(expected_sha256 ~ '^[0-9a-f]{64}$'),
  expected_books smallint not null check(expected_books=66),
  expected_chapters smallint not null check(expected_chapters=1189),
  expected_verses integer not null check(expected_verses>0),
  license_kind text not null,
  enabled boolean not null default true
);

insert into internal.open_spanish_translation_catalog(
  catalog_key,source_slug,helloao_id,expected_sha256,expected_books,expected_chapters,expected_verses,license_kind,enabled
) values
('pdpt','pdpt-ebible','spa_bltl','bab487ca8b6db01cd2528815666079d1601d1ffe96b02dc965756497551cb467',66,1189,31102,'CC BY 4.0',true),
('bes','bes-ebible','spa_bes','e3d37cbedec278e645e3e4c97a8b80f6d0f25281133162ce1b5263962883cdbe',66,1189,31103,'CC BY 4.0',true),
('blm','blm-ebible','spa_lsv','9ae01ac04cb7882d7545953928787aaf8d17c02e8617529c3921b768050147af',66,1189,31103,'Public Domain',true)
on conflict(catalog_key) do update set
  source_slug=excluded.source_slug,helloao_id=excluded.helloao_id,expected_sha256=excluded.expected_sha256,
  expected_books=excluded.expected_books,expected_chapters=excluded.expected_chapters,
  expected_verses=excluded.expected_verses,license_kind=excluded.license_kind,enabled=excluded.enabled;

revoke all on internal.open_spanish_translation_catalog from public,anon,authenticated;
grant select on internal.open_spanish_translation_catalog to service_role;

create or replace function internal.import_open_spanish_translation_v1(p_catalog_key text)
returns jsonb
language plpgsql
security definer
set search_path=public,extensions,internal,pg_temp
as $function$
declare
  v_cfg internal.open_spanish_translation_catalog%rowtype;
  v_source_id uuid;
  v_url text;
  v_status integer;
  v_content text;
  v_payload jsonb;
  v_raw_sha text;
  v_books integer;
  v_chapters integer;
  v_verse_slots integer;
  v_inserted integer;
  v_visible integer;
  v_placeholders integer;
  v_bad integer;
begin
  select * into v_cfg from internal.open_spanish_translation_catalog
  where catalog_key=p_catalog_key and enabled;
  if not found then raise exception 'Traducción abierta no autorizada: %',p_catalog_key; end if;

  select id into v_source_id from public.biblical_sources
  where slug=v_cfg.source_slug and license_status='verified' and review_status='approved' and enabled;
  if v_source_id is null then raise exception 'Fuente aprobada no encontrada: %',v_cfg.source_slug; end if;

  v_url:='https://bible.helloao.org/api/'||v_cfg.helloao_id||'/complete.json';
  select h.status,h.content into v_status,v_content from extensions.http_get(v_url) h;
  if v_status<>200 or v_content is null then raise exception 'No se pudo recuperar %: HTTP %',v_cfg.helloao_id,v_status; end if;
  v_payload:=v_content::jsonb;
  v_raw_sha:=encode(extensions.digest(v_content,'sha256'),'hex');

  if v_payload#>>'{translation,id}'<>v_cfg.helloao_id then raise exception 'ID HelloAO inesperado'; end if;
  if v_payload#>>'{translation,sha256}'<>v_cfg.expected_sha256 then raise exception 'SHA anunciado inesperado'; end if;
  if (v_payload#>>'{translation,numberOfBooks}')::int<>v_cfg.expected_books then raise exception 'Conteo de libros inesperado'; end if;
  if (v_payload#>>'{translation,totalNumberOfChapters}')::int<>v_cfg.expected_chapters then raise exception 'Conteo de capítulos inesperado'; end if;
  if (v_payload#>>'{translation,totalNumberOfVerses}')::int<>v_cfg.expected_verses then raise exception 'Conteo de versículos inesperado'; end if;

  drop table if exists pg_temp.open_spanish_verses;
  create temporary table open_spanish_verses on commit drop as
  select
    book->>'id' book_code,
    (chapter->'chapter'->>'number')::smallint chapter,
    (verse->>'number')::smallint verse,
    coalesce(verse->'content'->>0,'') verse_text
  from jsonb_array_elements(v_payload->'books') book
  cross join lateral jsonb_array_elements(book->'chapters') chapter
  cross join lateral jsonb_array_elements(chapter->'chapter'->'content') verse
  where verse->>'type'='verse';

  select count(distinct book_code),count(distinct (book_code,chapter)),count(*)
  into v_books,v_chapters,v_verse_slots from open_spanish_verses;
  if v_books<>v_cfg.expected_books or v_chapters<>v_cfg.expected_chapters or v_verse_slots<>v_cfg.expected_verses then
    raise exception 'Estructura extraída no coincide: libros %, capítulos %, versículos %',v_books,v_chapters,v_verse_slots;
  end if;
  select count(*) into v_bad from open_spanish_verses
  where book_code not in (select code from public.biblical_books) or chapter<=0 or verse<=0;
  if v_bad<>0 then raise exception 'Hay % referencias fuera del canon esperado',v_bad; end if;

  insert into public.biblical_verse_texts(
    source_id,book_code,chapter,verse,language,original_text,normalized_text,transliteration,literal_translation_es,
    text_direction,token_count,analysis_status,source_locator,provider_version,content_hash,review_status,enabled,
    approved_at,approved_by,metadata
  )
  select
    v_source_id,v.book_code,v.chapter,v.verse,'spanish',v.verse_text,null,null,null,'ltr',
    case when btrim(v.verse_text)='' then 0 else cardinality(regexp_split_to_array(btrim(v.verse_text),E'\s+')) end::smallint,
    'verified',format('helloao:%s:%s.%s.%s',v_cfg.helloao_id,v.book_code,v.chapter,v.verse),v_cfg.expected_sha256,
    encode(extensions.digest(v.verse_text,'sha256'),'hex'),'approved',btrim(v.verse_text)<>'',now(),null,
    jsonb_build_object('text_role','translation','translation_id',v_cfg.helloao_id,'license',v_cfg.license_kind,
      'delivery_provider','HelloAO Bible API','payload_sha256',v_raw_sha,'advertised_sha256',v_cfg.expected_sha256,
      'placeholder',btrim(v.verse_text)='','text_unmodified',true,'generated_by_ai',false)
  from open_spanish_verses v
  on conflict(source_id,book_code,chapter,verse,language) do update set
    original_text=excluded.original_text,normalized_text=excluded.normalized_text,transliteration=excluded.transliteration,
    literal_translation_es=excluded.literal_translation_es,text_direction=excluded.text_direction,token_count=excluded.token_count,
    analysis_status=excluded.analysis_status,source_locator=excluded.source_locator,provider_version=excluded.provider_version,
    content_hash=excluded.content_hash,review_status=excluded.review_status,enabled=excluded.enabled,approved_at=excluded.approved_at,
    metadata=excluded.metadata,updated_at=now();
  get diagnostics v_inserted=row_count;

  select count(*) filter(where btrim(verse_text)<>'') ,count(*) filter(where btrim(verse_text)='')
  into v_visible,v_placeholders from open_spanish_verses;

  update public.biblical_sources
  set content_hash=v_raw_sha,provider_version=v_cfg.expected_sha256,
      metadata=metadata||jsonb_build_object('content_imported',true,'books',v_books,'chapters',v_chapters,
        'verse_slots',v_verse_slots,'visible_verses',v_visible,'placeholder_verses',v_placeholders,
        'helloao_advertised_sha256',v_cfg.expected_sha256,'raw_response_sha256',v_raw_sha,
        'delivery_provider','HelloAO Bible API','importer','open-spanish-v1','text_unmodified',true,'imported_at',now()),
      updated_at=now()
  where id=v_source_id;

  return jsonb_build_object('catalog_key',p_catalog_key,'source_slug',v_cfg.source_slug,'helloao_id',v_cfg.helloao_id,
    'books',v_books,'chapters',v_chapters,'verse_slots',v_verse_slots,'visible_verses',v_visible,
    'placeholder_verses',v_placeholders,'rows_upserted',v_inserted,'raw_response_sha256',v_raw_sha,
    'advertised_sha256',v_cfg.expected_sha256,'license',v_cfg.license_kind);
end
$function$;

revoke all on function internal.import_open_spanish_translation_v1(text) from public,anon,authenticated;
grant execute on function internal.import_open_spanish_translation_v1(text) to service_role;
