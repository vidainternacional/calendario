-- FASE D · Bloque 4
-- Modelo textual piloto para texto original, secuencia morfológica y variantes.
-- Migración aditiva: no importa contenido ni modifica la visualización actual.

alter table public.biblical_word_occurrences
  add column if not exists display_word_index smallint,
  add column if not exists morpheme_index smallint not null default 1,
  add column if not exists token_kind text not null default 'word',
  add column if not exists word_group_key text,
  add column if not exists occurrence_transliteration text,
  add column if not exists occurrence_gloss_es text,
  add column if not exists punctuation_before text,
  add column if not exists punctuation_after text,
  add column if not exists joins_previous boolean not null default false,
  add column if not exists joins_next boolean not null default false,
  add column if not exists textual_status text not null default 'base',
  add column if not exists variant_group_key text,
  add column if not exists witness_data jsonb not null default '{}'::jsonb;

update public.biblical_word_occurrences
set display_word_index = word_index
where display_word_index is null;

alter table public.biblical_word_occurrences
  alter column display_word_index set not null;

do $constraints$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'biblical_word_occurrences_display_word_values'
  ) then
    alter table public.biblical_word_occurrences
      add constraint biblical_word_occurrences_display_word_values
      check (display_word_index > 0 and morpheme_index > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'biblical_word_occurrences_token_kind_check'
  ) then
    alter table public.biblical_word_occurrences
      add constraint biblical_word_occurrences_token_kind_check
      check (token_kind in ('word', 'prefix', 'suffix'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'biblical_word_occurrences_textual_status_check'
  ) then
    alter table public.biblical_word_occurrences
      add constraint biblical_word_occurrences_textual_status_check
      check (textual_status in ('base', 'variant', 'uncertain'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'biblical_word_occurrences_witness_data_object'
  ) then
    alter table public.biblical_word_occurrences
      add constraint biblical_word_occurrences_witness_data_object
      check (jsonb_typeof(witness_data) = 'object');
  end if;
end
$constraints$;

create index if not exists biblical_word_occurrences_display_sequence_idx
  on public.biblical_word_occurrences (
    book_code, chapter, verse, source_id,
    display_word_index, morpheme_index, word_index
  )
  where enabled and review_status = 'approved';

create index if not exists biblical_word_occurrences_variant_group_idx
  on public.biblical_word_occurrences (variant_group_key)
  where variant_group_key is not null;

create table if not exists public.biblical_verse_texts (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.biblical_sources(id) on delete restrict,
  book_code text not null references public.biblical_books(code) on delete restrict,
  chapter smallint not null,
  verse smallint not null,
  language text not null,
  original_text text not null,
  normalized_text text,
  transliteration text,
  literal_translation_es text,
  text_direction text not null default 'ltr',
  token_count smallint,
  analysis_status text not null default 'partial',
  source_locator text not null,
  provider_version text,
  content_hash text,
  review_status text not null default 'pending',
  enabled boolean not null default false,
  approved_at timestamptz,
  approved_by uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint biblical_verse_texts_reference_values
    check (chapter > 0 and verse > 0 and (token_count is null or token_count >= 0)),
  constraint biblical_verse_texts_language_check
    check (language in ('hebrew', 'aramaic', 'greek')),
  constraint biblical_verse_texts_direction_check
    check (text_direction in ('ltr', 'rtl')),
  constraint biblical_verse_texts_analysis_status_check
    check (analysis_status in ('partial', 'complete', 'verified')),
  constraint biblical_verse_texts_review_status_check
    check (review_status in ('pending', 'approved', 'rejected')),
  constraint biblical_verse_texts_enabled_requires_approval
    check (not enabled or (review_status = 'approved' and approved_at is not null)),
  constraint biblical_verse_texts_content_hash_format
    check (content_hash is null or content_hash ~ '^[0-9a-f]{64}$'),
  constraint biblical_verse_texts_metadata_object
    check (jsonb_typeof(metadata) = 'object'),
  constraint biblical_verse_texts_source_reference_key
    unique (source_id, book_code, chapter, verse, language)
);

create index if not exists biblical_verse_texts_reference_idx
  on public.biblical_verse_texts (book_code, chapter, verse, language)
  where enabled and review_status = 'approved';

create table if not exists public.biblical_textual_variants (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.biblical_sources(id) on delete restrict,
  verse_text_id uuid not null references public.biblical_verse_texts(id) on delete cascade,
  variant_key text not null,
  anchor_word_index smallint,
  reading_type text not null,
  base_reading text,
  variant_reading text,
  witness_summary text,
  witnesses jsonb not null default '[]'::jsonb,
  editions jsonb not null default '[]'::jsonb,
  significance_es text,
  source_locator text not null,
  provider_version text,
  content_hash text,
  review_status text not null default 'pending',
  enabled boolean not null default false,
  approved_at timestamptz,
  approved_by uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint biblical_textual_variants_anchor_values
    check (anchor_word_index is null or anchor_word_index > 0),
  constraint biblical_textual_variants_reading_type_check
    check (reading_type in ('substitution', 'addition', 'omission', 'transposition', 'orthographic')),
  constraint biblical_textual_variants_review_status_check
    check (review_status in ('pending', 'approved', 'rejected')),
  constraint biblical_textual_variants_enabled_requires_approval
    check (not enabled or (review_status = 'approved' and approved_at is not null)),
  constraint biblical_textual_variants_content_hash_format
    check (content_hash is null or content_hash ~ '^[0-9a-f]{64}$'),
  constraint biblical_textual_variants_witnesses_array
    check (jsonb_typeof(witnesses) = 'array'),
  constraint biblical_textual_variants_editions_array
    check (jsonb_typeof(editions) = 'array'),
  constraint biblical_textual_variants_metadata_object
    check (jsonb_typeof(metadata) = 'object'),
  constraint biblical_textual_variants_source_key
    unique (source_id, verse_text_id, variant_key)
);

create index if not exists biblical_textual_variants_verse_idx
  on public.biblical_textual_variants (verse_text_id, anchor_word_index)
  where enabled and review_status = 'approved';

alter table public.biblical_verse_texts enable row level security;
alter table public.biblical_textual_variants enable row level security;

revoke all on public.biblical_verse_texts from anon, authenticated;
revoke all on public.biblical_textual_variants from anon, authenticated;
grant select on public.biblical_verse_texts to authenticated;
grant select on public.biblical_textual_variants to authenticated;

do $policies$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'biblical_verse_texts'
      and policyname = 'Usuarios activos leen textos originales aprobados'
  ) then
    create policy "Usuarios activos leen textos originales aprobados"
      on public.biblical_verse_texts
      for select
      to authenticated
      using (
        enabled
        and review_status = 'approved'
        and (select public.cuenta_activa())
        and exists (
          select 1
          from public.biblical_sources source
          where source.id = biblical_verse_texts.source_id
            and source.enabled
            and source.review_status = 'approved'
        )
        and exists (
          select 1
          from public.biblical_books book
          where book.code = biblical_verse_texts.book_code
            and book.enabled
            and book.review_status = 'approved'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'biblical_textual_variants'
      and policyname = 'Usuarios activos leen variantes textuales aprobadas'
  ) then
    create policy "Usuarios activos leen variantes textuales aprobadas"
      on public.biblical_textual_variants
      for select
      to authenticated
      using (
        enabled
        and review_status = 'approved'
        and (select public.cuenta_activa())
        and exists (
          select 1
          from public.biblical_sources source
          where source.id = biblical_textual_variants.source_id
            and source.enabled
            and source.review_status = 'approved'
        )
        and exists (
          select 1
          from public.biblical_verse_texts verse_text
          where verse_text.id = biblical_textual_variants.verse_text_id
            and verse_text.source_id = biblical_textual_variants.source_id
            and verse_text.enabled
            and verse_text.review_status = 'approved'
        )
      );
  end if;
end
$policies$;

comment on table public.biblical_verse_texts is
  'Texto original completo por versículo, con transliteración y traducción literal editorial verificable.';
comment on table public.biblical_textual_variants is
  'Variantes textuales vinculadas a un versículo y a una fuente aprobada.';
comment on column public.biblical_word_occurrences.display_word_index is
  'Posición visual de la palabra; varios morfemas pueden compartirla.';
comment on column public.biblical_word_occurrences.morpheme_index is
  'Orden del morfema dentro de la palabra visual.';
comment on column public.biblical_word_occurrences.word_index is
  'Orden técnico continuo de la ocurrencia dentro del versículo.';