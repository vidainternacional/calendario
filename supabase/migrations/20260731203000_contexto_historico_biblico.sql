create table if not exists public.biblical_context_fragments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  source_id uuid not null references public.biblical_sources(id) on delete restrict,
  title text not null,
  content text not null,
  content_kind text not null default 'editorial_summary',
  context_type text not null,
  language text not null default 'spa',
  book_code text not null,
  chapter_start smallint not null,
  verse_start smallint,
  chapter_end smallint not null,
  verse_end smallint,
  reference_label text not null,
  source_locator text not null,
  period_label text,
  location_names text[] not null default '{}'::text[],
  people_groups text[] not null default '{}'::text[],
  topics text[] not null default '{}'::text[],
  provider_version text,
  content_hash text,
  review_status text not null default 'pending',
  enabled boolean not null default false,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint biblical_context_fragments_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint biblical_context_fragments_content_kind_check check (
    content_kind in ('source_excerpt', 'editorial_summary', 'inference')
  ),
  constraint biblical_context_fragments_type_check check (
    context_type in (
      'historical_period',
      'political',
      'religious',
      'social_custom',
      'institution',
      'people_group',
      'place',
      'archaeology',
      'literary',
      'other'
    )
  ),
  constraint biblical_context_fragments_language_format check (
    language ~ '^[a-z]{3}$'
  ),
  constraint biblical_context_fragments_book_code_format check (
    book_code ~ '^[A-Z0-9]{2,8}$'
  ),
  constraint biblical_context_fragments_chapter_range check (
    chapter_start > 0
    and chapter_end >= chapter_start
  ),
  constraint biblical_context_fragments_verse_pair check (
    (verse_start is null and verse_end is null)
    or (verse_start is not null and verse_end is not null)
  ),
  constraint biblical_context_fragments_verse_values check (
    (verse_start is null or verse_start > 0)
    and (verse_end is null or verse_end > 0)
  ),
  constraint biblical_context_fragments_same_chapter_verse_range check (
    chapter_start <> chapter_end
    or verse_start is null
    or verse_end >= verse_start
  ),
  constraint biblical_context_fragments_review_status_check check (
    review_status in ('approved', 'pending', 'rejected')
  ),
  constraint biblical_context_fragments_content_length check (
    char_length(content) between 40 and 12000
  ),
  constraint biblical_context_fragments_enabled_requires_approval check (
    not enabled
    or (review_status = 'approved' and approved_at is not null)
  )
);

create index if not exists idx_biblical_context_reference
  on public.biblical_context_fragments (
    book_code,
    chapter_start,
    chapter_end,
    enabled,
    review_status
  );

create index if not exists idx_biblical_context_source
  on public.biblical_context_fragments (source_id, enabled, review_status);

create index if not exists idx_biblical_context_topics
  on public.biblical_context_fragments using gin (topics);

create index if not exists idx_biblical_context_locations
  on public.biblical_context_fragments using gin (location_names);

alter table public.biblical_context_fragments enable row level security;

revoke all on table public.biblical_context_fragments from anon, authenticated;
grant select on table public.biblical_context_fragments to authenticated;

drop policy if exists "Usuarios activos leen contexto bíblico aprobado"
  on public.biblical_context_fragments;

create policy "Usuarios activos leen contexto bíblico aprobado"
on public.biblical_context_fragments
for select
to authenticated
using (
  enabled
  and review_status = 'approved'
  and (select public.cuenta_activa())
  and exists (
    select 1
    from public.biblical_sources source
    where source.id = biblical_context_fragments.source_id
      and source.enabled
      and source.review_status = 'approved'
  )
);

comment on table public.biblical_context_fragments is
  'Fragmentos históricos y culturales revisados, vinculados a fuentes bíblicas aprobadas.';

comment on column public.biblical_context_fragments.content_kind is
  'Distingue una cita de fuente, un resumen editorial o una inferencia explícita.';

comment on column public.biblical_context_fragments.source_locator is
  'Ubicación verificable dentro de la fuente: URL, endpoint, sección, página o identificador estable.';
