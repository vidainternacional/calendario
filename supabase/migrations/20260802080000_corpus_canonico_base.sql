-- FASE D · Bloque 4
-- Corpus canónico y contexto editorial interno: índice de 66 libros + lote 1 (Pentateuco).
-- No contiene texto de traducciones bíblicas protegidas ni contenido generado en tiempo de consulta.

create extension if not exists pgcrypto with schema extensions;

insert into public.biblical_sources (
  slug, name, source_type, language, website, license_url, license_notes,
  license_status, provider, provider_ref, provider_version, content_hash,
  attribution, review_status, enabled, metadata, approved_at
)
values (
  'vida-contexto-editorial',
  'VIDA — Corpus editorial de contexto bíblico',
  'commentary',
  'spa',
  null,
  null,
  'Contenido editorial original de Vida Internacional. Los resúmenes distinguen datos, debate académico e interpretación espiritual.',
  'verified',
  'Vida Internacional',
  'editorial-context-corpus',
  'pentateuco-v1-2026-08-02',
  encode(extensions.digest('vida-contexto-editorial|pentateuco-v1-2026-08-02', 'sha256'), 'hex'),
  'Resúmenes editoriales originales de Vida Internacional; pueden citar fuentes externas por separado cuando corresponda.',
  'approved',
  true,
  jsonb_build_object(
    'coverage', 'canonical-index-and-pentateuch',
    'generated_by_ai', false,
    'editorial_method', 'contextual-synthesis',
    'limitations', 'No sustituye crítica textual ni léxicos especializados.'
  ),
  now()
)
on conflict (slug) do update set
  name = excluded.name,
  provider_version = excluded.provider_version,
  content_hash = excluded.content_hash,
  attribution = excluded.attribution,
  review_status = excluded.review_status,
  enabled = excluded.enabled,
  metadata = excluded.metadata,
  updated_at = now();

create table if not exists public.biblical_books (
  code text primary key check (code ~ '^[A-Z0-9]{2,8}$'),
  canonical_order smallint not null unique check (canonical_order between 1 and 66),
  name_es text not null,
  name_en text not null,
  chapter_count smallint not null check (chapter_count > 0),
  testament text not null check (testament in ('old', 'new')),
  canonical_section text not null check (
    canonical_section in (
      'law','history','poetry','wisdom','prophets_major','prophets_minor',
      'gospels','pauline','general','apocalyptic'
    )
  ),
  original_languages text[] not null default '{}',
  aliases text[] not null default '{}',
  source_id uuid not null references public.biblical_sources(id) on delete restrict,
  source_locator text not null,
  provider_version text,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  review_status text not null default 'pending' check (review_status in ('pending','approved','rejected')),
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.biblical_books is
  'Índice canónico interno de los 66 libros usado para reconocer referencias y ensamblar estudios sin IA.';

create table if not exists public.biblical_context_units (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  book_code text not null references public.biblical_books(code) on delete cascade,
  source_id uuid not null references public.biblical_sources(id) on delete restrict,
  scope_kind text not null check (scope_kind in ('book','section','chapter')),
  chapter_start smallint not null check (chapter_start > 0),
  verse_start smallint check (verse_start is null or verse_start > 0),
  chapter_end smallint not null check (chapter_end >= chapter_start),
  verse_end smallint check (verse_end is null or verse_end > 0),
  title text not null,
  summary text not null check (char_length(summary) between 40 and 8000),
  historical_context text not null check (char_length(historical_context) between 40 and 8000),
  jewish_context text not null check (char_length(jewish_context) between 40 and 8000),
  literary_context text not null check (char_length(literary_context) between 40 and 8000),
  authorial_intent text not null check (char_length(authorial_intent) between 40 and 8000),
  theological_reflection text not null check (char_length(theological_reflection) between 40 and 8000),
  interpretive_cautions text not null check (char_length(interpretive_cautions) between 40 and 8000),
  key_terms text[] not null default '{}',
  people_groups text[] not null default '{}',
  places text[] not null default '{}',
  source_locator text not null,
  provider_version text,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  review_status text not null default 'pending' check (review_status in ('pending','approved','rejected')),
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (chapter_start < chapter_end)
    or (
      chapter_start = chapter_end
      and (verse_start is null or verse_end is null or verse_start <= verse_end)
    )
  )
);

comment on table public.biblical_context_units is
  'Contexto editorial por libro, sección o capítulo, recuperable por referencia y separado de la IA.';

create index if not exists biblical_context_units_reference_idx
  on public.biblical_context_units (book_code, chapter_start, chapter_end)
  where enabled = true and review_status = 'approved';

create index if not exists biblical_books_aliases_gin
  on public.biblical_books using gin (aliases);

alter table public.biblical_books enable row level security;
alter table public.biblical_context_units enable row level security;

drop policy if exists "Usuarios activos leen libros bíblicos aprobados" on public.biblical_books;
create policy "Usuarios activos leen libros bíblicos aprobados"
on public.biblical_books
for select
to authenticated
using (
  enabled
  and review_status = 'approved'
  and (select public.cuenta_activa())
  and exists (
    select 1
    from public.biblical_sources source
    where source.id = biblical_books.source_id
      and source.enabled
      and source.review_status = 'approved'
  )
);

drop policy if exists "Usuarios activos leen contexto canónico aprobado" on public.biblical_context_units;
create policy "Usuarios activos leen contexto canónico aprobado"
on public.biblical_context_units
for select
to authenticated
using (
  enabled
  and review_status = 'approved'
  and (select public.cuenta_activa())
  and exists (
    select 1
    from public.biblical_books book
    where book.code = biblical_context_units.book_code
      and book.enabled
      and book.review_status = 'approved'
  )
  and exists (
    select 1
    from public.biblical_sources source
    where source.id = biblical_context_units.source_id
      and source.enabled
      and source.review_status = 'approved'
  )
);

revoke all on table public.biblical_books from anon;
revoke all on table public.biblical_context_units from anon;
revoke insert, update, delete, truncate, references, trigger on table public.biblical_books from authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.biblical_context_units from authenticated;
grant select on table public.biblical_books to authenticated;
grant select on table public.biblical_context_units to authenticated;

with source as (
  select id from public.biblical_sources where slug = 'vida-contexto-editorial'
),
data(code, canonical_order, name_es, name_en, chapter_count, testament, canonical_section, original_languages, aliases) as (
  values
  ('GEN',1,'Génesis','Genesis',50,'old','law',ARRAY['hebrew']::text[],ARRAY['Génesis','Genesis','Gen','Gn']::text[]),
  ('EXO',2,'Éxodo','Exodus',40,'old','law',ARRAY['hebrew']::text[],ARRAY['Éxodo','Exodus','Ex','Éx']::text[]),
  ('LEV',3,'Levítico','Leviticus',27,'old','law',ARRAY['hebrew']::text[],ARRAY['Levítico','Leviticus','Lev','Lv']::text[]),
  ('NUM',4,'Números','Numbers',36,'old','law',ARRAY['hebrew']::text[],ARRAY['Números','Numbers','Num','Nm']::text[]),
  ('DEU',5,'Deuteronomio','Deuteronomy',34,'old','law',ARRAY['hebrew']::text[],ARRAY['Deuteronomio','Deuteronomy','Deut','Dt']::text[]),
  ('JOS',6,'Josué','Joshua',24,'old','history',ARRAY['hebrew']::text[],ARRAY['Josué','Joshua','Jos']::text[]),
  ('JDG',7,'Jueces','Judges',21,'old','history',ARRAY['hebrew']::text[],ARRAY['Jueces','Judges','Jue','Judg']::text[]),
  ('RUT',8,'Rut','Ruth',4,'old','history',ARRAY['hebrew']::text[],ARRAY['Rut','Ruth']::text[]),
  ('1SA',9,'1 Samuel','1 Samuel',31,'old','history',ARRAY['hebrew']::text[],ARRAY['1 Samuel','1 Sam','1Sa']::text[]),
  ('2SA',10,'2 Samuel','2 Samuel',24,'old','history',ARRAY['hebrew']::text[],ARRAY['2 Samuel','2 Sam','2Sa']::text[]),
  ('1KI',11,'1 Reyes','1 Kings',22,'old','history',ARRAY['hebrew']::text[],ARRAY['1 Reyes','1 Kings','1Re','1Ki']::text[]),
  ('2KI',12,'2 Reyes','2 Kings',25,'old','history',ARRAY['hebrew']::text[],ARRAY['2 Reyes','2 Kings','2Re','2Ki']::text[]),
  ('1CH',13,'1 Crónicas','1 Chronicles',29,'old','history',ARRAY['hebrew']::text[],ARRAY['1 Crónicas','1 Chronicles','1Cr','1Ch']::text[]),
  ('2CH',14,'2 Crónicas','2 Chronicles',36,'old','history',ARRAY['hebrew']::text[],ARRAY['2 Crónicas','2 Chronicles','2Cr','2Ch']::text[]),
  ('EZR',15,'Esdras','Ezra',10,'old','history',ARRAY['hebrew','aramaic']::text[],ARRAY['Esdras','Ezra','Esd']::text[]),
  ('NEH',16,'Nehemías','Nehemiah',13,'old','history',ARRAY['hebrew']::text[],ARRAY['Nehemías','Nehemiah','Neh']::text[]),
  ('EST',17,'Ester','Esther',10,'old','history',ARRAY['hebrew']::text[],ARRAY['Ester','Esther','Est']::text[]),
  ('JOB',18,'Job','Job',42,'old','wisdom',ARRAY['hebrew']::text[],ARRAY['Job']::text[]),
  ('PSA',19,'Salmos','Psalms',150,'old','poetry',ARRAY['hebrew']::text[],ARRAY['Salmos','Salmo','Psalms','Psalm','Sal','Ps']::text[]),
  ('PRO',20,'Proverbios','Proverbs',31,'old','wisdom',ARRAY['hebrew']::text[],ARRAY['Proverbios','Proverbs','Prov','Pr']::text[]),
  ('ECC',21,'Eclesiastés','Ecclesiastes',12,'old','wisdom',ARRAY['hebrew']::text[],ARRAY['Eclesiastés','Ecclesiastes','Ecl','Ec']::text[]),
  ('SNG',22,'Cantares','Song of Songs',8,'old','poetry',ARRAY['hebrew']::text[],ARRAY['Cantares','Cantar de los Cantares','Song of Songs','Song','Cnt']::text[]),
  ('ISA',23,'Isaías','Isaiah',66,'old','prophets_major',ARRAY['hebrew']::text[],ARRAY['Isaías','Isaiah','Isa']::text[]),
  ('JER',24,'Jeremías','Jeremiah',52,'old','prophets_major',ARRAY['hebrew']::text[],ARRAY['Jeremías','Jeremiah','Jer']::text[]),
  ('LAM',25,'Lamentaciones','Lamentations',5,'old','poetry',ARRAY['hebrew']::text[],ARRAY['Lamentaciones','Lamentations','Lam']::text[]),
  ('EZK',26,'Ezequiel','Ezekiel',48,'old','prophets_major',ARRAY['hebrew']::text[],ARRAY['Ezequiel','Ezekiel','Eze','Ezk']::text[]),
  ('DAN',27,'Daniel','Daniel',12,'old','prophets_major',ARRAY['hebrew','aramaic']::text[],ARRAY['Daniel','Dan']::text[]),
  ('HOS',28,'Oseas','Hosea',14,'old','prophets_minor',ARRAY['hebrew']::text[],ARRAY['Oseas','Hosea','Os','Hos']::text[]),
  ('JOL',29,'Joel','Joel',3,'old','prophets_minor',ARRAY['hebrew']::text[],ARRAY['Joel']::text[]),
  ('AMO',30,'Amós','Amos',9,'old','prophets_minor',ARRAY['hebrew']::text[],ARRAY['Amós','Amos']::text[]),
  ('OBA',31,'Abdías','Obadiah',1,'old','prophets_minor',ARRAY['hebrew']::text[],ARRAY['Abdías','Obadiah','Abd','Oba']::text[]),
  ('JON',32,'Jonás','Jonah',4,'old','prophets_minor',ARRAY['hebrew']::text[],ARRAY['Jonás','Jonah','Jon']::text[]),
  ('MIC',33,'Miqueas','Micah',7,'old','prophets_minor',ARRAY['hebrew']::text[],ARRAY['Miqueas','Micah','Miq','Mic']::text[]),
  ('NAM',34,'Nahúm','Nahum',3,'old','prophets_minor',ARRAY['hebrew']::text[],ARRAY['Nahúm','Nahum','Nah']::text[]),
  ('HAB',35,'Habacuc','Habakkuk',3,'old','prophets_minor',ARRAY['hebrew']::text[],ARRAY['Habacuc','Habakkuk','Hab']::text[]),
  ('ZEP',36,'Sofonías','Zephaniah',3,'old','prophets_minor',ARRAY['hebrew']::text[],ARRAY['Sofonías','Zephaniah','Sof','Zep']::text[]),
  ('HAG',37,'Hageo','Haggai',2,'old','prophets_minor',ARRAY['hebrew']::text[],ARRAY['Hageo','Haggai','Hag']::text[]),
  ('ZEC',38,'Zacarías','Zechariah',14,'old','prophets_minor',ARRAY['hebrew']::text[],ARRAY['Zacarías','Zechariah','Zac','Zec']::text[]),
  ('MAL',39,'Malaquías','Malachi',4,'old','prophets_minor',ARRAY['hebrew']::text[],ARRAY['Malaquías','Malachi','Mal']::text[]),
  ('MAT',40,'Mateo','Matthew',28,'new','gospels',ARRAY['greek']::text[],ARRAY['Mateo','Matthew','Mt','Matt']::text[]),
  ('MRK',41,'Marcos','Mark',16,'new','gospels',ARRAY['greek']::text[],ARRAY['Marcos','Mark','Mr','Mk']::text[]),
  ('LUK',42,'Lucas','Luke',24,'new','gospels',ARRAY['greek']::text[],ARRAY['Lucas','Luke','Lc','Lk']::text[]),
  ('JHN',43,'Juan','John',21,'new','gospels',ARRAY['greek']::text[],ARRAY['Juan','John','Jn','Jhn']::text[]),
  ('ACT',44,'Hechos','Acts',28,'new','history',ARRAY['greek']::text[],ARRAY['Hechos','Acts','Hch','Act']::text[]),
  ('ROM',45,'Romanos','Romans',16,'new','pauline',ARRAY['greek']::text[],ARRAY['Romanos','Romans','Rom']::text[]),
  ('1CO',46,'1 Corintios','1 Corinthians',16,'new','pauline',ARRAY['greek']::text[],ARRAY['1 Corintios','1 Corinthians','1Co']::text[]),
  ('2CO',47,'2 Corintios','2 Corinthians',13,'new','pauline',ARRAY['greek']::text[],ARRAY['2 Corintios','2 Corinthians','2Co']::text[]),
  ('GAL',48,'Gálatas','Galatians',6,'new','pauline',ARRAY['greek']::text[],ARRAY['Gálatas','Galatians','Gal']::text[]),
  ('EPH',49,'Efesios','Ephesians',6,'new','pauline',ARRAY['greek']::text[],ARRAY['Efesios','Ephesians','Efe','Eph']::text[]),
  ('PHP',50,'Filipenses','Philippians',4,'new','pauline',ARRAY['greek']::text[],ARRAY['Filipenses','Philippians','Fil','Php']::text[]),
  ('COL',51,'Colosenses','Colossians',4,'new','pauline',ARRAY['greek']::text[],ARRAY['Colosenses','Colossians','Col']::text[]),
  ('1TH',52,'1 Tesalonicenses','1 Thessalonians',5,'new','pauline',ARRAY['greek']::text[],ARRAY['1 Tesalonicenses','1 Thessalonians','1Tes','1Th']::text[]),
  ('2TH',53,'2 Tesalonicenses','2 Thessalonians',3,'new','pauline',ARRAY['greek']::text[],ARRAY['2 Tesalonicenses','2 Thessalonians','2Tes','2Th']::text[]),
  ('1TI',54,'1 Timoteo','1 Timothy',6,'new','pauline',ARRAY['greek']::text[],ARRAY['1 Timoteo','1 Timothy','1Ti']::text[]),
  ('2TI',55,'2 Timoteo','2 Timothy',4,'new','pauline',ARRAY['greek']::text[],ARRAY['2 Timoteo','2 Timothy','2Ti']::text[]),
  ('TIT',56,'Tito','Titus',3,'new','pauline',ARRAY['greek']::text[],ARRAY['Tito','Titus','Tit']::text[]),
  ('PHM',57,'Filemón','Philemon',1,'new','pauline',ARRAY['greek']::text[],ARRAY['Filemón','Philemon','Flm','Phm']::text[]),
  ('HEB',58,'Hebreos','Hebrews',13,'new','general',ARRAY['greek']::text[],ARRAY['Hebreos','Hebrews','Heb']::text[]),
  ('JAS',59,'Santiago','James',5,'new','general',ARRAY['greek']::text[],ARRAY['Santiago','James','Stg','Jas']::text[]),
  ('1PE',60,'1 Pedro','1 Peter',5,'new','general',ARRAY['greek']::text[],ARRAY['1 Pedro','1 Peter','1Pe']::text[]),
  ('2PE',61,'2 Pedro','2 Peter',3,'new','general',ARRAY['greek']::text[],ARRAY['2 Pedro','2 Peter','2Pe']::text[]),
  ('1JN',62,'1 Juan','1 John',5,'new','general',ARRAY['greek']::text[],ARRAY['1 Juan','1 John','1Jn']::text[]),
  ('2JN',63,'2 Juan','2 John',1,'new','general',ARRAY['greek']::text[],ARRAY['2 Juan','2 John','2Jn']::text[]),
  ('3JN',64,'3 Juan','3 John',1,'new','general',ARRAY['greek']::text[],ARRAY['3 Juan','3 John','3Jn']::text[]),
  ('JUD',65,'Judas','Jude',1,'new','general',ARRAY['greek']::text[],ARRAY['Judas','Jude','Jud']::text[]),
  ('REV',66,'Apocalipsis','Revelation',22,'new','apocalyptic',ARRAY['greek']::text[],ARRAY['Apocalipsis','Revelation','Rev','Apo']::text[])
)
insert into public.biblical_books (
  code, canonical_order, name_es, name_en, chapter_count, testament,
  canonical_section, original_languages, aliases, source_id,
  source_locator, provider_version, content_hash, review_status, enabled, metadata
)
select
  data.code, data.canonical_order, data.name_es, data.name_en, data.chapter_count,
  data.testament, data.canonical_section, data.original_languages, data.aliases,
  source.id,
  'vida://corpus/canon/66-books/v1#' || data.code,
  'canon-v1-2026-08-02',
  encode(extensions.digest(
    concat_ws('|', data.code, data.canonical_order::text, data.name_es, data.chapter_count::text),
    'sha256'
  ), 'hex'),
  'approved',
  true,
  jsonb_build_object('coverage_status', case when data.canonical_order <= 5 then 'context_ready' else 'indexed' end)
from data cross join source
on conflict (code) do update set
  canonical_order = excluded.canonical_order,
  name_es = excluded.name_es,
  name_en = excluded.name_en,
  chapter_count = excluded.chapter_count,
  testament = excluded.testament,
  canonical_section = excluded.canonical_section,
  original_languages = excluded.original_languages,
  aliases = excluded.aliases,
  source_id = excluded.source_id,
  source_locator = excluded.source_locator,
  provider_version = excluded.provider_version,
  content_hash = excluded.content_hash,
  review_status = excluded.review_status,
  enabled = excluded.enabled,
  metadata = excluded.metadata,
  updated_at = now();