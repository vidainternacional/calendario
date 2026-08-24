-- FASE H / Bloque 3
-- Lote editorial directo 002: cierre de las 511 glosas hebreas simples rechazadas restantes EN -> ES.
-- Alcance: SOLO filas existentes status='rejected' cuya source_gloss coincide exactamente con el mapa.
-- No modifica biblical_lexical_entries, Strong, lema, hebreo, ocurrencias, RLS ni grants.
-- Cada fila conserva snapshot completo previo en provenance.previous_snapshot para rollback exacto.

WITH map(en, es) AS (VALUES
('abode','morada'),('abomination','abominación'),('abyss','abismo'),('adultery','adulterio'),('animal','animal'),('ankle','tobillo'),('anointing','unción'),('another','otro'),('answer','respuesta'),('ark','arca'),('army','ejército'),('arrogance','arrogancia'),('bag','bolsa'),('banquet','banquete'),('barley','cebada'),('bath','baño'),('be arrogant','ser arrogante'),('be clothed','estar vestido'),('be grieved','afligirse'),('be healthy','estar sano'),('be kind','ser bondadoso'),('be quiet','estar quieto'),('be strong','ser fuerte'),('beautiful','hermoso'),('beauty','belleza'),('before','antes'),('beloved','amado'),('birth','nacimiento'),('birthright','primogenitura'),('bitterness','amargura'),('black','negro'),('blind','ciego'),('blood','sangre'),('bloodshed','derramamiento de sangre'),('body','cuerpo'),('bone','hueso'),('bosom','seno'),('boy','muchacho'),('branch','rama'),('breaking','ruptura'),('breast','pecho'),('breastplate','pectoral'),('bridle','freno'),('bright','brillante'),('brook','arroyo'),('brushwood','matorral'),('building','edificio'),('calf','becerro'),('camel','camello'),('captive','cautivo'),('captivity','cautiverio'),('caravan','caravana'),('carriage','carro'),('cave','cueva'),('chaff','paja'),('charge','encargo'),('childless','sin hijos'),('cold','frío'),('colt','potro'),('commandment','mandamiento'),('companion','compañero'),('compassion','compasión'),('complaint','queja'),('contention','contienda'),('corner','esquina'),('corruption','corrupción'),('covenant','pacto'),('creation','creación'),('crop','cosecha'),('crumb','miga'),('dawn','amanecer'),('decay','decadencia'),('declaration','declaración'),('decree','decreto'),('deep','profundidad'),('depth','profundidad'),('derision','burla'),('desire','deseo'),('devastation','devastación'),('dill','eneldo'),('disease','enfermedad'),('dish','plato'),('dog','perro'),('drachma','dracma'),('drunken','ebrio'),('dull','apagado'),('eating','comida'),('edict','edicto'),('eight','ocho'),('eighty','ochenta'),('eleven','once'),('emerald','esmeralda'),('empty','vacío'),('enemy','enemigo'),('entry','entrada'),('eunuch','eunuco'),('evil','mal'),('explanation','explicación'),('farmer','agricultor'),('father-in-law','suegro'),('female','hembra'),('field','campo'),('fifth','quinto'),('fifty','cincuenta'),('filthy','inmundo'),('fine flour','flor de harina'),('finger','dedo'),('flame','llama'),('flour','harina'),('folly','necedad'),('forehead','frente'),('fox','zorro'),('frankincense','incienso'),('free','libre'),('freedom','libertad'),('friend','amigo'),('frog','rana'),('gall','hiel'),('generation','generación'),('glorious','glorioso'),('gnat','mosquito'),('goodness','bondad'),('governor','gobernador'),('great','grande'),('great man','hombre poderoso'),('greatness','grandeza'),('groan','gemido'),('hail','granizo'),('harbor','puerto'),('harp','arpa'),('harvest','cosecha'),('heaven','cielo'),('heel','talón'),('helmet','yelmo'),('hill','colina'),('honey','miel'),('honeycomb','panal'),('honor','honor'),('hope','esperanza'),('horn','cuerno'),('horse','caballo'),('horseman','jinete'),('hostility','hostilidad'),('hot','caliente'),('hundred','cien'),('hyssop','hisopo'),('illness','enfermedad'),('image','imagen'),('impurity','impureza'),('indignation','indignación'),('inheritance','herencia'),('kindness','bondad'),('kiss','beso'),('lady','señora'),('lame','cojo'),('lampstand','candelabro'),('laughter','risa'),('leaf','hoja'),('leaven','levadura'),('leg','pierna'),('length','longitud'),('leopard','leopardo'),('leprosy','lepra'),('lily','lirio'),('linen','lino'),('lion','león'),('livestock','ganado'),('living thing','ser viviente'),('lot','suerte'),('love','amor'),('lovely','hermoso'),('lower','inferior'),('luxury','lujo'),('magistrate','magistrado'),('maidservant','sierva'),('male','varón'),('man','hombre'),('manna','maná'),('mark','marca'),('milk','leche'),('mina','mina'),('mire','lodo'),('mist','neblina'),('mixture','mezcla'),('month','mes'),('mother','madre'),('mother-in-law','suegra'),('mountain','montaña'),('mourning','duelo'),('much','mucho'),('murmuring','murmuración'),('music','música'),('mutilation','mutilación'),('myriad','miríada'),('myrrh','mirra'),('name','nombre'),('nard','nardo'),('narrow','estrecho'),('night','noche'),('obedience','obediencia'),('offspring','descendencia'),('ointment','ungüento'),('old age','vejez'),('opposition','oposición'),('oppression','opresión'),('origin','origen'),('outpouring','derramamiento'),('oven','horno'),('overseer','supervisor'),('oversight','supervisión'),('palm','palma'),('persecution','persecución'),('pestilence','pestilencia'),('pious','piadoso'),('pit','foso'),('pleasure','placer'),('pool','estanque'),('portico','pórtico'),('prayer','oración'),('preacher','predicador'),('precept','precepto'),('pregnant','embarazada'),('pressure','presión'),('prison','prisión'),('produce','fruto'),('profane','profano'),('prophecy','profecía'),('proportion','proporción'),('proverb','proverbio'),('province','provincia'),('purpose','propósito'),('purse','bolsa'),('raven','cuervo'),('ready','preparado'),('rebellion','rebelión'),('repentance','arrepentimiento'),('reproach','oprobio'),('request','petición'),('reward','recompensa'),('riches','riquezas'),('right','correcto'),('river','río'),('rod','vara'),('root','raíz'),('rough','áspero'),('rule','gobierno'),('sackcloth','cilicio'),('sacrifice','sacrificio'),('sand','arena'),('sapphire','zafiro'),('scribe','escriba'),('seah','sea'),('seat','asiento'),('seventy','setenta'),('severe','severo'),('sheath','vaina'),('sheep','oveja'),('shepherd','pastor'),('ship','barco'),('shoulder','hombro'),('sight','vista'),('sister','hermana'),('sixty','sesenta'),('slow','lento'),('small','pequeño'),('sojourning','peregrinación'),('sorcerer','hechicero'),('sorcery','hechicería'),('south','sur'),('standing','posición'),('stronghold','fortaleza'),('sufficiency','suficiencia'),('sun','sol'),('supplication','súplica'),('table','mesa'),('talent','talento'),('tender','tierno'),('tenth','décimo'),('testing','prueba'),('thief','ladrón'),('third','tercero'),('thirty','treinta'),('thorn','espina'),('threat','amenaza'),('throat','garganta'),('throne','trono'),('to alienate','alejar'),('to ambush','emboscar'),('to answer','responder'),('to arm','armar'),('to ascend','subir'),('to astonish','asombrar'),('to attach','unir'),('to avenge','vengar'),('to awake','despertar'),('to bear fruit','dar fruto'),('to beat','golpear'),('to beg','suplicar'),('to beget','engendrar'),('to bite','morder'),('to blaspheme','blasfemar'),('to blind','cegar'),('to blow','soplar'),('to bury','sepultar'),('to celebrate','celebrar'),('to clean','limpiar'),('to close','cerrar'),('to collect','recoger'),('to command','mandar'),('to compel','obligar'),('to consent','consentir'),('to corrupt','corromper'),('to create','crear'),('to crown','coronar'),('to cry','clamar'),('to declare','declarar'),('to decree','decretar'),('to descend','descender'),('to determine','determinar'),('to devour','devorar'),('to disperse','dispersar'),('to distract','distraer'),('to disturb','perturbar'),('to domineer','dominar'),('to double','duplicar'),('to drink','beber'),('to drive','conducir'),('to enrich','enriquecer'),('to entice','seducir'),('to enwrap','envolver'),('to exalt','exaltar'),('to exchange','intercambiar'),('to extend','extender'),('to extinguish','apagar'),('to find','encontrar'),('to flood','inundar'),('to fornicate','fornicar'),('to found','fundar'),('to gaze','mirar'),('to go through','atravesar'),('to grasp','agarrar'),('to hang','colgar'),('to hate','odiar'),('to have compassion','compadecerse'),('to heal','sanar'),('to hire','contratar'),('to honor','honrar'),('to hunger','tener hambre'),('to hurt','herir'),('to inherit','heredar'),('to judge','juzgar'),('to know','conocer'),('to laugh','reír'),('to lay','poner'),('to leaven','leudar'),('to lighten','aligerar'),('to liken','comparar'),('to magnify','engrandecer'),('to measure','medir'),('to mourn','lamentar'),('to murder','asesinar'),('to muzzle','poner bozal'),('to overflow','desbordar'),('to perfect','perfeccionar'),('to pervert','pervertir'),('to pile up','amontonar'),('to pity','compadecerse'),('to play','tocar'),('to prevail','prevalecer'),('to prolong','prolongar'),('to prophesy','profetizar'),('to prune','podar'),('to purify','purificar'),('to put out','apagar'),('to quiet','calmar'),('to raise','levantar'),('to ransom','rescatar'),('to reap','segar'),('to recognize','reconocer'),('to reign','reinar'),('to rise','levantarse'),('to rub','frotar'),('to ruin','arruinar'),('to sacrifice','sacrificar'),('to salt','salar'),('to scorch','chamuscar'),('to separate','separar'),('to shave','afeitar'),('to shear','esquilar'),('to shudder','estremecerse'),('to sin','pecar'),('to sing','cantar'),('to slander','calumniar'),('to sow','sembrar'),('to spare','perdonar'),('to spin','hilar'),('to spit','escupir'),('to split','partir'),('to spring','brotar'),('to sprinkle','rociar'),('to sprout','brotar'),('to spy','espiar'),('to steal','robar'),('to stink','heder'),('to stir up','agitar'),('to stoop','inclinarse'),('to strive','esforzarse'),('to stumble','tropezar'),('to suffer','sufrir'),('to swallow','tragar'),('to swear','jurar'),('to swim','nadar'),('to take captive','cautivar'),('to taste','probar'),('to teach','enseñar'),('to tell','contar'),('to terrify','aterrorizar'),('to test','probar'),('to thicken','espesar'),('to travel','viajar'),('to turn away','apartarse'),('to unite','unir'),('to uproot','desarraigar'),('to winter','invernar'),('to work','trabajar'),('to wound','herir'),('to wrap','envolver'),('to write','escribir'),('to wrong','agraviar'),('toil','trabajo'),('tomb','sepulcro'),('tooth','diente'),('tossing','agitación'),('tree','árbol'),('trumpet','trompeta'),('truth','verdad'),('tunic','túnica'),('twenty','veinte'),('uncircumcised','incircunciso'),('unclean','impuro'),('upright','recto'),('uprising','levantamiento'),('vengeance','venganza'),('vine','vid'),('vineyard','viña'),('virgin','virgen'),('virginity','virginidad'),('vomit','vómito'),('wage','salario'),('war','guerra'),('washing','lavado'),('water','agua'),('way','camino'),('weak','débil'),('weapon','arma'),('weeping','llanto'),('white','blanco'),('widow','viuda'),('width','anchura'),('wine','vino'),('winepress','lagar'),('wineskin','odre'),('wing','ala'),('wisdom','sabiduría'),('wise','sabio'),('witness','testigo'),('wolf','lobo'),('womb','matriz'),('wood','madera'),('wool','lana'),('worker','trabajador'),('worm','gusano'),('worshiper','adorador'),('worthless','inútil'),('wreath','guirnalda')
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
)
UPDATE public.biblical_hebrew_spanish_glosses g
SET
  display_gloss_es = t.es,
  alternative_glosses_es = ARRAY[]::text[],
  confidence = 97,
  derivation_method = 'direct_source_gloss_translation_v2',
  source_gloss_snapshot = t.source_gloss,
  status = 'verified_derived',
  provenance = jsonb_build_object(
    'batch_id', 'fase_h_es_direct_511_002_20260820',
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

-- ROLLBACK EXACTO:
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
-- WHERE g.provenance->>'batch_id' = 'fase_h_es_direct_511_002_20260820';
