-- FASE D · Bloque 4
-- Modelo mínimo de léxico y ocurrencias por pasaje.
-- Piloto limitado a palabras seleccionadas de Salmos 23:1 y Juan 3:16.
-- No conecta estos datos a la IA ni modifica la Biblia visible.

create table if not exists public.biblical_lexical_entries (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.biblical_sources(id) on delete restrict,
  language text not null,
  lexical_id text not null,
  strong_number text,
  lemma text not null,
  transliteration text,
  part_of_speech text,
  source_gloss text,
  display_gloss_es text,
  display_gloss_kind text not null default 'editorial_translation',
  definition text,
  source_locator text not null,
  provider_version text,
  content_hash text,
  review_status text not null default 'pending',
  enabled boolean not null default false,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint biblical_lexical_entries_language_check
    check (language in ('hebrew', 'aramaic', 'greek')),
  constraint biblical_lexical_entries_lexical_id_format
    check (lexical_id ~ '^[GH][0-9]{4}[A-Z]?$'),
  constraint biblical_lexical_entries_strong_number_format
    check (strong_number is null or strong_number ~ '^[GH][0-9]{4}$'),
  constraint biblical_lexical_entries_gloss_kind_check
    check (display_gloss_kind in ('source_translation', 'editorial_translation', 'editorial_summary')),
  constraint biblical_lexical_entries_review_status_check
    check (review_status in ('approved', 'pending', 'rejected')),
  constraint biblical_lexical_entries_enabled_requires_approval
    check (not enabled or (review_status = 'approved' and approved_at is not null)),
  constraint biblical_lexical_entries_content_hash_format
    check (content_hash is null or content_hash ~ '^[0-9a-f]{64}$'),
  constraint biblical_lexical_entries_source_language_lexical_key
    unique (source_id, language, lexical_id),
  constraint biblical_lexical_entries_id_source_key
    unique (id, source_id)
);

create index if not exists biblical_lexical_entries_strong_idx
  on public.biblical_lexical_entries (strong_number)
  where enabled and review_status = 'approved';

create index if not exists biblical_lexical_entries_lemma_idx
  on public.biblical_lexical_entries (language, lemma)
  where enabled and review_status = 'approved';

create table if not exists public.biblical_word_occurrences (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.biblical_sources(id) on delete restrict,
  lexical_entry_id uuid not null,
  book_code text not null,
  chapter smallint not null,
  verse smallint not null,
  word_index smallint not null,
  surface_form text not null,
  normalized_form text,
  morphology_code text,
  morphology_summary text,
  source_locator text not null,
  provider_version text,
  content_hash text,
  review_status text not null default 'pending',
  enabled boolean not null default false,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint biblical_word_occurrences_entry_source_fkey
    foreign key (lexical_entry_id, source_id)
    references public.biblical_lexical_entries(id, source_id)
    on delete restrict,
  constraint biblical_word_occurrences_book_code_format
    check (book_code ~ '^[A-Z0-9]{2,8}$'),
  constraint biblical_word_occurrences_reference_values
    check (chapter > 0 and verse > 0 and word_index > 0),
  constraint biblical_word_occurrences_review_status_check
    check (review_status in ('approved', 'pending', 'rejected')),
  constraint biblical_word_occurrences_enabled_requires_approval
    check (not enabled or (review_status = 'approved' and approved_at is not null)),
  constraint biblical_word_occurrences_content_hash_format
    check (content_hash is null or content_hash ~ '^[0-9a-f]{64}$'),
  constraint biblical_word_occurrences_reference_word_key
    unique (source_id, book_code, chapter, verse, word_index)
);

create index if not exists biblical_word_occurrences_reference_idx
  on public.biblical_word_occurrences (book_code, chapter, verse, word_index)
  where enabled and review_status = 'approved';

create index if not exists biblical_word_occurrences_entry_idx
  on public.biblical_word_occurrences (lexical_entry_id)
  where enabled and review_status = 'approved';

alter table public.biblical_lexical_entries enable row level security;
alter table public.biblical_word_occurrences enable row level security;

revoke all on table public.biblical_lexical_entries from anon;
revoke all on table public.biblical_word_occurrences from anon;
revoke all on table public.biblical_lexical_entries from authenticated;
revoke all on table public.biblical_word_occurrences from authenticated;
grant select on table public.biblical_lexical_entries to authenticated;
grant select on table public.biblical_word_occurrences to authenticated;

drop policy if exists "Usuarios activos leen entradas léxicas aprobadas"
  on public.biblical_lexical_entries;
create policy "Usuarios activos leen entradas léxicas aprobadas"
  on public.biblical_lexical_entries
  for select
  to authenticated
  using (
    enabled
    and review_status = 'approved'
    and (select public.cuenta_activa())
    and exists (
      select 1
      from public.biblical_sources source
      where source.id = biblical_lexical_entries.source_id
        and source.enabled
        and source.review_status = 'approved'
    )
  );

drop policy if exists "Usuarios activos leen ocurrencias léxicas aprobadas"
  on public.biblical_word_occurrences;
create policy "Usuarios activos leen ocurrencias léxicas aprobadas"
  on public.biblical_word_occurrences
  for select
  to authenticated
  using (
    enabled
    and review_status = 'approved'
    and (select public.cuenta_activa())
    and exists (
      select 1
      from public.biblical_sources source
      where source.id = biblical_word_occurrences.source_id
        and source.enabled
        and source.review_status = 'approved'
    )
    and exists (
      select 1
      from public.biblical_lexical_entries entry
      where entry.id = biblical_word_occurrences.lexical_entry_id
        and entry.source_id = biblical_word_occurrences.source_id
        and entry.enabled
        and entry.review_status = 'approved'
    )
  );

with source_row as (
  insert into public.biblical_sources (
    slug,
    name,
    source_type,
    language,
    website,
    license_url,
    license_notes,
    license_status,
    provider,
    provider_ref,
    provider_version,
    content_hash,
    attribution,
    review_status,
    enabled,
    approved_at,
    metadata,
    updated_at
  ) values (
    'stepbible-lexical-pilot',
    'STEPBible Data — piloto léxico',
    'provider_catalog',
    'mul',
    'https://github.com/STEPBible/STEPBible-Data',
    'https://creativecommons.org/licenses/by/4.0/',
    'CC BY 4.0. Este piloto usa únicamente lemas, transliteraciones, morfología y glosas breves de STEPBible Data. No importa la columna extensa Meaning de TBESH ni léxicos completos.',
    'verified',
    'STEPBible',
    'STEPBible-Data/lexical-pilot-v1',
    'pilot-v1-2026-08-01',
    'e6990d643802c3d5ec845ca7feda90123f25397078798aa666b06ed8d3ce7681',
    'STEP Bible (STEPBible.org), datos adaptados del repositorio STEPBible-Data bajo CC BY 4.0.',
    'approved',
    true,
    now(),
    jsonb_build_object(
      'datasets', jsonb_build_array('TBESH', 'TBESG', 'TAHOT', 'TAGNT'),
      'pilot_references', jsonb_build_array('PSA.23.1', 'JHN.3.16'),
      'fields_used', jsonb_build_array('lemma', 'transliteration', 'morphology', 'brief_gloss'),
      'excluded_fields', jsonb_build_array('TBESH Meaning', 'full lexicon definitions'),
      'transformations', jsonb_build_array('Spanish interface glosses are editorial translations'),
      'reviewed_on', '2026-08-01'
    ),
    now()
  )
  on conflict (slug) do update set
    name = excluded.name,
    source_type = excluded.source_type,
    language = excluded.language,
    website = excluded.website,
    license_url = excluded.license_url,
    license_notes = excluded.license_notes,
    license_status = excluded.license_status,
    provider = excluded.provider,
    provider_ref = excluded.provider_ref,
    provider_version = excluded.provider_version,
    content_hash = excluded.content_hash,
    attribution = excluded.attribution,
    review_status = excluded.review_status,
    enabled = excluded.enabled,
    approved_at = excluded.approved_at,
    metadata = excluded.metadata,
    updated_at = now()
  returning id
),
entry_seed (
  language,
  lexical_id,
  strong_number,
  lemma,
  transliteration,
  part_of_speech,
  source_gloss,
  display_gloss_es,
  source_locator,
  provider_version,
  content_hash,
  metadata
) as (
  values
    (
      'hebrew', 'H3068G', 'H3068', 'יְהֹוָה', 'ye.ho.vah', 'proper_name', 'LORD', 'SEÑOR',
      'https://github.com/STEPBible/STEPBible-Data/blob/master/Lexicons/TBESH%20-%20Translators%20Brief%20lexicon%20of%20Extended%20Strongs%20for%20Hebrew%20-%20STEPBible.org%20CC%20BY.txt',
      'pilot-v1-2026-08-01',
      '7c7dd404ec1e37e22ae47148e4ecfd88fcfead8763fcce477b29db9478d40fef',
      jsonb_build_object('dataset', 'TBESH', 'source_fields', jsonb_build_array('Hebrew', 'Transliteration', 'Morph', 'Gloss'), 'excluded_fields', jsonb_build_array('Meaning'))
    ),
    (
      'hebrew', 'H7462B', 'H7462', 'רָעָה', 'ra.ah', 'verb', 'to pasture', 'pastorear, cuidar',
      'https://github.com/STEPBible/STEPBible-Data/blob/master/Lexicons/TBESH%20-%20Translators%20Brief%20lexicon%20of%20Extended%20Strongs%20for%20Hebrew%20-%20STEPBible.org%20CC%20BY.txt',
      'pilot-v1-2026-08-01',
      'b9183f3d9ef33229a34f512c4c0e850d96c1b96eded0f0b4dabaf0fe844007b0',
      jsonb_build_object('dataset', 'TBESH', 'source_fields', jsonb_build_array('Hebrew', 'Transliteration', 'Morph', 'Gloss'), 'excluded_fields', jsonb_build_array('Meaning'))
    ),
    (
      'hebrew', 'H2637', 'H2637', 'חָסֵר', 'cha.ser', 'verb', 'to lack', 'carecer, faltar',
      'https://github.com/STEPBible/STEPBible-Data/blob/master/Lexicons/TBESH%20-%20Translators%20Brief%20lexicon%20of%20Extended%20Strongs%20for%20Hebrew%20-%20STEPBible.org%20CC%20BY.txt',
      'pilot-v1-2026-08-01',
      'bfdf3a4408e355392e017c528961515708dda57d9678eee1bcf5d119c3d7dcc1',
      jsonb_build_object('dataset', 'TBESH', 'source_fields', jsonb_build_array('Hebrew', 'Transliteration', 'Morph', 'Gloss'), 'excluded_fields', jsonb_build_array('Meaning'))
    ),
    (
      'greek', 'G0025', 'G0025', 'ἀγαπάω', 'agapaō', 'verb', 'to love', 'amar',
      'https://github.com/STEPBible/STEPBible-Data/blob/master/Lexicons/TBESG%20-%20Translators%20Brief%20lexicon%20of%20Extended%20Strongs%20for%20Greek%20-%20STEPBible.org%20CC%20BY.txt',
      'pilot-v1-2026-08-01',
      '66be061a17b4e4d2a2e6ced7f21c641b71cd0c52866045e8b81cfbfd69864c8d',
      jsonb_build_object('dataset', 'TBESG', 'source_fields', jsonb_build_array('Greek', 'Transliteration', 'Morph', 'Gloss'))
    ),
    (
      'greek', 'G2316', 'G2316', 'θεός', 'theos', 'noun', 'God', 'Dios',
      'https://github.com/STEPBible/STEPBible-Data/blob/master/Lexicons/TBESG%20-%20Translators%20Brief%20lexicon%20of%20Extended%20Strongs%20for%20Greek%20-%20STEPBible.org%20CC%20BY.txt',
      'pilot-v1-2026-08-01',
      '5297ec23adb0f58f1dee53f909da3660c4811fe5247f223058615d39ac5ba1d4',
      jsonb_build_object('dataset', 'TBESG', 'source_fields', jsonb_build_array('Greek', 'Transliteration', 'Morph', 'Gloss'))
    ),
    (
      'greek', 'G2889', 'G2889', 'κόσμος', 'kosmos', 'noun', 'world', 'mundo',
      'https://github.com/STEPBible/STEPBible-Data/blob/master/Lexicons/TBESG%20-%20Translators%20Brief%20lexicon%20of%20Extended%20Strongs%20for%20Greek%20-%20STEPBible.org%20CC%20BY.txt',
      'pilot-v1-2026-08-01',
      'a2c00391d886154be30e2c036912008889133bf2abd997492e92d8daf2b16efb',
      jsonb_build_object('dataset', 'TBESG', 'source_fields', jsonb_build_array('Greek', 'Transliteration', 'Morph', 'Gloss'))
    ),
    (
      'greek', 'G4100', 'G4100', 'πιστεύω', 'pisteuō', 'verb', 'to believe', 'creer, confiar',
      'https://github.com/STEPBible/STEPBible-Data/blob/master/Lexicons/TBESG%20-%20Translators%20Brief%20lexicon%20of%20Extended%20Strongs%20for%20Greek%20-%20STEPBible.org%20CC%20BY.txt',
      'pilot-v1-2026-08-01',
      'ce9a5813fb802105be642ff593960166438b5384288b0fadf5711e5d6ca1226d',
      jsonb_build_object('dataset', 'TBESG', 'source_fields', jsonb_build_array('Greek', 'Transliteration', 'Morph', 'Gloss'))
    )
),
entry_rows as (
  insert into public.biblical_lexical_entries (
    source_id,
    language,
    lexical_id,
    strong_number,
    lemma,
    transliteration,
    part_of_speech,
    source_gloss,
    display_gloss_es,
    display_gloss_kind,
    definition,
    source_locator,
    provider_version,
    content_hash,
    review_status,
    enabled,
    approved_at,
    metadata,
    updated_at
  )
  select
    source_row.id,
    entry_seed.language,
    entry_seed.lexical_id,
    entry_seed.strong_number,
    entry_seed.lemma,
    entry_seed.transliteration,
    entry_seed.part_of_speech,
    entry_seed.source_gloss,
    entry_seed.display_gloss_es,
    'editorial_translation',
    null,
    entry_seed.source_locator,
    entry_seed.provider_version,
    entry_seed.content_hash,
    'approved',
    true,
    now(),
    entry_seed.metadata,
    now()
  from source_row
  cross join entry_seed
  on conflict (source_id, language, lexical_id) do update set
    strong_number = excluded.strong_number,
    lemma = excluded.lemma,
    transliteration = excluded.transliteration,
    part_of_speech = excluded.part_of_speech,
    source_gloss = excluded.source_gloss,
    display_gloss_es = excluded.display_gloss_es,
    display_gloss_kind = excluded.display_gloss_kind,
    definition = excluded.definition,
    source_locator = excluded.source_locator,
    provider_version = excluded.provider_version,
    content_hash = excluded.content_hash,
    review_status = excluded.review_status,
    enabled = excluded.enabled,
    approved_at = excluded.approved_at,
    metadata = excluded.metadata,
    updated_at = now()
  returning id, source_id, lexical_id
),
occurrence_seed (
  lexical_id,
  book_code,
  chapter,
  verse,
  word_index,
  surface_form,
  normalized_form,
  morphology_code,
  morphology_summary,
  source_locator,
  provider_version,
  content_hash,
  metadata
) as (
  values
    (
      'H3068G', 'PSA', 23, 1, 3, 'יְהוָה', 'יהוה', null, null,
      'https://github.com/STEPBible/STEPBible-Data/blob/master/Translators%20Amalgamated%20OT%2BNT/TAHOT%20Job-Sng%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt',
      'pilot-v1-2026-08-01',
      '133d7482a59ccff74c2c371c7f2c5ce0c15a80a15450ab83fafe16346b292e5c',
      jsonb_build_object('dataset', 'TAHOT', 'reference', 'Psa.23.1', 'selection', 'pilot_keyword')
    ),
    (
      'H7462B', 'PSA', 23, 1, 4, 'רֹעִי', 'רעי', null, null,
      'https://github.com/STEPBible/STEPBible-Data/blob/master/Translators%20Amalgamated%20OT%2BNT/TAHOT%20Job-Sng%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt',
      'pilot-v1-2026-08-01',
      '25ce2971c4745a912b5252ccaf7d0d54ade2e47e914776c8d67ddbd735f1e01c',
      jsonb_build_object('dataset', 'TAHOT', 'reference', 'Psa.23.1', 'selection', 'pilot_keyword')
    ),
    (
      'H2637', 'PSA', 23, 1, 6, 'אֶחְסָר', 'אחסר', null, null,
      'https://github.com/STEPBible/STEPBible-Data/blob/master/Translators%20Amalgamated%20OT%2BNT/TAHOT%20Job-Sng%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt',
      'pilot-v1-2026-08-01',
      '0a45472d9d8f21e7facb812f8cd0b1d9e42ead89f9e4a6c1290d036151ec46d6',
      jsonb_build_object('dataset', 'TAHOT', 'reference', 'Psa.23.1', 'selection', 'pilot_keyword')
    ),
    (
      'G0025', 'JHN', 3, 16, 3, 'ἠγάπησεν', 'ηγαπησεν', 'V-AAI-3S', 'verbo, aoristo activo indicativo, tercera persona singular',
      'https://github.com/STEPBible/STEPBible-Data/blob/master/Translators%20Amalgamated%20OT%2BNT/TAGNT%20Mat-Jhn%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt',
      'pilot-v1-2026-08-01',
      '8349b50c0644fa2c8d94af226518895354e53d5a3a1a69b04f3f9238e27d0788',
      jsonb_build_object('dataset', 'TAGNT', 'reference', 'Jhn.3.16', 'selection', 'pilot_keyword', 'morphology_summary_kind', 'editorial_expansion')
    ),
    (
      'G2316', 'JHN', 3, 16, 5, 'θεὸς', 'θεος', 'N-NSM', 'sustantivo nominativo singular masculino',
      'https://github.com/STEPBible/STEPBible-Data/blob/master/Translators%20Amalgamated%20OT%2BNT/TAGNT%20Mat-Jhn%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt',
      'pilot-v1-2026-08-01',
      'e1f5097a7c2d65a613d13fdc41c35c56670bf09ce34342f8a3e3aea8a35c2c92',
      jsonb_build_object('dataset', 'TAGNT', 'reference', 'Jhn.3.16', 'selection', 'pilot_keyword', 'morphology_summary_kind', 'editorial_expansion')
    ),
    (
      'G2889', 'JHN', 3, 16, 7, 'κόσμον', 'κοσμον', 'N-ASM', 'sustantivo acusativo singular masculino',
      'https://github.com/STEPBible/STEPBible-Data/blob/master/Translators%20Amalgamated%20OT%2BNT/TAGNT%20Mat-Jhn%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt',
      'pilot-v1-2026-08-01',
      '5d62df1c24b106be54e57b3a263c59b367f1da6db56ce17536ea5258701f7d90',
      jsonb_build_object('dataset', 'TAGNT', 'reference', 'Jhn.3.16', 'selection', 'pilot_keyword', 'morphology_summary_kind', 'editorial_expansion')
    ),
    (
      'G4100', 'JHN', 3, 16, 17, 'πιστεύων', 'πιστευων', 'V-PAP-NSM', 'verbo, participio presente activo, nominativo singular masculino',
      'https://github.com/STEPBible/STEPBible-Data/blob/master/Translators%20Amalgamated%20OT%2BNT/TAGNT%20Mat-Jhn%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt',
      'pilot-v1-2026-08-01',
      '5678c5d5b4605220f17b5e9e64c7c679fc3f93357a3baac60cd47de0e10cb0a9',
      jsonb_build_object('dataset', 'TAGNT', 'reference', 'Jhn.3.16', 'selection', 'pilot_keyword', 'morphology_summary_kind', 'editorial_expansion')
    )
)
insert into public.biblical_word_occurrences (
  source_id,
  lexical_entry_id,
  book_code,
  chapter,
  verse,
  word_index,
  surface_form,
  normalized_form,
  morphology_code,
  morphology_summary,
  source_locator,
  provider_version,
  content_hash,
  review_status,
  enabled,
  approved_at,
  metadata,
  updated_at
)
select
  entry_rows.source_id,
  entry_rows.id,
  occurrence_seed.book_code,
  occurrence_seed.chapter,
  occurrence_seed.verse,
  occurrence_seed.word_index,
  occurrence_seed.surface_form,
  occurrence_seed.normalized_form,
  occurrence_seed.morphology_code,
  occurrence_seed.morphology_summary,
  occurrence_seed.source_locator,
  occurrence_seed.provider_version,
  occurrence_seed.content_hash,
  'approved',
  true,
  now(),
  occurrence_seed.metadata,
  now()
from occurrence_seed
join entry_rows using (lexical_id)
on conflict (source_id, book_code, chapter, verse, word_index) do update set
  lexical_entry_id = excluded.lexical_entry_id,
  surface_form = excluded.surface_form,
  normalized_form = excluded.normalized_form,
  morphology_code = excluded.morphology_code,
  morphology_summary = excluded.morphology_summary,
  source_locator = excluded.source_locator,
  provider_version = excluded.provider_version,
  content_hash = excluded.content_hash,
  review_status = excluded.review_status,
  enabled = excluded.enabled,
  approved_at = excluded.approved_at,
  metadata = excluded.metadata,
  updated_at = now();
