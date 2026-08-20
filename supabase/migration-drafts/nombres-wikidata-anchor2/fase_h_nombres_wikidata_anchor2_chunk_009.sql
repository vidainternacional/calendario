-- BORRADOR NO ACTIVO — FASE H / Bloque 3 — nombres propios TIPNR + Wikidata + gate bíblico español.
-- Chunk 009; candidatos=40.
-- No aplicar sin auditoría read-only del lote.
-- La referencia ancla se usa SOLO para confirmar la grafía española, no como significado.
-- Gate: source_gloss debe representar exactamente la misma entidad a ambos lados de ».
-- Gate: la etiqueta española debe aparecer como frase completa en >= 2 fuentes españolas verificadas.
-- Política futura: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta si se activa:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nombres_wikidata_anchor2_009_20260820';

with map(tipnr_id, anchor_ref, wikidata_id, english_label, display_gloss_es, source_uri, source_revision) as (
 values
  ('Korah_Exo.6.21','Exo.6.21','Q1337316','Korah','Coré','https://www.wikidata.org/entity/Q1337316','wikidata-lastrevid:2530664938'),
  ('Korah_Gen.36.16','Gen.36.16','Q1337316','Korah','Coré','https://www.wikidata.org/entity/Q1337316','wikidata-lastrevid:2530664938'),
  ('Korah_Gen.36.5','Gen.36.5','Q1337316','Korah','Coré','https://www.wikidata.org/entity/Q1337316','wikidata-lastrevid:2530664938'),
  ('Laban_Gen.24.29','Gen.24.29','Q840401','Laban','Labán','https://www.wikidata.org/entity/Q840401','wikidata-lastrevid:2533271291'),
  ('Leah_Gen.29.16','Gen.29.16','Q128847','Leah','Lea','https://www.wikidata.org/entity/Q128847','wikidata-lastrevid:2530663742'),
  ('Levi_Gen.29.34','Gen.29.34','Q215512','Levi','Leví','https://www.wikidata.org/entity/Q215512','wikidata-lastrevid:2532028935'),
  ('Levi_Luk.3.24','Luk.3.24','Q215512','Levi','Leví','https://www.wikidata.org/entity/Q215512','wikidata-lastrevid:2532028935'),
  ('Levi_Luk.3.29','Luk.3.29','Q215512','Levi','Leví','https://www.wikidata.org/entity/Q215512','wikidata-lastrevid:2532028935'),
  ('Lois_2Ti.1.5','2Ti.1.5','Q25344412','Lois','Lois','https://www.wikidata.org/entity/Q25344412','wikidata-lastrevid:2530671897'),
  ('Lot_Gen.11.27','Gen.11.27','Q40574','Lot','Lot','https://www.wikidata.org/entity/Q40574','wikidata-lastrevid:2532895744'),
  ('Magog_Gen.10.2','Gen.10.2','Q1964706','Magog','Magog','https://www.wikidata.org/entity/Q1964706','wikidata-lastrevid:2530683049'),
  ('Mahlon_Rut.1.2','Rut.1.2','Q9026972','Mahlon','Mahlón','https://www.wikidata.org/entity/Q9026972','wikidata-lastrevid:2530701821'),
  ('Manoah_Jdg.13.2','Jdg.13.2','Q221514','Manoah','Manoa','https://www.wikidata.org/entity/Q221514','wikidata-lastrevid:2530669769'),
  ('Martha_Luk.10.38','Luk.10.38','Q232453','Martha','Marta de Betania','https://www.wikidata.org/entity/Q232453','wikidata-lastrevid:2530670453'),
  ('Mash_Gen.10.23','Gen.10.23','Q13418757','Mash','Mash','https://www.wikidata.org/entity/Q13418757','wikidata-lastrevid:2530665110'),
  ('Mattatha_Luk.3.31','Luk.3.31','Q19715666','Mattatha','Matata','https://www.wikidata.org/entity/Q19715666','wikidata-lastrevid:2530683082'),
  ('Matthew_Mat.9.9','Mat.9.9','Q43600','Matthew the Apostle','San Mateo','https://www.wikidata.org/entity/Q43600','wikidata-lastrevid:2533407625'),
  ('Medad_Num.11.26','Num.11.26','Q56473843','Medad','Medad','https://www.wikidata.org/entity/Q56473843','wikidata-lastrevid:2307662392'),
  ('Mehujael_Gen.4.18','Gen.4.18','Q10329365','Mehujael','Mehuiael','https://www.wikidata.org/entity/Q10329365','wikidata-lastrevid:2530258269'),
  ('Melchizedek_Gen.14.18','Gen.14.18','Q219395','Melchizedek','Melquisedec','https://www.wikidata.org/entity/Q219395','wikidata-lastrevid:2530669565'),
  ('Mephibosheth_2Sa.21.8','2Sa.21.8','Q851686','Mephibosheth','Mefiboset','https://www.wikidata.org/entity/Q851686','wikidata-lastrevid:2530701536'),
  ('Mephibosheth_2Sa.4.4','2Sa.4.4','Q851686','Mephibosheth','Mefiboset','https://www.wikidata.org/entity/Q851686','wikidata-lastrevid:2530701536'),
  ('Merari_Gen.46.11','Gen.46.11','Q2670550','Merari','Merari','https://www.wikidata.org/entity/Q2670550','wikidata-lastrevid:2530672709'),
  ('Mesha_1Ch.8.9','1Ch.8.9','Q350258','Mesha','Mesa (Rey de Moab)','https://www.wikidata.org/entity/Q350258','wikidata-lastrevid:2418142447'),
  ('Mesha_2Ki.3.4','2Ki.3.4','Q350258','Mesha','Mesa (Rey de Moab)','https://www.wikidata.org/entity/Q350258','wikidata-lastrevid:2418142447'),
  ('Methuselah_Gen.5.21','Gen.5.21','Q156290','Methuselah','Matusalén','https://www.wikidata.org/entity/Q156290','wikidata-lastrevid:2533411102'),
  ('Micah_1Ch.5.5','1Ch.5.5','Q2804969','Micah','Miqueas','https://www.wikidata.org/entity/Q2804969','wikidata-lastrevid:2533411241'),
  ('Micah_2Sa.9.12','2Sa.9.12','Q2804969','Micah','Miqueas','https://www.wikidata.org/entity/Q2804969','wikidata-lastrevid:2533411241'),
  ('Micah_Jdg.17.1','Jdg.17.1','Q2804969','Micah','Miqueas','https://www.wikidata.org/entity/Q2804969','wikidata-lastrevid:2533411241'),
  ('Micah_Jer.26.18','Jer.26.18','Q2804969','Micah','Miqueas','https://www.wikidata.org/entity/Q2804969','wikidata-lastrevid:2533411241'),
  ('Micaiah_1Ki.22.8','1Ki.22.8','Q1531578','Micaiah','Micaías','https://www.wikidata.org/entity/Q1531578','wikidata-lastrevid:2530690299'),
  ('Michal_1Sa.14.49','1Sa.14.49','Q1341397','Michal','Michal','https://www.wikidata.org/entity/Q1341397','wikidata-lastrevid:2532026427'),
  ('Midian_Gen.25.2','Gen.25.2','Q755316','Midian','Madián','https://www.wikidata.org/entity/Q755316','wikidata-lastrevid:2530702719'),
  ('Miriam_1Ch.4.17','1Ch.4.17','Q1938388','Miriam','Miriam','https://www.wikidata.org/entity/Q1938388','wikidata-lastrevid:2530692843'),
  ('Miriam_Exo.15.20','Exo.15.20','Q1938388','Miriam','Miriam','https://www.wikidata.org/entity/Q1938388','wikidata-lastrevid:2530692843'),
  ('Mishael_Dan.1.6','Dan.1.6','Q11343582','Meshach','Misael','https://www.wikidata.org/entity/Q11343582','wikidata-lastrevid:2530654392'),
  ('Mishael_Exo.6.22','Exo.6.22','Q11343582','Meshach','Misael','https://www.wikidata.org/entity/Q11343582','wikidata-lastrevid:2530654392'),
  ('Mishael_Neh.8.4','Neh.8.4','Q11343582','Meshach','Misael','https://www.wikidata.org/entity/Q11343582','wikidata-lastrevid:2530654392'),
  ('Mizzah_Gen.36.13','Gen.36.13','Q6884915','Mizzah','Mizzah','https://www.wikidata.org/entity/Q6884915','wikidata-lastrevid:2530678990'),
  ('Moab_Gen.19.37','Gen.19.37','Q1585141','Moab','Moab','https://www.wikidata.org/entity/Q1585141','wikidata-lastrevid:2530690713')
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
   'batch_id','fase_h_es_nombres_wikidata_anchor2_009_20260820',
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
