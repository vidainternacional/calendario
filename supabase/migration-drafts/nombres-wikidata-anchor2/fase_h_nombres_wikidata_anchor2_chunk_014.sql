-- BORRADOR NO ACTIVO — FASE H / Bloque 3 — nombres propios TIPNR + Wikidata + gate bíblico español.
-- Chunk 014; candidatos=26.
-- No aplicar sin auditoría read-only del lote.
-- La referencia ancla se usa SOLO para confirmar la grafía española, no como significado.
-- Gate: source_gloss debe representar exactamente la misma entidad a ambos lados de ».
-- Gate: la etiqueta inglesa primaria de Wikidata debe coincidir exactamente con esa entidad.
-- Gate: la etiqueta española debe aparecer como frase completa en >= 2 fuentes españolas verificadas.
-- Política futura: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta si se activa:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nombres_wikidata_anchor2_014_20260820';

with map(tipnr_id, anchor_ref, wikidata_id, english_label, display_gloss_es, source_uri, source_revision) as (
 values
  ('Zechariah_Ezr.5.1','Ezr.5.1','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277'),
  ('Zechariah_Ezr.8.11','Ezr.8.11','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277'),
  ('Zechariah_Ezr.8.16','Ezr.8.16','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277'),
  ('Zechariah_Ezr.8.3','Ezr.8.3','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277'),
  ('Zechariah_Isa.8.2','Isa.8.2','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277'),
  ('Zechariah_Neh.11.12','Neh.11.12','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277'),
  ('Zechariah_Neh.11.4','Neh.11.4','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277'),
  ('Zechariah_Neh.11.5','Neh.11.5','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277'),
  ('Zechariah_Neh.12.16','Neh.12.16','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277'),
  ('Zechariah_Neh.12.35','Neh.12.35','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277'),
  ('Zechariah_Neh.12.41','Neh.12.41','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277'),
  ('Zechariah_Neh.8.4','Neh.8.4','Q604259','Zechariah','Zacarías','https://www.wikidata.org/entity/Q604259','wikidata-lastrevid:2533482277'),
  ('Zedekiah_1Ch.3.16','1Ch.3.16','Q184273','Zedekiah','Sedecías de Judá','https://www.wikidata.org/entity/Q184273','wikidata-lastrevid:2530682366'),
  ('Zedekiah_1Ki.22.11','1Ki.22.11','Q184273','Zedekiah','Sedecías de Judá','https://www.wikidata.org/entity/Q184273','wikidata-lastrevid:2530682366'),
  ('Zedekiah_2Ki.24.17','2Ki.24.17','Q184273','Zedekiah','Sedecías de Judá','https://www.wikidata.org/entity/Q184273','wikidata-lastrevid:2530682366'),
  ('Zedekiah_Jer.29.21','Jer.29.21','Q184273','Zedekiah','Sedecías de Judá','https://www.wikidata.org/entity/Q184273','wikidata-lastrevid:2530682366'),
  ('Zedekiah_Jer.36.12','Jer.36.12','Q184273','Zedekiah','Sedecías de Judá','https://www.wikidata.org/entity/Q184273','wikidata-lastrevid:2530682366'),
  ('Zephaniah_2Ki.25.18','2Ki.25.18','Q1761359','Zephaniah','Sofonías','https://www.wikidata.org/entity/Q1761359','wikidata-lastrevid:2533482480'),
  ('Zephaniah_Zec.6.10','Zec.6.10','Q1761359','Zephaniah','Sofonías','https://www.wikidata.org/entity/Q1761359','wikidata-lastrevid:2533482480'),
  ('Zephaniah_Zep.1.1','Zep.1.1','Q1761359','Zephaniah','Sofonías','https://www.wikidata.org/entity/Q1761359','wikidata-lastrevid:2533482480'),
  ('Zerubbabel_1Ch.3.19','1Ch.3.19','Q320139','Zerubbabel','Zorobabel','https://www.wikidata.org/entity/Q320139','wikidata-lastrevid:2530684654'),
  ('Ziba_2Sa.9.2','2Sa.9.2','Q8071402','Ziba','Ziba','https://www.wikidata.org/entity/Q8071402','wikidata-lastrevid:2530703358'),
  ('Zibiah_2Ki.12.1','2Ki.12.1','Q8071446','Zibiah','Zibiah','https://www.wikidata.org/entity/Q8071446','wikidata-lastrevid:2530703341'),
  ('Zillah_Gen.4.19','Gen.4.19','Q203082','Zillah','Sila','https://www.wikidata.org/entity/Q203082','wikidata-lastrevid:2530693229'),
  ('Zipporah_Exo.2.21','Exo.2.21','Q205523','Zipporah','Séfora','https://www.wikidata.org/entity/Q205523','wikidata-lastrevid:2530693384'),
  ('Zophar_Job.2.11','Job.2.11','Q3867348','Zophar','Zofar','https://www.wikidata.org/entity/Q3867348','wikidata-lastrevid:2530675251')
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
   'batch_id','fase_h_es_nombres_wikidata_anchor2_014_20260820',
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
