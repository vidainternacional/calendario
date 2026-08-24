-- FASE H / Bloque 3 — reutilización segura de identidad nominal estructurada.
-- Propaga una única grafía española ya verificada para la identidad explícita
-- situada a la derecha de » en source_gloss. No usa contexto como significado.
-- Insert-only y reversible por batch_id.
-- Reversión:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_reuse_structured_identity_001_20260820';

with verified_identity as (
  select
    lower(regexp_replace(btrim(split_part(split_part(l.source_gloss,'@',1),'»',2)),'[^[:alnum:]]+','','g')) as identity_key,
    min(g.display_gloss_es) as display_gloss_es,
    count(distinct g.display_gloss_es) as variants,
    count(*) as evidence_rows
  from public.biblical_lexical_entries l
  join public.biblical_hebrew_spanish_glosses g on g.lexical_entry_id=l.id
  where l.language='hebrew'
    and l.enabled=true
    and l.review_status='approved'
    and g.status in ('verified_derived','manual_approved')
    and g.derivation_method in (
      'tipnr_wikidata_spanish_anchor_similarity_safe_v4',
      'tahot_exact_entity_rv1909_same_surface_v1',
      'reuse_verified_exact_name_identity_v1'
    )
    and l.source_gloss like '%»%@%'
  group by 1
), pending as (
  select
    l.id as lexical_entry_id,
    l.lexical_id,
    l.strong_number,
    l.source_gloss,
    lower(regexp_replace(btrim(split_part(split_part(l.source_gloss,'@',1),'»',2)),'[^[:alnum:]]+','','g')) as identity_key
  from public.biblical_lexical_entries l
  left join public.biblical_hebrew_spanish_glosses g on g.lexical_entry_id=l.id
  where l.language='hebrew'
    and l.enabled=true
    and l.review_status='approved'
    and l.display_gloss_es is null
    and g.lexical_entry_id is null
    and l.source_gloss like '%»%@%'
    and btrim(split_part(l.source_gloss,'»',1))<>
        btrim(split_part(split_part(l.source_gloss,'@',1),'»',2))
), eligible as (
  select p.*,v.display_gloss_es,v.evidence_rows
  from pending p
  join verified_identity v using(identity_key)
  where v.variants=1
)
insert into public.biblical_hebrew_spanish_glosses (
  lexical_entry_id,display_gloss_es,alternative_glosses_es,confidence,
  derivation_method,source_gloss_snapshot,status,provenance
)
select
  lexical_entry_id,
  display_gloss_es,
  '{}'::text[],
  99,
  'reuse_verified_structured_name_identity_v1',
  source_gloss,
  'verified_derived',
  jsonb_build_object(
    'phase','FASE_H_BLOQUE_3',
    'batch_id','fase_h_es_reuse_structured_identity_001_20260820',
    'source_identity','STEPBible TAHOT/TIPNR',
    'source_identity_license','CC BY 4.0',
    'explicit_structured_identity',true,
    'unique_verified_spanish_mapping',true,
    'verified_mapping_evidence_rows',evidence_rows,
    'context_used_as_meaning',false,
    'rv1909_used_as_meaning',false,
    'lexical_id',lexical_id,
    'strong_number',strong_number
  )
from eligible
on conflict (lexical_entry_id) do nothing;
