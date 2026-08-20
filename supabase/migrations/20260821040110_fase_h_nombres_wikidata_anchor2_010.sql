-- — FASE H / Bloque 3 — nombres propios TIPNR + Wikidata + gate bíblico español.
-- Chunk 010; candidatos=40.
-- Gate estructural auditado; aplicación insert-only reversible.
-- La referencia ancla se usa SOLO para confirmar la grafía española, no como significado.
-- Gate: la etiqueta española debe aparecer como frase completa en >= 2 fuentes españolas verificadas.
-- Política futura: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta si se activa:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nombres_wikidata_anchor2_010_20260820';

with map(tipnr_id, anchor_ref, wikidata_id, english_label, display_gloss_es, source_uri, source_revision) as (
 values
  ('Mordecai_Est.2.5','Est.2.5','Q1136380','Mordecai','Mardoqueo','https://www.wikidata.org/entity/Q1136380','wikidata-lastrevid:2530654475'),
  ('Mordecai_Ezr.2.2','Ezr.2.2','Q1136380','Mordecai','Mardoqueo','https://www.wikidata.org/entity/Q1136380','wikidata-lastrevid:2530654475'),
  ('Moses_Exo.2.10','Exo.2.10','Q9077','Moses','Moisés','https://www.wikidata.org/entity/Q9077','wikidata-lastrevid:2533416105'),
  ('Nabal_1Sa.25.3','1Sa.25.3','Q1709507','Nabal','Nabal','https://www.wikidata.org/entity/Q1709507','wikidata-lastrevid:2530681608'),
  ('Naboth_1Ki.21.1','1Ki.21.1','Q44203','Naboth','Naboth','https://www.wikidata.org/entity/Q44203','wikidata-lastrevid:2530686723'),
  ('Nadab_1Ch.2.28','1Ch.2.28','Q1941782','Nadab','Nadab','https://www.wikidata.org/entity/Q1941782','wikidata-lastrevid:2530682969'),
  ('Nadab_1Ch.8.30','1Ch.8.30','Q1941782','Nadab','Nadab','https://www.wikidata.org/entity/Q1941782','wikidata-lastrevid:2530682969'),
  ('Nadab_1Ki.14.20','1Ki.14.20','Q1941782','Nadab','Nadab','https://www.wikidata.org/entity/Q1941782','wikidata-lastrevid:2530682969'),
  ('Nadab_Exo.6.23','Exo.6.23','Q1941782','Nadab','Nadab','https://www.wikidata.org/entity/Q1941782','wikidata-lastrevid:2530682969'),
  ('Nahbi_Num.13.14','Num.13.14','Q1703736','Nahbi','Najbí','https://www.wikidata.org/entity/Q1703736','wikidata-lastrevid:2530691657'),
  ('Nahum_Nam.1.1','Nam.1.1','Q1981722','Nahum','Naún','https://www.wikidata.org/entity/Q1981722','wikidata-lastrevid:2533421076'),
  ('Naomi_Rut.1.2','Rut.1.2','Q2596433','Naomi','Noemí','https://www.wikidata.org/entity/Q2596433','wikidata-lastrevid:2533421395'),
  ('Naphtali_Gen.30.8','Gen.30.8','Q1771963','Naphtali','Neftalí','https://www.wikidata.org/entity/Q1771963','wikidata-lastrevid:2530681982'),
  ('Nebat_1Ki.11.26','1Ki.11.26','Q26835883','Nebat','Nebat','https://www.wikidata.org/entity/Q26835883','wikidata-lastrevid:2530683757'),
  ('Nebuzaradan_2Ki.25.8','2Ki.25.8','Q6903514','Nebuzaradan','Nabuzardán','https://www.wikidata.org/entity/Q6903514','wikidata-lastrevid:2530700047'),
  ('Nehemiah_Ezr.2.2','Ezr.2.2','Q1025598','Nehemiah','Nehemías','https://www.wikidata.org/entity/Q1025598','wikidata-lastrevid:2530257601'),
  ('Nehemiah_Neh.1.1','Neh.1.1','Q1025598','Nehemiah','Nehemías','https://www.wikidata.org/entity/Q1025598','wikidata-lastrevid:2530257601'),
  ('Nehemiah_Neh.3.16','Neh.3.16','Q1025598','Nehemiah','Nehemías','https://www.wikidata.org/entity/Q1025598','wikidata-lastrevid:2530257601'),
  ('Nicodemus_Jhn.3.1','Jhn.3.1','Q295084','Nicodemus','Nicodemo','https://www.wikidata.org/entity/Q295084','wikidata-lastrevid:2530694148'),
  ('Nimrod_Gen.10.8','Gen.10.8','Q201861','Nimrod','Nemrod','https://www.wikidata.org/entity/Q201861','wikidata-lastrevid:2533422587'),
  ('Noah_Gen.5.29','Gen.5.29','Q81422','Noah','Noé','https://www.wikidata.org/entity/Q81422','wikidata-lastrevid:2533425309'),
  ('Noah_Num.26.33','Num.26.33','Q81422','Noah','Noé','https://www.wikidata.org/entity/Q81422','wikidata-lastrevid:2533425309'),
  ('Obed-edom_2Sa.6.10','2Sa.6.10','Q2898809','Obed-Edom','Obed-Edom','https://www.wikidata.org/entity/Q2898809','wikidata-lastrevid:2516431122'),
  ('Obed_1Ch.11.47','1Ch.11.47','Q1135791','Obed','Obed','https://www.wikidata.org/entity/Q1135791','wikidata-lastrevid:2530654446'),
  ('Obed_1Ch.2.37','1Ch.2.37','Q1135791','Obed','Obed','https://www.wikidata.org/entity/Q1135791','wikidata-lastrevid:2530654446'),
  ('Obed_1Ch.26.7','1Ch.26.7','Q1135791','Obed','Obed','https://www.wikidata.org/entity/Q1135791','wikidata-lastrevid:2530654446'),
  ('Obed_2Ch.23.1','2Ch.23.1','Q1135791','Obed','Obed','https://www.wikidata.org/entity/Q1135791','wikidata-lastrevid:2530654446'),
  ('Obed_Rut.4.17','Rut.4.17','Q1135791','Obed','Obed','https://www.wikidata.org/entity/Q1135791','wikidata-lastrevid:2530654446'),
  ('Og_Num.21.33','Num.21.33','Q878675','Og','Og','https://www.wikidata.org/entity/Q878675','wikidata-lastrevid:2530701753'),
  ('Omri_1Ch.27.18','1Ch.27.18','Q313221','Omri','Omri','https://www.wikidata.org/entity/Q313221','wikidata-lastrevid:2530517494'),
  ('Omri_1Ch.7.8','1Ch.7.8','Q313221','Omri','Omri','https://www.wikidata.org/entity/Q313221','wikidata-lastrevid:2530517494'),
  ('Omri_1Ch.9.4','1Ch.9.4','Q313221','Omri','Omri','https://www.wikidata.org/entity/Q313221','wikidata-lastrevid:2530517494'),
  ('Omri_1Ki.16.16','1Ki.16.16','Q313221','Omri','Omri','https://www.wikidata.org/entity/Q313221','wikidata-lastrevid:2530517494'),
  ('Onan_Gen.38.4','Gen.38.4','Q661074','Onan','Onán','https://www.wikidata.org/entity/Q661074','wikidata-lastrevid:2530678773'),
  ('Orpah_Rut.1.4','Rut.1.4','Q1697019','Orpah','Orfa','https://www.wikidata.org/entity/Q1697019','wikidata-lastrevid:2530691630'),
  ('Othniel_Jos.15.17','Jos.15.17','Q536485','Othniel','Otoniel','https://www.wikidata.org/entity/Q536485','wikidata-lastrevid:2530687559'),
  ('Pagiel_Num.1.13','Num.1.13','Q20605581','Pagiel','Paguiel','https://www.wikidata.org/entity/Q20605581','wikidata-lastrevid:2530683554'),
  ('Parmenas_Act.6.5','Act.6.5','Q1398612','Parmenas','Parmenas','https://www.wikidata.org/entity/Q1398612','wikidata-lastrevid:2530667184'),
  ('Peleg_Gen.10.25','Gen.10.25','Q1648259','Peleg','Peleg','https://www.wikidata.org/entity/Q1648259','wikidata-lastrevid:2530691177'),
  ('Peninnah_1Sa.1.2','1Sa.1.2','Q2068934','Peninnah','Penina','https://www.wikidata.org/entity/Q2068934','wikidata-lastrevid:2530683599')
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
 'tipnr_wikidata_spanish_anchor_2source_v1',
 source_gloss,
 'verified_derived',
 jsonb_build_object(
   'phase','FASE_H_BLOQUE_3',
   'batch_id','fase_h_es_nombres_wikidata_anchor2_010_20260820',
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
   'anchor_used_for_name_spelling_only',true,
   'context_used_as_meaning',false,
   'rv1909_used_as_meaning',false,
   'strong_number',strong_number
 )
from eligible
on conflict (lexical_entry_id) do nothing;
