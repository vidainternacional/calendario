-- BORRADOR NO ACTIVO — FASE H / Bloque 3 — plain_gloss adjetivales.
-- NO mover a supabase/migrations ni aplicar sin aprobación explícita.
--
-- Principio:
-- la traducción española se deriva únicamente de la glosa inglesa fuente ya
-- aprobada en STEPBible/TAHOT. No se usa RV1909, contexto, frecuencia ni
-- inferencia desde el lema hebreo para decidir el significado.
--
-- Subconjunto conservador de adjetivos con equivalencia española directa.
-- Se exige part_of_speech='adjective' y coincidencia exacta de source_gloss.
--
-- Batch id propuesto: fase_h_es_plain_adjectives_editorial_001_20260820
-- Política propuesta: insert-only + ON CONFLICT DO NOTHING.
--
-- Reversión exacta si posteriormente se activa:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_plain_adjectives_editorial_001_20260820';

with map(source_gloss, display_gloss_es) as (
  values
  ('afflicted','afligido'),
  ('alive','vivo'),
  ('barren','estéril'),
  ('blackish','negruzco'),
  ('burnished','bruñido'),
  ('contrite','contrito'),
  ('cooked','cocido'),
  ('crippled','lisiado'),
  ('cruel','cruel'),
  ('darkened','oscurecido'),
  ('dazzling','deslumbrante'),
  ('deaf','sordo'),
  ('desolate','desolado'),
  ('divided','dividido'),
  ('entire','entero'),
  ('full','lleno'),
  ('glad','alegre'),
  ('good','bueno'),
  ('greenish','verdoso'),
  ('hairy','velludo'),
  ('heavy','pesado'),
  ('humble','humilde'),
  ('hungry','hambriento'),
  ('incomprehensible','incomprensible'),
  ('jubilant','jubiloso'),
  ('lacking','falto'),
  ('laden','cargado'),
  ('late','tardío'),
  ('leafy','frondoso'),
  ('lefthanded','zurdo'),
  ('long','largo'),
  ('low','bajo'),
  ('mute','mudo'),
  ('near','cercano'),
  ('needy','necesitado'),
  ('new','nuevo'),
  ('proud','orgulloso'),
  ('prudent','prudente'),
  ('raw','crudo'),
  ('reddish','rojizo'),
  ('righteous','justo'),
  ('round','redondo'),
  ('ruthless','despiadado'),
  ('sated','saciado'),
  ('sharp','afilado'),
  ('shattered','destrozado'),
  ('short','corto'),
  ('sick','enfermo'),
  ('solitary','solitario'),
  ('speckled','moteado'),
  ('striped','rayado'),
  ('stubborn','obstinado'),
  ('stupid','necio'),
  ('swollen','hinchado'),
  ('terrible','terrible'),
  ('thin','delgado'),
  ('timely','oportuno'),
  ('treacherous','traicionero'),
  ('twisted','torcido'),
  ('upper','superior'),
  ('vigorous','vigoroso'),
  ('yellow','amarillo')
), eligible as (
  select
    e.id as lexical_entry_id,
    e.strong_number,
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
    and e.part_of_speech = 'adjective'
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
    'batch_id','fase_h_es_plain_adjectives_editorial_001_20260820',
    'source','STEPBible/TAHOT source_gloss en',
    'source_license','CC BY 4.0',
    'translation_layer','VIDA editorial Spanish',
    'translation_basis','exact approved English source_gloss + adjective POS',
    'context_used_as_meaning',false,
    'rv1909_used_as_meaning',false,
    'hebrew_lemma_used_to_infer_meaning',false,
    'strong_number',strong_number
  )
from eligible
on conflict (lexical_entry_id) do nothing;
