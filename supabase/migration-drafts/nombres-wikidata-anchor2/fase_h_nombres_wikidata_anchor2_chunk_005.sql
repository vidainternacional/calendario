-- BORRADOR NO ACTIVO — FASE H / Bloque 3 — nombres propios TIPNR + Wikidata + gate bíblico español.
-- Chunk 005; candidatos=40.
-- No aplicar sin auditoría read-only del lote.
-- La referencia ancla se usa SOLO para confirmar la grafía española, no como significado.
-- Gate: source_gloss debe representar exactamente la misma entidad a ambos lados de ».
-- Gate: la etiqueta inglesa primaria de Wikidata debe coincidir exactamente con esa entidad.
-- Gate: la etiqueta española debe aparecer como frase completa en >= 2 fuentes españolas verificadas.
-- Política futura: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta si se activa:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nombres_wikidata_anchor2_005_20260820';

with map(tipnr_id, anchor_ref, wikidata_id, english_label, display_gloss_es, source_uri, source_revision) as (
 values
  ('Elishama_2Sa.5.16','2Sa.5.16','Q10271944','Elishama','Elisamá','https://www.wikidata.org/entity/Q10271944','wikidata-lastrevid:2530257706'),
  ('Elishama_Jer.36.12','Jer.36.12','Q10271944','Elishama','Elisamá','https://www.wikidata.org/entity/Q10271944','wikidata-lastrevid:2530257706'),
  ('Elishama_Num.1.10','Num.1.10','Q10271944','Elishama','Elisamá','https://www.wikidata.org/entity/Q10271944','wikidata-lastrevid:2530257706'),
  ('Elisheba_Exo.6.23','Exo.6.23','Q2916801','Elisheba','Eliseba','https://www.wikidata.org/entity/Q2916801','wikidata-lastrevid:2530694096'),
  ('Elkanah_1Ch.12.6','1Ch.12.6','Q2424977','Elkanah','Elcaná','https://www.wikidata.org/entity/Q2424977','wikidata-lastrevid:2530671298'),
  ('Elkanah_1Ch.15.23','1Ch.15.23','Q2424977','Elkanah','Elcaná','https://www.wikidata.org/entity/Q2424977','wikidata-lastrevid:2530671298'),
  ('Elkanah_1Ch.6.25','1Ch.6.25','Q2424977','Elkanah','Elcaná','https://www.wikidata.org/entity/Q2424977','wikidata-lastrevid:2530671298'),
  ('Elkanah_1Ch.6.26','1Ch.6.26','Q2424977','Elkanah','Elcaná','https://www.wikidata.org/entity/Q2424977','wikidata-lastrevid:2530671298'),
  ('Elkanah_1Ch.9.16','1Ch.9.16','Q2424977','Elkanah','Elcaná','https://www.wikidata.org/entity/Q2424977','wikidata-lastrevid:2530671298'),
  ('Elkanah_1Sa.1.1','1Sa.1.1','Q2424977','Elkanah','Elcaná','https://www.wikidata.org/entity/Q2424977','wikidata-lastrevid:2530671298'),
  ('Elkanah_2Ch.28.7','2Ch.28.7','Q2424977','Elkanah','Elcaná','https://www.wikidata.org/entity/Q2424977','wikidata-lastrevid:2530671298'),
  ('Elkanah_Exo.6.24','Exo.6.24','Q2424977','Elkanah','Elcaná','https://www.wikidata.org/entity/Q2424977','wikidata-lastrevid:2530671298'),
  ('Epaphras_Col.1.7','Col.1.7','Q953527','Epaphras','Epafrás','https://www.wikidata.org/entity/Q953527','wikidata-lastrevid:2530702326'),
  ('Epher_1Ch.4.17','1Ch.4.17','Q5382171','Epher','Epher','https://www.wikidata.org/entity/Q5382171','wikidata-lastrevid:2530697741'),
  ('Epher_1Ch.5.24','1Ch.5.24','Q5382171','Epher','Epher','https://www.wikidata.org/entity/Q5382171','wikidata-lastrevid:2530697741'),
  ('Epher_Gen.25.4','Gen.25.4','Q5382171','Epher','Epher','https://www.wikidata.org/entity/Q5382171','wikidata-lastrevid:2530697741'),
  ('Ephraim_Gen.41.52','Gen.41.52','Q203251','Ephraim','Efraím','https://www.wikidata.org/entity/Q203251','wikidata-lastrevid:2530683402'),
  ('Ephron_Gen.23.8','Gen.23.8','Q6775384','Efron','Efrón','https://www.wikidata.org/entity/Q6775384','wikidata-lastrevid:2530689483'),
  ('Esau_Gen.25.25','Gen.25.25','Q220822','Esau','Esaú','https://www.wikidata.org/entity/Q220822','wikidata-lastrevid:2533011685'),
  ('Esther_Est.2.7','Est.2.7','Q732413','Esther','Ester','https://www.wikidata.org/entity/Q732413','wikidata-lastrevid:2533011705'),
  ('Ethan_1Ch.2.6','1Ch.2.6','Q1370913','Ethan','Etán','https://www.wikidata.org/entity/Q1370913','wikidata-lastrevid:2530666170'),
  ('Ethan_1Ki.4.31','1Ki.4.31','Q1370913','Ethan','Etán','https://www.wikidata.org/entity/Q1370913','wikidata-lastrevid:2530666170'),
  ('Eunice_2Ti.1.5','2Ti.1.5','Q1373978','Eunice','Eunice','https://www.wikidata.org/entity/Q1373978','wikidata-lastrevid:2530666275'),
  ('Eve_Gen.3.20','Gen.3.20','Q830183','Eve','Eva','https://www.wikidata.org/entity/Q830183','wikidata-lastrevid:2532887479'),
  ('Ezekiel_Ezk.1.3','Ezk.1.3','Q194064','Ezekiel','Ezequiel','https://www.wikidata.org/entity/Q194064','wikidata-lastrevid:2533012140'),
  ('Ezra_Ezr.7.1','Ezr.7.1','Q191787','Ezra','Esdras','https://www.wikidata.org/entity/Q191787','wikidata-lastrevid:2533012150'),
  ('Ezra_Neh.12.1','Neh.12.1','Q191787','Ezra','Esdras','https://www.wikidata.org/entity/Q191787','wikidata-lastrevid:2533012150'),
  ('Gaal_Jdg.9.26','Jdg.9.26','Q10287821','Gaal','Gaal (hijo de Ebed)','https://www.wikidata.org/entity/Q10287821','wikidata-lastrevid:2530258200'),
  ('Gaius_3Jn.1.1','3Jn.1.1','Q31283795','Gaius of Corinth','Cayo de Corinto','https://www.wikidata.org/entity/Q31283795','wikidata-lastrevid:2530674029'),
  ('Gaius_Act.19.29','Act.19.29','Q31283795','Gaius of Corinth','Cayo de Corinto','https://www.wikidata.org/entity/Q31283795','wikidata-lastrevid:2530674029'),
  ('Gaius_Act.20.4','Act.20.4','Q31283795','Gaius of Corinth','Cayo de Corinto','https://www.wikidata.org/entity/Q31283795','wikidata-lastrevid:2530674029'),
  ('Gaius_Rom.16.23','Rom.16.23','Q31283795','Gaius of Corinth','Cayo de Corinto','https://www.wikidata.org/entity/Q31283795','wikidata-lastrevid:2530674029'),
  ('Gedaliah_1Ch.25.3','1Ch.25.3','Q1497453','Gedaliah','Godolías','https://www.wikidata.org/entity/Q1497453','wikidata-lastrevid:2530679683'),
  ('Gedaliah_2Ki.25.22','2Ki.25.22','Q1497453','Gedaliah','Godolías','https://www.wikidata.org/entity/Q1497453','wikidata-lastrevid:2530679683'),
  ('Gedaliah_Ezr.10.18','Ezr.10.18','Q1497453','Gedaliah','Godolías','https://www.wikidata.org/entity/Q1497453','wikidata-lastrevid:2530679683'),
  ('Gedaliah_Jer.38.1','Jer.38.1','Q1497453','Gedaliah','Godolías','https://www.wikidata.org/entity/Q1497453','wikidata-lastrevid:2530679683'),
  ('Gedaliah_Zep.1.1','Zep.1.1','Q1497453','Gedaliah','Godolías','https://www.wikidata.org/entity/Q1497453','wikidata-lastrevid:2530679683'),
  ('Gehazi_2Ki.4.12','2Ki.4.12','Q977435','Gehazi','Giezi','https://www.wikidata.org/entity/Q977435','wikidata-lastrevid:2530704477'),
  ('Gershom_Exo.2.22','Exo.2.22','Q1514983','Gershom','Gershom','https://www.wikidata.org/entity/Q1514983','wikidata-lastrevid:2530690246'),
  ('Gershom_Ezr.8.2','Ezr.8.2','Q1514983','Gershom','Gershom','https://www.wikidata.org/entity/Q1514983','wikidata-lastrevid:2530690246')
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
   'batch_id','fase_h_es_nombres_wikidata_anchor2_005_20260820',
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
