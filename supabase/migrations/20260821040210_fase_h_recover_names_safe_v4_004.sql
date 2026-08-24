-- FASE H / Bloque 3 — recuperación segura de nombres propios, lote 004.
-- 19 entradas revalidadas con gate safe-v4. Insert-only, reversible por batch_id.
-- Reversión:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id'='fase_h_es_nombres_safe_v4_recovery_004_20260820';

with map(lexical_entry_id,expected_source_gloss,display_gloss_es,tipnr_id,wikidata_id,wikidata_revision,name_similarity,spanish_anchor_sources) as (values
 ('8cf6e7cd-690e-4d2e-9800-f7cd80129ef9'::uuid,'Judah»Judah@Gen.29.35-Rev','Judá','Judah_Gen.29.35','Q282220','wikidata-lastrevid:2533331588',1.0,3),
 ('a6ddaccf-10fa-4e58-acc5-75c23a46f269'::uuid,'Judah»Judah@Ezr.10.23','Judá','Judah_Ezr.10.23','Q282220','wikidata-lastrevid:2533331588',1.0,2),
 ('20857884-6522-4b38-8ea1-7a4361686752'::uuid,'Judah»Judah@Neh.12.8-','Judá','Judah_Neh.12.8','Q282220','wikidata-lastrevid:2533331588',1.0,3),
 ('90dc66f7-8a00-437e-8e61-7292d248bcdc'::uuid,'Judah»Judah@Neh.12.36','Judá','Judah_Neh.12.36','Q282220','wikidata-lastrevid:2533331588',1.0,2),
 ('566c19e5-c6e2-4059-b9a7-1cb3ec95b43f'::uuid,'Judah»Judah@Neh.12.8-','Judá','Judah_Neh.12.8','Q282220','wikidata-lastrevid:2533331588',1.0,3),
 ('2a0652b6-a89c-4f28-88be-9f56b114c1b0'::uuid,'Judah»Judah@Gen.29.35-Rev','Judá','Judah_Gen.29.35','Q282220','wikidata-lastrevid:2533331588',1.0,3),
 ('454a3964-59de-4c59-b05c-13cb08d94924'::uuid,'Joshua»Joshua@Exo.17.9-Heb','Josué','Joshua_Exo.17.9','Q7734','wikidata-lastrevid:2533331185',0.8,3),
 ('ed984bfa-8bf3-472e-b7e8-f11ed4a0de4e'::uuid,'Joshua»Joshua@1Sa.6.14-','Josué','Joshua_1Sa.6.14','Q7734','wikidata-lastrevid:2533331185',0.8,3),
 ('5541a58b-b19a-4c1e-8c33-75e70610d0ab'::uuid,'Joshua»Joshua@2Ki.23.8','Josué','Joshua_2Ki.23.8','Q7734','wikidata-lastrevid:2533331185',0.8,3),
 ('6b15f3e3-1257-4194-8274-8403182b4308'::uuid,'Jubal»Jubal@Gen.4.21','Jubal','Jubal_Gen.4.21','Q1432204','wikidata-lastrevid:2530667974',1.0,3),
 ('f660ca90-ece0-4955-aa38-6be563ab7cc6'::uuid,'Jonah»Jonah@2Ki.14.25-Luk','Jonás','Jonah_2Ki.14.25','Q2468262','wikidata-lastrevid:2533329593',0.888889,3),
 ('7ef53779-8587-4e0a-a3ff-4eb77fa2f02e'::uuid,'Leah»Leah@Gen.29.16-Rut','Lea','Leah_Gen.29.16','Q128847','wikidata-lastrevid:2530663742',1.0,3),
 ('0923c242-a2da-495f-b3b8-feb3fe411c1f'::uuid,'Laban»Laban@Gen.24.29-','Labán','Laban_Gen.24.29','Q840401','wikidata-lastrevid:2533271291',1.0,3),
 ('48fd8603-55a4-4ef0-8fcd-0020275d31a3'::uuid,'Lot»Lot@Gen.11.27-2Pe','Lot','Lot_Gen.11.27','Q40574','wikidata-lastrevid:2532895744',1.0,3),
 ('a845f249-26f8-4879-b241-f77f6edcc92b'::uuid,'Levi»Levi@Gen.29.34-Rev','Leví','Levi_Gen.29.34','Q215512','wikidata-lastrevid:2532028935',1.0,3),
 ('b5d5b7c1-d96a-495a-b342-ae2b7fdce1f2'::uuid,'Levi»Levi@Gen.29.34-Rev','Leví','Levi_Gen.29.34','Q215512','wikidata-lastrevid:2532028935',1.0,3),
 ('dc9b28fc-9acc-42a2-bac7-ede934decba3'::uuid,'Magog»Magog@Gen.10.2-1Ch','Magog','Magog_Gen.10.2','Q1964706','wikidata-lastrevid:2530683049',1.0,3),
 ('09696cac-936c-4d0a-905e-bc0387b05aad'::uuid,'Keturah»Keturah@Gen.25.1-1Ch','Cetura','Keturah_Gen.25.1','Q908531','wikidata-lastrevid:2530703837',1.0,3),
 ('4abc2afb-b29c-4617-ad97-4c7502a9c204'::uuid,'Korah»Korah@1Ch.2.43','Coré','Korah_1Ch.2.43','Q1337316','wikidata-lastrevid:2530664938',0.75,2)
), eligible as (
 select e.id lexical_entry_id,e.strong_number,e.source_gloss,map.*
 from map join public.biblical_lexical_entries e on e.id=map.lexical_entry_id and e.source_gloss=map.expected_source_gloss
 left join public.biblical_hebrew_spanish_glosses g on g.lexical_entry_id=e.id
 where e.language='hebrew' and e.enabled and e.review_status='approved'
   and nullif(btrim(e.display_gloss_es),'') is null and g.lexical_entry_id is null
)
insert into public.biblical_hebrew_spanish_glosses
(lexical_entry_id,display_gloss_es,alternative_glosses_es,confidence,derivation_method,source_gloss_snapshot,status,provenance)
select lexical_entry_id,display_gloss_es,'{}'::text[],99,'tipnr_wikidata_safe_v4_recovery_v1',source_gloss,'verified_derived',
 jsonb_build_object('phase','FASE_H_BLOQUE_3','batch_id','fase_h_es_nombres_safe_v4_recovery_004_20260820',
 'recovery_after_removed_batches',jsonb_build_array('fase_h_es_nombres_wikidata_rv1909_anchor_001_20260820','fase_h_es_nombres_wikidata_alias_rv1909_anchor_002_20260820'),
 'source_identity','STEPBible TIPNR','source_identity_license','CC BY 4.0','tipnr_id',tipnr_id,'wikidata_id',wikidata_id,
 'wikidata_uri','https://www.wikidata.org/entity/'||wikidata_id,'wikidata_license','CC0-1.0','wikidata_revision',wikidata_revision,
 'spanish_anchor_sources',spanish_anchor_sources,'spanish_anchor_sources_minimum',2,'name_similarity',name_similarity,'name_similarity_minimum',0.55,
 'exact_source_entity',true,'exact_wikidata_primary_label',true,'anchor_used_for_name_spelling_only',true,
 'context_used_as_meaning',false,'rv1909_used_as_meaning',false,'strong_number',strong_number)
from eligible on conflict (lexical_entry_id) do nothing;
