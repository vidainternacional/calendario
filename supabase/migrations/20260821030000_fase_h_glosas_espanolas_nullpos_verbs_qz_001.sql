-- FASE H / Bloque 3 — lote editorial de verbos con POS nulo Q–Z.
-- Fuente semántica exclusiva: source_gloss inglés aprobado STEPBible/TAHOT.
-- Política: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nullpos_verbs_qz_001_20260820';

with map(source_gloss, display_gloss_es) as ( values
('to quake','temblar'),('to rage','enfurecerse'),('to refine','refinar'),('to refrain','abstenerse'),('to reign','reinar'),('to renew','renovar'),('to repair','reparar'),('to rescue','rescatar'),('to restore','restaurar'),('to ride','montar'),('to rise','levantarse'),('to rival','rivalizar'),('to roll','rodar'),('to roll up','enrollar'),('to rouse','despertar'),('to rub','frotar'),('to rush','apresurarse'),('to satisfy','satisfacer'),('to saw','serrar'),('to scar','dejar cicatriz'),('to scream','gritar'),('to seal','sellar'),('to search','buscar'),('to seek refuge','refugiarse'),('to separate','separar'),('to serve','servir'),('to sew','coser'),('to shatter','destrozar'),('to shear','esquilar'),('to shoe','calzar'),('to shoot','disparar'),('to shudder','estremecerse'),('to shut eyes','cerrar los ojos'),('to sigh','suspirar'),('to silence','silenciar'),('to slap','abofetear'),('to sneeze','estornudar'),('to sojourn','residir temporalmente'),('to spice','sazonar'),('to spot','manchar'),('to squeeze','apretar'),('to start','comenzar'),('to step down','bajar'),('to stink','apestar'),('to stop','detenerse'),('to strangle','estrangular'),('to strip','despojar'),('to subside','calmarse'),('to succeed','tener éxito'),('to summer','pasar el verano'),('to support','sostener'),('to sustain','sustentar'),('to swallow','tragar'),('to swallow up','tragar por completo'),('to swear','jurar'),('to sweep','barrer'),('to sweep away','arrasar'),('to swerve','desviarse'),('to take provision','aprovisionarse'),('to take the fifth part','tomar la quinta parte'),('to tear','rasgar'),('to tend vineyards','cuidar viñedos'),('to thirst','tener sed'),('to throw','arrojar'),('to thrust','empujar'),('to till','labrar'),('to to be dismayed','estar consternado'),('to transgress','transgredir'),('to translate','trasladar'),('to tread down','pisotear'),('to treasure','atesorar'),('to tremble','temblar'),('to trouble','perturbar'),('to uproot','desarraigar'),('to urge','instar'),('to use a proverb','usar un proverbio'),('to vomit','vomitar'),('to wait','esperar'),('to wall up|off','amurallar; cerrar'),('to wallow','revolcarse'),('to warm','calentar'),('to warn','advertir'),('to waste','desperdiciar; devastar'),('to weave','tejer'),('to weep','llorar'),('to whistle','silbar'),('to whiten','blanquear'),('to whitewash','encalar'),('to wither','marchitarse'),('to wrestle','luchar')
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
 jsonb_build_object('phase','FASE_H_BLOQUE_3','batch_id','fase_h_es_nullpos_verbs_qz_001_20260820','source','STEPBible/TAHOT source_gloss en','source_license','CC BY 4.0','translation_layer','VIDA editorial Spanish','translation_basis','exact approved English source_gloss; null POS but explicitly verbal source label','context_used_as_meaning',false,'rv1909_used_as_meaning',false,'hebrew_lemma_used_to_infer_meaning',false,'strong_number',strong_number)
from eligible
on conflict (lexical_entry_id) do nothing;
