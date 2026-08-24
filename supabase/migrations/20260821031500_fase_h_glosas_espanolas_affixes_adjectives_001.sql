-- FASE H / Bloque 3 — lote editorial de adjetivos, prefijos, sufijos y conector.
-- Fuente semántica exclusiva: source_gloss inglés aprobado STEPBible/TAHOT.
-- Política: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_affixes_adjectives_001_20260820';

with map(lexical_id, display_gloss_es) as (values
('H0310A','posterior'),('H1107','junto a'),('H1157','acerca de; por medio de; para'),('H2059','segundo'),('H2114A','ser extranjero'),('H2289','ceñido'),('H2310','rechazado; fugaz'),('H2556B','ser rojo'),('H2557A','levadura'),('H2655','que se deleita'),('H2890','pureza'),('H3426','hay'),('H3795','golpeado'),('H4295','debajo'),('H4844','amargura'),('H4846','hiel'),('H5056','que cornea'),('H5621','espina'),('H5719','voluptuoso'),('H6001A','trabajador'),('H6267','antiguo; tomado'),('H6493','que ve'),('H6941','con tristeza'),('H7317','con altivez'),('H7338','anchura'),('H7726','que vuelve atrás'),('H8186A','horror'),('H8186B','horror'),('H8291','zarcillo'),('H8320','alazán'),
('H9001','y'),('H9002','y'),('H9003','en'),('H9004','como'),('H9005','a'),('H9006','de'),('H9007','que'),('H9008','¿ (interrogativo)'),('H9009','el/la'),('H9014','enlace'),
('H9011','hacia'),('H9012','énfasis'),('H9013','énfasis'),('H9021','tu'),('H9022','tu'),('H9023','su (de él)'),('H9024','su (de ella)'),('H9025','nuestro'),('H9026','de ustedes'),('H9027','de ustedes'),('H9028','su (de ellos)'),('H9029','su (de ellas)'),('H9030','me'),('H9034','ella / su'),('H9040','yo'),('H9041','tú'),('H9042','tú'),('H9043','él'),('H9044','ella'),('H9045','nosotros'),('H9046','ustedes'),('H9047','ustedes'),('H9048','ellos'),('H9049','ellas')
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
select lexical_entry_id,display_gloss_es,'{}'::text[],96,'manual_editorial_lexical_id_exact_v1',source_gloss,'manual_approved',
 jsonb_build_object('phase','FASE_H_BLOQUE_3','batch_id','fase_h_es_affixes_adjectives_001_20260820','source','STEPBible/TAHOT source_gloss en','source_license','CC BY 4.0','translation_layer','VIDA editorial Spanish','translation_basis','exact approved lexical entry + source_gloss','context_used_as_meaning',false,'rv1909_used_as_meaning',false,'hebrew_lemma_used_to_infer_meaning',false,'strong_number',strong_number,'lexical_id',lexical_id)
from eligible
on conflict (lexical_entry_id) do nothing;
