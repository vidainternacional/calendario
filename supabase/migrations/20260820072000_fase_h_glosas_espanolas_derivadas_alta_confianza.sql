create table public.biblical_hebrew_spanish_glosses (
  lexical_entry_id uuid primary key references public.biblical_lexical_entries(id) on delete cascade,
  display_gloss_es text not null check (btrim(display_gloss_es) <> ''),
  alternative_glosses_es text[] not null default '{}'::text[],
  confidence smallint not null check (confidence between 0 and 100),
  derivation_method text not null,
  source_gloss_snapshot text not null,
  status text not null check (status in ('verified_derived','candidate','manual_approved','rejected')),
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.biblical_hebrew_spanish_glosses is
  'Capa derivada y reversible de glosas españolas para hebreo. No sustituye ni modifica el léxico autoritativo.';

alter table public.biblical_hebrew_spanish_glosses enable row level security;

revoke all on table public.biblical_hebrew_spanish_glosses from anon, authenticated;
grant select on table public.biblical_hebrew_spanish_glosses to authenticated;
grant all on table public.biblical_hebrew_spanish_glosses to service_role;

create policy biblical_hebrew_spanish_glosses_select_active
on public.biblical_hebrew_spanish_glosses
for select
to authenticated
using (
  public.cuenta_activa()
  and status in ('verified_derived','manual_approved')
);

with greek_consensus as (
  select
    source_gloss,
    coalesce(part_of_speech,'') as pos,
    min(display_gloss_es) as display_gloss_es,
    count(*) as source_rows
  from public.biblical_lexical_entries
  where language='greek'
    and enabled=true
    and review_status='approved'
    and display_gloss_es is not null
    and btrim(display_gloss_es) <> ''
    and source_gloss is not null
    and btrim(source_gloss) <> ''
  group by source_gloss, coalesce(part_of_speech,'')
  having count(*)=1 and count(distinct display_gloss_es)=1
), candidates as (
  select
    h.id as lexical_entry_id,
    h.source_gloss,
    h.part_of_speech,
    g.display_gloss_es
  from public.biblical_lexical_entries h
  join greek_consensus g
    on g.source_gloss=h.source_gloss
   and g.pos=coalesce(h.part_of_speech,'')
  where h.language='hebrew'
    and h.enabled=true
    and h.review_status='approved'
    and (h.display_gloss_es is null or btrim(h.display_gloss_es)='')
    and coalesce(h.part_of_speech,'') not in ('prefix','suffix','connector','pronominal_suffix')
)
insert into public.biblical_hebrew_spanish_glosses (
  lexical_entry_id,
  display_gloss_es,
  confidence,
  derivation_method,
  source_gloss_snapshot,
  status,
  provenance
)
select
  lexical_entry_id,
  display_gloss_es,
  98,
  'exact_source_gloss_and_pos_unique_greek_consensus_v1',
  source_gloss,
  'verified_derived',
  jsonb_build_object(
    'source_language','greek',
    'criterion','exact_source_gloss_and_part_of_speech_unique_approved_spanish',
    'source_rows',1,
    'phase','FASE_H_BLOQUE_3',
    'imported_at',now()
  )
from candidates;
