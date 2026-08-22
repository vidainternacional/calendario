-- FASE H / Bloque 3
-- Glosas simples pendientes resueltas de forma editorial conservadora.
-- No modifica el lexico fuente; solo agrega la capa espanola cuando no existe fila.

with mapped(lexical_id, display_gloss_es, confidence) as (
  values
    ('H3973',  'desecho',          97),
    ('H5728',  'hasta',            95),
    ('H6574',  'desecho',          96),
    ('H7396',  'accion de montar', 96),
    ('H8175B', 'arremolinar',       95),
    ('H8611',  'acto de escupir',  97)
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
  l.id,
  m.display_gloss_es,
  '{}'::text[],
  m.confidence,
  'manual_editorial_plain_lexical_v3',
  l.source_gloss,
  'verified_derived',
  jsonb_build_object(
    'phase','FASE_H_BLOQUE_3',
    'batch_id','fase_h_es_plain_safe_002_20260820',
    'lexical_id',l.lexical_id,
    'strong_number',l.strong_number,
    'source_gloss',l.source_gloss,
    'source_gloss_language','en',
    'context_used_as_meaning',false,
    'rv1909_used_as_meaning',false,
    'editorial_translation','direct_conservative'
  )
from mapped m
join public.biblical_lexical_entries l on l.lexical_id=m.lexical_id
left join public.biblical_hebrew_spanish_glosses g on g.lexical_entry_id=l.id
where l.language='hebrew'
  and l.enabled
  and l.review_status='approved'
  and g.lexical_entry_id is null
on conflict (lexical_entry_id) do nothing;

-- Reversion exacta:
-- delete from public.biblical_hebrew_spanish_glosses
-- where provenance->>'batch_id'='fase_h_es_plain_safe_002_20260820';
