-- FASE H / Bloque 3 — lote editorial de verbos con POS nulo I–P.
-- Fuente semántica exclusiva: source_gloss inglés aprobado STEPBible/TAHOT.
-- Política: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nullpos_verbs_ip_001_20260820';

with map(source_gloss, display_gloss_es) as ( values
('to impoverish','empobrecer'),('to increase','aumentar'),('to inscribe','inscribir'),('to join','unir'),('to journey','viajar'),('to judge','juzgar'),('to justify','justificar'),('to keep','guardar'),('to kick','patear'),('to kiss','besar'),('to lament','lamentar'),('to laugh','reír'),('to lavish|despise','prodigar; despreciar'),('to lay beams','colocar vigas'),('to lead','conducir'),('to lean','inclinarse'),('to lie','mentir'),('to lie down','acostarse'),('to lift','levantar'),('to light','alumbrar'),('to limp','cojear'),('to low','mugir'),('to make noise','hacer ruido'),('to measure','medir'),('to meditate','meditar'),('to minister','ministrar'),('to moisten','humedecer'),('to mourn','lamentar'),('to multiply','multiplicar'),('to multiply ten thousand','multiplicar por diez mil'),('to mutter','murmurar'),('to nip','pellizcar'),('to ogle','mirar fijamente'),('to overflow','desbordarse'),('to overturn','volcar'),('to pervert','pervertir'),('to pine','languidecer'),('to plant','plantar'),('to pluck','arrancar'),('to polish','pulir'),('to ponder','ponderar'),('to pounce','abalanzarse'),('to practice sorcery','practicar hechicería'),('to praise','alabar'),('to pray','orar'),('to presume','presumir'),('to prevail','prevalecer'),('to proceed','proceder'),('to prophesy','profetizar'),('to pull','tirar'),('to put','poner')
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
 jsonb_build_object('phase','FASE_H_BLOQUE_3','batch_id','fase_h_es_nullpos_verbs_ip_001_20260820','source','STEPBible/TAHOT source_gloss en','source_license','CC BY 4.0','translation_layer','VIDA editorial Spanish','translation_basis','exact approved English source_gloss; null POS but explicitly verbal source label','context_used_as_meaning',false,'rv1909_used_as_meaning',false,'hebrew_lemma_used_to_infer_meaning',false,'strong_number',strong_number)
from eligible
on conflict (lexical_entry_id) do nothing;
