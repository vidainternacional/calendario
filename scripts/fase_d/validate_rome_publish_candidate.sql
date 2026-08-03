\set ON_ERROR_STOP on

create extension if not exists pgcrypto;

create table public.biblical_places (
  id uuid primary key default gen_random_uuid(), slug text unique not null,
  content_hash text not null, review_status text not null, enabled boolean not null,
  updated_at timestamptz not null default now()
);
create table public.biblical_timeline_periods (
  id uuid primary key default gen_random_uuid(), slug text unique not null,
  content_hash text not null, review_status text not null, enabled boolean not null,
  updated_at timestamptz not null default now()
);
create table public.biblical_timeline_events (
  id uuid primary key default gen_random_uuid(), slug text unique not null,
  content_hash text not null, review_status text not null, enabled boolean not null,
  updated_at timestamptz not null default now()
);
create table public.biblical_timeline_event_places (
  event_id uuid not null references public.biblical_timeline_events(id),
  place_id uuid not null references public.biblical_places(id),
  relation_type text not null, content_hash text not null,
  review_status text not null, enabled boolean not null,
  updated_at timestamptz not null default now(),
  primary key (event_id, place_id, relation_type)
);

insert into public.biblical_places (slug, content_hash, review_status, enabled) values
('roma','768fa98567a49be10e85ae29f748eea8a48fba471a56fbeb1b461f492cdd55ee','pending',false),
('control-place',repeat('a',64),'pending',false);

insert into public.biblical_timeline_periods (slug, content_hash, review_status, enabled) values
('roma-romanos-hechos-28','968637654ac8aefa36ebb849b10a47b6e1ec62ec1b1aa56d66e35aa126e09a54','pending',false),
('control-period',repeat('b',64),'pending',false);

insert into public.biblical_timeline_events (slug, content_hash, review_status, enabled) values
('roma-destinatarios-romanos','0ad8cbe5c8e4499022298e7446432f44892ed3dbad9a2514d209ff38b97d36c6','pending',false),
('pablo-llega-a-roma-hechos-28','1c97d3f44fc5453830ee09e8910b2519519adc9a1f6f4c6f4cf6fb57d101cd2d','pending',false),
('control-event',repeat('c',64),'pending',false);

insert into public.biblical_timeline_event_places (event_id, place_id, relation_type, content_hash, review_status, enabled)
select e.id, p.id, 'associated','c57f6ac09b54472138e6e7bd58919e204a8041c909ba7f4671894591ca4e6c1c','pending',false
from public.biblical_timeline_events e cross join public.biblical_places p
where e.slug='roma-destinatarios-romanos' and p.slug='roma';
insert into public.biblical_timeline_event_places (event_id, place_id, relation_type, content_hash, review_status, enabled)
select e.id, p.id, 'destination','232666a1732c67ccef35f1ead5eda59d2399b234b1e25ff60ff279973e42b87f','pending',false
from public.biblical_timeline_events e cross join public.biblical_places p
where e.slug='pablo-llega-a-roma-hechos-28' and p.slug='roma';

\i docs/sql-candidates/FASE_D_BLOQUE_5_ROMA_PUBLISH_CANDIDATE.sql

do $$ begin
  if (select count(*) from public.biblical_places where slug='roma' and review_status='approved' and enabled) <> 1 then raise exception 'Lugar no publicado'; end if;
  if (select count(*) from public.biblical_timeline_periods where slug='roma-romanos-hechos-28' and review_status='approved' and enabled) <> 1 then raise exception 'Periodo no publicado'; end if;
  if (select count(*) from public.biblical_timeline_events where review_status='approved' and enabled) <> 2 then raise exception 'Eventos no publicados'; end if;
  if (select count(*) from public.biblical_timeline_event_places where review_status='approved' and enabled) <> 2 then raise exception 'Relaciones no publicadas'; end if;
  if (select count(*) from public.biblical_places where slug='control-place' and review_status='pending' and not enabled) <> 1 then raise exception 'Fila control alterada'; end if;
  if (select count(*) from public.biblical_timeline_periods where slug='control-period' and review_status='pending' and not enabled) <> 1 then raise exception 'Periodo control alterado'; end if;
  if (select count(*) from public.biblical_timeline_events where slug='control-event' and review_status='pending' and not enabled) <> 1 then raise exception 'Evento control alterado'; end if;
end $$;

\i docs/sql-candidates/FASE_D_BLOQUE_5_ROMA_UNPUBLISH_RECOVERY_CANDIDATE.sql

do $$ begin
  if (select count(*) from public.biblical_places where slug='roma' and review_status='pending' and not enabled) <> 1 then raise exception 'Lugar no recuperado'; end if;
  if (select count(*) from public.biblical_timeline_periods where slug='roma-romanos-hechos-28' and review_status='pending' and not enabled) <> 1 then raise exception 'Periodo no recuperado'; end if;
  if (select count(*) from public.biblical_timeline_events where slug in ('roma-destinatarios-romanos','pablo-llega-a-roma-hechos-28') and review_status='pending' and not enabled) <> 2 then raise exception 'Eventos no recuperados'; end if;
  if (select count(*) from public.biblical_timeline_event_places where review_status='pending' and not enabled) <> 2 then raise exception 'Relaciones no recuperadas'; end if;
end $$;

select 'Publicación y recuperación de Roma: OK' as resultado;
