-- FASE H / Bloque 3 — remanente plain inequívoco, lote seguro 001.
-- Política: insert-only, equivalencias conservadoras y reversión exacta por batch_id.
-- No modifica biblical_lexical_entries ni usa contexto bíblico como significado.
-- Reversión:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_plain_remaining_safe_001_20260820';

with map(lexical_id, display_gloss_es) as (values
('H0655','tiempo (adecuado)'),
('H1215','ganancia (injusta)'),
('H0739','Ariel'),
('H0834D','como el cual'),
('H2177','especie'),
('H4327','especie'),
('H5777','plomo'),
('H4412','albergue'),
('H2785','pepita'),
('H0437','llanura'),
('H4334','llanura'),
('H6196','plátano oriental'),
('H8670','regalo'),
('H0380','pupila'),
('H4793','carrera'),
('H0122B','sustancia roja'),
('H7854','Satanás'),
('H7193','escama'),
('H3657','brote'),
('H8363','brote'),
('H2839','radio de rueda'),
('H4002','manantial'),
('H0413','hacia'),
('H4728','mercancía'),
('H9031','tú (m. s.)'),
('H9032','tú (f. s.)'),
('H9036','ustedes (m.)'),
('H9037','ustedes (f.)')
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
select lexical_entry_id,display_gloss_es,'{}'::text[],97,'manual_editorial_lexical_id_exact_v2',source_gloss,'manual_approved',
 jsonb_build_object('phase','FASE_H_BLOQUE_3','batch_id','fase_h_es_plain_remaining_safe_001_20260820','source','STEPBible/TAHOT source_gloss en','source_license','CC BY 4.0','translation_layer','VIDA editorial Spanish','translation_basis','exact approved lexical entry + direct source gloss; ambiguous remnants excluded','context_used_as_meaning',false,'rv1909_used_as_meaning',false,'hebrew_lemma_used_to_infer_meaning',false,'strong_number',strong_number,'lexical_id',lexical_id)
from eligible
on conflict (lexical_entry_id) do nothing;
