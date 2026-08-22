-- FASE H / Bloque 3 — recuperación segura de nombres propios, lote 005.
-- 21 entradas revalidadas con gate safe-v4. Insert-only, reversible por batch_id.
-- Reversión:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id'='fase_h_es_nombres_safe_v4_recovery_005_20260820';

with map(lexical_entry_id,expected_source_gloss,display_gloss_es,tipnr_id,wikidata_id,wikidata_revision,name_similarity,spanish_anchor_sources) as (values
 ('681f240a-6d42-47c4-a590-2d4e72dc20ab'::uuid,'Moab»Moab@Gen.19.37b-Zep','Moab','Moab_Gen.19.37','Q1585141','wikidata-lastrevid:2530690713',1.0,3),
 ('57b9afe5-d48b-4e67-bb89-0667197624fd'::uuid,'Moab»Moab@Gen.19.37a','Moab','Moab_Gen.19.37','Q1585141','wikidata-lastrevid:2530690713',1.0,3),
 ('f3791dfb-eb37-493d-acab-1718d5231be5'::uuid,'Moab»Moab@Gen.19.37b-Zep','Moab','Moab_Gen.19.37','Q1585141','wikidata-lastrevid:2530690713',1.0,3),
 ('7b0578a6-9711-4d94-a6fd-f5b11c03259f'::uuid,'Medad»Medad@Num.11.26-','Medad','Medad_Num.11.26','Q56473843','wikidata-lastrevid:2307662392',1.0,3),
 ('627f4a14-efaf-4498-babb-5f6d601bc00a'::uuid,'Micah»Micah@Jer.26.18-Mic','Miqueas','Micah_Jer.26.18','Q2804969','wikidata-lastrevid:2533411241',0.8,3),
 ('8d60e53c-7c19-4092-a9b5-7aaccfccbec3'::uuid,'Mesha»Mesha@2Ki.3.4','Mesa (Rey de Moab)','Mesha_2Ki.3.4','Q350258','wikidata-lastrevid:2418142447',1.0,3),
 ('08899156-ef70-421c-9d97-9921650fefdf'::uuid,'Manoah»Manoah@Jdg.13.2-','Manoa','Manoah_Jdg.13.2','Q221514','wikidata-lastrevid:2530669769',1.0,3),
 ('ddad5f48-b9a8-4443-8f89-0f4d0af5e079'::uuid,'Moses»Moses@Exo.2.10-Rev','Moisés','Moses_Exo.2.10','Q9077','wikidata-lastrevid:2533416105',0.909091,3),
 ('521796dd-54a3-4a84-b5f3-6b36678f3c9a'::uuid,'Moses»Moses@Exo.2.10-Rev','Moisés','Moses_Exo.2.10','Q9077','wikidata-lastrevid:2533416105',0.909091,3),
 ('2c26bee2-0460-458b-ac3f-0b9f422ca04b'::uuid,'Miriam»Miriam@Exo.15.20-Mic','Miriam','Miriam_Exo.15.20','Q1938388','wikidata-lastrevid:2530692843',1.0,2),
 ('50c0acab-b6bd-4732-8e77-188cb967cebd'::uuid,'Merari»Merari@Gen.46.11-Ezr','Merari','Merari_Gen.46.11','Q2670550','wikidata-lastrevid:2530672709',1.0,3),
 ('9028c6a6-5dab-4185-9cab-76600734c46b'::uuid,'Merari»Merari@Gen.46.11-Ezr','Merari','Merari_Gen.46.11','Q2670550','wikidata-lastrevid:2530672709',1.0,3),
 ('4f17ec7a-eea1-4d14-a492-13a665f8a80d'::uuid,'Nabal»Nabal@1Sa.25.3-2Sa','Nabal','Nabal_1Sa.25.3','Q1709507','wikidata-lastrevid:2530681608',1.0,3),
 ('e5ff8d55-978e-4682-8991-af0f5463a53e'::uuid,'Nadab»Nadab@Exo.6.23-1Ch','Nadab','Nadab_Exo.6.23','Q1941782','wikidata-lastrevid:2530682969',1.0,3),
 ('e67a7eea-0f9d-4847-939c-487eafa36070'::uuid,'Nadab»Nadab@1Ki.14.20-','Nadab','Nadab_1Ki.14.20','Q1941782','wikidata-lastrevid:2530682969',1.0,3),
 ('4829054f-616c-4d57-a731-be6085f0bcb7'::uuid,'Nadab»Nadab@1Ch.2.28-','Nadab','Nadab_1Ch.2.28','Q1941782','wikidata-lastrevid:2530682969',1.0,3),
 ('0e41baa9-8f34-4c8e-b07e-93615576bc6f'::uuid,'Nadab»Nadab@1Ch.8.30-','Nadab','Nadab_1Ch.8.30','Q1941782','wikidata-lastrevid:2530682969',1.0,3),
 ('e32a96e8-eb53-4a7a-9e5b-3911f88c1023'::uuid,'Nehemiah»Nehemiah@Ezr.2.2-Neh','Nehemías','Nehemiah_Ezr.2.2','Q1025598','wikidata-lastrevid:2530257601',0.933333,3),
 ('9c0adb0d-79c3-43d0-8b44-ea8ac4338623'::uuid,'Nehemiah»Nehemiah@Neh.1.1-','Nehemías','Nehemiah_Neh.1.1','Q1025598','wikidata-lastrevid:2530257601',0.933333,3),
 ('af8d8e6e-1984-4e46-bd09-2ebf612e3ef7'::uuid,'Nehemiah»Nehemiah@Neh.3.16','Nehemías','Nehemiah_Neh.3.16','Q1025598','wikidata-lastrevid:2530257601',0.933333,3),
 ('0fa292be-1e3f-4ee2-860a-cc4caea96f83'::uuid,'Naomi»Naomi@Rut.1.2-','Noemí','Naomi_Rut.1.2','Q2596433','wikidata-lastrevid:2533421395',0.8,2)
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
 jsonb_build_object('phase','FASE_H_BLOQUE_3','batch_id','fase_h_es_nombres_safe_v4_recovery_005_20260820',
 'recovery_after_removed_batches',jsonb_build_array('fase_h_es_nombres_wikidata_rv1909_anchor_001_20260820','fase_h_es_nombres_wikidata_alias_rv1909_anchor_002_20260820'),
 'source_identity','STEPBible TIPNR','source_identity_license','CC BY 4.0','tipnr_id',tipnr_id,'wikidata_id',wikidata_id,
 'wikidata_uri','https://www.wikidata.org/entity/'||wikidata_id,'wikidata_license','CC0-1.0','wikidata_revision',wikidata_revision,
 'spanish_anchor_sources',spanish_anchor_sources,'spanish_anchor_sources_minimum',2,'name_similarity',name_similarity,'name_similarity_minimum',0.55,
 'exact_source_entity',true,'exact_wikidata_primary_label',true,'anchor_used_for_name_spelling_only',true,
 'context_used_as_meaning',false,'rv1909_used_as_meaning',false,'strong_number',strong_number)
from eligible on conflict (lexical_entry_id) do nothing;
