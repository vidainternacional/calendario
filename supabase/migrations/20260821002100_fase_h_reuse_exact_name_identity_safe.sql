-- FASE H / Bloque 3
-- Reutiliza una glosa espanola ya verificada solo cuando:
-- 1) la fuente pendiente es una identidad estructurada exacta source_name == entity_name;
-- 2) existe otra fila aprobada con la misma identidad exacta;
-- 3) todas las evidencias aprobadas para ese source_name convergen en una sola glosa espanola.
-- No usa contexto como significado y no modifica filas existentes.

with approved_map as (
  select
    btrim(split_part(l.source_gloss,'»',1)) as source_name,
    min(g.display_gloss_es) as display_gloss_es,
    count(distinct g.display_gloss_es) as spanish_variants,
    count(*) as evidence_rows
  from public.biblical_lexical_entries l
  join public.biblical_hebrew_spanish_glosses g
    on g.lexical_entry_id = l.id
  where l.language = 'hebrew'
    and l.enabled
    and l.review_status = 'approved'
    and g.status in ('verified_derived','manual_approved')
    and nullif(btrim(g.display_gloss_es),'') is not null
    and l.source_gloss ~ '»'
    and lower(regexp_replace(btrim(split_part(l.source_gloss,'»',1)),'[^a-zA-Z0-9]+','','g')) =
        lower(regexp_replace(btrim(split_part(split_part(l.source_gloss,'»',2),'@',1)),'[^a-zA-Z0-9]+','','g'))
  group by btrim(split_part(l.source_gloss,'»',1))
  having count(distinct g.display_gloss_es) = 1
), pending as (
  select
    l.id,
    l.lexical_id,
    l.strong_number,
    l.source_gloss,
    btrim(split_part(l.source_gloss,'»',1)) as source_name
  from public.biblical_lexical_entries l
  left join public.biblical_hebrew_spanish_glosses g
    on g.lexical_entry_id = l.id
  where l.language = 'hebrew'
    and l.enabled
    and l.review_status = 'approved'
    and nullif(btrim(l.display_gloss_es),'') is null
    and g.lexical_entry_id is null
    and l.source_gloss ~ '»'
    and lower(regexp_replace(btrim(split_part(l.source_gloss,'»',1)),'[^a-zA-Z0-9]+','','g')) =
        lower(regexp_replace(btrim(split_part(split_part(l.source_gloss,'»',2),'@',1)),'[^a-zA-Z0-9]+','','g'))
)
insert into public.biblical_hebrew_spanish_glosses (
  lexical_entry_id,
  display_gloss_es,
  alternative_glosses_es,
  confidence,
  derivation_method,
  source_gloss_snapshot,
  status,
  provenance
)
select
  p.id,
  m.display_gloss_es,
  '{}'::text[],
  99,
  'reuse_verified_exact_identity_safe_v2',
  p.source_gloss,
  'verified_derived',
  jsonb_build_object(
    'phase','FASE_H_BLOQUE_3',
    'batch_id','fase_h_es_reuse_exact_identity_safe_002_20260820',
    'lexical_id',p.lexical_id,
    'strong_number',p.strong_number,
    'source_name',p.source_name,
    'exact_source_entity_equality',true,
    'verified_mapping_evidence_rows',m.evidence_rows,
    'unique_verified_spanish_mapping',true,
    'context_used_as_meaning',false,
    'rv1909_used_as_meaning',false
  )
from pending p
join approved_map m using (source_name)
on conflict (lexical_entry_id) do nothing;

-- Reversion exacta:
-- delete from public.biblical_hebrew_spanish_glosses
-- where provenance->>'batch_id'='fase_h_es_reuse_exact_identity_safe_002_20260820';
