-- BORRADOR NO ACTIVO — FASE H / Bloque 3 — nombres propios TIPNR + Wikidata + gate bíblico español.
-- Chunk 012; candidatos=40.
-- No aplicar sin auditoría read-only del lote.
-- La referencia ancla se usa SOLO para confirmar la grafía española, no como significado.
-- Gate: source_gloss debe representar exactamente la misma entidad a ambos lados de ».
-- Gate: la etiqueta inglesa primaria de Wikidata debe coincidir exactamente con esa entidad.
-- Gate: la etiqueta española debe aparecer como frase completa en >= 2 fuentes españolas verificadas.
-- Política futura: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta si se activa:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nombres_wikidata_anchor2_012_20260820';

with map(tipnr_id, anchor_ref, wikidata_id, english_label, display_gloss_es, source_uri, source_revision) as (
 values
  ('Sharezer_2Ki.19.37','2Ki.19.37','Q76383242','Nabu-shar-usur','Sharezer','https://www.wikidata.org/entity/Q76383242','wikidata-lastrevid:2490953171'),
  ('Shealtiel_1Ch.3.17','1Ch.3.17','Q2256348','Shealtiel','Salatiel','https://www.wikidata.org/entity/Q2256348','wikidata-lastrevid:2530669895'),
  ('Shebna_2Ki.18.18','2Ki.18.18','Q7492261','Shebna','Shebna','https://www.wikidata.org/entity/Q7492261','wikidata-lastrevid:2530700542'),
  ('Shechem_1Ch.7.19','1Ch.7.19','Q22054796','Shechem','Siquén','https://www.wikidata.org/entity/Q22054796','wikidata-lastrevid:2530669705'),
  ('Shechem_Num.26.31','Num.26.31','Q22054796','Shechem','Siquén','https://www.wikidata.org/entity/Q22054796','wikidata-lastrevid:2530669705'),
  ('Shem_Gen.5.32','Gen.5.32','Q200902','Shem','Sem','https://www.wikidata.org/entity/Q200902','wikidata-lastrevid:2532895882'),
  ('Shemaiah_1Ch.15.8','1Ch.15.8','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_1Ch.24.6','1Ch.24.6','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_1Ch.26.4','1Ch.26.4','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_1Ch.3.22','1Ch.3.22','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_1Ch.4.37','1Ch.4.37','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_1Ch.5.4','1Ch.5.4','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_1Ch.9.14','1Ch.9.14','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_1Ch.9.16','1Ch.9.16','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_1Ki.12.22','1Ki.12.22','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_2Ch.17.8','2Ch.17.8','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_2Ch.29.14','2Ch.29.14','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_2Ch.31.15','2Ch.31.15','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_2Ch.35.9','2Ch.35.9','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_Ezr.10.21','Ezr.10.21','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_Ezr.10.31','Ezr.10.31','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_Ezr.8.13','Ezr.8.13','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_Ezr.8.16','Ezr.8.16','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_Jer.26.20','Jer.26.20','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_Jer.29.24','Jer.29.24','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_Jer.36.12','Jer.36.12','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_Neh.10.8','Neh.10.8','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_Neh.12.35','Neh.12.35','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_Neh.12.36','Neh.12.36','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_Neh.12.42','Neh.12.42','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_Neh.3.29','Neh.3.29','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shemaiah_Neh.6.10','Neh.6.10','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703'),
  ('Shimon_1Ch.4.20','1Ch.4.20','Q33923','Saint Peter','Pedro','https://www.wikidata.org/entity/Q33923','wikidata-lastrevid:2533598212'),
  ('Shiphrah_Exo.1.15','Exo.1.15','Q767434','Shiphrah','Sifrá','https://www.wikidata.org/entity/Q767434','wikidata-lastrevid:2530700852'),
  ('Shishak_1Ki.11.40','1Ki.11.40','Q7499062','Shishak','Shishak','https://www.wikidata.org/entity/Q7499062','wikidata-lastrevid:2530702638'),
  ('Shobab_1Ch.2.18','1Ch.2.18','Q9352021','Sobab','Sobab','https://www.wikidata.org/entity/Q9352021','wikidata-lastrevid:2530704144'),
  ('Shobab_2Sa.5.14','2Sa.5.14','Q9352021','Sobab','Sobab','https://www.wikidata.org/entity/Q9352021','wikidata-lastrevid:2530704144'),
  ('Shuah_Gen.25.2','Gen.25.2','Q30226372','Bat Choua','Bat Choua','https://www.wikidata.org/entity/Q30226372','wikidata-lastrevid:2530679074'),
  ('Sisera_Ezr.2.53','Ezr.2.53','Q976765','Sisera','Sísara','https://www.wikidata.org/entity/Q976765','wikidata-lastrevid:2530702438'),
  ('Sisera_Jdg.4.2','Jdg.4.2','Q976765','Sisera','Sísara','https://www.wikidata.org/entity/Q976765','wikidata-lastrevid:2530702438')
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
   'batch_id','fase_h_es_nombres_wikidata_anchor2_012_20260820',
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
