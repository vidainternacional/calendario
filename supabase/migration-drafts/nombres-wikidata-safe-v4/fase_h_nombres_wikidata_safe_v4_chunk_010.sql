-- BORRADOR NO ACTIVO — FASE H / Bloque 3 — nombres propios TIPNR + Wikidata, gate seguro v4.
-- Chunk 010; candidatos seguros=40.
-- No aplicar sin auditoría read-only del lote.
-- La referencia ancla se usa SOLO para confirmar la grafía española, no como significado.
-- Gate: source_gloss debe representar exactamente la misma entidad a ambos lados de ».
-- Gate: la etiqueta inglesa primaria de Wikidata debe coincidir exactamente con esa entidad.
-- Gate: similitud fonética conservadora inglés/español >= 0.55.
-- Gate: la etiqueta española debe aparecer como frase completa en >= 2 fuentes españolas verificadas.
-- Política futura: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta si se activa:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nombres_wikidata_safe_v4_010_20260820';

with map(tipnr_id, anchor_ref, wikidata_id, english_label, display_gloss_es, source_uri, source_revision, name_similarity) as (
 values
  ('Nicodemus_Jhn.3.1','Jhn.3.1','Q295084','Nicodemus','Nicodemo','https://www.wikidata.org/entity/Q295084','wikidata-lastrevid:2530694148',0.823529),
  ('Nimrod_Gen.10.8','Gen.10.8','Q201861','Nimrod','Nemrod','https://www.wikidata.org/entity/Q201861','wikidata-lastrevid:2533422587',0.833333),
  ('Noah_Gen.5.29','Gen.5.29','Q81422','Noah','Noé','https://www.wikidata.org/entity/Q81422','wikidata-lastrevid:2533425309',0.666667),
  ('Noah_Num.26.33','Num.26.33','Q81422','Noah','Noé','https://www.wikidata.org/entity/Q81422','wikidata-lastrevid:2533425309',0.666667),
  ('Obed-edom_2Sa.6.10','2Sa.6.10','Q2898809','Obed-Edom','Obed-Edom','https://www.wikidata.org/entity/Q2898809','wikidata-lastrevid:2516431122',1.000000),
  ('Obed_1Ch.11.47','1Ch.11.47','Q1135791','Obed','Obed','https://www.wikidata.org/entity/Q1135791','wikidata-lastrevid:2530654446',1.000000),
  ('Obed_1Ch.2.37','1Ch.2.37','Q1135791','Obed','Obed','https://www.wikidata.org/entity/Q1135791','wikidata-lastrevid:2530654446',1.000000),
  ('Obed_1Ch.26.7','1Ch.26.7','Q1135791','Obed','Obed','https://www.wikidata.org/entity/Q1135791','wikidata-lastrevid:2530654446',1.000000),
  ('Obed_2Ch.23.1','2Ch.23.1','Q1135791','Obed','Obed','https://www.wikidata.org/entity/Q1135791','wikidata-lastrevid:2530654446',1.000000),
  ('Obed_Rut.4.17','Rut.4.17','Q1135791','Obed','Obed','https://www.wikidata.org/entity/Q1135791','wikidata-lastrevid:2530654446',1.000000),
  ('Og_Num.21.33','Num.21.33','Q878675','Og','Og','https://www.wikidata.org/entity/Q878675','wikidata-lastrevid:2530701753',1.000000),
  ('Omri_1Ch.27.18','1Ch.27.18','Q313221','Omri','Omri','https://www.wikidata.org/entity/Q313221','wikidata-lastrevid:2530517494',1.000000),
  ('Omri_1Ch.7.8','1Ch.7.8','Q313221','Omri','Omri','https://www.wikidata.org/entity/Q313221','wikidata-lastrevid:2530517494',1.000000),
  ('Omri_1Ch.9.4','1Ch.9.4','Q313221','Omri','Omri','https://www.wikidata.org/entity/Q313221','wikidata-lastrevid:2530517494',1.000000),
  ('Omri_1Ki.16.16','1Ki.16.16','Q313221','Omri','Omri','https://www.wikidata.org/entity/Q313221','wikidata-lastrevid:2530517494',1.000000),
  ('Onan_Gen.38.4','Gen.38.4','Q661074','Onan','Onán','https://www.wikidata.org/entity/Q661074','wikidata-lastrevid:2530678773',1.000000),
  ('Orpah_Rut.1.4','Rut.1.4','Q1697019','Orpah','Orfa','https://www.wikidata.org/entity/Q1697019','wikidata-lastrevid:2530691630',0.750000),
  ('Othniel_Jos.15.17','Jos.15.17','Q536485','Othniel','Otoniel','https://www.wikidata.org/entity/Q536485','wikidata-lastrevid:2530687559',0.923077),
  ('Pagiel_Num.1.13','Num.1.13','Q20605581','Pagiel','Paguiel','https://www.wikidata.org/entity/Q20605581','wikidata-lastrevid:2530683554',0.923077),
  ('Parmenas_Act.6.5','Act.6.5','Q1398612','Parmenas','Parmenas','https://www.wikidata.org/entity/Q1398612','wikidata-lastrevid:2530667184',1.000000),
  ('Peleg_Gen.10.25','Gen.10.25','Q1648259','Peleg','Peleg','https://www.wikidata.org/entity/Q1648259','wikidata-lastrevid:2530691177',1.000000),
  ('Peninnah_1Sa.1.2','1Sa.1.2','Q2068934','Peninnah','Penina','https://www.wikidata.org/entity/Q2068934','wikidata-lastrevid:2530683599',0.923077),
  ('Phanuel_Luk.2.36','Luk.2.36','Q7180641','Phanuel','Phanuel','https://www.wikidata.org/entity/Q7180641','wikidata-lastrevid:2530679203',1.000000),
  ('Pharaoh_1Ch.4.18','1Ch.4.18','Q659203','Pharaohs in the Bible','Faraones en la Biblia','https://www.wikidata.org/entity/Q659203','wikidata-lastrevid:2530699844',0.647059),
  ('Pharaoh_1Ki.3.1','1Ki.3.1','Q659203','Pharaohs in the Bible','Faraones en la Biblia','https://www.wikidata.org/entity/Q659203','wikidata-lastrevid:2530699844',0.647059),
  ('Pharaoh_2Ki.18.21','2Ki.18.21','Q659203','Pharaohs in the Bible','Faraones en la Biblia','https://www.wikidata.org/entity/Q659203','wikidata-lastrevid:2530699844',0.647059),
  ('Pharaoh_Exo.1.11','Exo.1.11','Q659203','Pharaohs in the Bible','Faraones en la Biblia','https://www.wikidata.org/entity/Q659203','wikidata-lastrevid:2530699844',0.647059),
  ('Pharaoh_Exo.3.10','Exo.3.10','Q659203','Pharaohs in the Bible','Faraones en la Biblia','https://www.wikidata.org/entity/Q659203','wikidata-lastrevid:2530699844',0.647059),
  ('Pharaoh_Gen.12.15','Gen.12.15','Q659203','Pharaohs in the Bible','Faraones en la Biblia','https://www.wikidata.org/entity/Q659203','wikidata-lastrevid:2530699844',0.647059),
  ('Pharaoh_Gen.37.36','Gen.37.36','Q659203','Pharaohs in the Bible','Faraones en la Biblia','https://www.wikidata.org/entity/Q659203','wikidata-lastrevid:2530699844',0.647059),
  ('Pharaoh_Jer.25.19','Jer.25.19','Q659203','Pharaohs in the Bible','Faraones en la Biblia','https://www.wikidata.org/entity/Q659203','wikidata-lastrevid:2530699844',0.647059),
  ('Potiphar_Gen.37.36','Gen.37.36','Q1148687','Potiphar','Putifar','https://www.wikidata.org/entity/Q1148687','wikidata-lastrevid:2530655374',0.857143),
  ('Puah_Exo.1.15','Exo.1.15','Q21959799','Puah','Puá','https://www.wikidata.org/entity/Q21959799','wikidata-lastrevid:2530669684',1.000000),
  ('Puah_Gen.46.13','Gen.46.13','Q21959799','Puah','Puá','https://www.wikidata.org/entity/Q21959799','wikidata-lastrevid:2530669684',1.000000),
  ('Puah_Jdg.10.1','Jdg.10.1','Q21959799','Puah','Puá','https://www.wikidata.org/entity/Q21959799','wikidata-lastrevid:2530669684',1.000000),
  ('Rachel_Gen.29.6','Gen.29.6','Q207389','Rachel','Raquel','https://www.wikidata.org/entity/Q207389','wikidata-lastrevid:2533437230',1.000000),
  ('Rahab_Job.9.13','Job.9.13','Q1135632','Rahab','Raab','https://www.wikidata.org/entity/Q1135632','wikidata-lastrevid:2531661787',0.888889),
  ('Rahab_Jos.2.1','Jos.2.1','Q1135632','Rahab','Raab','https://www.wikidata.org/entity/Q1135632','wikidata-lastrevid:2531661787',0.888889),
  ('Ram_1Ch.2.25','1Ch.2.25','Q1824842','Ram','Aram','https://www.wikidata.org/entity/Q1824842','wikidata-lastrevid:2530682311',0.857143),
  ('Ram_Job.32.2','Job.32.2','Q1824842','Ram','Aram','https://www.wikidata.org/entity/Q1824842','wikidata-lastrevid:2530682311',0.857143)
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
   'batch_id','fase_h_es_nombres_wikidata_safe_v4_010_20260820',
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
