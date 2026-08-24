-- FASE H / Bloque 3 — propagación segura adicional de nombres ya verificados.
-- Solo reutiliza una equivalencia española cuando una identidad inglesa normalizada
-- tiene UNA sola etiqueta española final entre métodos nominales previamente verificados.
-- No usa contexto como significado. Insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_reuse_verified_name_identity_002_20260820';

with final_name_methods as (
  select
    g.display_gloss_es,
    btrim(split_part(coalesce(g.source_gloss_snapshot,''),'»',1)) as source_name
  from public.biblical_hebrew_spanish_glosses g
  where g.status in ('verified_derived','manual_approved')
    and nullif(btrim(g.display_gloss_es),'') is not null
    and g.derivation_method in (
      'tahot_exact_entity_rv1909_same_surface_v1',
      'reuse_verified_structured_name_identity_v1',
      'reuse_verified_exact_name_identity_v1',
      'tipnr_wikidata_safe_v4_recovery_v1',
      'tahot_exact_name_spanish_multisource_same_surface_v1',
      'tipnr_wikidata_spanish_anchor_recovery_v2',
      'tipnr_wikidata_spanish_anchor_similarity_safe_v4',
      'tahot_structured_identity_spanish_multisource_same_surface_v1',
      'tipnr_wikidata_spanish_anchor_2source_exact_primary_v3',
      'tipnr_wikidata_spanish_anchor_2source_exact_entity_v2',
      'tipnr_wikidata_spanish_anchor_2source_v1'
    )
), unique_map as (
  select
    lower(regexp_replace(source_name,'[^[:alnum:]]+','','g')) as identity_key,
    min(display_gloss_es) as display_gloss_es
  from final_name_methods
  where nullif(source_name,'') is not null
  group by 1
  having count(distinct display_gloss_es)=1
), pending as (
  select
    l.id as lexical_entry_id,
    l.lexical_id,
    l.strong_number,
    l.source_gloss,
    btrim(split_part(l.source_gloss,'»',1)) as source_name
  from public.biblical_lexical_entries l
  left join public.biblical_hebrew_spanish_glosses g on g.lexical_entry_id=l.id
  where l.language='hebrew'
    and l.enabled=true
    and l.review_status='approved'
    and nullif(btrim(l.display_gloss_es),'') is null
    and g.lexical_entry_id is null
    and l.source_gloss like '%»%'
)
insert into public.biblical_hebrew_spanish_glosses (
  lexical_entry_id, display_gloss_es, alternative_glosses_es, confidence,
  derivation_method, source_gloss_snapshot, status, provenance
)
select
  p.lexical_entry_id,
  u.display_gloss_es,
  '{}'::text[],
  99,
  'reuse_verified_name_identity_v2',
  p.source_gloss,
  'verified_derived',
  jsonb_build_object(
    'phase','FASE_H_BLOQUE_3',
    'batch_id','fase_h_es_reuse_verified_name_identity_002_20260820',
    'source_identity','STEPBible TAHOT/TIPNR',
    'reuse_requires_unique_spanish_label',true,
    'context_used_as_meaning',false,
    'rv1909_used_as_meaning',false,
    'lexical_id',p.lexical_id,
    'strong_number',p.strong_number,
    'source_name',p.source_name
  )
from pending p
join unique_map u
  on u.identity_key=lower(regexp_replace(p.source_name,'[^[:alnum:]]+','','g'))
on conflict (lexical_entry_id) do nothing;
