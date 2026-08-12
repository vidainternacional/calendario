-- FASE D — Cobertura bíblica integral: cronología narrativa verificable.
-- Fuente primaria fijada: Theographic Bible Metadata @ cfb1c485d4da6fb63a69cb3b7f5b0752792f46bc
-- Licencia: CC BY-SA 4.0.
--
-- Política de rigor:
-- - NO se importan startDate/duration/sortKey como fechas históricas de VIDA.
-- - Theographic documenta Events/startDate/sortKey como incompletos y su bibliografía
--   cronológica responde a sistemas editoriales concretos.
-- - El orden publicado por VIDA es exclusivamente narrativo/canónico, derivado del
--   primer versículo enlazado a cada evento.
-- - Los 450 títulos fuente permanecen staged (enabled=false) hasta localización
--   editorial al español y auditoría del motor de Estudio.

create table if not exists public.biblical_timeline_event_references (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.biblical_timeline_events(id) on delete cascade,
  book_code text not null references public.biblical_books(code) on delete restrict,
  chapter smallint not null check (chapter > 0),
  verse smallint not null check (verse > 0),
  source_id uuid not null references public.biblical_sources(id) on delete restrict,
  source_locator text not null,
  provider_version text,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  review_status text not null default 'pending' check (review_status in ('pending','approved','rejected')),
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_id,event_id,book_code,chapter,verse)
);

create index if not exists biblical_timeline_event_references_reference_idx
  on public.biblical_timeline_event_references(book_code,chapter,verse)
  where enabled and review_status='approved';

create index if not exists biblical_timeline_event_references_event_idx
  on public.biblical_timeline_event_references(event_id)
  where enabled and review_status='approved';

alter table public.biblical_timeline_event_references enable row level security;
revoke all on table public.biblical_timeline_event_references from public;
revoke all on table public.biblical_timeline_event_references from anon;
revoke all on table public.biblical_timeline_event_references from authenticated;
grant select on table public.biblical_timeline_event_references to authenticated;

drop policy if exists "Usuarios activos leen referencias cronológicas aprobadas"
on public.biblical_timeline_event_references;

create policy "Usuarios activos leen referencias cronológicas aprobadas"
on public.biblical_timeline_event_references
for select
to authenticated
using (
  enabled
  and review_status='approved'
  and (select public.cuenta_activa())
  and exists (
    select 1
    from public.biblical_sources source
    where source.id=biblical_timeline_event_references.source_id
      and source.enabled
      and source.review_status='approved'
      and source.license_status in ('verified','varies_by_item')
  )
  and exists (
    select 1
    from public.biblical_timeline_events event
    where event.id=biblical_timeline_event_references.event_id
      and event.enabled
      and event.review_status='approved'
  )
);

insert into public.biblical_sources(
  slug,name,source_type,language,website,license_url,license_notes,license_status,
  provider,provider_ref,provider_version,content_hash,attribution,review_status,enabled,
  metadata,approved_at
)
values(
  'theographic-narrative-events',
  'Theographic Bible Metadata — Narrative Events',
  'historical',
  'eng',
  'https://github.com/robertrouse/theographic-bible-metadata',
  'https://creativecommons.org/licenses/by-sa/4.0/',
  'Dataset publicado bajo CC BY-SA 4.0. VIDA usa títulos y relaciones evento↔versículo como índice narrativo; no presenta las fechas absolutas de Theographic como cronología histórica.',
  'verified',
  'Theographic',
  'theographic-bible-metadata-events',
  'cfb1c485d4da6fb63a69cb3b7f5b0752792f46bc',
  '59dc86b8ff124813488fa036ffb70ff83127e024aa6ccd326c905d5c5018b5a9',
  'Theographic Bible Metadata, CC BY-SA 4.0',
  'approved',
  true,
  jsonb_build_object(
    'repository','robertrouse/theographic-bible-metadata',
    'source_commit','cfb1c485d4da6fb63a69cb3b7f5b0752792f46bc',
    'events_json_git_blob','1dad362f4ea5d5374b412a51c16f23ca9f8557b5',
    'events_json_sha256','59dc86b8ff124813488fa036ffb70ff83127e024aa6ccd326c905d5c5018b5a9',
    'verses_json_git_blob','3d9dd75698eb2de0f8e0a0df0d0e5b0f90e0ed42',
    'verses_json_sha256','471b7d7648acd4cf5300437acd9d048514f6a5da1f34f4ce2e43ef9eeec0e858',
    'events_documentation_status','Events, startDate and sortKey documented by provider as Incomplete',
    'chronology_policy','Absolute source dates retained only as provenance/not_for_display; VIDA order is canonical narrative order from linked verses.',
    'titles_language','en',
    'titles_spanish_status','pending_editorial_localization',
    'generated_by_ai',false
  ),
  now()
)
on conflict(slug) do update set
  name=excluded.name,
  source_type=excluded.source_type,
  language=excluded.language,
  website=excluded.website,
  license_url=excluded.license_url,
  license_notes=excluded.license_notes,
  license_status=excluded.license_status,
  provider=excluded.provider,
  provider_ref=excluded.provider_ref,
  provider_version=excluded.provider_version,
  content_hash=excluded.content_hash,
  attribution=excluded.attribution,
  review_status=excluded.review_status,
  enabled=excluded.enabled,
  metadata=excluded.metadata,
  approved_at=coalesce(public.biblical_sources.approved_at,excluded.approved_at),
  updated_at=now();

create or replace function internal.import_theographic_narrative_events_v1()
returns jsonb
language plpgsql
security definer
set search_path=public,extensions,internal,pg_temp
as $function$
declare
  v_events_url constant text := 'https://raw.githubusercontent.com/robertrouse/theographic-bible-metadata/cfb1c485d4da6fb63a69cb3b7f5b0752792f46bc/json/events.json';
  v_verses_url constant text := 'https://raw.githubusercontent.com/robertrouse/theographic-bible-metadata/cfb1c485d4da6fb63a69cb3b7f5b0752792f46bc/json/verses.json';
  v_events_sha_expected constant text := '59dc86b8ff124813488fa036ffb70ff83127e024aa6ccd326c905d5c5018b5a9';
  v_verses_sha_expected constant text := '471b7d7648acd4cf5300437acd9d048514f6a5da1f34f4ce2e43ef9eeec0e858';
  v_events_response extensions.http_response;
  v_verses_response extensions.http_response;
  v_events_content text;
  v_verses_content text;
  v_events_sha text;
  v_verses_sha text;
  v_source_id uuid;
  v_count integer;
  v_ref_count integer;
  v_missing integer;
  v_bad integer;
begin
  select id into v_source_id
  from public.biblical_sources
  where slug='theographic-narrative-events'
    and enabled
    and review_status='approved'
    and license_status='verified';

  if v_source_id is null then
    raise exception 'Fuente Theographic narrative events aprobada no encontrada';
  end if;

  v_events_response := extensions.http_get(v_events_url);
  if v_events_response.status<>200 then
    raise exception 'No se pudo descargar Theographic events.json: HTTP %',v_events_response.status;
  end if;
  v_events_content := v_events_response.content;
  v_events_sha := encode(extensions.digest(convert_to(v_events_content,'UTF8'),'sha256'),'hex');
  if v_events_sha<>v_events_sha_expected then
    raise exception 'SHA Theographic events.json inesperado: %',v_events_sha;
  end if;

  v_verses_response := extensions.http_get(v_verses_url);
  if v_verses_response.status<>200 then
    raise exception 'No se pudo descargar Theographic verses.json: HTTP %',v_verses_response.status;
  end if;
  v_verses_content := v_verses_response.content;
  v_verses_sha := encode(extensions.digest(convert_to(v_verses_content,'UTF8'),'sha256'),'hex');
  if v_verses_sha<>v_verses_sha_expected then
    raise exception 'SHA Theographic verses.json inesperado: %',v_verses_sha;
  end if;

  drop table if exists pg_temp.vida_theographic_verses;
  drop table if exists pg_temp.vida_theographic_events;
  drop table if exists pg_temp.vida_theographic_event_refs;
  drop table if exists pg_temp.vida_theographic_event_stats;

  create temporary table vida_theographic_verses on commit drop as
  select
    value->>'id' as record_id,
    value->'fields'->>'osisRef' as osis_ref,
    (value->'fields'->>'verseID')::bigint as verse_id,
    floor(((value->'fields'->>'verseID')::bigint)/1000000.0)::integer as book_order,
    floor((((value->'fields'->>'verseID')::bigint % 1000000))/1000.0)::integer as chapter,
    (((value->'fields'->>'verseID')::bigint % 1000))::integer as verse
  from jsonb_array_elements(v_verses_content::jsonb);

  select count(*) into v_count from pg_temp.vida_theographic_verses;
  if v_count<>31102 then
    raise exception 'Conteo Theographic verses inesperado: %',v_count;
  end if;

  create temporary table vida_theographic_events on commit drop as
  select value->>'id' as record_id, value->'fields' as fields, value as source_record
  from jsonb_array_elements(v_events_content::jsonb);

  select count(*) into v_count from pg_temp.vida_theographic_events;
  if v_count<>450 then
    raise exception 'Conteo Theographic events inesperado: %',v_count;
  end if;

  if (select count(distinct lower(record_id)) from pg_temp.vida_theographic_events)<>450 then
    raise exception 'Colisión de IDs Theographic al normalizar slug';
  end if;

  create temporary table vida_theographic_event_refs on commit drop as
  select
    e.record_id as event_record_id,
    verse_record.value #>> '{}' as verse_record_id,
    v.osis_ref,v.verse_id,v.book_order,v.chapter,v.verse,
    b.code as book_code,b.chapter_count
  from pg_temp.vida_theographic_events e
  cross join lateral jsonb_array_elements(coalesce(e.fields->'verses','[]'::jsonb)) verse_record
  left join pg_temp.vida_theographic_verses v on v.record_id=(verse_record.value #>> '{}')
  left join public.biblical_books b on b.canonical_order=v.book_order;

  select count(*) into v_ref_count from pg_temp.vida_theographic_event_refs;
  if v_ref_count<>17570 then
    raise exception 'Conteo Theographic event↔verse inesperado: %',v_ref_count;
  end if;

  select count(*) into v_missing
  from pg_temp.vida_theographic_event_refs
  where verse_id is null or book_code is null;
  if v_missing<>0 then
    raise exception 'Referencias Theographic no resueltas: %',v_missing;
  end if;

  select count(*) into v_bad
  from pg_temp.vida_theographic_event_refs
  where chapter<1 or chapter>chapter_count or verse<1;
  if v_bad<>0 then
    raise exception 'Referencias Theographic fuera del canon VIDA: %',v_bad;
  end if;

  select count(*) into v_bad
  from (
    select event_record_id,book_code,chapter,verse,count(*)
    from pg_temp.vida_theographic_event_refs
    group by 1,2,3,4
    having count(*)>1
  ) duplicated;
  if v_bad<>0 then
    raise exception 'Referencias Theographic duplicadas dentro de evento: %',v_bad;
  end if;

  create temporary table vida_theographic_event_stats on commit drop as
  select event_record_id,min(verse_id) as min_verse_id,max(verse_id) as max_verse_id,count(*)::integer as reference_count
  from pg_temp.vida_theographic_event_refs
  group by event_record_id;

  if (select count(*) from pg_temp.vida_theographic_event_stats)<>450 then
    raise exception 'Hay eventos Theographic sin referencias bíblicas';
  end if;

  with ranked as (
    select
      e.record_id,e.fields,e.source_record,s.min_verse_id,s.max_verse_id,s.reference_count,
      row_number() over(order by s.min_verse_id,e.record_id)::integer as narrative_order,
      b_start.code as start_code,
      floor((s.min_verse_id % 1000000)/1000.0)::integer as start_chapter,
      (s.min_verse_id % 1000)::integer as start_verse,
      b_end.code as end_code,
      floor((s.max_verse_id % 1000000)/1000.0)::integer as end_chapter,
      (s.max_verse_id % 1000)::integer as end_verse
    from pg_temp.vida_theographic_events e
    join pg_temp.vida_theographic_event_stats s on s.event_record_id=e.record_id
    join public.biblical_books b_start on b_start.canonical_order=floor(s.min_verse_id/1000000.0)::integer
    join public.biblical_books b_end on b_end.canonical_order=floor(s.max_verse_id/1000000.0)::integer
  )
  insert into public.biblical_timeline_events(
    slug,title,summary,period_id,start_book_code,start_chapter,start_verse,end_book_code,end_chapter,end_verse,
    start_year,end_year,era,relative_order,date_precision,certainty_level,controversy_note,
    source_id,source_locator,provider_version,content_hash,review_status,enabled,metadata
  )
  select
    'theographic-event-'||lower(r.record_id),r.fields->>'title',null,null,
    r.start_code,r.start_chapter::smallint,r.start_verse::smallint,r.end_code,r.end_chapter::smallint,r.end_verse::smallint,
    null,null,'relative',r.narrative_order,'relative','medium',null,
    v_source_id,v_events_url||'#'||r.record_id,
    'cfb1c485d4da6fb63a69cb3b7f5b0752792f46bc',
    encode(extensions.digest(convert_to(r.source_record::text,'UTF8'),'sha256'),'hex'),
    'approved',false,
    jsonb_build_object(
      'source_record_id',r.record_id,
      'source_title',r.fields->>'title',
      'source_title_language','en',
      'spanish_title_status','pending_editorial_localization',
      'reference_count',r.reference_count,
      'reference_bounds_only',true,
      'exact_references_table','biblical_timeline_event_references',
      'ordering_basis','first linked verse in Protestant canonical order',
      'absolute_date_imported',false,
      'source_chronology_not_for_display',jsonb_strip_nulls(jsonb_build_object(
        'startDate',r.fields->>'startDate','duration',r.fields->>'duration','sortKey',r.fields->>'sortKey',
        'rangeFlag',r.fields->'rangeFlag','lag',r.fields->>'lag','lagType',r.fields->>'lagType'
      )),
      'source_chronology_status','provider documents event chronology fields as incomplete; retained only for provenance',
      'participants_source_ids',coalesce(r.fields->'participants','[]'::jsonb),
      'locations_source_ids',coalesce(r.fields->'locations','[]'::jsonb),
      'predecessor_source_ids',coalesce(r.fields->'predecessor','[]'::jsonb),
      'part_of_source_ids',coalesce(r.fields->'partOf','[]'::jsonb),
      'source_event_id',r.fields->'eventID',
      'source_record_hash_basis','normalized jsonb text',
      'generated_by_ai',false,
      'staged_reason','Spanish editorial localization and Study-engine audit pending before visibility.'
    )
  from ranked r
  on conflict(slug) do update set
    title=excluded.title,summary=excluded.summary,period_id=excluded.period_id,
    start_book_code=excluded.start_book_code,start_chapter=excluded.start_chapter,start_verse=excluded.start_verse,
    end_book_code=excluded.end_book_code,end_chapter=excluded.end_chapter,end_verse=excluded.end_verse,
    start_year=excluded.start_year,end_year=excluded.end_year,era=excluded.era,relative_order=excluded.relative_order,
    date_precision=excluded.date_precision,certainty_level=excluded.certainty_level,controversy_note=excluded.controversy_note,
    source_id=excluded.source_id,source_locator=excluded.source_locator,provider_version=excluded.provider_version,
    content_hash=excluded.content_hash,review_status=excluded.review_status,enabled=excluded.enabled,
    metadata=excluded.metadata,updated_at=now();

  insert into public.biblical_timeline_event_references(
    event_id,book_code,chapter,verse,source_id,source_locator,provider_version,content_hash,review_status,enabled,metadata
  )
  select
    event.id,ref.book_code,ref.chapter::smallint,ref.verse::smallint,v_source_id,
    v_events_url||'#'||ref.event_record_id||'/'||ref.verse_record_id,
    'cfb1c485d4da6fb63a69cb3b7f5b0752792f46bc',
    encode(extensions.digest(convert_to(ref.event_record_id||'|'||ref.verse_record_id||'|'||ref.osis_ref||'|'||ref.verse_id::text,'UTF8'),'sha256'),'hex'),
    'approved',false,
    jsonb_build_object(
      'event_source_record_id',ref.event_record_id,
      'verse_source_record_id',ref.verse_record_id,
      'osis_ref',ref.osis_ref,
      'verse_id',ref.verse_id,
      'generated_by_ai',false,
      'staged_reason','Parent narrative event remains non-visible pending Spanish localization and Study-engine audit.'
    )
  from pg_temp.vida_theographic_event_refs ref
  join public.biblical_timeline_events event on event.slug='theographic-event-'||lower(ref.event_record_id)
  on conflict(source_id,event_id,book_code,chapter,verse) do update set
    source_locator=excluded.source_locator,provider_version=excluded.provider_version,content_hash=excluded.content_hash,
    review_status=excluded.review_status,enabled=excluded.enabled,metadata=excluded.metadata,updated_at=now();

  if (select count(*) from public.biblical_timeline_events where source_id=v_source_id)<>450 then
    raise exception 'Conteo final de eventos Theographic inesperado';
  end if;
  if (select count(*) from public.biblical_timeline_event_references where source_id=v_source_id)<>17570 then
    raise exception 'Conteo final de referencias Theographic inesperado';
  end if;

  update public.biblical_sources
  set metadata=metadata||jsonb_build_object(
        'imported_events',450,
        'imported_event_verse_references',17570,
        'source_verse_records',31102,
        'events_json_sha256',v_events_sha,
        'verses_json_sha256',v_verses_sha,
        'visible_in_app',false,
        'imported_at',now()
      ),
      content_hash=v_events_sha,
      updated_at=now()
  where id=v_source_id;

  return jsonb_build_object(
    'source','theographic-narrative-events',
    'source_commit','cfb1c485d4da6fb63a69cb3b7f5b0752792f46bc',
    'events_sha256',v_events_sha,
    'verses_sha256',v_verses_sha,
    'events',450,
    'event_verse_references',17570,
    'absolute_dates_imported',false,
    'visible_in_app',false,
    'generated_by_ai',false
  );
end
$function$;

revoke all on function internal.import_theographic_narrative_events_v1() from public;
revoke all on function internal.import_theographic_narrative_events_v1() from anon;
revoke all on function internal.import_theographic_narrative_events_v1() from authenticated;
grant execute on function internal.import_theographic_narrative_events_v1() to service_role;
