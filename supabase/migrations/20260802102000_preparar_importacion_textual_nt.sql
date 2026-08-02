-- FASE D · Bloque 4
-- Control de importaciones textuales y correspondencias de versificación.

update public.biblical_sources
set name = 'STEPBible Data — corpus textual y léxico',
    provider_ref = 'STEPBible-Data/textual-corpus',
    provider_version = 'STEPBible-Data@b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',
    license_notes = 'CC BY 4.0. Se importan texto original, transliteración, Strong, morfología, glosas breves y variantes declaradas por TAGNT/TAHOT. No se importa el campo extenso Meaning de TBESH ni comentarios completos.',
    content_hash = encode(extensions.digest(
      'STEPBible-Data|b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39|TAGNT|TAHOT|CC-BY-4.0',
      'sha256'
    ), 'hex'),
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'source_commit', 'b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',
      'corpus_status', 'new_testament_extraction_validated',
      'pilot_status', 'promoted_to_textual_corpus',
      'generated_by_ai', false,
      'new_testament', jsonb_build_object(
        'books', 27,
        'source_references', 7958,
        'base_words', 138096,
        'variant_rows', 4000,
        'total_rows', 142096,
        'fallback_references', 16,
        'artifact_sha256', '6daf1866f9749850f7a78a966ea2141a2670cca94b4af473fe286c29d331da2b'
      ),
      'source_files', jsonb_build_array(
        jsonb_build_object(
          'dataset', 'TAGNT Mat-Jhn',
          'sha256', 'ab8eaaeb68e17a1dcfa34e1e9350358f22f03bc2a97244d848750ad81044bc8e'
        ),
        jsonb_build_object(
          'dataset', 'TAGNT Act-Rev',
          'sha256', '524e32375361e6d3fa2f7ef00b87605fdc4317a762f395651a05fdc31ad031b7'
        ),
        jsonb_build_object(
          'dataset', 'TAHOT Job-Sng',
          'sha256', '84e118a97e5725e3847cdfdd593873513021c790c63cc91a0d41fca2b5db2ed5'
        )
      )
    ),
    updated_at = now()
where slug = 'stepbible-lexical-pilot'
  and review_status = 'approved'
  and enabled;

create table if not exists internal.biblical_textual_import_batches (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.biblical_sources(id) on delete restrict,
  dataset text not null,
  book_code text not null references public.biblical_books(code) on delete restrict,
  source_commit text not null,
  artifact_sha256 text not null check (artifact_sha256 ~ '^[0-9a-f]{64}$'),
  source_reference_count integer not null check (source_reference_count > 0),
  base_word_count integer not null check (base_word_count > 0),
  variant_row_count integer not null default 0 check (variant_row_count >= 0),
  total_row_count integer not null check (total_row_count >= base_word_count),
  import_status text not null default 'validated'
    check (import_status in ('validated','importing','imported','failed')),
  imported_verse_count integer not null default 0 check (imported_verse_count >= 0),
  imported_occurrence_count integer not null default 0 check (imported_occurrence_count >= 0),
  imported_variant_count integer not null default 0 check (imported_variant_count >= 0),
  error_message text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, dataset, book_code, source_commit)
);

revoke all on internal.biblical_textual_import_batches from public, anon, authenticated;

create table if not exists public.biblical_versification_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null unique check (profile_key ~ '^[a-z0-9][a-z0-9_-]{1,79}$'),
  name text not null,
  source_id uuid not null references public.biblical_sources(id) on delete restrict,
  translation_ids text[] not null default '{}'::text[],
  translation_name_patterns text[] not null default '{}'::text[],
  priority smallint not null default 100,
  review_status text not null default 'pending'
    check (review_status in ('pending','approved','rejected')),
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint biblical_versification_profiles_enabled_requires_approval
    check (not enabled or review_status = 'approved')
);

create table if not exists public.biblical_verse_mappings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.biblical_versification_profiles(id) on delete cascade,
  source_id uuid not null references public.biblical_sources(id) on delete restrict,
  source_book_code text not null references public.biblical_books(code) on delete restrict,
  source_chapter smallint not null check (source_chapter > 0),
  source_verse smallint not null check (source_verse > 0),
  target_book_code text not null references public.biblical_books(code) on delete restrict,
  target_chapter smallint not null check (target_chapter > 0),
  target_verse smallint not null check (target_verse > 0),
  source_word_start smallint check (source_word_start is null or source_word_start > 0),
  source_word_end smallint check (source_word_end is null or source_word_end > 0),
  sequence smallint not null default 1 check (sequence > 0),
  mapping_kind text not null
    check (mapping_kind in ('identity','split','merge','relabel')),
  source_locator text not null,
  provider_version text,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  review_status text not null default 'pending'
    check (review_status in ('pending','approved','rejected')),
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint biblical_verse_mappings_word_range
    check (
      (source_word_start is null and source_word_end is null)
      or (
        source_word_start is not null
        and source_word_end is not null
        and source_word_start <= source_word_end
      )
    ),
  constraint biblical_verse_mappings_enabled_requires_approval
    check (not enabled or review_status = 'approved')
);

create unique index if not exists biblical_verse_mappings_unique_segment
  on public.biblical_verse_mappings (
    profile_id, source_id,
    source_book_code, source_chapter, source_verse,
    target_book_code, target_chapter, target_verse,
    coalesce(source_word_start, 0), coalesce(source_word_end, 0), sequence
  );

create index if not exists biblical_verse_mappings_target_lookup
  on public.biblical_verse_mappings (
    profile_id, target_book_code, target_chapter, target_verse, sequence
  )
  where enabled and review_status = 'approved';

create index if not exists biblical_verse_mappings_source_lookup
  on public.biblical_verse_mappings (
    source_id, source_book_code, source_chapter, source_verse
  )
  where enabled and review_status = 'approved';

alter table public.biblical_versification_profiles enable row level security;
alter table public.biblical_verse_mappings enable row level security;

drop policy if exists "Usuarios activos leen perfiles de versificación aprobados"
  on public.biblical_versification_profiles;
create policy "Usuarios activos leen perfiles de versificación aprobados"
  on public.biblical_versification_profiles
  for select
  to authenticated
  using (
    enabled
    and review_status = 'approved'
    and (select public.cuenta_activa())
    and exists (
      select 1
      from public.biblical_sources source
      where source.id = biblical_versification_profiles.source_id
        and source.enabled
        and source.review_status = 'approved'
    )
  );

drop policy if exists "Usuarios activos leen correspondencias bíblicas aprobadas"
  on public.biblical_verse_mappings;
create policy "Usuarios activos leen correspondencias bíblicas aprobadas"
  on public.biblical_verse_mappings
  for select
  to authenticated
  using (
    enabled
    and review_status = 'approved'
    and (select public.cuenta_activa())
    and exists (
      select 1
      from public.biblical_versification_profiles profile
      where profile.id = biblical_verse_mappings.profile_id
        and profile.enabled
        and profile.review_status = 'approved'
    )
    and exists (
      select 1
      from public.biblical_sources source
      where source.id = biblical_verse_mappings.source_id
        and source.enabled
        and source.review_status = 'approved'
    )
  );

revoke all on public.biblical_versification_profiles from public, anon, authenticated;
revoke all on public.biblical_verse_mappings from public, anon, authenticated;
grant select on public.biblical_versification_profiles to authenticated;
grant select on public.biblical_verse_mappings to authenticated;
