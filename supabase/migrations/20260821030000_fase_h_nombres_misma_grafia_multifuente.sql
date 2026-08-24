-- FASE H / Bloque 3 — nombres exactos confirmados por >=2 fuentes españolas verificadas.
-- La identidad TAHOT debe ser exacta a ambos lados de » y la misma grafía debe aparecer
-- en un versículo donde ocurre esa entrada léxica en al menos 2 fuentes españolas verificadas.
-- Las fuentes españolas se usan solo para confirmar grafía/identidad, nunca significado.
-- Insert-only. Reversible por batch_id.
-- Reversión:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_exact_name_multisource_001_20260820';

with pending as (
  select
    l.id as lexical_entry_id,
    l.lexical_id,
    l.strong_number,
    l.source_gloss,
    btrim(split_part(l.source_gloss,'»',1)) as source_name,
    btrim(regexp_replace(lower(split_part(l.source_gloss,'»',1)),'[^[:alnum:]áéíóúüñ]+',' ','g')) as name_norm
  from public.biblical_lexical_entries l
  left join public.biblical_hebrew_spanish_glosses g on g.lexical_entry_id=l.id
  where l.language='hebrew'
    and l.enabled=true
    and l.review_status='approved'
    and l.display_gloss_es is null
    and g.lexical_entry_id is null
    and l.source_gloss like '%»%@%'
    and btrim(split_part(l.source_gloss,'»',1))=
        btrim(split_part(split_part(l.source_gloss,'@',1),'»',2))
), evidence as (
  select
    p.lexical_entry_id,
    p.lexical_id,
    p.strong_number,
    p.source_gloss,
    p.source_name,
    count(distinct s.id) as spanish_sources,
    count(distinct (o.book_code||':'||o.chapter||':'||o.verse)) as matching_verses
  from pending p
  join public.biblical_word_occurrences o
    on o.lexical_entry_id=p.lexical_entry_id
   and o.enabled=true
   and o.review_status='approved'
  join public.biblical_verse_texts v
    on v.book_code=o.book_code
   and v.chapter=o.chapter
   and v.verse=o.verse
   and v.enabled=true
   and v.review_status='approved'
  join public.biblical_sources s
    on s.id=v.source_id
   and s.language='spa'
   and s.license_status='verified'
   and s.enabled=true
  where length(p.name_norm)>=4
    and (' '||btrim(regexp_replace(lower(v.original_text),'[^[:alnum:]áéíóúüñ]+',' ','g'))||' ')
        like ('% '||p.name_norm||' %')
  group by p.lexical_entry_id,p.lexical_id,p.strong_number,p.source_gloss,p.source_name
), eligible as (
  select * from evidence where spanish_sources>=2
)
insert into public.biblical_hebrew_spanish_glosses (
  lexical_entry_id,display_gloss_es,alternative_glosses_es,confidence,
  derivation_method,source_gloss_snapshot,status,provenance
)
select
  lexical_entry_id,
  source_name,
  '{}'::text[],
  99,
  'tahot_exact_name_spanish_multisource_same_surface_v1',
  source_gloss,
  'verified_derived',
  jsonb_build_object(
    'phase','FASE_H_BLOQUE_3',
    'batch_id','fase_h_es_exact_name_multisource_001_20260820',
    'source_identity','STEPBible TAHOT',
    'source_identity_license','CC BY 4.0',
    'exact_source_entity',true,
    'same_lexical_occurrence_verse_required',true,
    'spanish_anchor_sources',spanish_sources,
    'spanish_anchor_sources_minimum',2,
    'matching_verses',matching_verses,
    'anchor_used_for_name_spelling_only',true,
    'context_used_as_meaning',false,
    'rv1909_used_as_meaning',false,
    'lexical_id',lexical_id,
    'strong_number',strong_number
  )
from eligible
on conflict (lexical_entry_id) do nothing;
