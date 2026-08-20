-- FASE H / Bloque 3 — tercer lote editorial de glosas adjetivales/estructuradas españolas.
-- Política: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_plain_adjectives_editorial_003_20260820';

with map(source_gloss, display_gloss_es) as (
 values
 (': among»between:2_among','entre'),(': angel»mighty:4_angel','ángel'),(': arrogant»broad:2_arrogant','arrogante'),(': between»between:1_between','entre'),(': blameless»unblemished:2_blameless','irreprochable'),(': complete»unblemished:3_complete','completo'),(': elder»old:2_elder;_leader','anciano'),(': evil»bad:2_evil','malvado'),(': holy»holy:1_holy','santo'),(': killed»slain:1_killed','muerto'),(': large»great:1_large','grande'),(': noble»noble:1_noble','noble'),(': old»old:1_old','viejo'),(': ox»mighty:1_ox','buey'),(': saint»holy:2_saint;_priest','santo'),(': small»small:1_small','pequeño'),(': stallion»mighty:2_stallion','semental'),(': strong»mighty:3_strong_man','fuerte'),(': thousand»thousand:1_thousand','mil'),(': Thummim»unblemished:4_Thummim','Tumim'),(': unblemished»unblemished:1_unblemished;_perfect','sin defecto'),(': upright»upright:2_straight','recto'),(': wide»broad:1_wide','ancho'),(': wounded»slain:2_wounded','herido'),('Aramaic»Aramaic@2Ki.18.26-Rev','arameo'),('approaching','que se acerca'),('burning','ardiente'),('chief','principal'),('combed','peinado'),('cult prostitute','prostituta cultual'),('degenerate','degenerado'),('fearing','temeroso'),('fleeing','fugitivo'),('fool(ish)','necio'),('fresh-plucked','recién arrancado'),('grieved','afligido'),('hammered out','martillado'),('hired','contratado'),('imperious','imperioso'),('insipid','insípido'),('Jealous»LORD@Gen.1.1-Heb','Celoso'),('laborious','laborioso'),('male cult prostitute','prostituto cultual'),('Most High»LORD@Gen.1.1-Heb','Altísimo'),('mourning','enlutado'),('obscure','oscuro'),('on foot','a pie'),('parched','reseco'),('removed','alejado'),('restful','tranquilo'),('scorching','abrasador'),('sevenfold','séptuple'),('sinner','pecador'),('sluggish','perezoso'),('smoking','humeante'),('stammerer','tartamudo'),('still','quieto'),('tawny','leonado')
), eligible as (
 select e.id lexical_entry_id,e.strong_number,e.source_gloss,map.display_gloss_es
 from public.biblical_lexical_entries e join map on map.source_gloss=e.source_gloss
 left join public.biblical_hebrew_spanish_glosses g on g.lexical_entry_id=e.id
 where e.language='hebrew' and e.enabled and e.review_status='approved'
   and e.part_of_speech='adjective' and e.display_gloss_es is null and g.lexical_entry_id is null
)
insert into public.biblical_hebrew_spanish_glosses
(lexical_entry_id,display_gloss_es,alternative_glosses_es,confidence,derivation_method,source_gloss_snapshot,status,provenance)
select lexical_entry_id,display_gloss_es,'{}'::text[],97,'manual_editorial_source_gloss_exact_v1',source_gloss,'manual_approved',
 jsonb_build_object('phase','FASE_H_BLOQUE_3','batch_id','fase_h_es_plain_adjectives_editorial_003_20260820','source','STEPBible/TAHOT source_gloss en','source_license','CC BY 4.0','translation_layer','VIDA editorial Spanish','translation_basis','exact approved English source_gloss + adjective POS; structured entries preserve explicit source sense','context_used_as_meaning',false,'rv1909_used_as_meaning',false,'hebrew_lemma_used_to_infer_meaning',false,'strong_number',strong_number)
from eligible
on conflict (lexical_entry_id) do nothing;
