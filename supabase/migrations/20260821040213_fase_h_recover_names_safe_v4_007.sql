-- FASE H / Bloque 3 — recuperación segura de nombres propios, lote 007.
-- 47 entradas revalidadas desde los drafts safe-v4 002–005.
--
-- Gate conservador:
-- - entrada hebrea aprobada/habilitada y todavía sin glosa española válida;
-- - UUID + source_gloss exactos fijados;
-- - grafía española confirmada en >= 2 fuentes españolas verificadas del ancla;
-- - Wikidata se usa como referencia licenciada de etiqueta, NO como afirmación de
--   identidad única para homónimos bíblicos;
-- - el ancla jamás se usa como significado léxico.
--
-- Se excluye deliberadamente Gaal -> "Gaal (hijo de Ebed)" porque el texto
-- parentético es descriptivo y no una glosa léxica limpia.
--
-- Insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id'='fase_h_es_nombres_safe_v4_recovery_007_20260820';

with map(
  lexical_entry_id, expected_source_gloss, display_gloss_es, tipnr_id,
  wikidata_id, wikidata_revision, name_similarity, spanish_anchor_sources
) as (values
 ('e64e8865-d08e-40fd-80ef-a6c8fb7527af'::uuid,'Amnon»Amnon@1Ch.4.20','Amnón','Amnon_1Ch.4.20','Q361636','wikidata-lastrevid:2532210162',1.0,2),
 ('411316d6-f203-40fa-846d-cfe285970cfa'::uuid,'Asa»Asa@1Ki.15.8-Mat','Asa','Asa_1Ki.15.8','Q313415','wikidata-lastrevid:2530684466',1.0,3),
 ('2488c64c-39c4-402c-99bb-ae300808a7c8'::uuid,'Asa»Asa@1Ch.9.16','Asa','Asa_1Ch.9.16','Q313415','wikidata-lastrevid:2530684466',1.0,3),
 ('b881a407-9e40-47a6-8edb-a7cadf36e45e'::uuid,'Armoni»Armoni@2Sa.21.8','Armoni','Armoni_2Sa.21.8','Q40326679','wikidata-lastrevid:2317819867',1.0,3),
 ('2533c46f-0ded-422e-bce6-1cca7d2165ba'::uuid,'Amos»Amos@Amo.1.1-','Amós','Amos_Amo.1.1','Q213850','wikidata-lastrevid:2532906057',1.0,2),
 ('6e78f770-3266-468a-a572-3c2e2d991ec6'::uuid,'Amram»Amram@Exo.6.18-1Ch','Amram','Amram_Exo.6.18','Q477527','wikidata-lastrevid:2531465499',1.0,3),
 ('a3156199-dbb1-4d26-8041-a9663faa34f7'::uuid,'Amram»Amram@Ezr.10.34','Amram','Amram_Ezr.10.34','Q477527','wikidata-lastrevid:2531465499',1.0,3),
 ('aa576c77-bc79-4bcc-9615-6aaf8a020952'::uuid,'Bildad»Bildad@Job.2.11-','Bildad','Bildad_Job.2.11','Q2776374','wikidata-lastrevid:2530693794',1.0,3),
 ('8ab2aa59-896c-4f26-82c6-4786fffe6703'::uuid,'Bilhah»Bilhah@Gen.29.29-1Ch','Bilha','Bilhah_Gen.29.29','Q794991','wikidata-lastrevid:2530701179',1.0,3),
 ('c456a9f3-574e-4a41-a4ff-b85463a57181'::uuid,'Balaam»Balaam@Num.22.5-Rev','Balaam','Balaam_Num.22.5','Q574641','wikidata-lastrevid:2530698351',1.0,3),
 ('eeb69024-ae90-4497-8355-919876a25e7a'::uuid,'Belshazzar»Belshazzar@Dan.5.1-','Belsasar','Belshazzar_Dan.5.1','Q225198','wikidata-lastrevid:2532913185',0.823529,3),
 ('b6fa3bf0-d791-4891-b23c-363666493107'::uuid,'Benjamin»Benjamin@Gen.35.18-Rev','Benjamín','Benjamin_Gen.35.18','Q460763','wikidata-lastrevid:2532913440',1.0,3),
 ('641cc95e-35ce-40e9-b871-7e9816ff4805'::uuid,'Benjamin»Benjamin@1Ch.7.10','Benjamín','Benjamin_1Ch.7.10','Q460763','wikidata-lastrevid:2532913440',1.0,2),
 ('702c657e-8908-4fd4-b981-754cb0ce641d'::uuid,'Benjamin»Benjamin@Ezr.10.32','Benjamín','Benjamin_Ezr.10.32','Q460763','wikidata-lastrevid:2532913440',1.0,3),
 ('9aa79f46-bad6-4ec9-847f-ad16c626c2d4'::uuid,'Benjamin»Benjamin@Neh.3.23','Benjamín','Benjamin_Neh.3.23','Q460763','wikidata-lastrevid:2532913440',1.0,3),
 ('07c515be-b229-4014-b30f-f9cb5a342b36'::uuid,'Benjamin»Benjamin@Neh.12.34','Benjamín','Benjamin_Neh.12.34','Q460763','wikidata-lastrevid:2532913440',1.0,3),
 ('2c3c0dcd-6129-4ab1-9fa8-eb6ba7729fcf'::uuid,'Boaz»Boaz@1Ki.7.21-2Ch','Boaz','Boaz_1Ki.7.21','Q212253','wikidata-lastrevid:2530668565',1.0,3),
 ('32dc9c9a-652b-45e1-bc7b-7bc1b8a1a4e8'::uuid,'Bera»Bera@Gen.14.2','Bera','Bera_Gen.14.2','Q4890957','wikidata-lastrevid:2530687126',1.0,3),
 ('38cfd14a-5afa-4c86-9fe2-4c1a0e413f6d'::uuid,'Cain»Cain@Gen.4.1-Jud','Caín','Cain_Gen.4.1','Q205365','wikidata-lastrevid:2532888908',1.0,3),
 ('8761ee9c-ddef-4850-afb4-cc99a6a854f7'::uuid,'Eldad»Eldad@Num.11.26-','Eldad','Eldad_Num.11.26','Q56473842','wikidata-lastrevid:2307661679',1.0,3),
 ('a8023cf3-93f5-4333-9724-d9e147d09a15'::uuid,'Elah»Elah@Gen.36.41-1Ch','Ela','Elah_Gen.36.41','Q319020','wikidata-lastrevid:2530694512',1.0,2),
 ('0417f813-fbf8-4596-a45a-1ba449d4880d'::uuid,'Elah»Elah@1Ki.16.6-','Ela','Elah_1Ki.16.6','Q319020','wikidata-lastrevid:2530694512',1.0,3),
 ('797b7de0-a7fc-4d59-a653-4e01a81db8c1'::uuid,'Elah»Elah@2Ki.15.30-','Ela','Elah_2Ki.15.30','Q319020','wikidata-lastrevid:2530694512',1.0,3),
 ('c99b02f4-8936-48c0-aa72-819b87f132b4'::uuid,'Elah»Elah@1Ch.4.15','Ela','Elah_1Ch.4.15','Q319020','wikidata-lastrevid:2530694512',1.0,3),
 ('0b6d54ac-82e3-4592-8b42-32ad638444d7'::uuid,'Elah»Elah@1Ch.9.8','Ela','Elah_1Ch.9.8','Q319020','wikidata-lastrevid:2530694512',1.0,3),
 ('a19f82ae-3c69-46ba-bb8d-e2cda00fd138'::uuid,'Eliada»Eliada@2Sa.5.16-1Ch','Eliada','Eliada_2Sa.5.16','Q9252681','wikidata-lastrevid:2530704024',1.0,3),
 ('38b12b55-169a-4617-943a-1478db859569'::uuid,'Eliada»Eliada@2Ch.17.17','Eliada','Eliada_2Ch.17.17','Q9252681','wikidata-lastrevid:2530704024',1.0,3),
 ('640f9af6-264a-474d-86e2-4c741f40a4a2'::uuid,'Elijah»Elijah@Ezr.10.21','Elías','Elijah_Ezr.10.21','Q133507','wikidata-lastrevid:2533011052',0.8,3),
 ('c7cc320d-ba1c-4ccd-8fd3-3be7e1ecbefa'::uuid,'David»David@Rut.4.17-Rev','David','David_Rut.4.17','Q41370','wikidata-lastrevid:2533006072',1.0,3),
 ('910a1012-5c05-45f8-85ec-8d880e206a9b'::uuid,'Dinah»Dinah@Gen.30.21-','Dina','Dinah_Gen.30.21','Q122035','wikidata-lastrevid:2530659747',1.0,3),
 ('d0bb3734-d612-4b7f-8cfc-491516cebe68'::uuid,'Delilah»Delilah@Jdg.16.4-','Dalila','Delilah_Jdg.16.4','Q937827','wikidata-lastrevid:2533006785',0.833333,3),
 ('f82edbca-bba3-49f3-8f47-5ff51cd88730'::uuid,'Dan»Dan@Gen.30.6-1Ch','Dan','Dan_Gen.30.6','Q550869','wikidata-lastrevid:2531451278',1.0,3),
 ('3ccf36d9-6259-4547-b7c1-463969919077'::uuid,'Daniel»Daniel@Ezk.14.14-Mrk','Daniel','Daniel_Ezk.14.14','Q171724','wikidata-lastrevid:2533005874',1.0,3),
 ('d2ef8470-05fa-4453-84e5-870566b2cc53'::uuid,'Daniel»Daniel@Ezr.8.2-Neh','Daniel','Daniel_Ezr.8.2','Q171724','wikidata-lastrevid:2533005874',1.0,3),
 ('6cba3913-d03d-4559-ab5b-2c60a5db2ce1'::uuid,'Daniel»Daniel@Ezk.14.14-Mrk','Daniel','Daniel_Ezk.14.14','Q171724','wikidata-lastrevid:2533005874',1.0,3),
 ('cf834ce9-5d33-4277-be09-332c252d6551'::uuid,'Eber»Eber@Neh.12.20','Eber','Eber_Neh.12.20','Q502282','wikidata-lastrevid:2530676655',1.0,3),
 ('cb908f8d-31a4-466a-b474-4db013568ff3'::uuid,'Eglah»Eglah@2Sa.3.5-1Ch','Egla','Eglah_2Sa.3.5','Q12630462','wikidata-lastrevid:2530661366',1.0,3),
 ('f939bc4d-cf65-4151-bd4f-d0924a02bd2c'::uuid,'Eglon»Eglon@Jdg.3.12-','Eglón','Eglon_Jdg.3.12','Q2662239','wikidata-lastrevid:2530683736',1.0,3),
 ('3e77e9f3-5ada-45de-9b08-d9c1720dc82e'::uuid,'Eli»Eli@1Sa.1.3-1Ki','Elí','Eli_1Sa.1.3','Q362021','wikidata-lastrevid:2530685268',1.0,2),
 ('2906727c-6ff4-4101-ab37-6e7ad21246f2'::uuid,'Gog»Gog@1Ch.5.4','Gog','Gog_1Ch.5.4','Q5882214','wikidata-lastrevid:2530677728',1.0,3),
 ('2c549599-404f-45b8-b254-8965d5e9f085'::uuid,'Gehazi»Gehazi@2Ki.4.12-','Giezi','Gehazi_2Ki.4.12','Q977435','wikidata-lastrevid:2530704477',0.727273,3),
 ('5b3e59a7-eda7-4a53-8c97-ab46bcbd5b05'::uuid,'Goliath»Goliath@1Sa.17.4-1Ch','Goliat','Goliath_1Sa.17.4','Q192785','wikidata-lastrevid:2533018238',1.0,2),
 ('47e49f84-fedc-4168-b44b-2210d54a0f4a'::uuid,'Eve»Eve@Gen.3.20-1Ti','Eva','Eve_Gen.3.20','Q830183','wikidata-lastrevid:2532887479',0.666667,3),
 ('d44ff3c5-2716-44d1-a380-8c697bdf3717'::uuid,'Ezekiel»Ezekiel@Ezk.1.3-','Ezequiel','Ezekiel_Ezk.1.3','Q194064','wikidata-lastrevid:2533012140',1.0,3),
 ('e18e2a4b-a4dd-4b9e-a955-1bdd69f4803c'::uuid,'Ezra»Ezra@Ezr.7.1-Neh','Esdras','Ezra_Ezr.7.1','Q191787','wikidata-lastrevid:2533012150',0.6,3),
 ('a81f8234-9178-4d61-a275-4eb44ace1dae'::uuid,'Ezra»Ezra@Neh.12.1-','Esdras','Ezra_Neh.12.1','Q191787','wikidata-lastrevid:2533012150',0.6,3),
 ('07220d47-fcbf-46a6-b405-c7d3d9ac2b58'::uuid,'Esau»Esau@Gen.25.25-Heb','Esaú','Esau_Gen.25.25','Q220822','wikidata-lastrevid:2533011685',1.0,3)
), eligible as (
 select
   e.id as lexical_entry_id,
   e.strong_number,
   e.source_gloss,
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
   'batch_id','fase_h_es_nombres_safe_v4_recovery_007_20260820',
   'source_chunks',jsonb_build_array('safe_v4_002','safe_v4_003','safe_v4_004','safe_v4_005'),
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