-- — FASE H / Bloque 3 — nombres propios TIPNR + Wikidata + gate bíblico español.
-- Chunk 004; candidatos=40.
-- Gate estructural auditado; aplicación insert-only reversible.
-- La referencia ancla se usa SOLO para confirmar la grafía española, no como significado.
-- Gate: source_gloss debe representar exactamente la misma entidad a ambos lados de ».
-- Gate: la etiqueta española debe aparecer como frase completa en >= 2 fuentes españolas verificadas.
-- Política futura: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta si se activa:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nombres_wikidata_anchor2_004_20260820';

with map(tipnr_id, anchor_ref, wikidata_id, english_label, display_gloss_es, source_uri, source_revision) as (
 values
  ('Cush_Psa.7.1','Psa.7.1','Q1138595','Cush','Kush','https://www.wikidata.org/entity/Q1138595','wikidata-lastrevid:2530654600'),
  ('Damaris_Act.17.34','Act.17.34','Q466687','Damaris','Damaris','https://www.wikidata.org/entity/Q466687','wikidata-lastrevid:2530686802'),
  ('Dan_Gen.30.6','Gen.30.6','Q550869','Dan','Dan','https://www.wikidata.org/entity/Q550869','wikidata-lastrevid:2531451278'),
  ('Daniel_Ezk.14.14','Ezk.14.14','Q171724','Daniel','Daniel','https://www.wikidata.org/entity/Q171724','wikidata-lastrevid:2533005874'),
  ('Daniel_Ezr.8.2','Ezr.8.2','Q171724','Daniel','Daniel','https://www.wikidata.org/entity/Q171724','wikidata-lastrevid:2533005874'),
  ('Darius_Dan.5.31','Dan.5.31','Q603176','Darius the Mede','Darío el Medo','https://www.wikidata.org/entity/Q603176','wikidata-lastrevid:2528835739'),
  ('Darius_Ezr.4.5','Ezr.4.5','Q603176','Darius the Mede','Darío el Medo','https://www.wikidata.org/entity/Q603176','wikidata-lastrevid:2528835739'),
  ('Darius_Neh.12.22','Neh.12.22','Q603176','Darius the Mede','Darío el Medo','https://www.wikidata.org/entity/Q603176','wikidata-lastrevid:2528835739'),
  ('Dathan_Num.16.1','Num.16.1','Q2238834','Dathan','Datán','https://www.wikidata.org/entity/Q2238834','wikidata-lastrevid:2530669873'),
  ('David_Rut.4.17','Rut.4.17','Q41370','David','David','https://www.wikidata.org/entity/Q41370','wikidata-lastrevid:2533006072'),
  ('Delilah_Jdg.16.4','Jdg.16.4','Q937827','Delilah','Dalila','https://www.wikidata.org/entity/Q937827','wikidata-lastrevid:2533006785'),
  ('Demas_Col.4.14','Col.4.14','Q1185201','Demas','Demas','https://www.wikidata.org/entity/Q1185201','wikidata-lastrevid:2530658551'),
  ('Dinah_Gen.30.21','Gen.30.21','Q122035','Dinah','Dina','https://www.wikidata.org/entity/Q122035','wikidata-lastrevid:2530659747'),
  ('Diotrephes_3Jn.1.9','3Jn.1.9','Q659399','Diotrephes','Diótrefes','https://www.wikidata.org/entity/Q659399','wikidata-lastrevid:2530699859'),
  ('Dumah_Gen.25.14','Gen.25.14','Q5313606','Dumah','Dumah','https://www.wikidata.org/entity/Q5313606','wikidata-lastrevid:2530687535'),
  ('Eber_1Ch.8.12','1Ch.8.12','Q502282','Eber','Eber','https://www.wikidata.org/entity/Q502282','wikidata-lastrevid:2530676655'),
  ('Eber_Neh.12.20','Neh.12.20','Q502282','Eber','Eber','https://www.wikidata.org/entity/Q502282','wikidata-lastrevid:2530676655'),
  ('Eglah_2Sa.3.5','2Sa.3.5','Q12630462','Eglah','Egla','https://www.wikidata.org/entity/Q12630462','wikidata-lastrevid:2530661366'),
  ('Eglon_Jdg.3.12','Jdg.3.12','Q2662239','Eglon','Eglón','https://www.wikidata.org/entity/Q2662239','wikidata-lastrevid:2530683736'),
  ('Ehud_1Ch.7.10','1Ch.7.10','Q1300996','Ehud','Aod','https://www.wikidata.org/entity/Q1300996','wikidata-lastrevid:2530664193'),
  ('Ehud_Jdg.3.15','Jdg.3.15','Q1300996','Ehud','Aod','https://www.wikidata.org/entity/Q1300996','wikidata-lastrevid:2530664193'),
  ('Elah_1Ch.4.15','1Ch.4.15','Q319020','Elah','Ela','https://www.wikidata.org/entity/Q319020','wikidata-lastrevid:2530694512'),
  ('Elah_1Ch.9.8','1Ch.9.8','Q319020','Elah','Ela','https://www.wikidata.org/entity/Q319020','wikidata-lastrevid:2530694512'),
  ('Elah_1Ki.16.6','1Ki.16.6','Q319020','Elah','Ela','https://www.wikidata.org/entity/Q319020','wikidata-lastrevid:2530694512'),
  ('Elah_2Ki.15.30','2Ki.15.30','Q319020','Elah','Ela','https://www.wikidata.org/entity/Q319020','wikidata-lastrevid:2530694512'),
  ('Elah_Gen.36.41','Gen.36.41','Q319020','Elah','Ela','https://www.wikidata.org/entity/Q319020','wikidata-lastrevid:2530694512'),
  ('Eldad_Num.11.26','Num.11.26','Q56473842','Eldad','Eldad','https://www.wikidata.org/entity/Q56473842','wikidata-lastrevid:2307661679'),
  ('Eli_1Sa.1.3','1Sa.1.3','Q362021','Eli','Elí','https://www.wikidata.org/entity/Q362021','wikidata-lastrevid:2530685268'),
  ('Eli_Mat.27.46','Mat.27.46','Q362021','Eli','Elí','https://www.wikidata.org/entity/Q362021','wikidata-lastrevid:2530685268'),
  ('Eliada_2Ch.17.17','2Ch.17.17','Q9252681','Eliada','Eliada','https://www.wikidata.org/entity/Q9252681','wikidata-lastrevid:2530704024'),
  ('Eliada_2Sa.5.16','2Sa.5.16','Q9252681','Eliada','Eliada','https://www.wikidata.org/entity/Q9252681','wikidata-lastrevid:2530704024'),
  ('Elihu_1Ch.12.20','1Ch.12.20','Q471388','Elihu','Elihu','https://www.wikidata.org/entity/Q471388','wikidata-lastrevid:2530696959'),
  ('Elihu_1Ch.26.7','1Ch.26.7','Q471388','Elihu','Elihu','https://www.wikidata.org/entity/Q471388','wikidata-lastrevid:2530696959'),
  ('Elihu_1Ch.27.18','1Ch.27.18','Q471388','Elihu','Elihu','https://www.wikidata.org/entity/Q471388','wikidata-lastrevid:2530696959'),
  ('Elihu_1Sa.1.1','1Sa.1.1','Q471388','Elihu','Elihu','https://www.wikidata.org/entity/Q471388','wikidata-lastrevid:2530696959'),
  ('Elihu_Job.32.2','Job.32.2','Q471388','Elihu','Elihu','https://www.wikidata.org/entity/Q471388','wikidata-lastrevid:2530696959'),
  ('Elijah_Ezr.10.21','Ezr.10.21','Q133507','Elijah','Elías','https://www.wikidata.org/entity/Q133507','wikidata-lastrevid:2533011052'),
  ('Elishama_1Ch.2.41','1Ch.2.41','Q10271944','Elishama','Elisamá','https://www.wikidata.org/entity/Q10271944','wikidata-lastrevid:2530257706'),
  ('Elishama_2Ch.17.8','2Ch.17.8','Q10271944','Elishama','Elisamá','https://www.wikidata.org/entity/Q10271944','wikidata-lastrevid:2530257706'),
  ('Elishama_2Ki.25.25','2Ki.25.25','Q10271944','Elishama','Elisamá','https://www.wikidata.org/entity/Q10271944','wikidata-lastrevid:2530257706')
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
   'batch_id','fase_h_es_nombres_wikidata_anchor2_004_20260820',
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
