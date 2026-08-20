-- FASE H / Bloque 3 — glosas anotadas comunes inequívocas.
-- Autoridad semántica: etiqueta inglesa explícita de source_gloss STEPBible/TAHOT.
-- La anotación posterior a » se conserva solo como procedencia/contexto de la fuente.
-- Política: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_annotated_common_001_20260820';

with map(lexical_id,display_gloss_es) as (values
('H8613','lugar de quema'),('H2051','barriles'),('H1336','hendidura'),('H0438G','roble'),('H6160I','llanuras'),('H0798','pendiente'),('H4067','estatura'),('H0059G','piedra'),('H8655','terafines'),('H7200N','ver'),('H4057G','desierto')
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
select lexical_entry_id,display_gloss_es,'{}'::text[],97,'manual_editorial_annotated_primary_label_v1',source_gloss,'manual_approved',
 jsonb_build_object('phase','FASE_H_BLOQUE_3','batch_id','fase_h_es_annotated_common_001_20260820','source','STEPBible/TAHOT source_gloss en','source_license','CC BY 4.0','translation_layer','VIDA editorial Spanish','translation_basis','explicit English label before »; lexical_id exact','annotation_used_as_meaning',false,'context_used_as_meaning',false,'rv1909_used_as_meaning',false,'hebrew_lemma_used_to_infer_meaning',false,'strong_number',strong_number,'lexical_id',lexical_id)
from eligible
on conflict (lexical_entry_id) do nothing;
