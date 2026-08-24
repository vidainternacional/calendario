-- FASE H / Bloque 3 — lote editorial de verbos con POS nulo A–H.
-- Fuente semántica exclusiva: source_gloss inglés aprobado STEPBible/TAHOT.
-- Política: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nullpos_verbs_ah_001_20260820';

with map(source_gloss, display_gloss_es) as ( values
('to accept','aceptar'),('to accompany','acompañar'),('to act treacherously','obrar traicioneramente'),('to advise','aconsejar'),('to amaze','asombrar'),('to ambush','emboscar'),('to anoint','ungir'),('to assail','atacar'),('to astounded','quedar atónito'),('to atone','expiar'),('to awake','despertar'),('to bark','ladrar'),('to be foolish','ser necio'),('to bear','llevar'),('to beat','golpear'),('to beautify','embellecer'),('to become vain','volverse vano'),('to bend (down)','inclinarse'),('to blossom','florecer'),('to blow','soplar'),('to border','lindar'),('to bore','perforar'),('to break the neck','quebrar el cuello'),('to bruise','magullar'),('to burn;_pursue','quemar; perseguir'),('to burst','reventar'),('to camp','acampar'),('to capture','capturar'),('to cast far off','arrojar lejos'),('to catch','atrapar'),('to chant','entonar'),('to chop','cortar'),('to cleave','partir; adherirse'),('to cloud','nublar'),('to come','venir'),('to complain','quejarse'),('to confine','confinar'),('to confront','confrontar'),('to confuse','confundir'),('to count','contar'),('to crash','estrellarse'),('to crowd','aglomerar'),('to cry','llorar'),('to cry out','clamar'),('to cut','cortar'),('to cut off the tail','cortar la cola'),('to cut up','cortar en pedazos'),('to darken','oscurecer'),('to daub','embadurnar'),('to dedicate','dedicar'),('to defend','defender'),('to delight','deleitar'),('to depart','partir'),('to descend','descender'),('to despair','desesperar'),('to devote;_destroy','consagrar; destruir'),('to dig about','cavar alrededor'),('to dip','sumergir'),('to dislocate|hang','dislocar; colgar'),('to do secretly','hacer en secreto'),('to drag','arrastrar'),('to drive away','ahuyentar'),('to embrace','abrazar'),('to endanger','poner en peligro'),('to enfeeble','debilitar'),('to engrave','grabar'),('to explain','explicar'),('to fast','ayunar'),('to feed on','alimentarse de'),('to feel','sentir'),('to fence','cercar'),('to fight','luchar'),('to fill','llenar'),('to finish','terminar'),('to fish','pescar'),('to fly','volar'),('to fold','doblar'),('to form','formar'),('to free','liberar'),('to gather|tend figs','recoger; cuidar higueras'),('to give a sixth','dar una sexta parte'),('to give thanks','dar gracias'),('to gnaw','roer'),('to go left','ir a la izquierda'),('to go right','ir a la derecha'),('to grasp','agarrar'),('to grieve','afligir'),('to grow dark','oscurecerse'),('to grumble','murmurar'),('to hail','granizar'),('to heap','amontonar'),('to hew','tallar'),('to hire','contratar'),('to hold in','contener')
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
 jsonb_build_object('phase','FASE_H_BLOQUE_3','batch_id','fase_h_es_nullpos_verbs_ah_001_20260820','source','STEPBible/TAHOT source_gloss en','source_license','CC BY 4.0','translation_layer','VIDA editorial Spanish','translation_basis','exact approved English source_gloss; null POS but explicitly verbal source label','context_used_as_meaning',false,'rv1909_used_as_meaning',false,'hebrew_lemma_used_to_infer_meaning',false,'strong_number',strong_number)
from eligible
on conflict (lexical_entry_id) do nothing;
