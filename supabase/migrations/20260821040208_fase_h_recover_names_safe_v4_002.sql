-- FASE H / Bloque 3 — recuperación segura de nombres propios, lote 002.
-- 15 entradas revalidadas read-only con el gate safe-v4 tras retirar los anclajes inseguros.
-- Insert-only, sin modificar léxico fuente. Ancla usada únicamente para confirmar grafía española.
-- Reversión exacta:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nombres_safe_v4_recovery_002_20260820';

with map(lexical_entry_id,expected_source_gloss,display_gloss_es,tipnr_id,wikidata_id,wikidata_revision,name_similarity,spanish_anchor_sources) as (values
 ('3aa517ff-ebb2-4679-81f1-68123ce5dc61'::uuid,'Hur»Hur@Exo.17.10-2Ch','Hur','Hur_Exo.17.10','Q492665','wikidata-lastrevid:2530687146',1.0,3),
 ('03aaae0d-29f5-43c0-8d04-2bf383ddedc7'::uuid,'Hur»Hur@Num.31.8-Jos','Hur','Hur_Num.31.8','Q492665','wikidata-lastrevid:2530687146',1.0,3),
 ('577a1d45-c1ad-41a3-86e1-55ec6a815f0c'::uuid,'Hur»Hur@Neh.3.9','Hur','Hur_Neh.3.9','Q492665','wikidata-lastrevid:2530687146',1.0,3),
 ('613482c0-45e7-431d-b309-4e522468274a'::uuid,'Huldah»Huldah@2Ki.22.14-2Ch','Hulda','Huldah_2Ki.22.14','Q583207','wikidata-lastrevid:2530677615',1.0,3),
 ('a03c2afe-5f8f-4afa-96f7-405d39ece9ee'::uuid,'Jahaziel»Jahaziel@1Ch.12.4','Jahaziel','Jahaziel_1Ch.12.4','Q1966067','wikidata-lastrevid:2530693015',1.0,2),
 ('85f1c4fd-eced-4504-a843-0a892982d792'::uuid,'Jahaziel»Jahaziel@1Ch.16.6','Jahaziel','Jahaziel_1Ch.16.6','Q1966067','wikidata-lastrevid:2530693015',1.0,3),
 ('9bbe45a4-a621-4027-b53c-53cb8054cdca'::uuid,'Jahaziel»Jahaziel@1Ch.23.19-','Jahaziel','Jahaziel_1Ch.23.19','Q1966067','wikidata-lastrevid:2530693015',1.0,3),
 ('4c6467d8-6a36-4cb5-9850-7e944b907232'::uuid,'Jahaziel»Jahaziel@2Ch.20.14','Jahaziel','Jahaziel_2Ch.20.14','Q1966067','wikidata-lastrevid:2530693015',1.0,3),
 ('6036c639-83df-48da-ad5b-6c22bfab9408'::uuid,'Jahaziel»Jahaziel@Ezr.8.5','Jahaziel','Jahaziel_Ezr.8.5','Q1966067','wikidata-lastrevid:2530693015',1.0,3),
 ('9bf00024-5fd4-4a8b-8bdb-56c345b9afa4'::uuid,'Japheth»Japheth@Gen.5.32-1Ch','Jafet','Japheth_Gen.5.32','Q200637','wikidata-lastrevid:2532887755',1.0,2),
 ('afecc5e4-e975-49ba-a83b-73ccdd608d77'::uuid,'Izhar»Izhar@Exo.6.18-1Ch','Izhar','Izhar_Exo.6.18','Q2210407','wikidata-lastrevid:2530669776',1.0,2),
 ('5f9007cb-9e23-4037-b010-dda12c47854b'::uuid,'Isaac»Isaac@Gen.17.19-Jas','Isaac','Isaac_Gen.17.19','Q671872','wikidata-lastrevid:2533318648',1.0,2),
 ('38b6b305-c909-4ce2-83c1-e49ea8d39e34'::uuid,'Isaac»Isaac@Gen.17.19-Jas','Isaac','Isaac_Gen.17.19','Q671872','wikidata-lastrevid:2533318648',1.0,2),
 ('a8b93110-10ad-43d3-83ca-5c26587b9ba9'::uuid,'Irad»Irad@Gen.4.18','Irad','Irad_Gen.4.18','Q3364264','wikidata-lastrevid:2530684867',1.0,3),
 ('867e678b-75b5-4bdf-8aaa-e86b2aa3c229'::uuid,'Izhar»Izhar@Exo.6.18-1Ch','Izhar','Izhar_Exo.6.18','Q2210407','wikidata-lastrevid:2530669776',1.0,2)
), eligible as (
 select e.id lexical_entry_id,e.strong_number,e.source_gloss,map.*
 from map
 join public.biblical_lexical_entries e on e.id=map.lexical_entry_id and e.source_gloss=map.expected_source_gloss
 left join public.biblical_hebrew_spanish_glosses g on g.lexical_entry_id=e.id
 where e.language='hebrew' and e.enabled and e.review_status='approved'
   and nullif(btrim(e.display_gloss_es),'') is null and g.lexical_entry_id is null
)
insert into public.biblical_hebrew_spanish_glosses
(lexical_entry_id,display_gloss_es,alternative_glosses_es,confidence,derivation_method,source_gloss_snapshot,status,provenance)
select lexical_entry_id,display_gloss_es,'{}'::text[],99,'tipnr_wikidata_safe_v4_recovery_v1',source_gloss,'verified_derived',
 jsonb_build_object(
   'phase','FASE_H_BLOQUE_3','batch_id','fase_h_es_nombres_safe_v4_recovery_002_20260820',
   'recovery_after_removed_batches',jsonb_build_array('fase_h_es_nombres_wikidata_rv1909_anchor_001_20260820','fase_h_es_nombres_wikidata_alias_rv1909_anchor_002_20260820'),
   'source_identity','STEPBible TIPNR','source_identity_license','CC BY 4.0','tipnr_id',tipnr_id,
   'wikidata_id',wikidata_id,'wikidata_uri','https://www.wikidata.org/entity/' || wikidata_id,
   'wikidata_license','CC0-1.0','wikidata_revision',wikidata_revision,
   'spanish_anchor_sources',spanish_anchor_sources,'spanish_anchor_sources_minimum',2,
   'name_similarity',name_similarity,'name_similarity_minimum',0.55,
   'exact_source_entity',true,'exact_wikidata_primary_label',true,
   'anchor_used_for_name_spelling_only',true,'context_used_as_meaning',false,'rv1909_used_as_meaning',false,
   'strong_number',strong_number)
from eligible
on conflict (lexical_entry_id) do nothing;
