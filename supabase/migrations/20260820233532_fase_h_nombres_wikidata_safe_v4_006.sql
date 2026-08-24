-- BORRADOR NO ACTIVO — FASE H / Bloque 3 — nombres propios TIPNR + Wikidata, gate seguro v4.
-- Chunk 006; candidatos seguros=40.
-- No aplicar sin auditoría read-only del lote.
-- La referencia ancla se usa SOLO para confirmar la grafía española, no como significado.
-- Gate: source_gloss debe representar exactamente la misma entidad a ambos lados de ».
-- Gate: la etiqueta inglesa primaria de Wikidata debe coincidir exactamente con esa entidad.
-- Gate: similitud fonética conservadora inglés/español >= 0.55.
-- Gate: la etiqueta española debe aparecer como frase completa en >= 2 fuentes españolas verificadas.
-- Política futura: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta si se activa:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nombres_wikidata_safe_v4_006_20260820';

with map(tipnr_id, anchor_ref, wikidata_id, english_label, display_gloss_es, source_uri, source_revision, name_similarity) as (
 values
  ('Ham_Gen.5.32','Gen.5.32','Q229702','Ham','Cam','https://www.wikidata.org/entity/Q229702','wikidata-lastrevid:2532887711',0.666667),
  ('Haman_Est.3.1','Est.3.1','Q650680','Haman','Haman','https://www.wikidata.org/entity/Q650680','wikidata-lastrevid:2532887728',1.000000),
  ('Hannah_1Sa.1.2','1Sa.1.2','Q2346367','Hannah','Ana','https://www.wikidata.org/entity/Q2346367','wikidata-lastrevid:2530670632',0.750000),
  ('Hazarmaveth_Gen.10.26','Gen.10.26','Q2905463','Hazarmaveth','Hazarmaveth','https://www.wikidata.org/entity/Q2905463','wikidata-lastrevid:2530694053',1.000000),
  ('Hebron_1Ch.2.42','1Ch.2.42','Q1800542','Hebron','Hebrón (personaje bíblico)','https://www.wikidata.org/entity/Q1800542','wikidata-lastrevid:2530682119',1.000000),
  ('Hebron_Exo.6.18','Exo.6.18','Q1800542','Hebron','Hebrón (personaje bíblico)','https://www.wikidata.org/entity/Q1800542','wikidata-lastrevid:2530682119',1.000000),
  ('Heli_Luk.3.23','Luk.3.23','Q2474891','Heli','Helí','https://www.wikidata.org/entity/Q2474891','wikidata-lastrevid:2530671512',1.000000),
  ('Herodias_Mat.14.3','Mat.14.3','Q230091','Herodias','Herodías','https://www.wikidata.org/entity/Q230091','wikidata-lastrevid:2530670329',1.000000),
  ('Hezekiah_2Ki.16.20','2Ki.16.20','Q244912','Hezekiah','Ezequías','https://www.wikidata.org/entity/Q244912','wikidata-lastrevid:2533300228',0.857143),
  ('Hezekiah_Ezr.2.16','Ezr.2.16','Q244912','Hezekiah','Ezequías','https://www.wikidata.org/entity/Q244912','wikidata-lastrevid:2533300228',0.857143),
  ('Hoshea_1Ch.27.20','1Ch.27.20','Q7734','Joshua','Josué','https://www.wikidata.org/entity/Q7734','wikidata-lastrevid:2533331185',0.800000),
  ('Hoshea_2Ki.15.30','2Ki.15.30','Q7734','Joshua','Josué','https://www.wikidata.org/entity/Q7734','wikidata-lastrevid:2533331185',0.800000),
  ('Hoshea_Neh.10.23','Neh.10.23','Q7734','Joshua','Josué','https://www.wikidata.org/entity/Q7734','wikidata-lastrevid:2533331185',0.800000),
  ('Huldah_2Ki.22.14','2Ki.22.14','Q583207','Huldah','Hulda','https://www.wikidata.org/entity/Q583207','wikidata-lastrevid:2530677615',1.000000),
  ('Hur_1Ki.4.8','1Ki.4.8','Q492665','Hur','Hur','https://www.wikidata.org/entity/Q492665','wikidata-lastrevid:2530687146',1.000000),
  ('Hur_Exo.17.10','Exo.17.10','Q492665','Hur','Hur','https://www.wikidata.org/entity/Q492665','wikidata-lastrevid:2530687146',1.000000),
  ('Hur_Neh.3.9','Neh.3.9','Q492665','Hur','Hur','https://www.wikidata.org/entity/Q492665','wikidata-lastrevid:2530687146',1.000000),
  ('Hur_Num.31.8','Num.31.8','Q492665','Hur','Hur','https://www.wikidata.org/entity/Q492665','wikidata-lastrevid:2530687146',1.000000),
  ('Hushai_2Sa.15.32','2Sa.15.32','Q5949258','Hushai','Jusay','https://www.wikidata.org/entity/Q5949258','wikidata-lastrevid:2530698764',0.600000),
  ('Hymenaeus_1Ti.1.20','1Ti.1.20','Q16199754','Hymenaeus','Hymenaeus','https://www.wikidata.org/entity/Q16199754','wikidata-lastrevid:2530680789',1.000000),
  ('Ibzan_Jdg.12.8','Jdg.12.8','Q645796','Ibzan','Ibsan','https://www.wikidata.org/entity/Q645796','wikidata-lastrevid:2530699656',0.800000),
  ('Ichabod_1Sa.4.21','1Sa.4.21','Q4205417','Ichabod','Ichabod','https://www.wikidata.org/entity/Q4205417','wikidata-lastrevid:2530696317',1.000000),
  ('Irad_Gen.4.18','Gen.4.18','Q3364264','Irad','Irad','https://www.wikidata.org/entity/Q3364264','wikidata-lastrevid:2530684867',1.000000),
  ('Isaac_Gen.17.19','Gen.17.19','Q671872','Isaac','Isaac','https://www.wikidata.org/entity/Q671872','wikidata-lastrevid:2533318648',1.000000),
  ('Israel_Gen.25.26','Gen.25.26','Q289957','Jacob','Jacob','https://www.wikidata.org/entity/Q289957','wikidata-lastrevid:2533322677',1.000000),
  ('Issachar_1Ch.26.5','1Ch.26.5','Q651256','Issachar','Isacar','https://www.wikidata.org/entity/Q651256','wikidata-lastrevid:2533322535',0.923077),
  ('Issachar_Gen.30.18','Gen.30.18','Q651256','Issachar','Isacar','https://www.wikidata.org/entity/Q651256','wikidata-lastrevid:2533322535',0.923077),
  ('Ithamar_Exo.6.23','Exo.6.23','Q1675214','Ithamar','Itamar','https://www.wikidata.org/entity/Q1675214','wikidata-lastrevid:2530681228',1.000000),
  ('Ithream_2Sa.3.5','2Sa.3.5','Q11727237','Ithream','Itream','https://www.wikidata.org/entity/Q11727237','wikidata-lastrevid:2530658270',1.000000),
  ('Izhar_Exo.6.18','Exo.6.18','Q2210407','Izhar','Izhar','https://www.wikidata.org/entity/Q2210407','wikidata-lastrevid:2530669776',1.000000),
  ('Jabal_Gen.4.20','Gen.4.20','Q1676803','Jabal','Yabal','https://www.wikidata.org/entity/Q1676803','wikidata-lastrevid:2530691552',0.800000),
  ('Jabez_1Ch.4.9','1Ch.4.9','Q1676833','Jabez','Jabes (figura bíblica)','https://www.wikidata.org/entity/Q1676833','wikidata-lastrevid:2530691546',0.800000),
  ('Jael_Jdg.4.17','Jdg.4.17','Q954820','Yael','Jael','https://www.wikidata.org/entity/Q954820','wikidata-lastrevid:2533007841',0.750000),
  ('Jahaziel_1Ch.12.4','1Ch.12.4','Q1966067','Jahaziel','Jahaziel','https://www.wikidata.org/entity/Q1966067','wikidata-lastrevid:2530693015',1.000000),
  ('Jahaziel_1Ch.16.6','1Ch.16.6','Q1966067','Jahaziel','Jahaziel','https://www.wikidata.org/entity/Q1966067','wikidata-lastrevid:2530693015',1.000000),
  ('Jahaziel_1Ch.23.19','1Ch.23.19','Q1966067','Jahaziel','Jahaziel','https://www.wikidata.org/entity/Q1966067','wikidata-lastrevid:2530693015',1.000000),
  ('Jahaziel_2Ch.20.14','2Ch.20.14','Q1966067','Jahaziel','Jahaziel','https://www.wikidata.org/entity/Q1966067','wikidata-lastrevid:2530693015',1.000000),
  ('Jahaziel_Ezr.8.5','Ezr.8.5','Q1966067','Jahaziel','Jahaziel','https://www.wikidata.org/entity/Q1966067','wikidata-lastrevid:2530693015',1.000000),
  ('Jairus_Mrk.5.22','Mrk.5.22','Q325476','Jairus','Jairo','https://www.wikidata.org/entity/Q325476','wikidata-lastrevid:2530684723',0.727273),
  ('Japheth_Gen.5.32','Gen.5.32','Q200637','Japheth','Jafet','https://www.wikidata.org/entity/Q200637','wikidata-lastrevid:2532887755',1.000000)
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
   'batch_id','fase_h_es_nombres_wikidata_safe_v4_006_20260820',
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
