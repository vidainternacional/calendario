-- FASE H / Bloque 3 — reutilización segura de nombres propios ya verificados.
-- Solo propaga una grafía española cuando el mismo nombre fuente inglés ya tiene
-- una única equivalencia española final proveniente de métodos conservadores aprobados.
-- No usa contexto como significado. Insert-only. Reversible por batch_id.
-- Reversión:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_reuse_verified_names_001_20260820';

with approved_name_map as (
  select
    lower(regexp_replace(btrim(split_part(l.source_gloss,'»',1)),'[^[:alnum:]]+','','g')) as source_name_key,
    min(g.display_gloss_es) as display_gloss_es,
    count(distinct g.display_gloss_es) as spanish_variants,
    count(*) as evidence_rows
  from public.biblical_lexical_entries l
  join public.biblical_hebrew_spanish_glosses g on g.lexical_entry_id=l.id
  where l.language='hebrew'
    and l.enabled=true
    and l.review_status='approved'
    and g.status in ('verified_derived','manual_approved')
    and g.derivation_method in (
      'tipnr_wikidata_spanish_anchor_similarity_safe_v4',
      'tahot_exact_entity_rv1909_same_surface_v1'
    )
    and l.source_gloss like '%»%@%'
    and btrim(split_part(l.source_gloss,'»',1))=
        btrim(split_part(split_part(l.source_gloss,'@',1),'»',2))
  group by 1
), pending as (
  select
    l.id as lexical_entry_id,
    l.lexical_id,
    l.strong_number,
    l.source_gloss,
    lower(regexp_replace(btrim(split_part(l.source_gloss,'»',1)),'[^[:alnum:]]+','','g')) as source_name_key
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
), eligible as (
  select p.*, m.display_gloss_es, m.evidence_rows
  from pending p
  join approved_name_map m using(source_name_key)
  where m.spanish_variants=1
)
insert into public.biblical_hebrew_spanish_glosses (
  lexical_entry_id, display_gloss_es, alternative_glosses_es, confidence,
  derivation_method, source_gloss_snapshot, status, provenance
)
select
  lexical_entry_id,
  display_gloss_es,
  '{}'::text[],
  99,
  'reuse_verified_exact_name_identity_v1',
  source_gloss,
  'verified_derived',
  jsonb_build_object(
    'phase','FASE_H_BLOQUE_3',
    'batch_id','fase_h_es_reuse_verified_names_001_20260820',
    'source_identity','STEPBible TAHOT/TIPNR',
    'source_identity_license','CC BY 4.0',
    'exact_source_name_identity',true,
    'unique_verified_spanish_mapping',true,
    'verified_mapping_evidence_rows',evidence_rows,
    'context_used_as_meaning',false,
    'rv1909_used_as_meaning',false,
    'lexical_id',lexical_id,
    'strong_number',strong_number
  )
from eligible
on conflict (lexical_entry_id) do nothing;
