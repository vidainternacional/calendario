create table public.biblical_library_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.biblical_sources(id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(trim(title)) between 2 and 300),
  author text,
  item_type text not null check (item_type in ('commentary','study_note','dictionary','article','manuscript','cross_reference_dataset','other')),
  language text not null default 'spa' check (language ~ '^[a-z]{3}$'),
  publication_year smallint check (publication_year is null or publication_year between 1 and 2200),
  edition text,
  description text check (description is null or char_length(description) <= 4000),
  source_locator text not null,
  license_status text not null default 'pending' check (license_status in ('verified','varies_by_item','pending','restricted')),
  provider_version text,
  content_hash text check (content_hash is null or content_hash ~ '^[0-9a-f]{64}$'),
  review_status text not null default 'pending' check (review_status in ('approved','pending','rejected')),
  enabled boolean not null default false,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint biblical_library_items_source_pair unique (id, source_id)
);

comment on table public.biblical_library_items is 'Inventario verificable de obras y recursos aptos para la biblioteca bíblica interna.';
comment on column public.biblical_library_items.source_locator is 'URL, catálogo, edición o identificador estable que permite verificar el recurso.';

create table public.biblical_library_fragments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null,
  source_id uuid not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(trim(title)) between 2 and 300),
  content text not null check (char_length(content) between 20 and 16000),
  content_kind text not null default 'editorial_summary' check (content_kind in ('source_excerpt','editorial_summary','inference')),
  language text not null default 'spa' check (language ~ '^[a-z]{3}$'),
  book_code text check (book_code is null or book_code ~ '^[A-Z0-9]{2,8}$'),
  chapter_start smallint check (chapter_start is null or chapter_start > 0),
  verse_start smallint check (verse_start is null or verse_start > 0),
  chapter_end smallint check (chapter_end is null or chapter_end > 0),
  verse_end smallint check (verse_end is null or verse_end > 0),
  reference_label text,
  topics text[] not null default '{}',
  source_locator text not null,
  provider_version text,
  content_hash text check (content_hash is null or content_hash ~ '^[0-9a-f]{64}$'),
  review_status text not null default 'pending' check (review_status in ('approved','pending','rejected')),
  enabled boolean not null default false,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint biblical_library_fragments_item_source_fkey
    foreign key (item_id, source_id)
    references public.biblical_library_items(id, source_id)
    on delete cascade,
  constraint biblical_library_fragments_reference_shape check (
    (book_code is null and chapter_start is null and chapter_end is null and verse_start is null and verse_end is null)
    or
    (book_code is not null and chapter_start is not null and chapter_end is not null and chapter_end >= chapter_start)
  )
);

comment on table public.biblical_library_fragments is 'Fragmentos o resúmenes editoriales revisados, vinculados a obras verificables y referencias bíblicas opcionales.';
comment on column public.biblical_library_fragments.content_kind is 'Distingue texto de fuente, resumen editorial e inferencia explícita.';

create index biblical_library_items_source_idx on public.biblical_library_items(source_id);
create index biblical_library_items_status_idx on public.biblical_library_items(enabled, review_status, item_type);
create index biblical_library_fragments_item_idx on public.biblical_library_fragments(item_id);
create index biblical_library_fragments_reference_idx on public.biblical_library_fragments(book_code, chapter_start, chapter_end) where enabled = true and review_status = 'approved';
create index biblical_library_fragments_topics_idx on public.biblical_library_fragments using gin(topics);

alter table public.biblical_library_items enable row level security;
alter table public.biblical_library_fragments enable row level security;

revoke all on table public.biblical_library_items from anon;
revoke all on table public.biblical_library_fragments from anon;
revoke all on table public.biblical_library_items from authenticated;
revoke all on table public.biblical_library_fragments from authenticated;
grant select on table public.biblical_library_items to authenticated;
grant select on table public.biblical_library_fragments to authenticated;

create policy "Usuarios activos leen recursos bíblicos aprobados"
on public.biblical_library_items
for select
to authenticated
using (
  enabled
  and review_status = 'approved'
  and license_status in ('verified','varies_by_item')
  and (select public.cuenta_activa())
  and exists (
    select 1
    from public.biblical_sources source
    where source.id = biblical_library_items.source_id
      and source.enabled
      and source.review_status = 'approved'
  )
);

create policy "Usuarios activos leen fragmentos bíblicos aprobados"
on public.biblical_library_fragments
for select
to authenticated
using (
  enabled
  and review_status = 'approved'
  and (select public.cuenta_activa())
  and exists (
    select 1
    from public.biblical_sources source
    where source.id = biblical_library_fragments.source_id
      and source.enabled
      and source.review_status = 'approved'
  )
  and exists (
    select 1
    from public.biblical_library_items item
    where item.id = biblical_library_fragments.item_id
      and item.source_id = biblical_library_fragments.source_id
      and item.enabled
      and item.review_status = 'approved'
      and item.license_status in ('verified','varies_by_item')
  )
);
