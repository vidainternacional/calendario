-- FASE H / Bloque 3 — recuperación segura de nombres propios, lote 003.
-- 16 entradas revalidadas con gate safe-v4. Insert-only, reversible por batch_id.
-- Reversión:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id'='fase_h_es_nombres_safe_v4_recovery_003_20260820';

with map(lexical_entry_id,expected_source_gloss,display_gloss_es,tipnr_id,wikidata_id,wikidata_revision,name_similarity,spanish_anchor_sources) as (values
 ('ef93c1f3-e764-4718-a200-17496b6ecfc3'::uuid,'Job»Job@Job.1.1-Jas','Job','Job_Job.1.1','Q179962','wikidata-lastrevid:2533327847',1.0,3),
 ('35bcc0e0-8bfe-4de1-a967-09cd2d22072b'::uuid,'Jezebel»Jezebel@1Ki.16.31-Rev','Jezabel','Jezebel_1Ki.16.31','Q721295','wikidata-lastrevid:2533327284',0.857143,3),
 ('8ddc5b05-dbbb-4b85-8905-b8289cb961c1'::uuid,'Joab»Joab@1Sa.26.6-Psa','Joab','Joab_1Sa.26.6','Q1141064','wikidata-lastrevid:2530654801',1.0,3),
 ('104d9ad6-1c3f-4dad-8c9b-3f8267f585af'::uuid,'Joab»Joab@1Ch.4.14','Joab','Joab_1Ch.4.14','Q1141064','wikidata-lastrevid:2530654801',1.0,3),
 ('6a26ba0d-6dae-4862-bf8f-2ad775a5b3f6'::uuid,'Joab»Joab@Ezr.2.6-Neh','Joab','Joab_Ezr.2.6','Q1141064','wikidata-lastrevid:2530654801',1.0,3),
 ('30f8677a-d359-4270-aa90-692edb8b620b'::uuid,'Joab»Joab@Ezr.8.9','Joab','Joab_Ezr.8.9','Q1141064','wikidata-lastrevid:2530654801',1.0,3),
 ('8b1f8376-88af-4d5c-9ebb-1b574c2630b5'::uuid,'Jared»Jared@Gen.5.15-Luk','Jared','Jared_Gen.5.15','Q927410','wikidata-lastrevid:2530702130',1.0,3),
 ('22a23024-87a3-4c48-ac2d-b3fca4fcbe37'::uuid,'Jeremiah»Jeremiah@2Ki.23.31-Jer','Jeremías','Jeremiah_2Ki.23.31','Q158825','wikidata-lastrevid:2533326960',0.933333,3),
 ('3768862f-93c1-4f9c-b740-00b242280379'::uuid,'Jeremiah»Jeremiah@1Ch.5.24','Jeremías','Jeremiah_1Ch.5.24','Q158825','wikidata-lastrevid:2533326960',0.933333,3),
 ('a912f47d-6efc-4096-b6fb-ee05b6939e22'::uuid,'Jeremiah»Jeremiah@1Ch.12.4','Jeremías','Jeremiah_1Ch.12.4','Q158825','wikidata-lastrevid:2533326960',0.933333,3),
 ('229d06ee-3107-4773-b321-8987c8cc527a'::uuid,'Jeremiah»Jeremiah@1Ch.12.10','Jeremías','Jeremiah_1Ch.12.10','Q158825','wikidata-lastrevid:2533326960',0.933333,3),
 ('078dedbc-6f78-4d0f-b924-580c2fe295aa'::uuid,'Jeremiah»Jeremiah@1Ch.12.13','Jeremías','Jeremiah_1Ch.12.13','Q158825','wikidata-lastrevid:2533326960',0.933333,3),
 ('fc9f6e98-030e-46ea-993d-bf539cf08d52'::uuid,'Jeremiah»Jeremiah@2Ch.35.25-Mat','Jeremías','Jeremiah_2Ch.35.25','Q158825','wikidata-lastrevid:2533326960',0.933333,3),
 ('fc161c53-0316-4268-9a9b-27a06ecf3e71'::uuid,'Jeremiah»Jeremiah@Neh.10.2-','Jeremías','Jeremiah_Neh.10.2','Q158825','wikidata-lastrevid:2533326960',0.933333,3),
 ('a4571eae-c2d0-4a67-887f-35a753e97f23'::uuid,'Jeremiah»Jeremiah@Jer.35.3','Jeremías','Jeremiah_Jer.35.3','Q158825','wikidata-lastrevid:2533326960',0.933333,3),
 ('fc161c53-0316-4268-9a9b-27a06ecf3e71'::uuid,'Jeremiah»Jeremiah@Neh.10.2-','Jeremías','Jeremiah_Neh.10.2','Q158825','wikidata-lastrevid:2533326960',0.933333,3)
), dedup as (
 select distinct on (lexical_entry_id) * from map order by lexical_entry_id
), eligible as (
 select e.id lexical_entry_id,e.strong_number,e.source_gloss,dedup.*
 from dedup join public.biblical_lexical_entries e on e.id=dedup.lexical_entry_id and e.source_gloss=dedup.expected_source_gloss
 left join public.biblical_hebrew_spanish_glosses g on g.lexical_entry_id=e.id
 where e.language='hebrew' and e.enabled and e.review_status='approved'
   and nullif(btrim(e.display_gloss_es),'') is null and g.lexical_entry_id is null
)
insert into public.biblical_hebrew_spanish_glosses
(lexical_entry_id,display_gloss_es,alternative_glosses_es,confidence,derivation_method,source_gloss_snapshot,status,provenance)
select lexical_entry_id,display_gloss_es,'{}'::text[],99,'tipnr_wikidata_safe_v4_recovery_v1',source_gloss,'verified_derived',
 jsonb_build_object('phase','FASE_H_BLOQUE_3','batch_id','fase_h_es_nombres_safe_v4_recovery_003_20260820',
 'recovery_after_removed_batches',jsonb_build_array('fase_h_es_nombres_wikidata_rv1909_anchor_001_20260820','fase_h_es_nombres_wikidata_alias_rv1909_anchor_002_20260820'),
 'source_identity','STEPBible TIPNR','source_identity_license','CC BY 4.0','tipnr_id',tipnr_id,'wikidata_id',wikidata_id,
 'wikidata_uri','https://www.wikidata.org/entity/'||wikidata_id,'wikidata_license','CC0-1.0','wikidata_revision',wikidata_revision,
 'spanish_anchor_sources',spanish_anchor_sources,'spanish_anchor_sources_minimum',2,'name_similarity',name_similarity,'name_similarity_minimum',0.55,
 'exact_source_entity',true,'exact_wikidata_primary_label',true,'anchor_used_for_name_spelling_only',true,
 'context_used_as_meaning',false,'rv1909_used_as_meaning',false,'strong_number',strong_number)
from eligible on conflict (lexical_entry_id) do nothing;
