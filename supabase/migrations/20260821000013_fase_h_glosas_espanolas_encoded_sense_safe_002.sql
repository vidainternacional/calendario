-- FASE H / Bloque 3 — sentidos codificados restantes, lote seguro 002.
-- Se conserva source_gloss íntegro; la anotación estructurada sirve solo para desambiguar
-- el sentido explícito de la propia fuente, nunca como contexto bíblico ni como inferencia nueva.
-- H1567 (nombre compuesto) queda fuera para tratamiento de nombres propios.
-- Reversión:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_encoded_sense_safe_002_20260820';

with map(lexical_id,display_gloss_es) as (values
('H0935L','casarse'),('H0935N','quedar bajo asedio'),('H1121H','cría'),('H1121J','heredero'),('H1121K','guerrero'),
('H1167K','dueño de'),('H3372H','reverenciar'),('H3559J','comprometer'),('H4150J','señal fijada'),('H5307J','matar'),
('H5307K','enojado'),('H5375U','casarse'),('H5869K','pecado'),('H5927K','copular'),('H6213J','hacer'),
('H6440L','persona'),('H6635H','guerra'),('H7323H','guardia'),('H7323I','pedazos'),('H7704I','silvestre (animales o plantas)'),
('H8210I','construir terraplén de asedio'),('H8577N','monstruo')
), eligible as (
 select e.id lexical_entry_id,e.lexical_id,e.strong_number,e.source_gloss,map.display_gloss_es
 from public.biblical_lexical_entries e
 join map on map.lexical_id=e.lexical_id
 left join public.biblical_hebrew_spanish_glosses g on g.lexical_entry_id=e.id
 where e.language='hebrew' and e.enabled and e.review_status='approved'
   and e.display_gloss_es is null and g.lexical_entry_id is null
)
insert into public.biblical_hebrew_spanish_glosses
(lexical_entry_id,display_gloss_es,alternative_glosses_es,confidence,derivation_method,source_gloss_snapshot,status,provenance)
select lexical_entry_id,display_gloss_es,'{}'::text[],96,'encoded_source_sense_editorial_v1',source_gloss,'manual_approved',
 jsonb_build_object('phase','FASE_H_BLOQUE_3','batch_id','fase_h_es_encoded_sense_safe_002_20260820','source','STEPBible/TAHOT source_gloss en','source_license','CC BY 4.0','translation_layer','VIDA editorial Spanish','translation_basis','explicit structured source sense; technical annotation used only to disambiguate source sense','context_used_as_meaning',false,'rv1909_used_as_meaning',false,'new_meaning_inferred',false,'lexical_id',lexical_id,'strong_number',strong_number)
from eligible
on conflict (lexical_entry_id) do nothing;
