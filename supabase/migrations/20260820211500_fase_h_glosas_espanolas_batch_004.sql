-- FASE H / Bloque 3 — lote 004 de glosas españolas conservadoras.
-- Política: insert-only. No modifica biblical_lexical_entries ni sobrescribe glosas existentes.
-- Batch id: fase_h_es_batch_004_20260820
--
-- Reversión exacta, si fuera necesaria:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_batch_004_20260820';

with map(source_gloss, display_gloss_es) as (
  values
  ('armor','armadura'),('arrow','flecha'),('cedar','cedro'),('cheese','queso'),('child','niño'),
  ('choice','elección'),('chosen','escogido'),('circuit','circuito'),('clearness','claridad'),('cluster','racimo'),
  ('comfort','consuelo'),('command','mandato'),('companion','compañero'),('company','compañía'),('compassion','compasión'),
  ('compassionate','compasivo'),('complete','completo'),('concubine','concubina'),('conspiracy','conspiración'),('constellation','constelación'),
  ('contribution','contribución'),('copy','copia'),('crag','peñasco'),('crookedness','torcedura'),('crowd','multitud'),
  ('dance','danza'),('debt','deuda'),('deceit','engaño'),('deception','engaño'),('deceptive','engañoso'),
  ('defense','defensa'),('deliverance','liberación'),('descent','descenso'),('dismay','consternación'),('distance','distancia'),
  ('doe','cierva'),('dough','masa'),('dread','pavor'),('dreg','poso'),('drink','bebida'),
  ('drunkenness','embriaguez'),('dry','seco'),('dry land','tierra seca'),('dryness','sequedad'),('early fig','higo temprano'),
  ('encampment','campamento'),('engraving','grabado'),('ephod','efod'),('faithfulness','fidelidad'),('fatling','animal cebado'),
  ('favor','favor'),('fetter','grillete'),('fish','pez'),('fisher','pescador'),('flask','frasco'),
  ('flax','lino'),('fleece','vellón'),('flint','pedernal'),('flock','rebaño'),('floor','suelo'),
  ('flower','flor'),('flute','flauta'),('fodder','forraje'),('fool','necio'),('foolish','necio'),
  ('footstool','estrado'),('fowler','cazador de aves'),('frost','escarcha'),('fugitive','fugitivo'),('fullness','plenitud'),
  ('furnace','horno'),('garden','jardín'),('gazelle','gacela'),('gem','gema'),('girdle','cinturón'),
  ('gleaning','rebusca'),('goad','aguijón'),('God','Dios'),('gourd','calabaza'),('greatness','grandeza'),
  ('green','verde'),('groaning','gemido'),('guilty','culpable'),('handbreadth','palmo'),('handful','puñado'),
  ('haste','prisa'),('hawk','halcón'),('heaviness','pesadez'),('herb','hierba'),('here','aquí'),
  ('high place','lugar alto'),('highway','calzada'),('hill','colina'),('hinge','bisagra'),('hollow','hueco'),
  ('honeycomb','panal'),('incense','incienso'),('injury','lesión'),('injustice','injusticia'),('innocent','inocente'),
  ('integrity','integridad'),('isolation','aislamiento'),('jealous','celoso'),('joint','articulación'),('journey','viaje'),
  ('joy','gozo'),('judge','juez'),('juice','jugo'),('kid','cabrito'),('lattice','celosía'),
  ('lest','para que no'),('letter','carta'),('lion','león'),('loan','préstamo'),('lobe','lóbulo'),
  ('male goat','macho cabrío'),('mallow','malva'),('mantle','manto'),('many','muchos'),('mare','yegua'),
  ('mast','mástil'),('meadow','pradera'),('melody','melodía'),('melting','derretimiento'),('merchant','comerciante'),
  ('middle','medio'),('midst','en medio'),('might','poder'),('mire','cieno'),('mirror','espejo'),
  ('mixture','mezcla'),('mocking','burla'),('moon','luna'),('morsel','bocado'),('mortar','mortero'),
  ('mud','lodo'),('nail','clavo'),('noble','noble'),('oak','roble'),('oath','juramento'),
  ('official','funcionario'),('oil','aceite'),('one','uno'),('only','solo'),('oppression','opresión'),
  ('oracle','oráculo'),('ornament','adorno'),('overthrow','derrocamiento'),('owl','búho'),('pan','sartén'),
  ('pasture','pasto'),('pavement','pavimento'),('peak','cima'),('perfumer','perfumista'),('perpetuity','perpetuidad'),
  ('perversion','perversión'),('pillar','columna'),('pitch','brea'),('plan','plan'),('plant','planta'),
  ('plate','placa'),('pleasant','agradable'),('pleasantness','agrado'),('please','agradar'),('plowshare','reja de arado'),
  ('precious thing','cosa preciosa'),('prison','prisión'),('prisoner','prisionero'),('profaneness','profanación'),('progeny','descendencia'),
  ('prosperity','prosperidad'),('pure','puro'),('purple','púrpura'),('quickly','rápidamente'),('quiver','carcaj'),
  ('quivering','temblor'),('raft','balsa'),('rag','trapo'),('rage','ira'),('raisin bun','torta de pasas'),
  ('ram','carnero'),('razor','navaja'),('recklessness','temeridad'),('reed','caña'),('reeling','tambaleo'),
  ('refusing','rechazo'),('righteousness','justicia'),('ring','anillo'),('roaring','rugido'),('roasted','tostado'),
  ('rock','roca'),('rottenness','podredumbre'),('ruler','gobernante'),('sack','saco'),('sale','venta'),
  ('satiety','saciedad'),('saw','sierra'),('scroll','rollo'),('second','segundo'),('secrecy','secreto'),
  ('secret','secreto'),('seer','vidente'),('sending','envío'),('seven','siete'),('shaking','temblor'),
  ('shattering','destrozo'),('shelter','refugio'),('shovel','pala'),('shuddering','estremecimiento'),('siege','asedio'),
  ('sieve','tamiz'),('signpost','señal'),('silk','seda'),('slaughtering','matanza'),('sleep','sueño'),
  ('sling','honda'),('slope','pendiente'),('sluggishness','pereza'),('snorting','resoplido'),('sojourner','forastero'),
  ('someone','alguien'),('sorrow','tristeza'),('sound','sonido'),('south','sur'),('sowing','siembra'),
  ('spark','chispa'),('spear','lanza'),('spittle','saliva'),('splendor','esplendor'),('splinter','astilla'),
  ('spoil','botín'),('spot','mancha'),('steep','empinado'),('stench','hedor'),('storehouse','almacén'),
  ('straw','paja'),('stricken','herido'),('string','cuerda'),('stubbornness','terquedad'),('surely','ciertamente'),
  ('surpassing','sobresaliente'),('swarm','enjambre'),('sweat','sudor'),('swift','veloz'),('sword','espada')
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
    'batch_id','fase_h_es_batch_004_20260820',
    'source','STEPBible/TAHOT source_gloss en',
    'derivation','conservative exact English gloss mapping',
    'context_used_as_meaning',false
  )
from eligible
on conflict (lexical_entry_id) do nothing;
