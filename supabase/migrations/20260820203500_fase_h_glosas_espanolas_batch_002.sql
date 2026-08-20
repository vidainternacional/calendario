-- FASE H / Bloque 3 — lote 002 de glosas españolas conservadoras.
-- Política: insert-only. No modifica biblical_lexical_entries ni sobrescribe glosas existentes.
-- Batch id: fase_h_es_batch_002_20260820
--
-- Reversión exacta, si fuera necesaria:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_batch_002_20260820';

with map(source_gloss, display_gloss_es) as (
  values
  ('covering','cobertura'),
  ('stream','arroyo'),
  ('queen','reina'),
  ('rejoicing','regocijo'),
  ('rest','descanso'),
  ('serpent','serpiente'),
  ('shout','grito'),
  ('stall','establo'),
  ('storm','tormenta'),
  ('survivor','sobreviviente'),
  ('to appoint','designar'),
  ('to cut off','cortar'),
  ('to deceive','engañar'),
  ('to faint','desfallecer'),
  ('to flee','huir'),
  ('to gird','ceñir'),
  ('to hasten','apresurarse'),
  ('to help','ayudar'),
  ('to kindle','encender'),
  ('to languish','languidecer'),
  ('to mark','marcar'),
  ('to meet','encontrarse'),
  ('to rule','gobernar'),
  ('to scrape','raspar'),
  ('to see','ver'),
  ('to shut','cerrar'),
  ('to smooth','alisar'),
  ('to wail','gemir'),
  ('to wander','vagar'),
  ('truly','verdaderamente'),
  ('uprightness','rectitud'),
  ('wages','salario'),
  ('wheel','rueda'),
  ('wickedness','maldad'),
  ('agony','agonía'),
  ('altar','altar'),
  ('anguish','angustia'),
  ('ashes','cenizas'),
  ('basket','canasta'),
  ('be angry','enojarse'),
  ('be willing','estar dispuesto'),
  ('beam','viga'),
  ('blindness','ceguera'),
  ('bracelet','brazalete'),
  ('breach','brecha'),
  ('briar','zarza'),
  ('brightness','brillo'),
  ('captivity','cautiverio'),
  ('cessation','cesación'),
  ('circle','círculo'),
  ('cistern','cisterna'),
  ('clod','terrón'),
  ('clothing','ropa'),
  ('coal','carbón'),
  ('corner','esquina'),
  ('crown','corona'),
  ('crushed','aplastado'),
  ('curse','maldición'),
  ('cypress','ciprés'),
  ('death','muerte'),
  ('deed','hecho'),
  ('derision','burla'),
  ('divination','adivinación'),
  ('dust','polvo'),
  ('ear','oreja'),
  ('elevation','elevación'),
  ('emptiness','vacío'),
  ('enclosure','recinto'),
  ('enemy','enemigo'),
  ('except','excepto'),
  ('famine','hambre'),
  ('feast','fiesta'),
  ('field','campo'),
  ('filth','suciedad'),
  ('fire','fuego'),
  ('flame','llama'),
  ('flatbread','pan plano'),
  ('flood','inundación'),
  ('folly','necedad'),
  ('ford','vado'),
  ('fortress','fortaleza'),
  ('fresh','fresco'),
  ('furrow','surco'),
  ('goat','cabra'),
  ('grain','grano'),
  ('granary','granero'),
  ('habitation','morada'),
  ('hair','cabello'),
  ('half','mitad'),
  ('healing','curación'),
  ('hedge','seto'),
  ('hiding','escondite'),
  ('jasper','jaspe'),
  ('jaw','mandíbula'),
  ('kinsman','pariente')
),
eligible as (
  select
    e.id as lexical_entry_id,
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
  96,
  'exact_source_gloss_editorial_map_v1',
  source_gloss,
  'verified_derived',
  jsonb_build_object(
    'phase', 'FASE_H_BLOQUE_3',
    'batch_id', 'fase_h_es_batch_002_20260820',
    'source', 'STEPBible/TAHOT source_gloss en',
    'derivation', 'conservative exact English gloss mapping',
    'context_used_as_meaning', false
  )
from eligible
on conflict (lexical_entry_id) do nothing;
