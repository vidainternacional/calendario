-- FASE H / Bloque 3 — lote 005 de glosas españolas conservadoras.
-- Política: insert-only. No modifica biblical_lexical_entries ni sobrescribe glosas existentes.
-- Batch id: fase_h_es_batch_005_20260820
--
-- Reversión exacta, si fuera necesaria:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_batch_005_20260820';

with map(source_gloss, display_gloss_es) as (
  values
  ('to plunder','saquear'),
  ('battle','batalla'),
  ('knife','cuchillo'),
  ('missile','proyectil'),
  ('shield','escudo'),
  ('to bake','hornear'),
  ('to sharpen','afilar'),
  ('to strike','golpear'),
  ('to subdue','someter'),
  ('to trample','pisotear'),
  ('to tread','pisar'),
  ('violence','violencia'),
  ('bolt','cerrojo')
), eligible as (
  select e.id as lexical_entry_id, e.source_gloss, map.display_gloss_es
  from public.biblical_lexical_entries e
  join map on map.source_gloss = e.source_gloss
  left join public.biblical_hebrew_spanish_glosses g on g.lexical_entry_id = e.id
  where e.language = 'hebrew'
    and e.review_status = 'approved'
    and e.enabled = true
    and e.display_gloss_es is null
    and g.lexical_entry_id is null
)
insert into public.biblical_hebrew_spanish_glosses (
  lexical_entry_id, display_gloss_es, alternative_glosses_es, confidence,
  derivation_method, source_gloss_snapshot, status, provenance
)
select
  lexical_entry_id, display_gloss_es, '{}'::text[], 96,
  'exact_source_gloss_editorial_map_v1', source_gloss, 'verified_derived',
  jsonb_build_object(
    'phase','FASE_H_BLOQUE_3',
    'batch_id','fase_h_es_batch_005_20260820',
    'source','STEPBible/TAHOT source_gloss en',
    'derivation','conservative exact English gloss mapping',
    'context_used_as_meaning',false
  )
from eligible
on conflict (lexical_entry_id) do nothing;
