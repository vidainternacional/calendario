-- FASE H / Bloque 3
-- Lote editorial directo 001: 500 glosas hebreas simples EN -> ES.
-- Alcance: SOLO filas existentes status='rejected' cuya source_gloss coincide
-- exactamente con una de las 200 equivalencias léxicas directas de este mapa.
-- No modifica biblical_lexical_entries, Strong, lema, hebreo, ocurrencias, RLS ni grants.
-- Cada fila conserva un snapshot completo de sus campos editoriales previos dentro
-- de provenance.previous_snapshot para rollback exacto por batch_id.

WITH map(en, es) AS (VALUES
('valley','valle'),('strength','fuerza'),('desire','deseo'),('idol','ídolo'),('oppression','opresión'),('branch','rama'),('to tear','desgarrar'),('flame','llama'),('lion','león'),('pillar','pilar'),('pit','foso'),('pledge','prenda'),('to cut','cortar'),('to open','abrir'),('to remove','quitar'),('to tremble','temblar'),('to weave','tejer'),('trembling','temblor'),('bitterness','amargura'),('collection','colección'),('flower','flor'),('folly','necedad'),('hope','esperanza'),('image','imagen'),('locust','langosta'),('mourning','duelo'),('neck','cuello'),('pasture','pasto'),('poor','pobre'),('silence','silencio'),('thorn','espina'),('to cease','cesar'),('to gaze','mirar'),('to groan','gemir'),('to shatter','destrozar'),('to sing','cantar'),('toil','trabajo'),('tower','torre'),('treasure','tesoro'),('youth','juventud'),('beauty','belleza'),('belly','vientre'),('breast','pecho'),('captivity','cautiverio'),('city','ciudad'),('crooked','torcido'),('curtain','cortina'),('devastation','devastación'),('discharge','flujo'),('door','puerta'),('drop','gota'),('east','oriente'),('fine linen','lino fino'),('glory','gloria'),('grain','grano'),('heart','corazón'),('linen','lino'),('lord','señor'),('lust','concupiscencia'),('memorial','memorial'),('nakedness','desnudez'),('number','número'),('opening','abertura'),('palm','palma'),('piece','pieza'),('produce','fruto'),('ring','anillo'),('skin','piel'),('smooth','liso'),('spear','lanza'),('to beat','golpear'),('to blow','soplar'),('to cry','clamar'),('to desire','desear'),('to divine','adivinar'),('to extend','extender'),('to fear','temer'),('to leap','saltar'),('to multiply','multiplicar'),('to rebel','rebelarse'),('to ruin','arruinar'),('to strip','despojar'),('to trade','comerciar'),('to wound','herir'),('veil','velo'),('word','palabra'),('abomination','abominación'),('advantage','ventaja'),('ark','arca'),('arrogant','arrogante'),('axe','hacha'),('back','espalda'),('band','grupo'),('be ashamed','avergonzarse'),('be fruitful','fructificar'),('be poor','empobrecer'),('be sick','enfermar'),('be silent','callar'),('bitter','amargo'),('blemish','defecto'),('bow','arco'),('bronze','bronce'),('bundle','haz'),('burnt offering','holocausto'),('capital','capitel'),('censer','incensario'),('chariot','carro'),('childless','sin hijos'),('clean','limpio'),('confidence','confianza'),('cup','copa'),('disease','enfermedad'),('enemy','enemigo'),('father','padre'),('flesh','carne'),('fragment','fragmento'),('garden','jardín'),('gathering','reunión'),('generation','generación'),('grass','hierba'),('great','grande'),('head','cabeza'),('heifer','novilla'),('high','alto'),('incense','incienso'),('infant','niño'),('interest','interés'),('interpretation','interpretación'),('iron','hierro'),('judge','juez'),('kingdom','reino'),('lamp','lámpara'),('laughter','risa'),('leg','pierna'),('lie','mentira'),('maidservant','sierva'),('millstone','piedra de molino'),('moth','polilla'),('naked','desnudo'),('need','necesidad'),('offering','ofrenda'),('offspring','descendencia'),('old','viejo'),('outcry','clamor'),('path','senda'),('people','pueblo'),('petition','petición'),('precious','precioso'),('rebellion','rebelión'),('red','rojo'),('remnant','remanente'),('restraint','restricción'),('roof','techo'),('salvation','salvación'),('sheep','oveja'),('shoulder','hombro'),('sickle','hoz'),('sickness','enfermedad'),('side','lado'),('skill','habilidad'),('smoke','humo'),('song','canto'),('stumbling','tropiezo'),('supplication','súplica'),('sweet','dulce'),('tablet','tablilla'),('thigh','muslo'),('thunder','trueno'),('time','tiempo'),('to build','construir'),('to cast','arrojar'),('to circumcise','circuncidar'),('to dance','danzar'),('to die','morir'),('to dream','soñar'),('to dry','secar'),('to empty','vaciar'),('to engrave','grabar'),('to exalt','exaltar'),('to flash','relampaguear'),('to fly','volar'),('to grasp','agarrar'),('to grind','moler'),('to hang','colgar'),('to hate','odiar'),('to hew','labrar'),('to hire','contratar'),('to know','conocer'),('to lead','guiar'),('to lend','prestar'),('to lick','lamer'),('to melt','derretir'),('to overflow','desbordar'),('to pursue','perseguir'),('to rise','levantarse'),('to rot','pudrirse'),('to run','correr'),('to scorch','chamuscar'),('to search','buscar'),('to seize','apoderarse')
), targets AS MATERIALIZED (
  SELECT
    g.lexical_entry_id,
    e.lexical_id,
    e.source_gloss,
    m.es,
    g.status AS old_status,
    g.display_gloss_es AS old_display_gloss_es,
    g.alternative_glosses_es AS old_alternative_glosses_es,
    g.confidence AS old_confidence,
    g.derivation_method AS old_derivation_method,
    g.source_gloss_snapshot AS old_source_gloss_snapshot,
    g.provenance AS old_provenance
  FROM public.biblical_hebrew_spanish_glosses g
  JOIN public.biblical_lexical_entries e ON e.id = g.lexical_entry_id
  JOIN map m ON m.en = e.source_gloss
  WHERE g.status = 'rejected'
    AND e.language = 'hebrew'
    AND e.enabled = true
    AND e.review_status = 'approved'
  ORDER BY e.lexical_id
  LIMIT 500
)
UPDATE public.biblical_hebrew_spanish_glosses g
SET
  display_gloss_es = t.es,
  alternative_glosses_es = ARRAY[]::text[],
  confidence = 98,
  derivation_method = 'direct_source_gloss_translation_v1',
  source_gloss_snapshot = t.source_gloss,
  status = 'verified_derived',
  provenance = jsonb_build_object(
    'batch_id', 'fase_h_es_direct_500_001_20260820',
    'translation_basis', 'exact English source_gloss mapped to concise Spanish lexical equivalent',
    'source_identity', 'STEPBible TAHOT source_gloss',
    'context_used_as_meaning', false,
    'previous_snapshot', jsonb_build_object(
      'status', t.old_status,
      'display_gloss_es', t.old_display_gloss_es,
      'alternative_glosses_es', to_jsonb(t.old_alternative_glosses_es),
      'confidence', t.old_confidence,
      'derivation_method', t.old_derivation_method,
      'source_gloss_snapshot', t.old_source_gloss_snapshot,
      'provenance', t.old_provenance
    )
  ),
  updated_at = now()
FROM targets t
WHERE g.lexical_entry_id = t.lexical_entry_id
  AND g.status = 'rejected';

-- ROLLBACK EXACTO (ejecutar solo si fuera necesario):
-- UPDATE public.biblical_hebrew_spanish_glosses g
-- SET
--   status = g.provenance #>> '{previous_snapshot,status}',
--   display_gloss_es = g.provenance #>> '{previous_snapshot,display_gloss_es}',
--   alternative_glosses_es = CASE
--     WHEN g.provenance #> '{previous_snapshot,alternative_glosses_es}' IS NULL
--       OR g.provenance #> '{previous_snapshot,alternative_glosses_es}' = 'null'::jsonb
--     THEN NULL
--     ELSE ARRAY(SELECT jsonb_array_elements_text(g.provenance #> '{previous_snapshot,alternative_glosses_es}'))
--   END,
--   confidence = NULLIF(g.provenance #>> '{previous_snapshot,confidence}','')::smallint,
--   derivation_method = g.provenance #>> '{previous_snapshot,derivation_method}',
--   source_gloss_snapshot = g.provenance #>> '{previous_snapshot,source_gloss_snapshot}',
--   provenance = g.provenance #> '{previous_snapshot,provenance}',
--   updated_at = now()
-- WHERE g.provenance->>'batch_id' = 'fase_h_es_direct_500_001_20260820';
