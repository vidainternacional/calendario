-- FASE D · Bloque 5
-- CANDIDATA NO DESPLEGABLE AUTOMÁTICAMENTE
-- Ubicada fuera de supabase/migrations para impedir aplicación accidental.
-- No contiene datos de Roma; crea únicamente el modelo vacío.

begin;

create table public.biblical_places (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  canonical_name_es text not null,
  alternate_names text[] not null default '{}',
  place_kind text not null,
  external_provider text,
  external_ref text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  coordinate_precision text not null default 'unknown'
    check (coordinate_precision in ('exact', 'approximate', 'regional', 'unknown')),
  certainty_level text not null default 'medium'
    check (certainty_level in ('high', 'medium', 'low', 'disputed')),
  source_id uuid not null references public.biblical_sources(id),
  source_locator text not null,
  provider_version text,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected')),
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((latitude is null) = (longitude is null)),
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180),
  check ((external_provider is null) = (external_ref is null))
);

create unique index biblical_places_external_identity_key
  on public.biblical_places (external_provider, external_ref)
  nulls not distinct;

create index biblical_places_published_idx
  on public.biblical_places (enabled, review_status);
create index biblical_places_source_id_idx
  on public.biblical_places (source_id);

create table public.biblical_timeline_periods (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  start_year integer,
  end_year integer,
  era text not null default 'CE' check (era in ('BCE', 'CE', 'relative', 'unknown')),
  chronology_system text not null default 'historical',
  date_precision text not null default 'unknown'
    check (date_precision in ('exact', 'year', 'range', 'approximate', 'relative', 'unknown')),
  certainty_level text not null default 'medium'
    check (certainty_level in ('high', 'medium', 'low', 'disputed')),
  source_id uuid not null references public.biblical_sources(id),
  source_locator text not null,
  provider_version text,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected')),
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_year is null or end_year is null or start_year <= end_year)
);

create index biblical_timeline_periods_published_idx
  on public.biblical_timeline_periods (enabled, review_status);
create index biblical_timeline_periods_source_id_idx
  on public.biblical_timeline_periods (source_id);

create table public.biblical_timeline_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  period_id uuid references public.biblical_timeline_periods(id),
  start_book_code text references public.biblical_books(code),
  start_chapter smallint,
  start_verse smallint,
  end_book_code text references public.biblical_books(code),
  end_chapter smallint,
  end_verse smallint,
  start_year integer,
  end_year integer,
  era text not null default 'CE' check (era in ('BCE', 'CE', 'relative', 'unknown')),
  relative_order integer not null default 0,
  date_precision text not null default 'unknown'
    check (date_precision in ('exact', 'year', 'range', 'approximate', 'relative', 'unknown')),
  certainty_level text not null default 'medium'
    check (certainty_level in ('high', 'medium', 'low', 'disputed')),
  controversy_note text,
  source_id uuid not null references public.biblical_sources(id),
  source_locator text not null,
  provider_version text,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected')),
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_chapter is null or start_chapter > 0),
  check (end_chapter is null or end_chapter > 0),
  check (start_verse is null or start_verse > 0),
  check (end_verse is null or end_verse > 0),
  check (start_year is null or end_year is null or start_year <= end_year),
  check ((start_book_code is null) = (start_chapter is null)),
  check (end_book_code is null or start_book_code is not null)
);

create index biblical_timeline_events_published_idx
  on public.biblical_timeline_events (enabled, review_status, relative_order);
create index biblical_timeline_events_period_id_idx
  on public.biblical_timeline_events (period_id);
create index biblical_timeline_events_source_id_idx
  on public.biblical_timeline_events (source_id);
create index biblical_timeline_events_reference_idx
  on public.biblical_timeline_events (start_book_code, start_chapter, start_verse);

create table public.biblical_timeline_event_places (
  event_id uuid not null references public.biblical_timeline_events(id) on delete cascade,
  place_id uuid not null references public.biblical_places(id),
  relation_type text not null
    check (relation_type in ('location', 'origin', 'destination', 'route', 'region', 'associated')),
  sequence_order smallint not null default 0 check (sequence_order >= 0),
  source_id uuid not null references public.biblical_sources(id),
  source_locator text not null,
  provider_version text,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected')),
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_id, place_id, relation_type)
);

create index biblical_timeline_event_places_place_id_idx
  on public.biblical_timeline_event_places (place_id);
create index biblical_timeline_event_places_published_idx
  on public.biblical_timeline_event_places (enabled, review_status);

create trigger set_biblical_places_updated_at
  before update on public.biblical_places
  for each row execute function extensions.moddatetime('updated_at');
create trigger set_biblical_timeline_periods_updated_at
  before update on public.biblical_timeline_periods
  for each row execute function extensions.moddatetime('updated_at');
create trigger set_biblical_timeline_events_updated_at
  before update on public.biblical_timeline_events
  for each row execute function extensions.moddatetime('updated_at');
create trigger set_biblical_timeline_event_places_updated_at
  before update on public.biblical_timeline_event_places
  for each row execute function extensions.moddatetime('updated_at');

alter table public.biblical_places enable row level security;
alter table public.biblical_timeline_periods enable row level security;
alter table public.biblical_timeline_events enable row level security;
alter table public.biblical_timeline_event_places enable row level security;

revoke all on public.biblical_places from anon, authenticated;
revoke all on public.biblical_timeline_periods from anon, authenticated;
revoke all on public.biblical_timeline_events from anon, authenticated;
revoke all on public.biblical_timeline_event_places from anon, authenticated;

grant select on public.biblical_places to authenticated;
grant select on public.biblical_timeline_periods to authenticated;
grant select on public.biblical_timeline_events to authenticated;
grant select on public.biblical_timeline_event_places to authenticated;

grant all on public.biblical_places to service_role;
grant all on public.biblical_timeline_periods to service_role;
grant all on public.biblical_timeline_events to service_role;
grant all on public.biblical_timeline_event_places to service_role;

create policy "Usuarios activos leen lugares bíblicos aprobados"
  on public.biblical_places for select to authenticated
  using (
    enabled and review_status = 'approved' and (select public.cuenta_activa())
    and exists (
      select 1 from public.biblical_sources source
      where source.id = biblical_places.source_id
        and source.enabled
        and source.review_status = 'approved'
        and source.license_status in ('verified', 'varies_by_item')
    )
  );

create policy "Usuarios activos leen periodos bíblicos aprobados"
  on public.biblical_timeline_periods for select to authenticated
  using (
    enabled and review_status = 'approved' and (select public.cuenta_activa())
    and exists (
      select 1 from public.biblical_sources source
      where source.id = biblical_timeline_periods.source_id
        and source.enabled
        and source.review_status = 'approved'
        and source.license_status in ('verified', 'varies_by_item')
    )
  );

create policy "Usuarios activos leen eventos bíblicos aprobados"
  on public.biblical_timeline_events for select to authenticated
  using (
    enabled and review_status = 'approved' and (select public.cuenta_activa())
    and exists (
      select 1 from public.biblical_sources source
      where source.id = biblical_timeline_events.source_id
        and source.enabled
        and source.review_status = 'approved'
        and source.license_status in ('verified', 'varies_by_item')
    )
  );

create policy "Usuarios activos leen relaciones geográficas aprobadas"
  on public.biblical_timeline_event_places for select to authenticated
  using (
    enabled and review_status = 'approved' and (select public.cuenta_activa())
    and exists (
      select 1 from public.biblical_sources source
      where source.id = biblical_timeline_event_places.source_id
        and source.enabled
        and source.review_status = 'approved'
        and source.license_status in ('verified', 'varies_by_item')
    )
    and exists (
      select 1 from public.biblical_timeline_events event
      where event.id = biblical_timeline_event_places.event_id
        and event.enabled and event.review_status = 'approved'
    )
    and exists (
      select 1 from public.biblical_places place
      where place.id = biblical_timeline_event_places.place_id
        and place.enabled and place.review_status = 'approved'
    )
  );

commit;
