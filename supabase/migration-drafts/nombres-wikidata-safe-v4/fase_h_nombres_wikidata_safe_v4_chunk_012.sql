-- BORRADOR NO ACTIVO — FASE H / Bloque 3 — nombres propios TIPNR + Wikidata, gate seguro v4.
-- Chunk 012; candidatos seguros=40.
-- No aplicar sin auditoría read-only del lote.
-- La referencia ancla se usa SOLO para confirmar la grafía española, no como significado.
-- Gate: source_gloss debe representar exactamente la misma entidad a ambos lados de ».
-- Gate: la etiqueta inglesa primaria de Wikidata debe coincidir exactamente con esa entidad.
-- Gate: similitud fonética conservadora inglés/español >= 0.55.
-- Gate: la etiqueta española debe aparecer como frase completa en >= 2 fuentes españolas verificadas.
-- Política futura: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta si se activa:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nombres_wikidata_safe_v4_012_20260820';

with map(tipnr_id, anchor_ref, wikidata_id, english_label, display_gloss_es, source_uri, source_revision, name_similarity) as (
 values
  ('Shemaiah_Ezr.10.31','Ezr.10.31','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703',1.000000),
  ('Shemaiah_Ezr.8.13','Ezr.8.13','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703',1.000000),
  ('Shemaiah_Ezr.8.16','Ezr.8.16','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703',1.000000),
  ('Shemaiah_Jer.26.20','Jer.26.20','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703',1.000000),
  ('Shemaiah_Jer.29.24','Jer.29.24','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703',1.000000),
  ('Shemaiah_Jer.36.12','Jer.36.12','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703',1.000000),
  ('Shemaiah_Neh.10.8','Neh.10.8','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703',1.000000),
  ('Shemaiah_Neh.12.35','Neh.12.35','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703',1.000000),
  ('Shemaiah_Neh.12.36','Neh.12.36','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703',1.000000),
  ('Shemaiah_Neh.12.42','Neh.12.42','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703',1.000000),
  ('Shemaiah_Neh.3.29','Neh.3.29','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703',1.000000),
  ('Shemaiah_Neh.6.10','Neh.6.10','Q2090113','Shemaiah','Shemaiah','https://www.wikidata.org/entity/Q2090113','wikidata-lastrevid:2530683703',1.000000),
  ('Shiphrah_Exo.1.15','Exo.1.15','Q767434','Shiphrah','Sifrá','https://www.wikidata.org/entity/Q767434','wikidata-lastrevid:2530700852',1.000000),
  ('Shishak_1Ki.11.40','1Ki.11.40','Q7499062','Shishak','Shishak','https://www.wikidata.org/entity/Q7499062','wikidata-lastrevid:2530702638',1.000000),
  ('Shobab_1Ch.2.18','1Ch.2.18','Q9352021','Sobab','Sobab','https://www.wikidata.org/entity/Q9352021','wikidata-lastrevid:2530704144',1.000000),
  ('Shobab_2Sa.5.14','2Sa.5.14','Q9352021','Sobab','Sobab','https://www.wikidata.org/entity/Q9352021','wikidata-lastrevid:2530704144',1.000000),
  ('Shuah_Gen.25.2','Gen.25.2','Q30226372','Bat Choua','Bat Choua','https://www.wikidata.org/entity/Q30226372','wikidata-lastrevid:2530679074',1.000000),
  ('Sisera_Ezr.2.53','Ezr.2.53','Q976765','Sisera','Sísara','https://www.wikidata.org/entity/Q976765','wikidata-lastrevid:2530702438',0.833333),
  ('Sisera_Jdg.4.2','Jdg.4.2','Q976765','Sisera','Sísara','https://www.wikidata.org/entity/Q976765','wikidata-lastrevid:2530702438',0.833333),
  ('Solomon_2Sa.5.14','2Sa.5.14','Q37085','Solomon','Salomón','https://www.wikidata.org/entity/Q37085','wikidata-lastrevid:2533451883',0.857143),
  ('Stephanas_1Co.1.16','1Co.1.16','Q7608188','Stephanas','Stephanas','https://www.wikidata.org/entity/Q7608188','wikidata-lastrevid:2530702736',1.000000),
  ('Tabitha_Act.9.36','Act.9.36','Q693055','Dorcas','Dorcas','https://www.wikidata.org/entity/Q693055','wikidata-lastrevid:2530689543',1.000000),
  ('Tahpenes_1Ki.11.19','1Ki.11.19','Q12058221','Tahpenes','Tahpenes','https://www.wikidata.org/entity/Q12058221','wikidata-lastrevid:2530659376',1.000000),
  ('Tertullus_Act.24.1','Act.24.1','Q3518955','Tertullus','Tertullus','https://www.wikidata.org/entity/Q3518955','wikidata-lastrevid:2530694902',1.000000),
  ('Theophilus_Luk.1.3','Luk.1.3','Q1384449','Theophilus','Teófilo','https://www.wikidata.org/entity/Q1384449','wikidata-lastrevid:2530666894',0.800000),
  ('Tibni_1Ki.16.21','1Ki.16.21','Q887994','Tibni','Tibni','https://www.wikidata.org/entity/Q887994','wikidata-lastrevid:2522152734',1.000000),
  ('Tidal_Gen.14.1','Gen.14.1','Q7800767','Tidal','Tidal','https://www.wikidata.org/entity/Q7800767','wikidata-lastrevid:2530700924',1.000000),
  ('Timaeus_Mrk.10.46','Mrk.10.46','Q41111704','Timaeus','Timeo','https://www.wikidata.org/entity/Q41111704','wikidata-lastrevid:2530675649',0.666667),
  ('Tobiah_Ezr.2.60','Ezr.2.60','Q1412773','Tobias','Tobías','https://www.wikidata.org/entity/Q1412773','wikidata-lastrevid:2530667507',1.000000),
  ('Tobiah_Neh.2.10','Neh.2.10','Q1412773','Tobias','Tobías','https://www.wikidata.org/entity/Q1412773','wikidata-lastrevid:2530667507',1.000000),
  ('Togarmah_Gen.10.3','Gen.10.3','Q1068499','Togarmah','Togarma','https://www.wikidata.org/entity/Q1068499','wikidata-lastrevid:2530259146',1.000000),
  ('Tubal-cain_Gen.4.22','Gen.4.22','Q1356181','Tubal-cain','Tubalcaín','https://www.wikidata.org/entity/Q1356181','wikidata-lastrevid:2530665354',1.000000),
  ('Tychicus_Act.20.4','Act.20.4','Q1396807','Tychicus','Tychicus','https://www.wikidata.org/entity/Q1396807','wikidata-lastrevid:2530667157',1.000000),
  ('Uzziah_1Ch.27.25','1Ch.27.25','Q313216','Uzziah','Uzías','https://www.wikidata.org/entity/Q313216','wikidata-lastrevid:2530684424',0.800000),
  ('Uzziah_1Ch.6.24','1Ch.6.24','Q313216','Uzziah','Uzías','https://www.wikidata.org/entity/Q313216','wikidata-lastrevid:2530684424',0.800000),
  ('Uzziah_2Ki.14.21','2Ki.14.21','Q313216','Uzziah','Uzías','https://www.wikidata.org/entity/Q313216','wikidata-lastrevid:2530684424',0.800000),
  ('Uzziah_Ezr.10.21','Ezr.10.21','Q313216','Uzziah','Uzías','https://www.wikidata.org/entity/Q313216','wikidata-lastrevid:2530684424',0.800000),
  ('Uzziah_Neh.11.4','Neh.11.4','Q313216','Uzziah','Uzías','https://www.wikidata.org/entity/Q313216','wikidata-lastrevid:2530684424',0.800000),
  ('Vashti_Est.1.9','Est.1.9','Q1889603','Vashti','Vasti','https://www.wikidata.org/entity/Q1889603','wikidata-lastrevid:2530682506',1.000000),
  ('Zabdi_1Ch.27.27','1Ch.27.27','Q11955533','Zabdi','Zabdí','https://www.wikidata.org/entity/Q11955533','wikidata-lastrevid:2530659001',1.000000)
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
   'batch_id','fase_h_es_nombres_wikidata_safe_v4_012_20260820',
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
