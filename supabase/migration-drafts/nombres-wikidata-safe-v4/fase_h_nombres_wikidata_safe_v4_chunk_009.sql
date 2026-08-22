-- BORRADOR NO ACTIVO — FASE H / Bloque 3 — nombres propios TIPNR + Wikidata, gate seguro v4.
-- Chunk 009; candidatos seguros=40.
-- No aplicar sin auditoría read-only del lote.
-- La referencia ancla se usa SOLO para confirmar la grafía española, no como significado.
-- Gate: source_gloss debe representar exactamente la misma entidad a ambos lados de ».
-- Gate: la etiqueta inglesa primaria de Wikidata debe coincidir exactamente con esa entidad.
-- Gate: similitud fonética conservadora inglés/español >= 0.55.
-- Gate: la etiqueta española debe aparecer como frase completa en >= 2 fuentes españolas verificadas.
-- Política futura: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta si se activa:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nombres_wikidata_safe_v4_009_20260820';

with map(tipnr_id, anchor_ref, wikidata_id, english_label, display_gloss_es, source_uri, source_revision, name_similarity) as (
 values
  ('Mahlon_Rut.1.2','Rut.1.2','Q9026972','Mahlon','Mahlón','https://www.wikidata.org/entity/Q9026972','wikidata-lastrevid:2530701821',1.000000),
  ('Manoah_Jdg.13.2','Jdg.13.2','Q221514','Manoah','Manoa','https://www.wikidata.org/entity/Q221514','wikidata-lastrevid:2530669769',1.000000),
  ('Mash_Gen.10.23','Gen.10.23','Q13418757','Mash','Mash','https://www.wikidata.org/entity/Q13418757','wikidata-lastrevid:2530665110',1.000000),
  ('Mattatha_Luk.3.31','Luk.3.31','Q19715666','Mattatha','Matata','https://www.wikidata.org/entity/Q19715666','wikidata-lastrevid:2530683082',0.923077),
  ('Medad_Num.11.26','Num.11.26','Q56473843','Medad','Medad','https://www.wikidata.org/entity/Q56473843','wikidata-lastrevid:2307662392',1.000000),
  ('Mehujael_Gen.4.18','Gen.4.18','Q10329365','Mehujael','Mehuiael','https://www.wikidata.org/entity/Q10329365','wikidata-lastrevid:2530258269',0.875000),
  ('Melchizedek_Gen.14.18','Gen.14.18','Q219395','Melchizedek','Melquisedec','https://www.wikidata.org/entity/Q219395','wikidata-lastrevid:2530669565',0.900000),
  ('Mephibosheth_2Sa.21.8','2Sa.21.8','Q851686','Mephibosheth','Mefiboset','https://www.wikidata.org/entity/Q851686','wikidata-lastrevid:2530701536',1.000000),
  ('Mephibosheth_2Sa.4.4','2Sa.4.4','Q851686','Mephibosheth','Mefiboset','https://www.wikidata.org/entity/Q851686','wikidata-lastrevid:2530701536',1.000000),
  ('Merari_Gen.46.11','Gen.46.11','Q2670550','Merari','Merari','https://www.wikidata.org/entity/Q2670550','wikidata-lastrevid:2530672709',1.000000),
  ('Mesha_1Ch.8.9','1Ch.8.9','Q350258','Mesha','Mesa (Rey de Moab)','https://www.wikidata.org/entity/Q350258','wikidata-lastrevid:2418142447',1.000000),
  ('Mesha_2Ki.3.4','2Ki.3.4','Q350258','Mesha','Mesa (Rey de Moab)','https://www.wikidata.org/entity/Q350258','wikidata-lastrevid:2418142447',1.000000),
  ('Methuselah_Gen.5.21','Gen.5.21','Q156290','Methuselah','Matusalén','https://www.wikidata.org/entity/Q156290','wikidata-lastrevid:2533411102',0.588235),
  ('Micah_1Ch.5.5','1Ch.5.5','Q2804969','Micah','Miqueas','https://www.wikidata.org/entity/Q2804969','wikidata-lastrevid:2533411241',0.800000),
  ('Micah_2Sa.9.12','2Sa.9.12','Q2804969','Micah','Miqueas','https://www.wikidata.org/entity/Q2804969','wikidata-lastrevid:2533411241',0.800000),
  ('Micah_Jdg.17.1','Jdg.17.1','Q2804969','Micah','Miqueas','https://www.wikidata.org/entity/Q2804969','wikidata-lastrevid:2533411241',0.800000),
  ('Micah_Jer.26.18','Jer.26.18','Q2804969','Micah','Miqueas','https://www.wikidata.org/entity/Q2804969','wikidata-lastrevid:2533411241',0.800000),
  ('Micaiah_1Ki.22.8','1Ki.22.8','Q1531578','Micaiah','Micaías','https://www.wikidata.org/entity/Q1531578','wikidata-lastrevid:2530690299',0.923077),
  ('Michal_1Sa.14.49','1Sa.14.49','Q1341397','Michal','Michal','https://www.wikidata.org/entity/Q1341397','wikidata-lastrevid:2532026427',1.000000),
  ('Midian_Gen.25.2','Gen.25.2','Q755316','Midian','Madián','https://www.wikidata.org/entity/Q755316','wikidata-lastrevid:2530702719',0.833333),
  ('Miriam_1Ch.4.17','1Ch.4.17','Q1938388','Miriam','Miriam','https://www.wikidata.org/entity/Q1938388','wikidata-lastrevid:2530692843',1.000000),
  ('Miriam_Exo.15.20','Exo.15.20','Q1938388','Miriam','Miriam','https://www.wikidata.org/entity/Q1938388','wikidata-lastrevid:2530692843',1.000000),
  ('Mizzah_Gen.36.13','Gen.36.13','Q6884915','Mizzah','Mizzah','https://www.wikidata.org/entity/Q6884915','wikidata-lastrevid:2530678990',1.000000),
  ('Moab_Gen.19.37','Gen.19.37','Q1585141','Moab','Moab','https://www.wikidata.org/entity/Q1585141','wikidata-lastrevid:2530690713',1.000000),
  ('Moses_Exo.2.10','Exo.2.10','Q9077','Moses','Moisés','https://www.wikidata.org/entity/Q9077','wikidata-lastrevid:2533416105',0.909091),
  ('Nabal_1Sa.25.3','1Sa.25.3','Q1709507','Nabal','Nabal','https://www.wikidata.org/entity/Q1709507','wikidata-lastrevid:2530681608',1.000000),
  ('Naboth_1Ki.21.1','1Ki.21.1','Q44203','Naboth','Naboth','https://www.wikidata.org/entity/Q44203','wikidata-lastrevid:2530686723',1.000000),
  ('Nadab_1Ch.2.28','1Ch.2.28','Q1941782','Nadab','Nadab','https://www.wikidata.org/entity/Q1941782','wikidata-lastrevid:2530682969',1.000000),
  ('Nadab_1Ch.8.30','1Ch.8.30','Q1941782','Nadab','Nadab','https://www.wikidata.org/entity/Q1941782','wikidata-lastrevid:2530682969',1.000000),
  ('Nadab_1Ki.14.20','1Ki.14.20','Q1941782','Nadab','Nadab','https://www.wikidata.org/entity/Q1941782','wikidata-lastrevid:2530682969',1.000000),
  ('Nadab_Exo.6.23','Exo.6.23','Q1941782','Nadab','Nadab','https://www.wikidata.org/entity/Q1941782','wikidata-lastrevid:2530682969',1.000000),
  ('Nahbi_Num.13.14','Num.13.14','Q1703736','Nahbi','Najbí','https://www.wikidata.org/entity/Q1703736','wikidata-lastrevid:2530691657',0.800000),
  ('Nahum_Nam.1.1','Nam.1.1','Q1981722','Nahum','Naún','https://www.wikidata.org/entity/Q1981722','wikidata-lastrevid:2533421076',0.666667),
  ('Naomi_Rut.1.2','Rut.1.2','Q2596433','Naomi','Noemí','https://www.wikidata.org/entity/Q2596433','wikidata-lastrevid:2533421395',0.800000),
  ('Naphtali_Gen.30.8','Gen.30.8','Q1771963','Naphtali','Neftalí','https://www.wikidata.org/entity/Q1771963','wikidata-lastrevid:2530681982',0.857143),
  ('Nebat_1Ki.11.26','1Ki.11.26','Q26835883','Nebat','Nebat','https://www.wikidata.org/entity/Q26835883','wikidata-lastrevid:2530683757',1.000000),
  ('Nebuzaradan_2Ki.25.8','2Ki.25.8','Q6903514','Nebuzaradan','Nabuzardán','https://www.wikidata.org/entity/Q6903514','wikidata-lastrevid:2530700047',0.857143),
  ('Nehemiah_Ezr.2.2','Ezr.2.2','Q1025598','Nehemiah','Nehemías','https://www.wikidata.org/entity/Q1025598','wikidata-lastrevid:2530257601',0.933333),
  ('Nehemiah_Neh.1.1','Neh.1.1','Q1025598','Nehemiah','Nehemías','https://www.wikidata.org/entity/Q1025598','wikidata-lastrevid:2530257601',0.933333),
  ('Nehemiah_Neh.3.16','Neh.3.16','Q1025598','Nehemiah','Nehemías','https://www.wikidata.org/entity/Q1025598','wikidata-lastrevid:2530257601',0.933333)
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
 group by map.tipnr_id,map.anchor_ref,map.wikidata_id,map.english_label,map.display_gloss_es,map.source_uri,map.source_revision,map.name_similarity
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
   and evidence.name_similarity >= 0.55
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
 'tipnr_wikidata_spanish_anchor_similarity_safe_v4',
 source_gloss,
 'verified_derived',
 jsonb_build_object(
   'phase','FASE_H_BLOQUE_3',
   'batch_id','fase_h_es_nombres_wikidata_safe_v4_009_20260820',
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
