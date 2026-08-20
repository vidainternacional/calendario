-- — FASE H / Bloque 3 — nombres propios TIPNR + Wikidata + gate bíblico español.
-- Chunk 011; candidatos=40.
-- Gate estructural auditado; aplicación insert-only reversible.
-- La referencia ancla se usa SOLO para confirmar la grafía española, no como significado.
-- Gate: source_gloss debe representar exactamente la misma entidad a ambos lados de ».
-- Gate: la etiqueta española debe aparecer como frase completa en >= 2 fuentes españolas verificadas.
-- Política futura: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta si se activa:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nombres_wikidata_anchor2_011_20260820';

with map(tipnr_id, anchor_ref, wikidata_id, english_label, display_gloss_es, source_uri, source_revision) as (
 values
  ('Peter_Mat.4.18','Mat.4.18','Q33923','Saint Peter','Pedro','https://www.wikidata.org/entity/Q33923','wikidata-lastrevid:2533598212'),
  ('Phanuel_Luk.2.36','Luk.2.36','Q7180641','Phanuel','Phanuel','https://www.wikidata.org/entity/Q7180641','wikidata-lastrevid:2530679203'),
  ('Pharaoh_1Ch.4.18','1Ch.4.18','Q659203','Pharaohs in the Bible','Faraones en la Biblia','https://www.wikidata.org/entity/Q659203','wikidata-lastrevid:2530699844'),
  ('Pharaoh_1Ki.3.1','1Ki.3.1','Q659203','Pharaohs in the Bible','Faraones en la Biblia','https://www.wikidata.org/entity/Q659203','wikidata-lastrevid:2530699844'),
  ('Pharaoh_2Ki.18.21','2Ki.18.21','Q659203','Pharaohs in the Bible','Faraones en la Biblia','https://www.wikidata.org/entity/Q659203','wikidata-lastrevid:2530699844'),
  ('Pharaoh_Exo.1.11','Exo.1.11','Q659203','Pharaohs in the Bible','Faraones en la Biblia','https://www.wikidata.org/entity/Q659203','wikidata-lastrevid:2530699844'),
  ('Pharaoh_Exo.3.10','Exo.3.10','Q659203','Pharaohs in the Bible','Faraones en la Biblia','https://www.wikidata.org/entity/Q659203','wikidata-lastrevid:2530699844'),
  ('Pharaoh_Gen.12.15','Gen.12.15','Q659203','Pharaohs in the Bible','Faraones en la Biblia','https://www.wikidata.org/entity/Q659203','wikidata-lastrevid:2530699844'),
  ('Pharaoh_Gen.37.36','Gen.37.36','Q659203','Pharaohs in the Bible','Faraones en la Biblia','https://www.wikidata.org/entity/Q659203','wikidata-lastrevid:2530699844'),
  ('Pharaoh_Jer.25.19','Jer.25.19','Q659203','Pharaohs in the Bible','Faraones en la Biblia','https://www.wikidata.org/entity/Q659203','wikidata-lastrevid:2530699844'),
  ('Potiphar_Gen.37.36','Gen.37.36','Q1148687','Potiphar','Putifar','https://www.wikidata.org/entity/Q1148687','wikidata-lastrevid:2530655374'),
  ('Puah_Exo.1.15','Exo.1.15','Q21959799','Puah','Puá','https://www.wikidata.org/entity/Q21959799','wikidata-lastrevid:2530669684'),
  ('Puah_Gen.46.13','Gen.46.13','Q21959799','Puah','Puá','https://www.wikidata.org/entity/Q21959799','wikidata-lastrevid:2530669684'),
  ('Puah_Jdg.10.1','Jdg.10.1','Q21959799','Puah','Puá','https://www.wikidata.org/entity/Q21959799','wikidata-lastrevid:2530669684'),
  ('Rachel_Gen.29.6','Gen.29.6','Q207389','Rachel','Raquel','https://www.wikidata.org/entity/Q207389','wikidata-lastrevid:2533437230'),
  ('Rahab_Job.9.13','Job.9.13','Q1135632','Rahab','Raab','https://www.wikidata.org/entity/Q1135632','wikidata-lastrevid:2531661787'),
  ('Rahab_Jos.2.1','Jos.2.1','Q1135632','Rahab','Raab','https://www.wikidata.org/entity/Q1135632','wikidata-lastrevid:2531661787'),
  ('Ram_1Ch.2.25','1Ch.2.25','Q1824842','Ram','Aram','https://www.wikidata.org/entity/Q1824842','wikidata-lastrevid:2530682311'),
  ('Ram_Job.32.2','Job.32.2','Q1824842','Ram','Aram','https://www.wikidata.org/entity/Q1824842','wikidata-lastrevid:2530682311'),
  ('Ram_Rut.4.19','Rut.4.19','Q1824842','Ram','Aram','https://www.wikidata.org/entity/Q1824842','wikidata-lastrevid:2530682311'),
  ('Rehoboam_1Ki.11.43','1Ki.11.43','Q211663','Rehoboam','Roboam','https://www.wikidata.org/entity/Q211663','wikidata-lastrevid:2530668481'),
  ('Reu_Gen.11.18','Gen.11.18','Q2040793','Reu','Reu','https://www.wikidata.org/entity/Q2040793','wikidata-lastrevid:2530693350'),
  ('Reuben_Gen.29.32','Gen.29.32','Q625661','Reuben','Rubén','https://www.wikidata.org/entity/Q625661','wikidata-lastrevid:2533438425'),
  ('Rezin_2Ki.15.37','2Ki.15.37','Q878947','Rezin','Rezin','https://www.wikidata.org/entity/Q878947','wikidata-lastrevid:2530701749'),
  ('Rezin_Ezr.2.48','Ezr.2.48','Q878947','Rezin','Rezin','https://www.wikidata.org/entity/Q878947','wikidata-lastrevid:2530701749'),
  ('Riphath_Gen.10.3','Gen.10.3','Q2918052','Riphath','Riphath','https://www.wikidata.org/entity/Q2918052','wikidata-lastrevid:2530694102'),
  ('Rizpah_2Sa.3.7','2Sa.3.7','Q2899077','Rizpah','Rizpah','https://www.wikidata.org/entity/Q2899077','wikidata-lastrevid:2531728019'),
  ('Ruth_Rut.1.4','Rut.1.4','Q1774982','Ruth','Rut','https://www.wikidata.org/entity/Q1774982','wikidata-lastrevid:2533445042'),
  ('Salma_1Ch.2.51','1Ch.2.51','Q1771358','Salmon','Salmón','https://www.wikidata.org/entity/Q1771358','wikidata-lastrevid:2530681990'),
  ('Samson_Jdg.13.24','Jdg.13.24','Q214648','Samson','Sansón','https://www.wikidata.org/entity/Q214648','wikidata-lastrevid:2533445894'),
  ('Samuel_1Sa.1.20','1Sa.1.20','Q6577515','Samuel','Samuel','https://www.wikidata.org/entity/Q6577515','wikidata-lastrevid:2533445915'),
  ('Sapphira_Act.5.1','Act.5.1','Q37946284','Sapphira','Safira','https://www.wikidata.org/entity/Q37946284','wikidata-lastrevid:2530674984'),
  ('Saul_1Sa.9.2','1Sa.9.2','Q28730','Saul','Saúl','https://www.wikidata.org/entity/Q28730','wikidata-lastrevid:2533446621'),
  ('Seba_Gen.10.7','Gen.10.7','Q23639444','Seba','Seba','https://www.wikidata.org/entity/Q23639444','wikidata-lastrevid:2530670896'),
  ('Selah_Psa.3.2','Psa.3.2','Q1827950','Salah','Sala','https://www.wikidata.org/entity/Q1827950','wikidata-lastrevid:2530692427'),
  ('Serug_Gen.11.20','Gen.11.20','Q1161313','Serug','Serug','https://www.wikidata.org/entity/Q1161313','wikidata-lastrevid:2530657733'),
  ('Seth_Gen.4.25','Gen.4.25','Q107626','Seth','Set','https://www.wikidata.org/entity/Q107626','wikidata-lastrevid:2532887572'),
  ('Shamgar_Jdg.3.31','Jdg.3.31','Q1516550','Shamgar','Samgar','https://www.wikidata.org/entity/Q1516550','wikidata-lastrevid:2530679873'),
  ('Shaphan_2Ki.22.3','2Ki.22.3','Q2904866','Shaphan','Shaphan','https://www.wikidata.org/entity/Q2904866','wikidata-lastrevid:2530694065'),
  ('Shaphan_Ezk.8.11','Ezk.8.11','Q2904866','Shaphan','Shaphan','https://www.wikidata.org/entity/Q2904866','wikidata-lastrevid:2530694065')
), evidence as (
 select
   map.*,
   count(distinct v.source_id) as spanish_anchor_sources
 from map
 join public.biblical_verse_texts v
   on v.book_code = upper(split_part(map.anchor_ref,'.',1))
  and v.chapter = split_part(map.anchor_ref,'.',2)::int
  and v.verse = split_part(map.anchor_ref,'.',3)::int
 join public.biblical_sources s
   on s.id = v.source_id
  and s.language = 'spa'
  and s.license_status = 'verified'
  and s.enabled = true
 where position(
   ' ' || btrim(regexp_replace(lower(map.display_gloss_es),'[^[:alpha:]]+',' ','g')) || ' '
   in
   ' ' || btrim(regexp_replace(lower(v.original_text),'[^[:alpha:]]+',' ','g')) || ' '
 ) > 0
 group by map.tipnr_id,map.anchor_ref,map.wikidata_id,map.english_label,map.display_gloss_es,map.source_uri,map.source_revision
), eligible as (
 select
   e.id as lexical_entry_id,
   e.strong_number,
   e.source_gloss,
   evidence.*
 from public.biblical_lexical_entries e
 join evidence on evidence.tipnr_id =
   btrim(split_part(split_part(e.source_gloss,'»',2),'@',1)) || '_' ||
   substring(split_part(e.source_gloss,'@',2) from '[123]?[A-Za-z]{2,3}[.][0-9]+[.][0-9]+')
 left join public.biblical_hebrew_spanish_glosses g on g.lexical_entry_id = e.id
 where e.language = 'hebrew'
   and e.review_status = 'approved'
   and e.enabled = true
   and e.display_gloss_es is null
   and g.lexical_entry_id is null
   and lower(regexp_replace(btrim(split_part(e.source_gloss,'»',1)), '[^[:alnum:]]+', '', 'g')) =
       lower(regexp_replace(btrim(split_part(split_part(e.source_gloss,'»',2),'@',1)), '[^[:alnum:]]+', '', 'g'))
   and evidence.spanish_anchor_sources >= 2
)
insert into public.biblical_hebrew_spanish_glosses (
 lexical_entry_id, display_gloss_es, alternative_glosses_es, confidence,
 derivation_method, source_gloss_snapshot, status, provenance
)
select
 lexical_entry_id,
 display_gloss_es,
 '{}'::text[],
 99,
 'tipnr_wikidata_spanish_anchor_2source_exact_entity_v2',
 source_gloss,
 'verified_derived',
 jsonb_build_object(
   'phase','FASE_H_BLOQUE_3',
   'batch_id','fase_h_es_nombres_wikidata_anchor2_011_20260820',
   'source_identity','STEPBible TIPNR',
   'source_identity_license','CC BY 4.0',
   'wikidata_id',wikidata_id,
   'wikidata_uri',source_uri,
   'wikidata_license','CC0-1.0',
   'wikidata_revision',source_revision,
   'english_identity_label',english_label,
   'anchor_reference',anchor_ref,
   'spanish_anchor_sources',spanish_anchor_sources,
   'spanish_anchor_sources_minimum',2,
   'exact_source_entity',true,
   'anchor_used_for_name_spelling_only',true,
   'context_used_as_meaning',false,
   'rv1909_used_as_meaning',false,
   'strong_number',strong_number
 )
from eligible
on conflict (lexical_entry_id) do nothing;
