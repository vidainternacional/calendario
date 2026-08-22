-- BORRADOR NO ACTIVO — FASE H / Bloque 3 — nombres propios TIPNR + Wikidata, gate seguro v4.
-- Chunk 008; candidatos seguros=40.
-- No aplicar sin auditoría read-only del lote.
-- La referencia ancla se usa SOLO para confirmar la grafía española, no como significado.
-- Gate: source_gloss debe representar exactamente la misma entidad a ambos lados de ».
-- Gate: la etiqueta inglesa primaria de Wikidata debe coincidir exactamente con esa entidad.
-- Gate: similitud fonética conservadora inglés/español >= 0.55.
-- Gate: la etiqueta española debe aparecer como frase completa en >= 2 fuentes españolas verificadas.
-- Política futura: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta si se activa:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nombres_wikidata_safe_v4_008_20260820';

with map(tipnr_id, anchor_ref, wikidata_id, english_label, display_gloss_es, source_uri, source_revision, name_similarity) as (
 values
  ('Joel_2Ch.29.12','2Ch.29.12','Q20888416','Joel','Joel (hijo de Samuel)','https://www.wikidata.org/entity/Q20888416','wikidata-lastrevid:2530683709',1.000000),
  ('Joel_Ezr.10.43','Ezr.10.43','Q20888416','Joel','Joel (hijo de Samuel)','https://www.wikidata.org/entity/Q20888416','wikidata-lastrevid:2530683709',1.000000),
  ('Joel_Jol.1.1','Jol.1.1','Q20888416','Joel','Joel (hijo de Samuel)','https://www.wikidata.org/entity/Q20888416','wikidata-lastrevid:2530683709',1.000000),
  ('Joel_Neh.11.9','Neh.11.9','Q20888416','Joel','Joel (hijo de Samuel)','https://www.wikidata.org/entity/Q20888416','wikidata-lastrevid:2530683709',1.000000),
  ('Jokshan_Gen.25.2','Gen.25.2','Q737548','Jokshan','Jocxan','https://www.wikidata.org/entity/Q737548','wikidata-lastrevid:2530679417',0.833333),
  ('Jonah_2Ki.14.25','2Ki.14.25','Q2468262','Jonah','Jonás','https://www.wikidata.org/entity/Q2468262','wikidata-lastrevid:2533329593',0.888889),
  ('Joshua_1Sa.6.14','1Sa.6.14','Q7734','Joshua','Josué','https://www.wikidata.org/entity/Q7734','wikidata-lastrevid:2533331185',0.800000),
  ('Joshua_2Ki.23.8','2Ki.23.8','Q7734','Joshua','Josué','https://www.wikidata.org/entity/Q7734','wikidata-lastrevid:2533331185',0.800000),
  ('Joshua_Exo.17.9','Exo.17.9','Q7734','Joshua','Josué','https://www.wikidata.org/entity/Q7734','wikidata-lastrevid:2533331185',0.800000),
  ('Joshua_Ezr.2.2','Ezr.2.2','Q7734','Joshua','Josué','https://www.wikidata.org/entity/Q7734','wikidata-lastrevid:2533331185',0.800000),
  ('Josiah_1Ki.13.2','1Ki.13.2','Q313228','Josiah','Josías de Judá','https://www.wikidata.org/entity/Q313228','wikidata-lastrevid:2530684420',0.588235),
  ('Josiah_Zec.6.10','Zec.6.10','Q313228','Josiah','Josías de Judá','https://www.wikidata.org/entity/Q313228','wikidata-lastrevid:2530684420',0.588235),
  ('Jozadak_Ezr.10.18','Ezr.10.18','Q6176509','Jehozadak','Jehozadak','https://www.wikidata.org/entity/Q6176509','wikidata-lastrevid:2489745356',1.000000),
  ('Jubal_Gen.4.21','Gen.4.21','Q1432204','Jubal','Jubal','https://www.wikidata.org/entity/Q1432204','wikidata-lastrevid:2530667974',1.000000),
  ('Judah_Ezr.10.23','Ezr.10.23','Q282220','Judah','Judá','https://www.wikidata.org/entity/Q282220','wikidata-lastrevid:2533331588',1.000000),
  ('Judah_Gen.29.35','Gen.29.35','Q282220','Judah','Judá','https://www.wikidata.org/entity/Q282220','wikidata-lastrevid:2533331588',1.000000),
  ('Judah_Neh.11.9','Neh.11.9','Q282220','Judah','Judá','https://www.wikidata.org/entity/Q282220','wikidata-lastrevid:2533331588',1.000000),
  ('Judah_Neh.12.36','Neh.12.36','Q282220','Judah','Judá','https://www.wikidata.org/entity/Q282220','wikidata-lastrevid:2533331588',1.000000),
  ('Judah_Neh.12.8','Neh.12.8','Q282220','Judah','Judá','https://www.wikidata.org/entity/Q282220','wikidata-lastrevid:2533331588',1.000000),
  ('Judith_Gen.26.34','Gen.26.34','Q28532552','Judith','Judit','https://www.wikidata.org/entity/Q28532552','wikidata-lastrevid:2524318778',1.000000),
  ('Junia_Rom.16.7','Rom.16.7','Q262766','Junia','Junia','https://www.wikidata.org/entity/Q262766','wikidata-lastrevid:2530672389',1.000000),
  ('Keren-happuch_Job.42.14','Job.42.14','Q3201131','Keren-happuch','Keren-happu','https://www.wikidata.org/entity/Q3201131','wikidata-lastrevid:2530684643',0.952381),
  ('Keturah_Gen.25.1','Gen.25.1','Q908531','Keturah','Cetura','https://www.wikidata.org/entity/Q908531','wikidata-lastrevid:2530703837',1.000000),
  ('Kish_1Ch.23.21','1Ch.23.21','Q2915270','Kish','Kish','https://www.wikidata.org/entity/Q2915270','wikidata-lastrevid:2530673195',1.000000),
  ('Kish_1Sa.9.1','1Sa.9.1','Q2915270','Kish','Kish','https://www.wikidata.org/entity/Q2915270','wikidata-lastrevid:2530673195',1.000000),
  ('Kish_2Ch.29.12','2Ch.29.12','Q2915270','Kish','Kish','https://www.wikidata.org/entity/Q2915270','wikidata-lastrevid:2530673195',1.000000),
  ('Kish_Est.2.5','Est.2.5','Q2915270','Kish','Kish','https://www.wikidata.org/entity/Q2915270','wikidata-lastrevid:2530673195',1.000000),
  ('Kohath_Gen.46.11','Gen.46.11','Q2914557','Kohath','Kohath','https://www.wikidata.org/entity/Q2914557','wikidata-lastrevid:2530684173',1.000000),
  ('Korah_1Ch.2.43','1Ch.2.43','Q1337316','Korah','Coré','https://www.wikidata.org/entity/Q1337316','wikidata-lastrevid:2530664938',0.750000),
  ('Korah_Exo.6.21','Exo.6.21','Q1337316','Korah','Coré','https://www.wikidata.org/entity/Q1337316','wikidata-lastrevid:2530664938',0.750000),
  ('Korah_Gen.36.16','Gen.36.16','Q1337316','Korah','Coré','https://www.wikidata.org/entity/Q1337316','wikidata-lastrevid:2530664938',0.750000),
  ('Korah_Gen.36.5','Gen.36.5','Q1337316','Korah','Coré','https://www.wikidata.org/entity/Q1337316','wikidata-lastrevid:2530664938',0.750000),
  ('Laban_Gen.24.29','Gen.24.29','Q840401','Laban','Labán','https://www.wikidata.org/entity/Q840401','wikidata-lastrevid:2533271291',1.000000),
  ('Leah_Gen.29.16','Gen.29.16','Q128847','Leah','Lea','https://www.wikidata.org/entity/Q128847','wikidata-lastrevid:2530663742',1.000000),
  ('Levi_Gen.29.34','Gen.29.34','Q215512','Levi','Leví','https://www.wikidata.org/entity/Q215512','wikidata-lastrevid:2532028935',1.000000),
  ('Levi_Luk.3.24','Luk.3.24','Q215512','Levi','Leví','https://www.wikidata.org/entity/Q215512','wikidata-lastrevid:2532028935',1.000000),
  ('Levi_Luk.3.29','Luk.3.29','Q215512','Levi','Leví','https://www.wikidata.org/entity/Q215512','wikidata-lastrevid:2532028935',1.000000),
  ('Lois_2Ti.1.5','2Ti.1.5','Q25344412','Lois','Lois','https://www.wikidata.org/entity/Q25344412','wikidata-lastrevid:2530671897',1.000000),
  ('Lot_Gen.11.27','Gen.11.27','Q40574','Lot','Lot','https://www.wikidata.org/entity/Q40574','wikidata-lastrevid:2532895744',1.000000),
  ('Magog_Gen.10.2','Gen.10.2','Q1964706','Magog','Magog','https://www.wikidata.org/entity/Q1964706','wikidata-lastrevid:2530683049',1.000000)
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
   'batch_id','fase_h_es_nombres_wikidata_safe_v4_008_20260820',
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
