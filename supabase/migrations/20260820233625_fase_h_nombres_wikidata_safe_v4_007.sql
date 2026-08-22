-- BORRADOR NO ACTIVO — FASE H / Bloque 3 — nombres propios TIPNR + Wikidata, gate seguro v4.
-- Chunk 007; candidatos seguros=40.
-- No aplicar sin auditoría read-only del lote.
-- La referencia ancla se usa SOLO para confirmar la grafía española, no como significado.
-- Gate: source_gloss debe representar exactamente la misma entidad a ambos lados de ».
-- Gate: la etiqueta inglesa primaria de Wikidata debe coincidir exactamente con esa entidad.
-- Gate: similitud fonética conservadora inglés/español >= 0.55.
-- Gate: la etiqueta española debe aparecer como frase completa en >= 2 fuentes españolas verificadas.
-- Política futura: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta si se activa:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nombres_wikidata_safe_v4_007_20260820';

with map(tipnr_id, anchor_ref, wikidata_id, english_label, display_gloss_es, source_uri, source_revision, name_similarity) as (
 values
  ('Jared_Gen.5.15','Gen.5.15','Q927410','Jared','Jared','https://www.wikidata.org/entity/Q927410','wikidata-lastrevid:2530702130',1.000000),
  ('Javan_Gen.10.2','Gen.10.2','Q1684266','Javan','Javan','https://www.wikidata.org/entity/Q1684266','wikidata-lastrevid:2530691576',1.000000),
  ('Jeduthun_1Ch.6.44','1Ch.6.44','Q3567244','Jeduthun','Jeduthun','https://www.wikidata.org/entity/Q3567244','wikidata-lastrevid:2530695019',1.000000),
  ('Jeduthun_1Ch.9.16','1Ch.9.16','Q3567244','Jeduthun','Jeduthun','https://www.wikidata.org/entity/Q3567244','wikidata-lastrevid:2530695019',1.000000),
  ('Jehoiachin_2Ki.24.6','2Ki.24.6','Q319049','Jeconiah','Jeconías de Judá','https://www.wikidata.org/entity/Q319049','wikidata-lastrevid:2530519953',0.666667),
  ('Jehoiakim_2Ki.23.34','2Ki.23.34','Q319034','Jehoiakim','Joaquim','https://www.wikidata.org/entity/Q319034','wikidata-lastrevid:2530519715',0.800000),
  ('Jehosheba_2Ki.11.2','2Ki.11.2','Q4202829','Jehosheba','Jehosheba','https://www.wikidata.org/entity/Q4202829','wikidata-lastrevid:2530686396',1.000000),
  ('Jehu_1Ch.12.3','1Ch.12.3','Q1686571','Jehu','Jehú (profeta)','https://www.wikidata.org/entity/Q1686571','wikidata-lastrevid:2530691579',1.000000),
  ('Jehu_1Ch.2.38','1Ch.2.38','Q1686571','Jehu','Jehú (profeta)','https://www.wikidata.org/entity/Q1686571','wikidata-lastrevid:2530691579',1.000000),
  ('Jehu_1Ch.4.35','1Ch.4.35','Q1686571','Jehu','Jehú (profeta)','https://www.wikidata.org/entity/Q1686571','wikidata-lastrevid:2530691579',1.000000),
  ('Jehu_1Ki.16.1','1Ki.16.1','Q1686571','Jehu','Jehú (profeta)','https://www.wikidata.org/entity/Q1686571','wikidata-lastrevid:2530691579',1.000000),
  ('Jehu_1Ki.19.16','1Ki.19.16','Q1686571','Jehu','Jehú (profeta)','https://www.wikidata.org/entity/Q1686571','wikidata-lastrevid:2530691579',1.000000),
  ('Jephthah_Jdg.11.1','Jdg.11.1','Q1133523','Jephthah','Jefté','https://www.wikidata.org/entity/Q1133523','wikidata-lastrevid:2530654379',0.800000),
  ('Jered_1Ch.4.18','1Ch.4.18','Q927410','Jared','Jared','https://www.wikidata.org/entity/Q927410','wikidata-lastrevid:2530702130',1.000000),
  ('Jeremiah_1Ch.12.10','1Ch.12.10','Q158825','Jeremiah','Jeremías','https://www.wikidata.org/entity/Q158825','wikidata-lastrevid:2533326960',0.933333),
  ('Jeremiah_1Ch.12.13','1Ch.12.13','Q158825','Jeremiah','Jeremías','https://www.wikidata.org/entity/Q158825','wikidata-lastrevid:2533326960',0.933333),
  ('Jeremiah_1Ch.12.4','1Ch.12.4','Q158825','Jeremiah','Jeremías','https://www.wikidata.org/entity/Q158825','wikidata-lastrevid:2533326960',0.933333),
  ('Jeremiah_1Ch.5.24','1Ch.5.24','Q158825','Jeremiah','Jeremías','https://www.wikidata.org/entity/Q158825','wikidata-lastrevid:2533326960',0.933333),
  ('Jeremiah_2Ch.35.25','2Ch.35.25','Q158825','Jeremiah','Jeremías','https://www.wikidata.org/entity/Q158825','wikidata-lastrevid:2533326960',0.933333),
  ('Jeremiah_2Ki.23.31','2Ki.23.31','Q158825','Jeremiah','Jeremías','https://www.wikidata.org/entity/Q158825','wikidata-lastrevid:2533326960',0.933333),
  ('Jeremiah_Jer.35.3','Jer.35.3','Q158825','Jeremiah','Jeremías','https://www.wikidata.org/entity/Q158825','wikidata-lastrevid:2533326960',0.933333),
  ('Jeremiah_Neh.10.2','Neh.10.2','Q158825','Jeremiah','Jeremías','https://www.wikidata.org/entity/Q158825','wikidata-lastrevid:2533326960',0.933333),
  ('Jesus_Mat.1.1','Mat.1.1','Q302','Jesus Christ','Jesús de Nazaret','https://www.wikidata.org/entity/Q302','wikidata-lastrevid:2532893739',0.583333),
  ('Jethro_Exo.2.18','Exo.2.18','Q62788','Jethro','Jetró','https://www.wikidata.org/entity/Q62788','wikidata-lastrevid:2530688884',1.000000),
  ('Jezebel_1Ki.16.31','1Ki.16.31','Q721295','Jezebel','Jezabel','https://www.wikidata.org/entity/Q721295','wikidata-lastrevid:2533327284',0.857143),
  ('Joab_1Ch.4.14','1Ch.4.14','Q1141064','Joab','Joab','https://www.wikidata.org/entity/Q1141064','wikidata-lastrevid:2530654801',1.000000),
  ('Joab_1Sa.26.6','1Sa.26.6','Q1141064','Joab','Joab','https://www.wikidata.org/entity/Q1141064','wikidata-lastrevid:2530654801',1.000000),
  ('Joab_Ezr.2.6','Ezr.2.6','Q1141064','Joab','Joab','https://www.wikidata.org/entity/Q1141064','wikidata-lastrevid:2530654801',1.000000),
  ('Joab_Ezr.8.9','Ezr.8.9','Q1141064','Joab','Joab','https://www.wikidata.org/entity/Q1141064','wikidata-lastrevid:2530654801',1.000000),
  ('Job_Job.1.1','Job.1.1','Q179962','Job','Job','https://www.wikidata.org/entity/Q179962','wikidata-lastrevid:2533327847',1.000000),
  ('Joel_1Ch.11.38','1Ch.11.38','Q20888416','Joel','Joel (hijo de Samuel)','https://www.wikidata.org/entity/Q20888416','wikidata-lastrevid:2530683709',1.000000),
  ('Joel_1Ch.15.7','1Ch.15.7','Q20888416','Joel','Joel (hijo de Samuel)','https://www.wikidata.org/entity/Q20888416','wikidata-lastrevid:2530683709',1.000000),
  ('Joel_1Ch.23.8','1Ch.23.8','Q20888416','Joel','Joel (hijo de Samuel)','https://www.wikidata.org/entity/Q20888416','wikidata-lastrevid:2530683709',1.000000),
  ('Joel_1Ch.27.20','1Ch.27.20','Q20888416','Joel','Joel (hijo de Samuel)','https://www.wikidata.org/entity/Q20888416','wikidata-lastrevid:2530683709',1.000000),
  ('Joel_1Ch.4.35','1Ch.4.35','Q20888416','Joel','Joel (hijo de Samuel)','https://www.wikidata.org/entity/Q20888416','wikidata-lastrevid:2530683709',1.000000),
  ('Joel_1Ch.5.12','1Ch.5.12','Q20888416','Joel','Joel (hijo de Samuel)','https://www.wikidata.org/entity/Q20888416','wikidata-lastrevid:2530683709',1.000000),
  ('Joel_1Ch.5.4','1Ch.5.4','Q20888416','Joel','Joel (hijo de Samuel)','https://www.wikidata.org/entity/Q20888416','wikidata-lastrevid:2530683709',1.000000),
  ('Joel_1Ch.5.8','1Ch.5.8','Q20888416','Joel','Joel (hijo de Samuel)','https://www.wikidata.org/entity/Q20888416','wikidata-lastrevid:2530683709',1.000000),
  ('Joel_1Ch.7.3','1Ch.7.3','Q20888416','Joel','Joel (hijo de Samuel)','https://www.wikidata.org/entity/Q20888416','wikidata-lastrevid:2530683709',1.000000),
  ('Joel_1Sa.8.2','1Sa.8.2','Q20888416','Joel','Joel (hijo de Samuel)','https://www.wikidata.org/entity/Q20888416','wikidata-lastrevid:2530683709',1.000000)
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
   'batch_id','fase_h_es_nombres_wikidata_safe_v4_007_20260820',
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
