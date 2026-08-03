-- FASE D · Bloque 5
-- CANDIDATA DE IMPORTACIÓN NO AUTORIZADA PARA PRODUCCIÓN
-- Importa únicamente el paquete fijado rome-pilot-v1 y mantiene todo pending/disabled.

begin;

do $import$
declare
  v_package_key constant text := 'rome-pilot-v1';
  v_package_hash constant text := '67efcaa4e4cae2ec6f908f60a97850a1b7fd6ee223496fbc17438a87ea3a0550';
  v_source_id uuid;
  v_place_id uuid;
  v_period_id uuid;
  v_romans_event_id uuid;
  v_acts_event_id uuid;
  v_count integer;
begin
  select id
    into v_source_id
  from public.biblical_sources
  where slug = 'pleiades-gazetteer'
    and provider = 'Pleiades'
    and provider_ref = 'gazetteer'
    and provider_version = 'accessed-2026-07-31'
    and license_status = 'verified'
    and review_status = 'approved'
    and enabled
    and attribution like '%CC BY 3.0%';

  if v_source_id is null then
    raise exception 'Fuente Pleiades aprobada, habilitada y con licencia verificada no encontrada';
  end if;

  select count(*)
    into v_count
  from public.biblical_context_fragments
  where source_id = v_source_id
    and review_status = 'approved'
    and enabled
    and (
      (slug = 'roma-capital-romanos'
        and content_hash = 'a2f4808cb82111e86f5b4c56f22cb6266d501fae422562992c2965e02bc4767c')
      or
      (slug = 'roma-capital-hechos-28'
        and content_hash = 'fb892d134ef1edd6b4954d27e0c8495bc5ac5fdb808b79ddbc3ef3300ec98969')
    );

  if v_count <> 2 then
    raise exception 'Los fragmentos contextuales de Roma no coinciden con el paquete fijado';
  end if;

  if not exists (
    select 1 from public.biblical_books
    where code = 'ROM' and chapter_count = 16 and review_status = 'approved' and enabled
  ) or not exists (
    select 1 from public.biblical_books
    where code = 'ACT' and chapter_count = 28 and review_status = 'approved' and enabled
  ) then
    raise exception 'El catálogo canónico requerido para ROM y ACT no está aprobado';
  end if;

  if exists (
    select 1 from public.biblical_places
    where slug = 'roma'
      and (metadata ->> 'package_key') is distinct from v_package_key
  ) then
    raise exception 'El slug roma ya pertenece a otro paquete';
  end if;

  if exists (
    select 1 from public.biblical_timeline_periods
    where slug = 'roma-romanos-hechos-28'
      and (metadata ->> 'package_key') is distinct from v_package_key
  ) then
    raise exception 'El periodo piloto ya pertenece a otro paquete';
  end if;

  if exists (
    select 1 from public.biblical_timeline_events
    where slug in ('roma-destinatarios-romanos', 'pablo-llega-a-roma-hechos-28')
      and (metadata ->> 'package_key') is distinct from v_package_key
  ) then
    raise exception 'Un evento piloto ya pertenece a otro paquete';
  end if;

  insert into public.biblical_places (
    slug,
    canonical_name_es,
    alternate_names,
    place_kind,
    external_provider,
    external_ref,
    latitude,
    longitude,
    coordinate_precision,
    certainty_level,
    source_id,
    source_locator,
    provider_version,
    content_hash,
    review_status,
    enabled,
    metadata
  ) values (
    'roma',
    'Roma',
    array['Rome', 'Roma'],
    'city',
    'Pleiades',
    '423025',
    41.889977,
    12.491258,
    'approximate',
    'high',
    v_source_id,
    'https://pleiades.stoa.org/places/423025',
    'pleiades-place-423025-accessed-2026-07-31',
    '768fa98567a49be10e85ae29f748eea8a48fba471a56fbeb1b461f492cdd55ee',
    'pending',
    false,
    jsonb_build_object(
      'api_uri', 'https://pleiades.stoa.org/places/423025/json',
      'coordinate_basis', 'Pleiades reprPoint rounded to six decimals',
      'source_description', 'The capital of the Roman Republic and Empire.',
      'place_types', jsonb_build_array('urban', 'settlement'),
      'package_key', v_package_key,
      'package_hash', v_package_hash
    )
  )
  on conflict (slug) do update set
    canonical_name_es = excluded.canonical_name_es,
    alternate_names = excluded.alternate_names,
    place_kind = excluded.place_kind,
    external_provider = excluded.external_provider,
    external_ref = excluded.external_ref,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    coordinate_precision = excluded.coordinate_precision,
    certainty_level = excluded.certainty_level,
    source_id = excluded.source_id,
    source_locator = excluded.source_locator,
    provider_version = excluded.provider_version,
    content_hash = excluded.content_hash,
    review_status = 'pending',
    enabled = false,
    metadata = excluded.metadata
  returning id into v_place_id;

  insert into public.biblical_timeline_periods (
    slug,
    title,
    start_year,
    end_year,
    era,
    chronology_system,
    date_precision,
    certainty_level,
    source_id,
    source_locator,
    provider_version,
    content_hash,
    review_status,
    enabled,
    metadata
  ) values (
    'roma-romanos-hechos-28',
    'Roma en el contexto de Romanos y Hechos 28',
    null,
    null,
    'relative',
    'biblical-relative',
    'relative',
    'medium',
    v_source_id,
    'https://pleiades.stoa.org/places/423025',
    'pleiades-place-423025-accessed-2026-07-31',
    '968637654ac8aefa36ebb849b10a47b6e1ec62ec1b1aa56d66e35aa126e09a54',
    'pending',
    false,
    jsonb_build_object(
      'basis_fragments', jsonb_build_array('roma-capital-romanos', 'roma-capital-hechos-28'),
      'date_policy', 'No absolute year asserted by this package.',
      'package_key', v_package_key,
      'package_hash', v_package_hash
    )
  )
  on conflict (slug) do update set
    title = excluded.title,
    start_year = excluded.start_year,
    end_year = excluded.end_year,
    era = excluded.era,
    chronology_system = excluded.chronology_system,
    date_precision = excluded.date_precision,
    certainty_level = excluded.certainty_level,
    source_id = excluded.source_id,
    source_locator = excluded.source_locator,
    provider_version = excluded.provider_version,
    content_hash = excluded.content_hash,
    review_status = 'pending',
    enabled = false,
    metadata = excluded.metadata
  returning id into v_period_id;

  insert into public.biblical_timeline_events (
    slug,
    title,
    summary,
    period_id,
    start_book_code,
    start_chapter,
    start_verse,
    end_book_code,
    end_chapter,
    end_verse,
    start_year,
    end_year,
    era,
    relative_order,
    date_precision,
    certainty_level,
    controversy_note,
    source_id,
    source_locator,
    provider_version,
    content_hash,
    review_status,
    enabled,
    metadata
  ) values (
    'roma-destinatarios-romanos',
    'Roma como destino de la carta a los Romanos',
    'Relación editorial entre Roma y el marco completo de Romanos 1–16, basada en el fragmento contextual aprobado.',
    v_period_id,
    'ROM', 1, null,
    'ROM', 16, null,
    null, null,
    'relative',
    1,
    'relative',
    'medium',
    null,
    v_source_id,
    'https://pleiades.stoa.org/places/423025',
    'pleiades-place-423025-accessed-2026-07-31',
    '0ad8cbe5c8e4499022298e7446432f44892ed3dbad9a2514d209ff38b97d36c6',
    'pending',
    false,
    jsonb_build_object(
      'context_fragment_slug', 'roma-capital-romanos',
      'context_fragment_hash', 'a2f4808cb82111e86f5b4c56f22cb6266d501fae422562992c2965e02bc4767c',
      'relation_kind', 'editorial_link',
      'package_key', v_package_key,
      'package_hash', v_package_hash
    )
  )
  on conflict (slug) do update set
    title = excluded.title,
    summary = excluded.summary,
    period_id = excluded.period_id,
    start_book_code = excluded.start_book_code,
    start_chapter = excluded.start_chapter,
    start_verse = excluded.start_verse,
    end_book_code = excluded.end_book_code,
    end_chapter = excluded.end_chapter,
    end_verse = excluded.end_verse,
    start_year = excluded.start_year,
    end_year = excluded.end_year,
    era = excluded.era,
    relative_order = excluded.relative_order,
    date_precision = excluded.date_precision,
    certainty_level = excluded.certainty_level,
    controversy_note = excluded.controversy_note,
    source_id = excluded.source_id,
    source_locator = excluded.source_locator,
    provider_version = excluded.provider_version,
    content_hash = excluded.content_hash,
    review_status = 'pending',
    enabled = false,
    metadata = excluded.metadata
  returning id into v_romans_event_id;

  insert into public.biblical_timeline_events (
    slug,
    title,
    summary,
    period_id,
    start_book_code,
    start_chapter,
    start_verse,
    end_book_code,
    end_chapter,
    end_verse,
    start_year,
    end_year,
    era,
    relative_order,
    date_precision,
    certainty_level,
    controversy_note,
    source_id,
    source_locator,
    provider_version,
    content_hash,
    review_status,
    enabled,
    metadata
  ) values (
    'pablo-llega-a-roma-hechos-28',
    'Llegada de Pablo a Roma',
    'Relación editorial entre Roma y Hechos 28:14–31, basada en el fragmento contextual aprobado.',
    v_period_id,
    'ACT', 28, 14,
    'ACT', 28, 31,
    null, null,
    'relative',
    2,
    'relative',
    'medium',
    null,
    v_source_id,
    'https://pleiades.stoa.org/places/423025',
    'pleiades-place-423025-accessed-2026-07-31',
    '1c97d3f44fc5453830ee09e8910b2519519adc9a1f6f4c6f4cf6fb57d101cd2d',
    'pending',
    false,
    jsonb_build_object(
      'context_fragment_slug', 'roma-capital-hechos-28',
      'context_fragment_hash', 'fb892d134ef1edd6b4954d27e0c8495bc5ac5fdb808b79ddbc3ef3300ec98969',
      'relation_kind', 'editorial_link',
      'package_key', v_package_key,
      'package_hash', v_package_hash
    )
  )
  on conflict (slug) do update set
    title = excluded.title,
    summary = excluded.summary,
    period_id = excluded.period_id,
    start_book_code = excluded.start_book_code,
    start_chapter = excluded.start_chapter,
    start_verse = excluded.start_verse,
    end_book_code = excluded.end_book_code,
    end_chapter = excluded.end_chapter,
    end_verse = excluded.end_verse,
    start_year = excluded.start_year,
    end_year = excluded.end_year,
    era = excluded.era,
    relative_order = excluded.relative_order,
    date_precision = excluded.date_precision,
    certainty_level = excluded.certainty_level,
    controversy_note = excluded.controversy_note,
    source_id = excluded.source_id,
    source_locator = excluded.source_locator,
    provider_version = excluded.provider_version,
    content_hash = excluded.content_hash,
    review_status = 'pending',
    enabled = false,
    metadata = excluded.metadata
  returning id into v_acts_event_id;

  if exists (
    select 1
    from public.biblical_timeline_event_places
    where event_id = v_romans_event_id
      and place_id = v_place_id
      and relation_type = 'associated'
      and (metadata ->> 'package_key') is distinct from v_package_key
  ) or exists (
    select 1
    from public.biblical_timeline_event_places
    where event_id = v_acts_event_id
      and place_id = v_place_id
      and relation_type = 'destination'
      and (metadata ->> 'package_key') is distinct from v_package_key
  ) then
    raise exception 'Una relación piloto ya pertenece a otro paquete';
  end if;

  insert into public.biblical_timeline_event_places (
    event_id,
    place_id,
    relation_type,
    sequence_order,
    source_id,
    source_locator,
    provider_version,
    content_hash,
    review_status,
    enabled,
    metadata
  ) values (
    v_romans_event_id,
    v_place_id,
    'associated',
    0,
    v_source_id,
    'https://pleiades.stoa.org/places/423025',
    'pleiades-place-423025-accessed-2026-07-31',
    'c57f6ac09b54472138e6e7bd58919e204a8041c909ba7f4671894591ca4e6c1c',
    'pending',
    false,
    jsonb_build_object(
      'context_fragment_slug', 'roma-capital-romanos',
      'package_key', v_package_key,
      'package_hash', v_package_hash
    )
  )
  on conflict (event_id, place_id, relation_type) do update set
    sequence_order = excluded.sequence_order,
    source_id = excluded.source_id,
    source_locator = excluded.source_locator,
    provider_version = excluded.provider_version,
    content_hash = excluded.content_hash,
    review_status = 'pending',
    enabled = false,
    metadata = excluded.metadata;

  insert into public.biblical_timeline_event_places (
    event_id,
    place_id,
    relation_type,
    sequence_order,
    source_id,
    source_locator,
    provider_version,
    content_hash,
    review_status,
    enabled,
    metadata
  ) values (
    v_acts_event_id,
    v_place_id,
    'destination',
    0,
    v_source_id,
    'https://pleiades.stoa.org/places/423025',
    'pleiades-place-423025-accessed-2026-07-31',
    '232666a1732c67ccef35f1ead5eda59d2399b234b1e25ff60ff279973e42b87f',
    'pending',
    false,
    jsonb_build_object(
      'context_fragment_slug', 'roma-capital-hechos-28',
      'package_key', v_package_key,
      'package_hash', v_package_hash
    )
  )
  on conflict (event_id, place_id, relation_type) do update set
    sequence_order = excluded.sequence_order,
    source_id = excluded.source_id,
    source_locator = excluded.source_locator,
    provider_version = excluded.provider_version,
    content_hash = excluded.content_hash,
    review_status = 'pending',
    enabled = false,
    metadata = excluded.metadata;

  select count(*) into v_count
  from public.biblical_places
  where metadata @> jsonb_build_object('package_key', v_package_key, 'package_hash', v_package_hash);
  if v_count <> 1 then raise exception 'Conteo de lugares inesperado: %', v_count; end if;

  select count(*) into v_count
  from public.biblical_timeline_periods
  where metadata @> jsonb_build_object('package_key', v_package_key, 'package_hash', v_package_hash);
  if v_count <> 1 then raise exception 'Conteo de periodos inesperado: %', v_count; end if;

  select count(*) into v_count
  from public.biblical_timeline_events
  where metadata @> jsonb_build_object('package_key', v_package_key, 'package_hash', v_package_hash);
  if v_count <> 2 then raise exception 'Conteo de eventos inesperado: %', v_count; end if;

  select count(*) into v_count
  from public.biblical_timeline_event_places
  where metadata @> jsonb_build_object('package_key', v_package_key, 'package_hash', v_package_hash);
  if v_count <> 2 then raise exception 'Conteo de relaciones inesperado: %', v_count; end if;

  if exists (
    select 1 from public.biblical_places
    where metadata ->> 'package_key' = v_package_key
      and (review_status <> 'pending' or enabled)
  ) or exists (
    select 1 from public.biblical_timeline_periods
    where metadata ->> 'package_key' = v_package_key
      and (review_status <> 'pending' or enabled)
  ) or exists (
    select 1 from public.biblical_timeline_events
    where metadata ->> 'package_key' = v_package_key
      and (review_status <> 'pending' or enabled)
  ) or exists (
    select 1 from public.biblical_timeline_event_places
    where metadata ->> 'package_key' = v_package_key
      and (review_status <> 'pending' or enabled)
  ) then
    raise exception 'El paquete dejó contenido visible o aprobado durante la importación';
  end if;
end
$import$;

commit;
