-- — FASE H / Bloque 3 — nombres propios TIPNR + Wikidata + gate bíblico español.
-- Chunk 003; candidatos=40.
-- Gate estructural auditado; aplicación insert-only reversible.
-- La referencia ancla se usa SOLO para confirmar la grafía española, no como significado.
-- Gate: source_gloss debe representar exactamente la misma entidad a ambos lados de ».
-- Gate: la etiqueta inglesa primaria de Wikidata debe coincidir exactamente con esa entidad.
-- Gate: la etiqueta española debe aparecer como frase completa en >= 2 fuentes españolas verificadas.
-- Política futura: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta si se activa:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nombres_wikidata_anchor2_003_20260820';

with map(tipnr_id, anchor_ref, wikidata_id, english_label, display_gloss_es, source_uri, source_revision) as (
 values
  ('Azariah_Dan.1.6','Dan.1.6','Q313216','Uzziah','Uzías','https://www.wikidata.org/entity/Q313216','wikidata-lastrevid:2530684424'),
  ('Azariah_Neh.3.23','Neh.3.23','Q313216','Uzziah','Uzías','https://www.wikidata.org/entity/Q313216','wikidata-lastrevid:2530684424'),
  ('Azariah_Neh.7.7','Neh.7.7','Q313216','Uzziah','Uzías','https://www.wikidata.org/entity/Q313216','wikidata-lastrevid:2530684424'),
  ('Azariah_Neh.8.7','Neh.8.7','Q313216','Uzziah','Uzías','https://www.wikidata.org/entity/Q313216','wikidata-lastrevid:2530684424'),
  ('Azor_Mat.1.13','Mat.1.13','Q11907447','Azor','Azor','https://www.wikidata.org/entity/Q11907447','wikidata-lastrevid:2530658694'),
  ('Baasha_1Ki.15.16','1Ki.15.16','Q313224','Baasha','Basá','https://www.wikidata.org/entity/Q313224','wikidata-lastrevid:2530517540'),
  ('Balaam_Num.22.5','Num.22.5','Q574641','Balaam','Balaam','https://www.wikidata.org/entity/Q574641','wikidata-lastrevid:2530698351'),
  ('Barabbas_Mat.27.16','Mat.27.16','Q313417','Barabbas','Barrabás','https://www.wikidata.org/entity/Q313417','wikidata-lastrevid:2531184941'),
  ('Barak_Jdg.4.6','Jdg.4.6','Q807236','Barak','Barak','https://www.wikidata.org/entity/Q807236','wikidata-lastrevid:2530703348'),
  ('Bartholomew_Mat.10.3','Mat.10.3','Q43982','Bartholomew the Apostle','Bartolomé el Apóstol','https://www.wikidata.org/entity/Q43982','wikidata-lastrevid:2525278110'),
  ('Bartimaeus_Mrk.10.46','Mrk.10.46','Q809440','Bartimaeus','Bartimeo','https://www.wikidata.org/entity/Q809440','wikidata-lastrevid:2530701244'),
  ('Baruch_Jer.32.12','Jer.32.12','Q599907','Baruch ben Neriah','Baruc (profeta)','https://www.wikidata.org/entity/Q599907','wikidata-lastrevid:2532912373'),
  ('Baruch_Neh.10.6','Neh.10.6','Q599907','Baruch ben Neriah','Baruc (profeta)','https://www.wikidata.org/entity/Q599907','wikidata-lastrevid:2532912373'),
  ('Baruch_Neh.11.5','Neh.11.5','Q599907','Baruch ben Neriah','Baruc (profeta)','https://www.wikidata.org/entity/Q599907','wikidata-lastrevid:2532912373'),
  ('Baruch_Neh.3.20','Neh.3.20','Q599907','Baruch ben Neriah','Baruc (profeta)','https://www.wikidata.org/entity/Q599907','wikidata-lastrevid:2532912373'),
  ('Bathsheba_2Sa.11.3','2Sa.11.3','Q272277','Bathsheba','Betsabé','https://www.wikidata.org/entity/Q272277','wikidata-lastrevid:2532912462'),
  ('Belshazzar_Dan.5.1','Dan.5.1','Q225198','Belshazzar','Belsasar','https://www.wikidata.org/entity/Q225198','wikidata-lastrevid:2532913185'),
  ('Ben-ammi_Gen.19.38','Gen.19.38','Q9168580','Ben-Ammi','Ben Ammi','https://www.wikidata.org/entity/Q9168580','wikidata-lastrevid:2530703984'),
  ('Benjamin_1Ch.7.10','1Ch.7.10','Q460763','Benjamin','Benjamín','https://www.wikidata.org/entity/Q460763','wikidata-lastrevid:2532913440'),
  ('Benjamin_Ezr.10.32','Ezr.10.32','Q460763','Benjamin','Benjamín','https://www.wikidata.org/entity/Q460763','wikidata-lastrevid:2532913440'),
  ('Benjamin_Gen.35.18','Gen.35.18','Q460763','Benjamin','Benjamín','https://www.wikidata.org/entity/Q460763','wikidata-lastrevid:2532913440'),
  ('Benjamin_Neh.12.34','Neh.12.34','Q460763','Benjamin','Benjamín','https://www.wikidata.org/entity/Q460763','wikidata-lastrevid:2532913440'),
  ('Benjamin_Neh.3.23','Neh.3.23','Q460763','Benjamin','Benjamín','https://www.wikidata.org/entity/Q460763','wikidata-lastrevid:2532913440'),
  ('Bera_Gen.14.2','Gen.14.2','Q4890957','Bera','Bera','https://www.wikidata.org/entity/Q4890957','wikidata-lastrevid:2530687126'),
  ('Bethuel_Gen.22.22','Gen.22.22','Q1579827','Bethuel','Betuel','https://www.wikidata.org/entity/Q1579827','wikidata-lastrevid:2530690653'),
  ('Bildad_Job.2.11','Job.2.11','Q2776374','Bildad','Bildad','https://www.wikidata.org/entity/Q2776374','wikidata-lastrevid:2530693794'),
  ('Bilhah_Gen.29.29','Gen.29.29','Q794991','Bilhah','Bilha','https://www.wikidata.org/entity/Q794991','wikidata-lastrevid:2530701179'),
  ('Bilshan_Ezr.2.2','Ezr.2.2','Q1136380','Mordecai','Mardoqueo','https://www.wikidata.org/entity/Q1136380','wikidata-lastrevid:2530654475'),
  ('Bithiah_1Ch.4.18','1Ch.4.18','Q1873244','Bithiah','Bithiah','https://www.wikidata.org/entity/Q1873244','wikidata-lastrevid:2530692631'),
  ('Boaz_1Ki.7.21','1Ki.7.21','Q212253','Boaz','Boaz','https://www.wikidata.org/entity/Q212253','wikidata-lastrevid:2530668565'),
  ('Caiaphas_Mat.26.3','Mat.26.3','Q211246','Caiaphas','Caifás','https://www.wikidata.org/entity/Q211246','wikidata-lastrevid:2529249064'),
  ('Cain_Gen.4.1','Gen.4.1','Q205365','Cain','Caín','https://www.wikidata.org/entity/Q205365','wikidata-lastrevid:2532888908'),
  ('Cainan_Luk.3.36','Luk.3.36','Q844433','Kenan','Cainán','https://www.wikidata.org/entity/Q844433','wikidata-lastrevid:2530703510'),
  ('Caleb_1Ch.2.9','1Ch.2.9','Q922184','Caleb','Caleb','https://www.wikidata.org/entity/Q922184','wikidata-lastrevid:2530703998'),
  ('Caleb_Num.13.6','Num.13.6','Q922184','Caleb','Caleb','https://www.wikidata.org/entity/Q922184','wikidata-lastrevid:2530703998'),
  ('Canaan_Gen.9.18','Gen.9.18','Q204797','Canaan','Canaan (hijo de Cam)','https://www.wikidata.org/entity/Q204797','wikidata-lastrevid:2530693363'),
  ('Chedorlaomer_Gen.14.1','Gen.14.1','Q2118973','Chedorlaomer','Quedorlaomer','https://www.wikidata.org/entity/Q2118973','wikidata-lastrevid:2530668506'),
  ('Chuza_Luk.8.3','Luk.8.3','Q106079959','Chuza','Cusa','https://www.wikidata.org/entity/Q106079959','wikidata-lastrevid:2307666806'),
  ('Cornelius_Act.10.1','Act.10.1','Q435987','Cornelius the Centurion','Cornelio el Centurión','https://www.wikidata.org/entity/Q435987','wikidata-lastrevid:2530675905'),
  ('Cush_Gen.10.6','Gen.10.6','Q1138595','Cush','Kush','https://www.wikidata.org/entity/Q1138595','wikidata-lastrevid:2530654600')
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
   and lower(regexp_replace(btrim(evidence.english_label), '[^[:alnum:]]+', '', 'g')) =
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
 'tipnr_wikidata_spanish_anchor_2source_exact_primary_v3',
 source_gloss,
 'verified_derived',
 jsonb_build_object(
   'phase','FASE_H_BLOQUE_3',
   'batch_id','fase_h_es_nombres_wikidata_anchor2_003_20260820',
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
   'exact_wikidata_primary_label',true,
   'anchor_used_for_name_spelling_only',true,
   'context_used_as_meaning',false,
   'rv1909_used_as_meaning',false,
   'strong_number',strong_number
 )
from eligible
on conflict (lexical_entry_id) do nothing;
