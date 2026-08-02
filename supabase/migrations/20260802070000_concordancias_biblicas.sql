-- FASE D · Bloque 4
-- Estructura segura para concordancias bíblicas y palabras clave.

create table if not exists public.biblical_concordance_terms (
  id uuid primary key default gen_random_uuid(),
  canonical_term text not null,
  normalized_term text not null,
  language text not null default 'es',
  description text,
  source_id uuid not null references public.biblical_sources(id) on delete restrict,
  source_locator text not null,
  provider_version text,
  content_hash text not null,
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (normalized_term, language, source_id)
);

create table if not exists public.biblical_concordance_aliases (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.biblical_concordance_terms(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  alias_kind text not null default 'keyword' check (alias_kind in ('keyword', 'synonym', 'question_intent', 'transliteration', 'lemma')),
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  unique (term_id, normalized_alias)
);

create table if not exists public.biblical_concordance_occurrences (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.biblical_concordance_terms(id) on delete cascade,
  book_code text not null,
  book_name text not null,
  chapter integer not null check (chapter > 0),
  verse integer not null check (verse > 0),
  reference_label text not null,
  verse_excerpt text,
  relevance smallint not null default 50 check (relevance between 0 and 100),
  relation_kind text not null default 'direct' check (relation_kind in ('direct', 'conceptual', 'cross_reference', 'original_language')),
  source_id uuid not null references public.biblical_sources(id) on delete restrict,
  source_locator text not null,
  provider_version text,
  content_hash text not null,
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (term_id, book_code, chapter, verse, relation_kind, source_id)
);

create index if not exists biblical_concordance_terms_normalized_idx
  on public.biblical_concordance_terms (normalized_term);
create index if not exists biblical_concordance_aliases_normalized_idx
  on public.biblical_concordance_aliases (normalized_alias);
create index if not exists biblical_concordance_occurrences_reference_idx
  on public.biblical_concordance_occurrences (book_code, chapter, verse);
create index if not exists biblical_concordance_occurrences_term_relevance_idx
  on public.biblical_concordance_occurrences (term_id, relevance desc);

alter table public.biblical_concordance_terms enable row level security;
alter table public.biblical_concordance_aliases enable row level security;
alter table public.biblical_concordance_occurrences enable row level security;

revoke all on public.biblical_concordance_terms from anon;
revoke all on public.biblical_concordance_aliases from anon;
revoke all on public.biblical_concordance_occurrences from anon;

grant select on public.biblical_concordance_terms to authenticated;
grant select on public.biblical_concordance_aliases to authenticated;
grant select on public.biblical_concordance_occurrences to authenticated;

drop policy if exists "authenticated_read_approved_concordance_terms" on public.biblical_concordance_terms;
create policy "authenticated_read_approved_concordance_terms"
  on public.biblical_concordance_terms
  for select
  to authenticated
  using (
    enabled = true
    and review_status = 'approved'
    and exists (
      select 1
      from public.biblical_sources source
      where source.id = source_id
        and source.enabled = true
        and source.review_status = 'approved'
    )
  );

drop policy if exists "authenticated_read_approved_concordance_aliases" on public.biblical_concordance_aliases;
create policy "authenticated_read_approved_concordance_aliases"
  on public.biblical_concordance_aliases
  for select
  to authenticated
  using (
    enabled = true
    and review_status = 'approved'
    and exists (
      select 1
      from public.biblical_concordance_terms term
      where term.id = term_id
        and term.enabled = true
        and term.review_status = 'approved'
    )
  );

drop policy if exists "authenticated_read_approved_concordance_occurrences" on public.biblical_concordance_occurrences;
create policy "authenticated_read_approved_concordance_occurrences"
  on public.biblical_concordance_occurrences
  for select
  to authenticated
  using (
    enabled = true
    and review_status = 'approved'
    and exists (
      select 1
      from public.biblical_concordance_terms term
      where term.id = term_id
        and term.enabled = true
        and term.review_status = 'approved'
    )
    and exists (
      select 1
      from public.biblical_sources source
      where source.id = source_id
        and source.enabled = true
        and source.review_status = 'approved'
    )
  );

comment on table public.biblical_concordance_terms is
  'Conceptos canónicos revisados para búsqueda temática y concordancias bíblicas.';
comment on table public.biblical_concordance_aliases is
  'Sinónimos, palabras clave e intenciones de pregunta asociadas a términos aprobados.';
comment on table public.biblical_concordance_occurrences is
  'Referencias bíblicas verificadas asociadas a términos de concordancia aprobados.';
