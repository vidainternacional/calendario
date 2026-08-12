-- FASE D — Cobertura bíblica integral: geografía por versículo.
-- Fuente fijada: OpenBible.info Bible Geocoding Data @ 7eb18a5ee62f27b9b93bd6689ea272d76dd23b8f
-- Licencia: CC BY 4.0. No importa imágenes; conserva solo su metadata/licencia de origen.

create table if not exists public.biblical_place_references (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.biblical_places(id) on delete cascade,
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
  unique(source_id, place_id, book_code, chapter, verse)
);

create index if not exists biblical_place_references_reference_idx
  on public.biblical_place_references(book_code, chapter, verse)
  where enabled and review_status = 'approved';

create index if not exists biblical_place_references_place_idx
  on public.biblical_place_references(place_id)
  where enabled and review_status = 'approved';

alter table public.biblical_place_references enable row level security;

revoke all on table public.biblical_place_references from public;
revoke all on table public.biblical_place_references from anon;
revoke all on table public.biblical_place_references from authenticated;
grant select on table public.biblical_place_references to authenticated;

create policy "Usuarios activos leen referencias geográficas aprobadas"
on public.biblical_place_references
for select
to authenticated
using (
  enabled
  and review_status = 'approved'
  and (select public.cuenta_activa())
  and exists (
    select 1
    from public.biblical_sources source
    where source.id = biblical_place_references.source_id
      and source.enabled
      and source.review_status = 'approved'
      and source.license_status in ('verified','varies_by_item')
  )
  and exists (
    select 1
    from public.biblical_places place
    where place.id = biblical_place_references.place_id
      and place.enabled
      and place.review_status = 'approved'
  )
);

insert into public.biblical_sources(
  slug,name,source_type,language,website,license_url,license_notes,license_status,
  provider,provider_ref,provider_version,content_hash,attribution,review_status,enabled,
  metadata,approved_at
)
values(
  'openbible-geocoding',
  'OpenBible.info — Bible Geocoding Data',
  'historical',
  'eng',
  'https://www.openbible.info/geo/',
  'https://creativecommons.org/licenses/by/4.0/',
  'Datos geográficos de lugares bíblicos bajo CC BY 4.0. Las imágenes tienen licencias individuales y no se importan como contenido de VIDA.',
  'verified',
  'OpenBible.info',
  'Bible-Geocoding-Data',
  '7eb18a5ee62f27b9b93bd6689ea272d76dd23b8f',
  'b8187aa4737e8517ccc090f765d2be11da4c548cd2a59d3cdcb62e952cb8c0f2',
  'OpenBible.info — Bible Geocoding Data, CC BY 4.0',
  'approved',
  true,
  jsonb_build_object(
    'repository','openbibleinfo/Bible-Geocoding-Data',
    'source_commit','7eb18a5ee62f27b9b93bd6689ea272d76dd23b8f',
    'ancient_jsonl_sha256','b8187aa4737e8517ccc090f765d2be11da4c548cd2a59d3cdcb62e952cb8c0f2',
    'ancient_jsonl_git_blob','b127b4446c6f4ba36ec62dde290c752afeb51bf3',
    'images_imported',false,
    'geometry_policy','Preserve exact source scores and all alternative resolutions; no inferred travel routes.',
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

create or replace function internal.import_openbible_geography_v1()
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, internal, pg_temp
as $function$
declare
  v_url constant text := 'https://raw.githubusercontent.com/openbibleinfo/Bible-Geocoding-Data/7eb18a5ee62f27b9b93bd6689ea272d76dd23b8f/data/ancient.jsonl';
  v_expected_sha constant text := 'b8187aa4737e8517ccc090f765d2be11da4c548cd2a59d3cdcb62e952cb8c0f2';
  v_response extensions.http_response;
  v_content text;
  v_sha text;
  v_source_id uuid;
  v_line text;
  v_record jsonb;
  v_ident jsonb;
  v_resolution jsonb;
  v_best_ident jsonb;
  v_best_resolution jsonb;
  v_resolution_score integer;
  v_best_score integer;
  v_identification_count integer;
  v_resolution_count integer;
  v_lonlat text;
  v_lat numeric;
  v_lon numeric;
  v_coordinate_precision text;
  v_certainty text;
  v_place_id uuid;
  v_place_count integer := 0;
  v_ref_count integer := 0;
  v_verse jsonb;
  v_usx text;
  v_match text[];
  v_book text;
  v_chapter integer;
  v_verse_num integer;
  v_chapter_count integer;
  v_source_hash text;
  v_place_kind text;
  v_uncertain boolean;
begin
  select id into v_source_id
  from public.biblical_sources
  where slug='openbible-geocoding'
    and enabled
    and review_status='approved'
    and license_status='verified';

  if v_source_id is null then
    raise exception 'Fuente OpenBible geocoding aprobada no encontrada';
  end if;

  v_response := extensions.http_get(v_url);
  if v_response.status <> 200 then
    raise exception 'No se pudo descargar OpenBible ancient.jsonl: HTTP %',v_response.status;
  end if;

  v_content := v_response.content;
  v_sha := encode(extensions.digest(convert_to(v_content,'UTF8'),'sha256'),'hex');
  if v_sha <> v_expected_sha then
    raise exception 'SHA OpenBible ancient.jsonl inesperado: %',v_sha;
  end if;

  foreach v_line in array string_to_array(v_content,E'\n') loop
    if btrim(v_line)='' then continue; end if;
    v_record := v_line::jsonb;

    if coalesce(v_record->>'id','')='' or coalesce(v_record->>'friendly_id','')='' then
      raise exception 'Lugar OpenBible sin id/nombre';
    end if;
    if jsonb_typeof(v_record->'identifications') <> 'array' or jsonb_array_length(v_record->'identifications')=0 then
      raise exception 'Lugar OpenBible % sin identificaciones',v_record->>'id';
    end if;

    v_best_ident := null;
    v_best_resolution := null;
    v_best_score := -2147483648;
    v_resolution_count := 0;
    v_identification_count := jsonb_array_length(v_record->'identifications');

    for v_ident in select value from jsonb_array_elements(v_record->'identifications') loop
      for v_resolution in select value from jsonb_array_elements(coalesce(v_ident->'resolutions','[]'::jsonb)) loop
        v_resolution_count := v_resolution_count + 1;
        v_resolution_score := greatest(
          coalesce((v_ident#>>'{score,time_total}')::integer,0),
          coalesce((v_resolution->>'best_time_score')::integer,0)
        );
        if v_best_resolution is null
           or v_resolution_score > v_best_score
           or (v_resolution_score = v_best_score and coalesce((v_resolution->>'best_path_score')::integer,0) > coalesce((v_best_resolution->>'best_path_score')::integer,0)) then
          v_best_ident := v_ident;
          v_best_resolution := v_resolution;
          v_best_score := v_resolution_score;
        end if;
      end loop;
    end loop;

    if v_best_resolution is null then
      raise exception 'Lugar OpenBible % sin resolución final',v_record->>'id';
    end if;

    v_lon := null;
    v_lat := null;
    v_lonlat := nullif(v_best_resolution->>'lonlat','');
    if v_lonlat is not null and v_lonlat ~ '^-?[0-9]+(?:\.[0-9]+)?,-?[0-9]+(?:\.[0-9]+)?$' then
      v_lon := split_part(v_lonlat,',',1)::numeric;
      v_lat := split_part(v_lonlat,',',2)::numeric;
    end if;

    if v_lon is null then
      v_coordinate_precision := 'unknown';
    elsif coalesce(v_best_resolution->>'lonlat_type','') ilike '%representative%'
       or coalesce(v_best_resolution->>'ancient_geometry','') in ('region','path','polygon') then
      v_coordinate_precision := 'regional';
    else
      -- Incluso un punto moderno exacto puede ser solo una identificación aproximada del lugar antiguo.
      v_coordinate_precision := 'approximate';
    end if;

    v_uncertain := coalesce((v_best_ident#>>'{tags,confidence_unlikely}')::integer,0) > 0
      or coalesce((v_best_ident#>>'{tags,confidence_no}')::integer,0) > 0
      or coalesce((v_best_ident#>>'{tags,unknown}')::integer,0) > 0
      or coalesce((v_best_ident#>>'{tags,uncertain}')::integer,0) > 0;

    if v_best_score >= 500 then
      v_certainty := 'high';
    elsif v_uncertain then
      v_certainty := 'low';
    elsif v_identification_count > 1 or v_resolution_count > 1 then
      v_certainty := 'disputed';
    else
      v_certainty := 'medium';
    end if;

    v_place_kind := coalesce(nullif(v_best_resolution->>'type',''),nullif(v_best_ident->>'class',''),'unknown');
    v_source_hash := encode(extensions.digest(convert_to(v_line,'UTF8'),'sha256'),'hex');

    insert into public.biblical_places(
      slug,canonical_name_es,alternate_names,place_kind,external_provider,external_ref,
      latitude,longitude,coordinate_precision,certainty_level,source_id,source_locator,
      provider_version,content_hash,review_status,enabled,metadata
    ) values(
      'openbible-'||(v_record->>'id'),
      v_record->>'friendly_id',
      array[]::text[],
      v_place_kind,
      'OpenBible.info',
      v_record->>'id',
      v_lat,v_lon,v_coordinate_precision,v_certainty,v_source_id,
      v_url||'#'||(v_record->>'id'),
      '7eb18a5ee62f27b9b93bd6689ea272d76dd23b8f',
      v_source_hash,'approved',true,
      jsonb_build_object(
        'source_label',v_record->>'friendly_id',
        'source_label_language','en',
        'spanish_label_status','pending_editorial_localization',
        'url_slug',v_record->>'url_slug',
        'geojson_file',v_record->>'geojson_file',
        'geometry_credit',v_record->>'geometry_credit',
        'best_confidence_score',v_best_score,
        'identification_count',v_identification_count,
        'resolution_count',v_resolution_count,
        'coarse_certainty_policy','high: source score >=500; low: explicit unlikely/no/unknown/uncertain tag; disputed: multiple alternatives; otherwise medium',
        'best_identification',v_best_ident,
        'best_resolution',v_best_resolution,
        'all_identifications',v_record->'identifications',
        'extra',v_record->'extra',
        'image_content_imported',false,
        'generated_by_ai',false
      )
    )
    on conflict(slug) do update set
      canonical_name_es=excluded.canonical_name_es,
      place_kind=excluded.place_kind,
      external_provider=excluded.external_provider,
      external_ref=excluded.external_ref,
      latitude=excluded.latitude,
      longitude=excluded.longitude,
      coordinate_precision=excluded.coordinate_precision,
      certainty_level=excluded.certainty_level,
      source_id=excluded.source_id,
      source_locator=excluded.source_locator,
      provider_version=excluded.provider_version,
      content_hash=excluded.content_hash,
      review_status=excluded.review_status,
      enabled=excluded.enabled,
      metadata=excluded.metadata,
      updated_at=now()
    returning id into v_place_id;

    v_place_count := v_place_count + 1;

    for v_verse in select value from jsonb_array_elements(coalesce(v_record->'verses','[]'::jsonb)) loop
      v_usx := v_verse->>'usx';
      select regexp_match(v_usx,'^([1-3A-Z]+) ([0-9]+):([0-9]+)$') into v_match;
      if v_match is null then
        raise exception 'Referencia USX OpenBible inválida: %',v_usx;
      end if;

      v_book := v_match[1];
      v_chapter := v_match[2]::integer;
      v_verse_num := v_match[3]::integer;

      select chapter_count into v_chapter_count
      from public.biblical_books
      where code=v_book and enabled and review_status='approved';
      if v_chapter_count is null or v_chapter < 1 or v_chapter > v_chapter_count or v_verse_num < 1 then
        raise exception 'Referencia OpenBible fuera del canon VIDA: %',v_usx;
      end if;

      insert into public.biblical_place_references(
        place_id,book_code,chapter,verse,source_id,source_locator,provider_version,
        content_hash,review_status,enabled,metadata
      ) values(
        v_place_id,v_book,v_chapter::smallint,v_verse_num::smallint,v_source_id,
        v_url||'#'||(v_record->>'id')||'/'||replace(v_usx,' ','_'),
        '7eb18a5ee62f27b9b93bd6689ea272d76dd23b8f',
        encode(extensions.digest(convert_to((v_record->>'id')||'|'||v_verse::text,'UTF8'),'sha256'),'hex'),
        'approved',true,
        v_verse || jsonb_build_object('openbible_place_id',v_record->>'id','generated_by_ai',false)
      )
      on conflict(source_id,place_id,book_code,chapter,verse) do update set
        source_locator=excluded.source_locator,
        provider_version=excluded.provider_version,
        content_hash=excluded.content_hash,
        review_status=excluded.review_status,
        enabled=excluded.enabled,
        metadata=excluded.metadata,
        updated_at=now();

      v_ref_count := v_ref_count + 1;
    end loop;
  end loop;

  if v_place_count <> 1342 or v_ref_count <> 8742 then
    raise exception 'Conteos OpenBible inesperados: places %, refs %',v_place_count,v_ref_count;
  end if;

  update public.biblical_sources
  set metadata = metadata || jsonb_build_object(
        'imported_places',v_place_count,
        'imported_place_verse_references',v_ref_count,
        'imported_at',now(),
        'ancient_jsonl_sha256',v_sha
      ),
      content_hash=v_sha,
      updated_at=now()
  where id=v_source_id;

  return jsonb_build_object(
    'source','openbible-geocoding',
    'source_commit','7eb18a5ee62f27b9b93bd6689ea272d76dd23b8f',
    'sha256',v_sha,
    'places',v_place_count,
    'verse_references',v_ref_count,
    'images_imported',false,
    'generated_by_ai',false
  );
end
$function$;

revoke all on function internal.import_openbible_geography_v1() from public;
revoke all on function internal.import_openbible_geography_v1() from anon;
revoke all on function internal.import_openbible_geography_v1() from authenticated;
grant execute on function internal.import_openbible_geography_v1() to service_role;
