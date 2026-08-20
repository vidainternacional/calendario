-- FASE H / Bloque 3 — segundo lote editorial de glosas adjetivales españolas.
-- Aprobación continua del usuario dentro del bloque activo.
-- Política: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_plain_adjectives_editorial_002_20260820';

with map(source_gloss, display_gloss_es) as (
 values
 ('aged','anciano'),('beautiful','hermoso'),('beloved','amado'),('bitter','amargo'),('black','negro'),('blind','ciego'),('bright','brillante'),('bronze','de bronce'),('childless','sin hijos'),('clean','limpio'),('cool','fresco'),('crooked','torcido'),('deep','profundo'),('drunken','ebrio'),('empty','vacío'),('evil','malvado'),('faint','débil'),('fat','gordo'),('female','femenino'),('fifth','quinto'),('fifty','cincuenta'),('filthy','inmundo'),('free','libre'),('glorious','glorioso'),('gracious','clemente'),('great','grande'),('high','alto'),('hot','caliente'),('humpbacked','jorobado'),('hundred','cien'),('lame','cojo'),('lean','delgado'),('lovely','hermoso'),('lower','inferior'),('luxuriant','frondoso'),('male','masculino'),('mighty','poderoso'),('much','mucho'),('naked','desnudo'),('narrow','estrecho'),('old','viejo'),('pious','piadoso'),('poor','pobre'),('precious','precioso'),('pregnant','embarazada'),('pretty','bonito'),('profane','profano'),('quick','rápido'),('ready','preparado'),('red','rojo'),('rough','áspero'),('severe','severo'),('slow','lento'),('small','pequeño'),('smooth','liso'),('sweet','dulce'),('tame','domesticado'),('tender','tierno'),('tenth','décimo'),('third','tercero'),('thirty','treinta'),('twenty','veinte'),('uncircumcised','incircunciso'),('unclean','impuro'),('upright','recto'),('weak','débil'),('white','blanco'),('wise','sabio'),('worthless','sin valor')
), eligible as (
 select e.id lexical_entry_id,e.strong_number,e.source_gloss,map.display_gloss_es
 from public.biblical_lexical_entries e join map on map.source_gloss=e.source_gloss
 left join public.biblical_hebrew_spanish_glosses g on g.lexical_entry_id=e.id
 where e.language='hebrew' and e.enabled and e.review_status='approved'
   and e.part_of_speech='adjective' and e.display_gloss_es is null and g.lexical_entry_id is null
)
insert into public.biblical_hebrew_spanish_glosses
(lexical_entry_id,display_gloss_es,alternative_glosses_es,confidence,derivation_method,source_gloss_snapshot,status,provenance)
select lexical_entry_id,display_gloss_es,'{}'::text[],98,'manual_editorial_source_gloss_exact_v1',source_gloss,'manual_approved',
 jsonb_build_object('phase','FASE_H_BLOQUE_3','batch_id','fase_h_es_plain_adjectives_editorial_002_20260820','source','STEPBible/TAHOT source_gloss en','source_license','CC BY 4.0','translation_layer','VIDA editorial Spanish','translation_basis','exact approved English source_gloss + adjective POS','context_used_as_meaning',false,'rv1909_used_as_meaning',false,'hebrew_lemma_used_to_infer_meaning',false,'strong_number',strong_number)
from eligible
on conflict (lexical_entry_id) do nothing;
