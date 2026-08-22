-- FASE H / Bloque 3 — glosas plain con POS nulo N–R, solo equivalencias inglesas no ambiguas.
-- Autoridad semántica: source_gloss inglés aprobado STEPBible/TAHOT.
-- Política: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nullpos_plain_nr_001_20260820';

with map(source_gloss, display_gloss_es) as (values
('nakedness','desnudez'),('nation','nación'),('neighboring','adyacente'),('new wine','vino nuevo'),('newborn','recién nacido'),('ninety','noventa'),('ninth','noveno'),('north','norte'),('northern','septentrional'),('nostril','fosa nasal'),('now','ahora'),('numbering','enumeración'),('O that!','¡ojalá!'),('odour','olor'),('offal','despojos'),('office','oficio'),('offshoot','retoño'),('oh that!','¡ojalá!'),('ointment pot|seasoning','recipiente de ungüento; condimento'),('old age','vejez'),('onion','cebolla'),('opening','abertura'),('or','o'),('outer','exterior'),('outermost','más exterior'),('overflowing','desbordamiento'),('overtunic','túnica exterior'),('oxgoad','aguijada para bueyes'),('pagan priest','sacerdote pagano'),('palm','palma'),('palm-tree','palmera'),('panic','pánico'),('parched','reseco'),('park','parque'),('partridge','perdiz'),('passage','paso'),('path','senda'),('peacock','pavo real'),('pelican','pelícano'),('pendant','colgante'),('perhaps','quizá'),('permission','permiso'),('pestle','mano de mortero'),('phylacteries','filacterias'),('pilot','piloto'),('pitchfork','horca'),('Please!','¡por favor!'),('pledge','prenda'),('plumage','plumaje'),('pomegranate','granada'),('pool','estanque'),('pouch','bolsa'),('precipice','precipicio'),('pregnant','embarazada'),('price','precio'),('priest','sacerdote'),('procession','procesión'),('proclamation','proclamación'),('profaned','profanado'),('property','propiedad'),('prophet','profeta'),('prophetess','profetisa'),('protector','protector'),('pruner','podador'),('purse','bolsa'),('quantity','cantidad'),('quick','rápido'),('rabble','muchedumbre'),('rafter','viga'),('raging','furioso'),('rain','lluvia'),('rampart','baluarte'),('ranks','filas'),('ravage','devastación'),('ravine','barranco'),('ready','preparado'),('rebellion','rebelión'),('rebellious','rebelde'),('reinforced','reforzado'),('relief','alivio'),('repentance','arrepentimiento'),('repose','reposo'),('reptile','reptil'),('request','petición'),('reservoir','depósito'),('respect','respeto'),('reviling','insulto'),('riches','riquezas'),('rising','elevación'),('river','río'),('robber','ladrón'),('robbery','robo'),('rock badger','damán'),('rod','vara'),('roebuck','corzo'),('rogue','bribón'),('roughness','aspereza'),('roundness','redondez'),('rug','alfombra'),('rushing','ímpetu'),('rye','centeno')
), eligible as (
 select e.id lexical_entry_id,e.strong_number,e.source_gloss,map.display_gloss_es
 from public.biblical_lexical_entries e join map on map.source_gloss=e.source_gloss
 left join public.biblical_hebrew_spanish_glosses g on g.lexical_entry_id=e.id
 where e.language='hebrew' and e.enabled and e.review_status='approved' and e.part_of_speech is null
   and e.display_gloss_es is null and g.lexical_entry_id is null
)
insert into public.biblical_hebrew_spanish_glosses
(lexical_entry_id,display_gloss_es,alternative_glosses_es,confidence,derivation_method,source_gloss_snapshot,status,provenance)
select lexical_entry_id,display_gloss_es,'{}'::text[],96,'manual_editorial_source_gloss_exact_v2',source_gloss,'manual_approved',
 jsonb_build_object('phase','FASE_H_BLOQUE_3','batch_id','fase_h_es_nullpos_plain_nr_001_20260820','source','STEPBible/TAHOT source_gloss en','source_license','CC BY 4.0','translation_layer','VIDA editorial Spanish','translation_basis','exact approved English source_gloss + null POS; ambiguous labels excluded','context_used_as_meaning',false,'rv1909_used_as_meaning',false,'hebrew_lemma_used_to_infer_meaning',false,'strong_number',strong_number)
from eligible
on conflict (lexical_entry_id) do nothing;
