-- FASE H / Bloque 3 — recuperación segura de nombres propios, lote 006.
-- 31 entradas revalidadas desde chunks safe-v4 010–013.
--
-- Esta recuperación NO afirma que el QID de Wikidata identifique de forma única
-- a cada homónimo bíblico. Wikidata se conserva como referencia licenciada de
-- etiqueta; la identidad léxica continúa siendo la entrada TAHOT/TIPNR exacta y
-- la grafía española se confirma en >= 2 fuentes españolas verificadas del ancla.
--
-- Insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id'='fase_h_es_nombres_safe_v4_recovery_006_20260820';

with map(
  lexical_entry_id, expected_source_gloss, display_gloss_es, tipnr_id,
  wikidata_id, wikidata_revision, name_similarity, spanish_anchor_sources
) as (values
 ('dce89dd5-ff33-4d8a-a709-ffc0987381f8'::uuid,'Onan»Onan@Gen.38.4-1Ch','Onán','Onan_Gen.38.4','Q661074','wikidata-lastrevid:2530678773',1.0,3),
 ('e562db41-3a03-4e63-9873-728d8ade2dc4'::uuid,'Obed-edom»Obed-edom@2Sa.6.10-2Ch','Obed-Edom','Obed-edom_2Sa.6.10','Q2898809','wikidata-lastrevid:2516431122',1.0,3),
 ('48275c0e-65ee-46c4-b4f6-94a86807d88a'::uuid,'Obed»Obed@Rut.4.17-Luk','Obed','Obed_Rut.4.17','Q1135791','wikidata-lastrevid:2530654446',1.0,3),
 ('0f06ecbb-2c47-4016-85e6-8da6fa2d0ec8'::uuid,'Obed»Obed@1Ch.2.37-','Obed','Obed_1Ch.2.37','Q1135791','wikidata-lastrevid:2530654446',1.0,3),
 ('a6a6dd52-53c4-4ec1-b58d-14a4bdce6c22'::uuid,'Obed»Obed@1Ch.11.47','Obed','Obed_1Ch.11.47','Q1135791','wikidata-lastrevid:2530654446',1.0,3),
 ('f568504b-183f-4e44-a239-165c226de808'::uuid,'Obed»Obed@1Ch.26.7','Obed','Obed_1Ch.26.7','Q1135791','wikidata-lastrevid:2530654446',1.0,3),
 ('cad925a8-1ecc-4441-b716-5cf424cab6ad'::uuid,'Obed»Obed@2Ch.23.1','Obed','Obed_2Ch.23.1','Q1135791','wikidata-lastrevid:2530654446',1.0,3),
 ('4f116114-5b87-41fd-95c0-351556467380'::uuid,'Og»Og@Num.21.33-Psa','Og','Og_Num.21.33','Q878675','wikidata-lastrevid:2530701753',1.0,3),
 ('3398f0a8-2728-44bb-9475-5c1f77910444'::uuid,'Omri»Omri@1Ki.16.16-Mic','Omri','Omri_1Ki.16.16','Q313221','wikidata-lastrevid:2530517494',1.0,3),
 ('dd36e5b2-beba-4c61-94ab-68e7039d60fe'::uuid,'Omri»Omri@1Ch.7.8','Omri','Omri_1Ch.7.8','Q313221','wikidata-lastrevid:2530517494',1.0,3),
 ('4135e6fb-2a12-4763-a9c5-c0799da19953'::uuid,'Omri»Omri@1Ch.9.4','Omri','Omri_1Ch.9.4','Q313221','wikidata-lastrevid:2530517494',1.0,3),
 ('606bfc75-3e51-45b1-83a9-a1e4e3f0d35e'::uuid,'Omri»Omri@1Ch.27.18','Omri','Omri_1Ch.27.18','Q313221','wikidata-lastrevid:2530517494',1.0,3),
 ('be5c9cff-7a33-4d5d-bf87-7d53736ba326'::uuid,'Peleg»Peleg@Gen.10.25-Luk','Peleg','Peleg_Gen.10.25','Q1648259','wikidata-lastrevid:2530691177',1.0,3),
 ('a92386f4-1cbe-481c-a699-13d882b9e685'::uuid,'Seba»Seba@Gen.10.7-1Ch','Seba','Seba_Gen.10.7','Q23639444','wikidata-lastrevid:2530670896',1.0,3),
 ('d44d5135-9685-4ce4-80a2-d0ae379422fe'::uuid,'Reuben»Reuben@Gen.29.32-Rev','Rubén','Reuben_Gen.29.32','Q625661','wikidata-lastrevid:2533438425',0.909091,3),
 ('b9ee0119-9ffa-4618-989f-1b50661d9ff2'::uuid,'Ruth»Ruth@Rut.1.4-Mat','Rut','Ruth_Rut.1.4','Q1774982','wikidata-lastrevid:2533445042',1.0,2),
 ('af85d6e8-3ca9-4570-92bb-140ac60e610f'::uuid,'Rehoboam»Rehoboam@1Ki.11.43-Mat','Roboam','Rehoboam_1Ki.11.43','Q211663','wikidata-lastrevid:2530668481',0.857143,3),
 ('ce74c87a-c00b-4748-a0d9-f2e23b422758'::uuid,'Reu»Reu@Gen.11.18-Luk','Reu','Reu_Gen.11.18','Q2040793','wikidata-lastrevid:2530693350',1.0,2),
 ('d95d0a5d-0385-468c-bee6-5cf8b80e1ac2'::uuid,'Saul»Saul@1Sa.9.2-Act','Saúl','Saul_1Sa.9.2','Q28730','wikidata-lastrevid:2533446621',1.0,3),
 ('2122836d-2985-4f84-8d78-2c8674487320'::uuid,'Shealtiel»Shealtiel@1Ch.3.17-Mat','Salatiel','Shealtiel_1Ch.3.17','Q2256348','wikidata-lastrevid:2530669895',0.875,2),
 ('a16bd24f-c8b6-43ef-aeb8-98a75efefcba'::uuid,'Shealtiel»Shealtiel@1Ch.3.17-Mat','Salatiel','Shealtiel_1Ch.3.17','Q2256348','wikidata-lastrevid:2530669895',0.875,2),
 ('57aab0b2-6329-4495-b29f-80eb22808783'::uuid,'Shem»Shem@Gen.5.32-Luk','Sem','Shem_Gen.5.32','Q200902','wikidata-lastrevid:2532895882',1.0,3),
 ('84beb5a8-d08e-4bd3-ae1f-81e050ce2b6d'::uuid,'Shamgar»Shamgar@Jdg.3.31-','Samgar','Shamgar_Jdg.3.31','Q1516550','wikidata-lastrevid:2530679873',1.0,3),
 ('b60bbbfa-6bb5-49cb-bf42-a92b9cc87626'::uuid,'Samuel»Samuel@1Sa.1.20-Heb','Samuel','Samuel_1Sa.1.20','Q6577515','wikidata-lastrevid:2533445915',1.0,3),
 ('3e79cf2f-7147-4f49-b3d2-af0455b60e16'::uuid,'Serug»Serug@Gen.11.20-Luk','Serug','Serug_Gen.11.20','Q1161313','wikidata-lastrevid:2530657733',1.0,3),
 ('05440456-0988-4055-88b9-dd0997aeb22a'::uuid,'Seth»Seth@Gen.4.25-Luk','Set','Seth_Gen.4.25','Q107626','wikidata-lastrevid:2532887572',1.0,2),
 ('d63bc01f-0936-4da8-809c-8829be881c40'::uuid,'Sisera»Sisera@Jdg.4.2-Psa','Sísara','Sisera_Jdg.4.2','Q976765','wikidata-lastrevid:2530702438',0.833333,3),
 ('a0dd6b9b-f811-4327-9189-e8136e8e5020'::uuid,'Solomon»Solomon@2Sa.5.14-Act','Salomón','Solomon_2Sa.5.14','Q37085','wikidata-lastrevid:2533451883',0.857143,3),
 ('bda158d4-b1be-488c-84e2-ee0bb7cd640f'::uuid,'Tidal»Tidal@Gen.14.1-','Tidal','Tidal_Gen.14.1','Q7800767','wikidata-lastrevid:2530700924',1.0,3),
 ('f5d1c1d1-767e-4005-9e42-643934921ea8'::uuid,'Zebulun»Zebulun@Gen.30.20-Rev','Zabulón','Zebulun_Gen.30.20','Q614575','wikidata-lastrevid:2530699251',0.714286,3),
 ('be37fdc6-55a9-4294-a9fc-2b8ea1e0985b'::uuid,'Zerubbabel»Zerubbabel@1Ch.3.19-Mat','Zorobabel','Zerubbabel_1Ch.3.19','Q320139','wikidata-lastrevid:2530684654',0.736842,3)
), eligible as (
 select
   e.id as lexical_entry_id,
   e.strong_number,
   e.source_gloss,
   map.expected_source_gloss,
   map.display_gloss_es,
   map.tipnr_id,
   map.wikidata_id,
   map.wikidata_revision,
   map.name_similarity,
   map.spanish_anchor_sources
 from map
 join public.biblical_lexical_entries e
   on e.id=map.lexical_entry_id
  and e.source_gloss=map.expected_source_gloss
 left join public.biblical_hebrew_spanish_glosses g on g.lexical_entry_id=e.id
 where e.language='hebrew'
   and e.enabled=true
   and e.review_status='approved'
   and nullif(btrim(e.display_gloss_es),'') is null
   and g.lexical_entry_id is null
   and map.spanish_anchor_sources >= 2
)
insert into public.biblical_hebrew_spanish_glosses
(lexical_entry_id,display_gloss_es,alternative_glosses_es,confidence,derivation_method,source_gloss_snapshot,status,provenance)
select lexical_entry_id,display_gloss_es,'{}'::text[],99,
 'tipnr_wikidata_spanish_anchor_recovery_v2',source_gloss,'verified_derived',
 jsonb_build_object(
   'phase','FASE_H_BLOQUE_3',
   'batch_id','fase_h_es_nombres_safe_v4_recovery_006_20260820',
   'source_identity','STEPBible TIPNR',
   'source_identity_license','CC BY 4.0',
   'tipnr_id',tipnr_id,
   'wikidata_id',wikidata_id,
   'wikidata_uri','https://www.wikidata.org/entity/'||wikidata_id,
   'wikidata_license','CC0-1.0',
   'wikidata_revision',wikidata_revision,
   'wikidata_used_as_label_reference',true,
   'wikidata_identity_asserted',false,
   'spanish_anchor_sources',spanish_anchor_sources,
   'spanish_anchor_sources_minimum',2,
   'name_similarity',name_similarity,
   'anchor_used_for_name_spelling_only',true,
   'context_used_as_meaning',false,
   'rv1909_used_as_meaning',false,
   'strong_number',strong_number
 )
from eligible
on conflict (lexical_entry_id) do nothing;