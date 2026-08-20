-- BORRADOR NO ACTIVO — FASE H / Bloque 3 — nombres propios TIPNR + Wikidata, gate seguro v4.
-- Chunk 013; candidatos seguros=40.
-- No aplicar sin auditoría read-only del lote.
-- La referencia ancla se usa SOLO para confirmar la grafía española, no como significado.
-- Gate: source_gloss debe representar exactamente la misma entidad a ambos lados de ».
-- Gate: la etiqueta inglesa primaria de Wikidata debe coincidir exactamente con esa entidad.
-- Gate: similitud fonética conservadora inglés/español >= 0.55.
-- Gate: la etiqueta española debe aparecer como frase completa en >= 2 fuentes españolas verificadas.
-- Política futura: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta si se activa:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nombres_wikidata_safe_v4_013_20260820';

with map(tipnr_id, anchor_ref, wikidata_id, english_label, display_gloss_es, source_uri, source_revision, name_similarity) as (
 values
  ('Zabdi_1Ch.8.19','1Ch.8.19','Q11955533','Zabdi','Zabdí','https://www.wikidata.org/entity/Q11955533','wikidata-lastrevid:2530659001',1.000000),
  ('Zabdi_Jos.7.1','Jos.7.1','Q11955533','Zabdi','Zabdí','https://www.wikidata.org/entity/Q11955533','wikidata-lastrevid:2530659001',1.000000),
  ('Zebedee_Mat.4.21','Mat.4.21','Q169363','Zebedee','Zebedeo','https://www.wikidata.org/entity/Q169363','wikidata-lastrevid:2530691608',0.857143),
  ('Zebulun_Gen.30.20','Gen.30.20','Q614575','Zebulun','Zabulón','https://www.wikidata.org/entity/Q614575','wikidata-lastrevid:2530699251',0.714286),
  ('Zechariah_1Ch.24.25','1Ch.24.25','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_1Ch.26.11','1Ch.26.11','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_1Ch.27.21','1Ch.27.21','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_1Ch.5.7','1Ch.5.7','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_1Ch.9.21','1Ch.9.21','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_2Ch.17.7','2Ch.17.7','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_2Ch.20.14','2Ch.20.14','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_2Ch.21.2','2Ch.21.2','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_2Ch.24.20','2Ch.24.20','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_2Ch.26.5','2Ch.26.5','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_2Ch.29.13','2Ch.29.13','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_2Ch.34.12','2Ch.34.12','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_2Ch.35.8','2Ch.35.8','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_Ezr.10.26','Ezr.10.26','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_Ezr.5.1','Ezr.5.1','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_Ezr.8.11','Ezr.8.11','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_Ezr.8.16','Ezr.8.16','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_Ezr.8.3','Ezr.8.3','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_Isa.8.2','Isa.8.2','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_Neh.11.12','Neh.11.12','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_Neh.11.4','Neh.11.4','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_Neh.11.5','Neh.11.5','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_Neh.12.16','Neh.12.16','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_Neh.12.35','Neh.12.35','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_Neh.12.41','Neh.12.41','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zechariah_Neh.8.4','Neh.8.4','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277',0.800000),
  ('Zedekiah_1Ch.3.16','1Ch.3.16','Q184273','Zedekiah','Sedecías de Judá','https://www.wikidata.org/entity/Q184273','wikidata-lastrevid:2530682366',0.571429),
  ('Zedekiah_1Ki.22.11','1Ki.22.11','Q184273','Zedekiah','Sedecías de Judá','https://www.wikidata.org/entity/Q184273','wikidata-lastrevid:2530682366',0.571429),
  ('Zedekiah_2Ki.24.17','2Ki.24.17','Q184273','Zedekiah','Sedecías de Judá','https://www.wikidata.org/entity/Q184273','wikidata-lastrevid:2530682366',0.571429),
  ('Zedekiah_Jer.29.21','Jer.29.21','Q184273','Zedekiah','Sedecías de Judá','https://www.wikidata.org/entity/Q184273','wikidata-lastrevid:2530682366',0.571429),
  ('Zedekiah_Jer.36.12','Jer.36.12','Q184273','Zedekiah','Sedecías de Judá','https://www.wikidata.org/entity/Q184273','wikidata-lastrevid:2530682366',0.571429),
  ('Zerubbabel_1Ch.3.19','1Ch.3.19','Q320139','Zerubbabel','Zorobabel','https://www.wikidata.org/entity/Q320139','wikidata-lastrevid:2530684654',0.736842),
  ('Ziba_2Sa.9.2','2Sa.9.2','Q8071402','Ziba','Ziba','https://www.wikidata.org/entity/Q8071402','wikidata-lastrevid:2530703358',1.000000),
  ('Zibiah_2Ki.12.1','2Ki.12.1','Q8071446','Zibiah','Zibiah','https://www.wikidata.org/entity/Q8071446','wikidata-lastrevid:2530703341',1.000000),
  ('Zillah_Gen.4.19','Gen.4.19','Q203082','Zillah','Sila','https://www.wikidata.org/entity/Q203082','wikidata-lastrevid:2530693229',0.666667),
  ('Zophar_Job.2.11','Job.2.11','Q3867348','Zophar','Zofar','https://www.wikidata.org/entity/Q3867348','wikidata-lastrevid:2530675251',1.000000)
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
   'batch_id','fase_h_es_nombres_wikidata_safe_v4_013_20260820',
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
