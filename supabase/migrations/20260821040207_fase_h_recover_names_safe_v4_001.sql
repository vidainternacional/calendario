-- FASE H / Bloque 3 — recuperación segura de nombres propios tras retirar anclajes RV1909 inseguros.
--
-- Este lote contiene únicamente 22 lexical_entry_id que quedaron sin glosa al retirar los dos
-- batches inseguros y que PASARON nuevamente el gate safe-v4 en auditoría read-only:
-- - entidad fuente exacta a ambos lados de »;
-- - etiqueta inglesa primaria de Wikidata exacta para la entidad;
-- - similitud conservadora >= 0.55;
-- - grafía española presente como frase completa en >= 2 fuentes españolas verificadas;
-- - ancla usada solo para confirmar grafía, nunca como significado/identidad por coocurrencia.
--
-- Insert-only + ON CONFLICT DO NOTHING. No toca el léxico fuente.
-- Reversión exacta:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nombres_safe_v4_recovery_001_20260820';

with map(
  lexical_entry_id, expected_source_gloss, display_gloss_es, tipnr_id,
  wikidata_id, wikidata_revision, name_similarity, spanish_anchor_sources
) as (values
 ('3eccef40-ae33-49f8-863a-b189320bf6bd'::uuid,'Abidan»Abidan@Num.1.11-','Abidán','Abidan_Num.1.11','Q3494535','wikidata-lastrevid:2530694881',1.000000,3),
 ('0f9b2d39-2e6e-4274-8dab-47660f816815'::uuid,'Abishai»Abishai@1Sa.26.6-1Ch','Abisai','Abishai_1Sa.26.6','Q1154317','wikidata-lastrevid:2530942436',1.000000,3),
 ('313adc90-b24d-4ad4-b458-b62bf7b1c27c'::uuid,'Abiathar»Abiathar@1Sa.22.20-Mrk','Abiatar','Abiathar_1Sa.22.20','Q321804','wikidata-lastrevid:2530684693',1.000000,2),
 ('cb6e43e6-2b7c-4415-98fb-11491efe58c4'::uuid,'Abner»Abner@1Sa.14.50-1Ch','Abner','Abner_1Sa.14.50','Q1133337','wikidata-lastrevid:2530654286',1.000000,3),
 ('ee3554be-da04-472b-9300-3541a6fd4683'::uuid,'Agag»Agag@Num.24.7','Agag','Agag_Num.24.7','Q390086','wikidata-lastrevid:2530695936',1.000000,2),
 ('ec7bafb9-3820-4056-898e-547410fd9e0e'::uuid,'Agag»Agag@1Sa.15.8-Est','Agag','Agag_1Sa.15.8','Q390086','wikidata-lastrevid:2530695936',1.000000,3),
 ('e04410fa-309c-4963-a246-785847c55759'::uuid,'Adonijah»Adonijah@2Sa.3.4-1Ch','Adonías','Adonijah_2Sa.3.4','Q360378','wikidata-lastrevid:2530695049',0.857143,3),
 ('4ead717a-5864-43d7-8767-5ace1bc11076'::uuid,'Adonijah»Adonijah@2Ch.17.8','Adonías','Adonijah_2Ch.17.8','Q360378','wikidata-lastrevid:2530695049',0.857143,2),
 ('61d30f25-1314-4566-8cd7-fdb525da1c49'::uuid,'Adonijah»Adonijah@Neh.10.16','Adonías','Adonijah_Neh.10.16','Q360378','wikidata-lastrevid:2530695049',0.857143,3),
 ('7e12b7d3-38f8-4040-9194-9f0f774a9a63'::uuid,'Adoni-zedek»Adoni-zedek@Jos.10.1-','Adonisedec','Adoni-zedek_Jos.10.1','Q2468894','wikidata-lastrevid:2530671423',0.900000,2),
 ('bf79a531-03df-474f-8b9b-59cccf592aa3'::uuid,'Aaron»Aaron@Exo.4.14-Heb','Aarón','Aaron_Exo.4.14','Q51676','wikidata-lastrevid:2530697539',1.000000,2),
 ('e002a4e9-9e6f-4037-9c9c-4aa26370b3f8'::uuid,'Ahinoam»Ahinoam@1Sa.14.50','Ahinoam','Ahinoam_1Sa.14.50','Q400266','wikidata-lastrevid:2530696067',1.000000,3),
 ('ef0ece8b-6188-49f2-b2b1-9113eaba3d4c'::uuid,'Ahinoam»Ahinoam@1Sa.25.43-1Ch','Ahinoam','Ahinoam_1Sa.25.43','Q400266','wikidata-lastrevid:2530696067',1.000000,3),
 ('ccb834ab-8fe5-4083-bcc7-0251fa3647b0'::uuid,'Almodad»Almodad@Gen.10.26-1Ch','Almodad','Almodad_Gen.10.26','Q2905798','wikidata-lastrevid:2530684172',1.000000,3),
 ('60ad6031-b322-42aa-bdd1-0b2754175837'::uuid,'Abel»Abel@Gen.4.2-Heb','Abel','Abel_Gen.4.2','Q313421','wikidata-lastrevid:2530684437',1.000000,3),
 ('373eab7e-010c-40ad-acdf-57f78aad435c'::uuid,'Abdon»Abdon@Jdg.12.13-','Abdón','Abdon_Jdg.12.13','Q308320','wikidata-lastrevid:2530694381',1.000000,3),
 ('11198c73-fa91-4a85-adcf-cc58304d2cf5'::uuid,'Abdon»Abdon@1Ch.8.30-','Abdón','Abdon_1Ch.8.30','Q308320','wikidata-lastrevid:2530694381',1.000000,3),
 ('a9b79524-43ea-4d84-af31-b78a5a7f0631'::uuid,'Adriel»Adriel@1Sa.18.19-2Sa','Adriel','Adriel_1Sa.18.19','Q2825091','wikidata-lastrevid:2530693861',1.000000,3),
 ('42e493aa-c8f8-4c41-98d8-071aee6384e9'::uuid,'Amminadab»Amminadab@1Ch.15.10-','Aminadab','Amminadab_1Ch.15.10','Q2038223','wikidata-lastrevid:2530693302',0.941176,3),
 ('827f0b90-3857-40fe-8d25-52bb56ecf56d'::uuid,'Amalek»Amalek@Gen.36.12-','Amalec','Amalek_Gen.36.12','Q372091','wikidata-lastrevid:2530695617',1.000000,3),
 ('266da6a9-a16a-4f2b-8f7e-c03a0cc23080'::uuid,'Amasa»Amasa@2Sa.17.25-1Ch','Amasa','Amasa_2Sa.17.25','Q2689456','wikidata-lastrevid:2530683760',1.000000,3),
 ('d879156d-2782-4e3f-87a7-90a2a582ef77'::uuid,'Amasa»Amasa@2Ch.28.12','Amasa','Amasa_2Ch.28.12','Q2689456','wikidata-lastrevid:2530683760',1.000000,3)
), eligible as (
 select e.id lexical_entry_id,e.strong_number,e.source_gloss,map.*
 from map
 join public.biblical_lexical_entries e
   on e.id=map.lexical_entry_id
  and e.source_gloss=map.expected_source_gloss
 left join public.biblical_hebrew_spanish_glosses g on g.lexical_entry_id=e.id
 where e.language='hebrew'
   and e.enabled
   and e.review_status='approved'
   and nullif(btrim(e.display_gloss_es),'') is null
   and g.lexical_entry_id is null
)
insert into public.biblical_hebrew_spanish_glosses
(lexical_entry_id,display_gloss_es,alternative_glosses_es,confidence,derivation_method,source_gloss_snapshot,status,provenance)
select
 lexical_entry_id,display_gloss_es,'{}'::text[],99,
 'tipnr_wikidata_safe_v4_recovery_v1',source_gloss,'verified_derived',
 jsonb_build_object(
   'phase','FASE_H_BLOQUE_3',
   'batch_id','fase_h_es_nombres_safe_v4_recovery_001_20260820',
   'recovery_after_removed_batches',jsonb_build_array(
     'fase_h_es_nombres_wikidata_rv1909_anchor_001_20260820',
     'fase_h_es_nombres_wikidata_alias_rv1909_anchor_002_20260820'
   ),
   'source_identity','STEPBible TIPNR',
   'source_identity_license','CC BY 4.0',
   'tipnr_id',tipnr_id,
   'wikidata_id',wikidata_id,
   'wikidata_uri','https://www.wikidata.org/entity/' || wikidata_id,
   'wikidata_license','CC0-1.0',
   'wikidata_revision',wikidata_revision,
   'spanish_anchor_sources',spanish_anchor_sources,
   'spanish_anchor_sources_minimum',2,
   'name_similarity',name_similarity,
   'name_similarity_minimum',0.55,
   'exact_source_entity',true,
   'exact_wikidata_primary_label',true,
   'anchor_used_for_name_spelling_only',true,
   'context_used_as_meaning',false,
   'rv1909_used_as_meaning',false,
   'strong_number',strong_number
 )
from eligible
on conflict (lexical_entry_id) do nothing;
