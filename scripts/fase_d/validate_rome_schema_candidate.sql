\set ON_ERROR_STOP on

create extension if not exists pgcrypto;
create extension if not exists moddatetime;

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create table public.profiles (id uuid primary key default gen_random_uuid(), active boolean not null default true);
create table public.biblical_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  provider text not null,
  provider_ref text not null,
  provider_version text,
  content_hash text,
  attribution text not null,
  license_status text not null check (license_status in ('verified','varies_by_item','pending','restricted')),
  review_status text not null check (review_status in ('approved','pending','rejected')),
  enabled boolean not null default false
);
create table public.biblical_books (
  code text primary key,
  chapter_count smallint not null,
  source_id uuid not null references public.biblical_sources(id),
  review_status text not null default 'pending',
  enabled boolean not null default false
);

create or replace function public.cuenta_activa()
returns boolean language sql stable as $$ select true $$;

grant usage on schema public to authenticated, service_role;

\ir ../../docs/sql-candidates/FASE_D_BLOQUE_5_ROMA_SCHEMA_CANDIDATE.sql

-- Estructura
select to_regclass('public.biblical_places') is not null as places_exists \gset
\if :places_exists
\else
  \quit 1
\endif
select to_regclass('public.biblical_timeline_periods') is not null as periods_exists \gset
\if :periods_exists
\else
  \quit 1
\endif
select to_regclass('public.biblical_timeline_events') is not null as events_exists \gset
\if :events_exists
\else
  \quit 1
\endif
select to_regclass('public.biblical_timeline_event_places') is not null as relations_exists \gset
\if :relations_exists
\else
  \quit 1
\endif

-- RLS
select bool_and(relrowsecurity) as all_rls
from pg_class
where oid in (
  'public.biblical_places'::regclass,
  'public.biblical_timeline_periods'::regclass,
  'public.biblical_timeline_events'::regclass,
  'public.biblical_timeline_event_places'::regclass
) \gset
\if :all_rls
\else
  \quit 1
\endif

-- Privilegios
select not has_table_privilege('anon', 'public.biblical_places', 'SELECT') as anon_blocked \gset
\if :anon_blocked
\else
  \quit 1
\endif
select has_table_privilege('authenticated', 'public.biblical_places', 'SELECT') as auth_select \gset
\if :auth_select
\else
  \quit 1
\endif
select not has_table_privilege('authenticated', 'public.biblical_places', 'INSERT') as auth_no_insert \gset
\if :auth_no_insert
\else
  \quit 1
\endif

-- Datos mínimos válidos
insert into public.biblical_sources
  (slug, provider, provider_ref, attribution, license_status, review_status, enabled)
values
  ('pleiades', 'Pleiades', 'rome', 'Pleiades CC BY 3.0', 'verified', 'approved', true)
returning id as source_id \gset

insert into public.biblical_books (code, chapter_count, source_id, review_status, enabled)
values ('ROM', 16, :'source_id', 'approved', true), ('ACT', 28, :'source_id', 'approved', true);

insert into public.biblical_places (
  slug, canonical_name_es, place_kind, external_provider, external_ref,
  latitude, longitude, coordinate_precision, certainty_level,
  source_id, source_locator, content_hash, review_status, enabled
) values (
  'roma', 'Roma', 'city', 'Pleiades', '423025',
  41.893320, 12.482932, 'approximate', 'high',
  :'source_id', 'places/423025', repeat('a', 64), 'approved', true
) returning id as place_id, updated_at as place_updated_at \gset

insert into public.biblical_timeline_periods (
  slug, title, start_year, end_year, era, chronology_system,
  date_precision, certainty_level, source_id, source_locator,
  content_hash, review_status, enabled
) values (
  'ministerio-pablo-roma', 'Pablo en Roma', 60, 62, 'CE', 'historical',
  'range', 'medium', :'source_id', 'Acts 28', repeat('b', 64), 'approved', true
) returning id as period_id \gset

insert into public.biblical_timeline_events (
  slug, title, summary, period_id,
  start_book_code, start_chapter, start_verse,
  end_book_code, end_chapter, end_verse,
  start_year, end_year, era, relative_order,
  date_precision, certainty_level, source_id, source_locator,
  content_hash, review_status, enabled
) values (
  'pablo-llega-roma', 'Pablo llega a Roma', 'Piloto cronológico.', :'period_id',
  'ACT', 28, 16, 'ACT', 28, 31,
  60, 62, 'CE', 10,
  'approximate', 'medium', :'source_id', 'Acts 28:16-31',
  repeat('c', 64), 'approved', true
) returning id as event_id \gset

insert into public.biblical_timeline_event_places (
  event_id, place_id, relation_type, sequence_order,
  source_id, source_locator, content_hash, review_status, enabled
) values (
  :'event_id', :'place_id', 'location', 0,
  :'source_id', 'Acts 28:16-31', repeat('d', 64), 'approved', true
);

-- Trigger updated_at
select pg_sleep(0.01);
update public.biblical_places set canonical_name_es = 'Roma' where id = :'place_id';
select updated_at > :'place_updated_at'::timestamptz as trigger_ok
from public.biblical_places where id = :'place_id' \gset
\if :trigger_ok
\else
  \quit 1
\endif

-- Restricciones inválidas deben fallar sin abortar la suite
\set ON_ERROR_STOP off
savepoint invalid_coordinate;
insert into public.biblical_places (
  slug, canonical_name_es, place_kind, latitude, longitude,
  source_id, source_locator, content_hash
) values ('invalid-coordinate', 'Inválido', 'city', 91, 10, :'source_id', 'x', repeat('e',64));
\if :ERROR
  rollback to savepoint invalid_coordinate;
\else
  \quit 1
\endif

savepoint invalid_hash;
insert into public.biblical_timeline_periods (
  slug, title, source_id, source_locator, content_hash
) values ('invalid-hash', 'Inválido', :'source_id', 'x', 'bad');
\if :ERROR
  rollback to savepoint invalid_hash;
\else
  \quit 1
\endif
\set ON_ERROR_STOP on

-- RLS autenticada: solo aprobados/habilitados
set role authenticated;
select count(*) = 1 as auth_places_ok from public.biblical_places \gset
\if :auth_places_ok
\else
  \quit 1
\endif
select count(*) = 1 as auth_events_ok from public.biblical_timeline_events \gset
\if :auth_events_ok
\else
  \quit 1
\endif
reset role;

-- Ninguna tabla contiene datos no piloto inesperados
select count(*) = 1 as place_count_ok from public.biblical_places \gset
\if :place_count_ok
\else
  \quit 1
\endif

\echo 'Esquema candidato de Roma validado correctamente en PostgreSQL 17.'
