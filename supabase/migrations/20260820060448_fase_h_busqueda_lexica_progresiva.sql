create table public.biblical_hebrew_search_resolutions (
  id uuid primary key default gen_random_uuid(),
  search_key text not null,
  search_kind text not null check (search_kind in ('spanish', 'hebrew', 'transliteration', 'strong')),
  lexical_entry_id uuid not null references public.biblical_lexical_entries(id) on delete cascade,
  relation_kind text not null check (relation_kind in ('lemma', 'strong', 'curated_spanish', 'editorial_spanish', 'transliteration', 'inflected_form', 'contextual')),
  confidence smallint not null default 0 check (confidence between 0 and 100),
  evidence_count integer not null default 0 check (evidence_count >= 0),
  provenance jsonb not null default '{}'::jsonb,
  status text not null default 'derived' check (status in ('derived', 'approved', 'rejected')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint biblical_hebrew_search_resolutions_search_key_length check (char_length(search_key) between 1 and 80),
  constraint biblical_hebrew_search_resolutions_unique unique (search_key, search_kind, lexical_entry_id, relation_kind)
);

create index biblical_hebrew_search_resolutions_lookup_idx
  on public.biblical_hebrew_search_resolutions (search_kind, search_key, confidence desc, evidence_count desc)
  where enabled = true and status in ('derived', 'approved');

create index biblical_hebrew_search_resolutions_lexical_idx
  on public.biblical_hebrew_search_resolutions (lexical_entry_id);

alter table public.biblical_hebrew_search_resolutions enable row level security;

revoke all on table public.biblical_hebrew_search_resolutions from anon, authenticated;
grant select on table public.biblical_hebrew_search_resolutions to authenticated;
grant all on table public.biblical_hebrew_search_resolutions to service_role;

create policy "Usuarios activos leen resoluciones hebreas derivadas"
on public.biblical_hebrew_search_resolutions
for select
to authenticated
using (
  enabled
  and status in ('derived', 'approved')
  and (select public.cuenta_activa())
  and exists (
    select 1
    from public.biblical_lexical_entries entry
    where entry.id = biblical_hebrew_search_resolutions.lexical_entry_id
      and entry.language = 'hebrew'
      and entry.enabled = true
      and entry.review_status = 'approved'
  )
);

comment on table public.biblical_hebrew_search_resolutions is
  'Índice derivado y reversible para reutilizar resoluciones verificadas del buscador de Hebreo Bíblico. No sustituye ni modifica el léxico autoritativo.';

comment on column public.biblical_hebrew_search_resolutions.provenance is
  'Evidencia técnica de cómo se obtuvo la relación; no debe contener identidad del usuario ni historial personal de búsqueda.';
