create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create schema extensions;
create extension if not exists pgcrypto with schema extensions;
create schema internal;

create table public.biblical_sources(
 id uuid primary key default extensions.gen_random_uuid(),
 slug text unique not null,
 name text not null,
 source_type text not null,
 language text,
 website text,
 license_url text,
 license_notes text,
 license_status text not null default 'approved',
 provider text not null,
 provider_ref text not null,
 provider_version text,
 content_hash text,
 attribution text not null,
 review_status text not null default 'approved',
 enabled boolean not null default true,
 metadata jsonb not null default '{}'::jsonb,
 approved_at timestamptz,
 approved_by uuid,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.biblical_books(
 code text primary key,
 review_status text not null default 'approved',
 enabled boolean not null default true
);
create table public.biblical_lexical_entries(
 id uuid primary key default extensions.gen_random_uuid(),
 source_id uuid not null references public.biblical_sources(id),
 language text not null check(language in ('hebrew','aramaic','greek')),
 lexical_id text not null check(lexical_id ~ '^[GH][0-9]{4}[A-Z]?$'),
 strong_number text check(strong_number is null or strong_number ~ '^[GH][0-9]{4}$'),
 lemma text not null,
 transliteration text,
 part_of_speech text,
 source_gloss text,
 display_gloss_es text,
 display_gloss_kind text not null default 'editorial_translation' check(display_gloss_kind in ('source_translation','editorial_translation','editorial_summary')),
 definition text,
 source_locator text not null,
 provider_version text,
 content_hash text check(content_hash is null or content_hash ~ '^[0-9a-f]{64}$'),
 review_status text not null default 'pending',
 enabled boolean not null default false,
 approved_at timestamptz,
 approved_by uuid,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(source_id,language,lexical_id),
 unique(id,source_id)
);
create table public.biblical_word_occurrences(
 id uuid primary key default extensions.gen_random_uuid(),
 source_id uuid not null references public.biblical_sources(id),
 lexical_entry_id uuid not null,
 book_code text not null references public.biblical_books(code),
 chapter smallint not null,
 verse smallint not null,
 word_index smallint not null,
 surface_form text not null,
 normalized_form text,
 morphology_code text,
 morphology_summary text,
 source_locator text not null,
 provider_version text,
 content_hash text check(content_hash is null or content_hash ~ '^[0-9a-f]{64}$'),
 review_status text not null default 'pending',
 enabled boolean not null default false,
 approved_at timestamptz,
 approved_by uuid,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 display_word_index smallint not null,
 morpheme_index smallint not null default 1,
 token_kind text not null default 'word' check(token_kind in ('word','prefix','suffix')),
 word_group_key text,
 occurrence_transliteration text,
 occurrence_gloss_es text,
 punctuation_before text,
 punctuation_after text,
 joins_previous boolean not null default false,
 joins_next boolean not null default false,
 textual_status text not null default 'base' check(textual_status in ('base','variant','uncertain')),
 variant_group_key text,
 witness_data jsonb not null default '{}'::jsonb,
 foreign key(lexical_entry_id,source_id) references public.biblical_lexical_entries(id,source_id),
 unique(book_code,chapter,verse,source_id,word_index,morpheme_index)
);
create table public.biblical_verse_texts(
 id uuid primary key default extensions.gen_random_uuid(),
 source_id uuid not null references public.biblical_sources(id),
 book_code text not null references public.biblical_books(code),
 chapter smallint not null,
 verse smallint not null,
 language text not null check(language in ('hebrew','aramaic','greek')),
 original_text text not null,
 normalized_text text,
 transliteration text,
 literal_translation_es text,
 text_direction text not null default 'ltr' check(text_direction in ('ltr','rtl')),
 token_count smallint,
 analysis_status text not null default 'partial' check(analysis_status in ('partial','complete','verified')),
 source_locator text not null,
 provider_version text,
 content_hash text check(content_hash is null or content_hash ~ '^[0-9a-f]{64}$'),
 review_status text not null default 'pending',
 enabled boolean not null default false,
 approved_at timestamptz,
 approved_by uuid,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(source_id,book_code,chapter,verse,language),
 unique(id,source_id)
);
create table public.biblical_textual_variants(
 id uuid primary key default extensions.gen_random_uuid(),
 source_id uuid not null references public.biblical_sources(id),
 verse_text_id uuid not null,
 variant_key text not null,
 anchor_word_index smallint,
 reading_type text not null check(reading_type in ('substitution','addition','omission','transposition','orthographic')),
 base_reading text,
 variant_reading text,
 witness_summary text,
 witnesses jsonb not null default '[]'::jsonb,
 editions jsonb not null default '[]'::jsonb,
 significance_es text,
 source_locator text not null,
 provider_version text,
 content_hash text check(content_hash is null or content_hash ~ '^[0-9a-f]{64}$'),
 review_status text not null default 'pending',
 enabled boolean not null default false,
 approved_at timestamptz,
 approved_by uuid,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 foreign key(verse_text_id,source_id) references public.biblical_verse_texts(id,source_id) on delete cascade,
 unique(source_id,verse_text_id,variant_key)
);
create table internal.biblical_textual_import_batches(
 id uuid primary key default extensions.gen_random_uuid(),
 source_id uuid not null references public.biblical_sources(id),
 dataset text not null,
 book_code text not null references public.biblical_books(code),
 source_commit text not null,
 artifact_sha256 text not null check(artifact_sha256 ~ '^[0-9a-f]{64}$'),
 source_reference_count integer not null,
 base_word_count integer not null,
 variant_row_count integer not null default 0,
 total_row_count integer not null,
 import_status text not null default 'validated',
 imported_verse_count integer not null default 0,
 imported_occurrence_count integer not null default 0,
 imported_variant_count integer not null default 0,
 error_message text,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(source_id,dataset,book_code,source_commit)
);

insert into public.biblical_sources(
 slug,name,source_type,language,provider,provider_ref,provider_version,
 content_hash,attribution,review_status,enabled,approved_at,metadata
) values(
 'stepbible-lexical-pilot','STEP Bible Data','lexical','multilingual','STEP Bible',
 'STEPBible/STEPBible-Data','STEPBible-Data@b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39',
 repeat('a',64),'STEP Bible, CC BY 4.0','approved',true,now(),'{}'::jsonb
);
insert into public.biblical_books(code) values('OBA');

with source as (select id from public.biblical_sources where slug='stepbible-lexical-pilot')
insert into public.biblical_lexical_entries(
 source_id,language,lexical_id,strong_number,lemma,source_gloss,display_gloss_es,
 display_gloss_kind,source_locator,provider_version,content_hash,
 review_status,enabled,approved_at,metadata
)
select id,'hebrew','H3068G','H3068','יהוה','Yahweh','Yahvé','editorial_translation',
 'fixture:H3068G','fixture',repeat('b',64),'approved',true,now(),'{}'::jsonb from source
union all
select id,'hebrew','H9020','H9020','־י','my','mi','editorial_translation',
 'fixture:H9020','fixture',repeat('c',64),'approved',true,now(),'{}'::jsonb from source;
