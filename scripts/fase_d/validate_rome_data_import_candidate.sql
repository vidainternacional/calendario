\set ON_ERROR_STOP on

create extension if not exists pgcrypto;

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  active boolean not null default true
);

create table public.biblical_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  source_type text not null,
  language text,
  website text,
  license_url text,
  license_notes text,
  license_status text not null,
  provider text not null,
  provider_ref text not null,
  provider_version text,
  content_hash text,
  attribution text not null,
  review_status text not null,
  enabled boolean not null default false
);

create table public.biblical_books (
  code text primary key,
  chapter_count smallint not null,
  source_id uuid not null references public.biblical_sources(id),
  review_status text not null default 'pending',
  enabled boolean not null default false
);

create table public.biblical_context_fragments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  source_id uuid not null references public.biblical_sources(id),
  content_hash text not null,
  review_status text not null default 'pending',
  enabled boolean not null default false
);

create or replace function public.cuenta_activa()
returns boolean language sql stable as $$ select true $$;

grant usage on schema public to authenticated, service_role;
grant select on public.biblical_sources, public.biblical_books to authenticated;
grant all on public.biblical_sources, public.biblical_books to service_role;

\ir ../../docs/sql-candidates/FASE_D_BLOQUE_5_ROMA_SCHEMA_CANDIDATE.sql

insert into public.biblical_sources (
  slug,
  source_type,
  language,
  website,
  license_url,
  license_notes,
  license_status,
  provider,
  provider_ref,
  provider_version,
  attribution,
  review_status,
  enabled
) values (
  'pleiades-gazetteer',
  'historical',
  'mul',
  'https://pleiades.stoa.org/',
  'https://creativecommons.org/licenses/by/3.0/',
  'Contenido reutilizable bajo CC BY 3.0.',
  'verified',
  'Pleiades',
  'gazetteer',
  'accessed-2026-07-31',
  'Pleiades: A Gazetteer of Past Places. Licencia CC BY 3.0.',
  'approved',
  true
) returning id as source_id \gset

insert into public.biblical_books (code, chapter_count, source_id, review_status, enabled)
values
  ('ROM', 16, :'source_id', 'approved', true),
  ('ACT', 28, :'source_id', 'approved', true);

insert into public.biblical_context_fragments (
  slug, source_id, content_hash, review_status, enabled
) values
  (
    'roma-capital-romanos',
    :'source_id',
    'a2f4808cb82111e86f5b4c56f22cb6266d501fae422562992c2965e02bc4767c',
    'approved',
    true
  ),
  (
    'roma-capital-hechos-28',
    :'source_id',
    'fb892d134ef1edd6b4954d27e0c8495bc5ac5fdb808b79ddbc3ef3300ec98969',
    'approved',
    true
  );

\ir ../../docs/sql-candidates/FASE_D_BLOQUE_5_ROMA_DATA_IMPORT_CANDIDATE.sql

select id::text as place_id_before
from public.biblical_places where slug = 'roma' \gset
select id::text as period_id_before
from public.biblical_timeline_periods where slug = 'roma-romanos-hechos-28' \gset
select id::text as romans_event_id_before
from public.biblical_timeline_events where slug = 'roma-destinatarios-romanos' \gset
select id::text as acts_event_id_before
from public.biblical_timeline_events where slug = 'pablo-llega-a-roma-hechos-28' \gset

select count(*) = 1 as first_place_count
from public.biblical_places
where metadata ->> 'package_key' = 'rome-pilot-v1' \gset
\if :first_place_count
\else
  \quit 1
\endif

select count(*) = 1 as first_period_count
from public.biblical_timeline_periods
where metadata ->> 'package_key' = 'rome-pilot-v1' \gset
\if :first_period_count
\else
  \quit 1
\endif

select count(*) = 2 as first_event_count
from public.biblical_timeline_events
where metadata ->> 'package_key' = 'rome-pilot-v1' \gset
\if :first_event_count
\else
  \quit 1
\endif

select count(*) = 2 as first_relation_count
from public.biblical_timeline_event_places
where metadata ->> 'package_key' = 'rome-pilot-v1' \gset
\if :first_relation_count
\else
  \quit 1
\endif

select not exists (
  select 1 from public.biblical_places
  where metadata ->> 'package_key' = 'rome-pilot-v1'
    and (review_status <> 'pending' or enabled)
) and not exists (
  select 1 from public.biblical_timeline_periods
  where metadata ->> 'package_key' = 'rome-pilot-v1'
    and (review_status <> 'pending' or enabled)
) and not exists (
  select 1 from public.biblical_timeline_events
  where metadata ->> 'package_key' = 'rome-pilot-v1'
    and (review_status <> 'pending' or enabled)
) and not exists (
  select 1 from public.biblical_timeline_event_places
  where metadata ->> 'package_key' = 'rome-pilot-v1'
    and (review_status <> 'pending' or enabled)
) as all_hidden \gset
\if :all_hidden
\else
  \quit 1
\endif

set role authenticated;
select count(*) = 0 as auth_places_hidden from public.biblical_places \gset
\if :auth_places_hidden
\else
  \quit 1
\endif
select count(*) = 0 as auth_events_hidden from public.biblical_timeline_events \gset
\if :auth_events_hidden
\else
  \quit 1
\endif
reset role;

\ir ../../docs/sql-candidates/FASE_D_BLOQUE_5_ROMA_DATA_IMPORT_CANDIDATE.sql

select id::text = :'place_id_before' as same_place_id
from public.biblical_places where slug = 'roma' \gset
\if :same_place_id
\else
  \quit 1
\endif

select id::text = :'period_id_before' as same_period_id
from public.biblical_timeline_periods where slug = 'roma-romanos-hechos-28' \gset
\if :same_period_id
\else
  \quit 1
\endif

select id::text = :'romans_event_id_before' as same_romans_event_id
from public.biblical_timeline_events where slug = 'roma-destinatarios-romanos' \gset
\if :same_romans_event_id
\else
  \quit 1
\endif

select id::text = :'acts_event_id_before' as same_acts_event_id
from public.biblical_timeline_events where slug = 'pablo-llega-a-roma-hechos-28' \gset
\if :same_acts_event_id
\else
  \quit 1
\endif

select
  (select count(*) from public.biblical_places where metadata ->> 'package_key' = 'rome-pilot-v1') = 1
  and (select count(*) from public.biblical_timeline_periods where metadata ->> 'package_key' = 'rome-pilot-v1') = 1
  and (select count(*) from public.biblical_timeline_events where metadata ->> 'package_key' = 'rome-pilot-v1') = 2
  and (select count(*) from public.biblical_timeline_event_places where metadata ->> 'package_key' = 'rome-pilot-v1') = 2
  as second_run_idempotent \gset
\if :second_run_idempotent
\else
  \quit 1
\endif

\ir ../../docs/sql-candidates/FASE_D_BLOQUE_5_ROMA_DATA_RECOVERY_CANDIDATE.sql

select
  (select count(*) from public.biblical_places where metadata ->> 'package_key' = 'rome-pilot-v1')
  + (select count(*) from public.biblical_timeline_periods where metadata ->> 'package_key' = 'rome-pilot-v1')
  + (select count(*) from public.biblical_timeline_events where metadata ->> 'package_key' = 'rome-pilot-v1')
  + (select count(*) from public.biblical_timeline_event_places where metadata ->> 'package_key' = 'rome-pilot-v1')
  = 0 as recovery_complete \gset
\if :recovery_complete
\else
  \quit 1
\endif

select count(*) = 1 as source_preserved
from public.biblical_sources where slug = 'pleiades-gazetteer' \gset
\if :source_preserved
\else
  \quit 1
\endif

select count(*) = 2 as fragments_preserved
from public.biblical_context_fragments
where slug in ('roma-capital-romanos', 'roma-capital-hechos-28') \gset
\if :fragments_preserved
\else
  \quit 1
\endif

\ir ../../docs/sql-candidates/FASE_D_BLOQUE_5_ROMA_DATA_RECOVERY_CANDIDATE.sql

\echo 'Importador candidato de Roma: primera carga, segunda carga idempotente y recuperación aprobadas.'
