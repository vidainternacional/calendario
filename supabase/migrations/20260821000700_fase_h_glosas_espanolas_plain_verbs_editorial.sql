-- FASE H / Bloque 3 — plain_gloss verbales editoriales.
--
-- Principio:
-- la traducción española se deriva únicamente de la glosa inglesa fuente ya
-- aprobada en STEPBible/TAHOT. No se usa RV1909, contexto, frecuencia ni
-- inferencia desde el lema hebreo para decidir el significado.
--
-- Este primer subconjunto se limita a glosas inglesas verbales explícitas
-- `to ...` con correspondencia editorial española directa y part_of_speech=verb.
-- Los registros con POS nulo u otro POS quedan fuera aunque compartan source_gloss.
--
-- Batch id: fase_h_es_plain_verbs_editorial_001_20260820
-- Política: insert-only + ON CONFLICT DO NOTHING.
--
-- Reversión exacta:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_plain_verbs_editorial_001_20260820';

with map(source_gloss, display_gloss_es) as (
  values
  ('to advise','aconsejar'),
  ('to await','esperar'),
  ('to beautify','embellecer'),
  ('to bless','bendecir'),
  ('to border','bordear'),
  ('to capture','capturar'),
  ('to conceive','concebir'),
  ('to cry out','clamar'),
  ('to darken','oscurecer'),
  ('to dedicate','dedicar'),
  ('to delay','retrasar'),
  ('to delight','deleitar'),
  ('to dread','temer'),
  ('to drip','gotear'),
  ('to endanger','poner en peligro'),
  ('to exult','regocijarse'),
  ('to fatten','engordar'),
  ('to fence','cercar'),
  ('to free','liberar'),
  ('to gleam','brillar'),
  ('to glean','espigar'),
  ('to grow','crecer'),
  ('to grumble','murmurar'),
  ('to increase','aumentar'),
  ('to lift','levantar'),
  ('to limp','cojear'),
  ('to listen','escuchar'),
  ('to live','vivir'),
  ('to loath','aborrecer'),
  ('to lust','codiciar'),
  ('to marry','casarse'),
  ('to neglect','descuidar'),
  ('to peel','pelar'),
  ('to plan','planear'),
  ('to polish','pulir'),
  ('to pray','orar'),
  ('to quench','apagar'),
  ('to rain','llover'),
  ('to recount','relatar'),
  ('to refine','refinar'),
  ('to refrain','abstenerse'),
  ('to rescue','rescatar'),
  ('to reserve','reservar'),
  ('to roar','rugir'),
  ('to roll','rodar'),
  ('to seek refuge','refugiarse'),
  ('to serve','servir'),
  ('to shoot','disparar'),
  ('to sleep','dormir'),
  ('to slip','resbalar'),
  ('to smear','untar'),
  ('to stone','apedrear'),
  ('to sweep away','arrasar'),
  ('to treasure','atesorar')
), eligible as (
  select
    e.id as lexical_entry_id,
    e.strong_number,
    e.lemma,
    e.source_gloss,
    map.display_gloss_es
  from public.biblical_lexical_entries e
  join map on map.source_gloss = e.source_gloss
  left join public.biblical_hebrew_spanish_glosses g
    on g.lexical_entry_id = e.id
  where e.language = 'hebrew'
    and e.review_status = 'approved'
    and e.enabled = true
    and e.display_gloss_es is null
    and g.lexical_entry_id is null
    and e.part_of_speech = 'verb'
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
  lexical_entry_id,
  display_gloss_es,
  '{}'::text[],
  98,
  'manual_editorial_source_gloss_exact_v1',
  source_gloss,
  'manual_approved',
  jsonb_build_object(
    'phase','FASE_H_BLOQUE_3',
    'batch_id','fase_h_es_plain_verbs_editorial_001_20260820',
    'source','STEPBible/TAHOT source_gloss en',
    'source_license','CC BY 4.0',
    'translation_layer','VIDA editorial Spanish',
    'translation_basis','exact approved English source_gloss + verb POS',
    'context_used_as_meaning',false,
    'rv1909_used_as_meaning',false,
    'hebrew_lemma_used_to_infer_meaning',false,
    'strong_number',strong_number
  )
from eligible
on conflict (lexical_entry_id) do nothing;
