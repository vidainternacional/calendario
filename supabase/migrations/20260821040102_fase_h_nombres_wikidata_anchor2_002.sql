-- — FASE H / Bloque 3 — nombres propios TIPNR + Wikidata + gate bíblico español.
-- Chunk 002; candidatos=40.
-- Gate estructural auditado; aplicación insert-only reversible.
-- La referencia ancla se usa SOLO para confirmar la grafía española, no como significado.
-- Gate: la etiqueta española debe aparecer como frase completa en >= 2 fuentes españolas verificadas.
-- Política futura: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta si se activa:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nombres_wikidata_anchor2_002_20260820';

with map(tipnr_id, anchor_ref, wikidata_id, english_label, display_gloss_es, source_uri, source_revision) as (
 values
  ('Amnon_1Ch.4.20','1Ch.4.20','Q361636','Amnon','Amnón','https://www.wikidata.org/entity/Q361636','wikidata-lastrevid:2532210162'),
  ('Amnon_2Sa.3.2','2Sa.3.2','Q361636','Amnon','Amnón','https://www.wikidata.org/entity/Q361636','wikidata-lastrevid:2532210162'),
  ('Amon_1Ki.22.26','1Ki.22.26','Q313423','Amon','Amón de Judà','https://www.wikidata.org/entity/Q313423','wikidata-lastrevid:2521278995'),
  ('Amon_2Ki.21.18','2Ki.21.18','Q313423','Amon','Amón de Judà','https://www.wikidata.org/entity/Q313423','wikidata-lastrevid:2521278995'),
  ('Amon_Jer.46.25','Jer.46.25','Q313423','Amon','Amón de Judà','https://www.wikidata.org/entity/Q313423','wikidata-lastrevid:2521278995'),
  ('Amos_Amo.1.1','Amo.1.1','Q213850','Amos','Amós','https://www.wikidata.org/entity/Q213850','wikidata-lastrevid:2532906057'),
  ('Amos_Luk.3.25','Luk.3.25','Q213850','Amos','Amós','https://www.wikidata.org/entity/Q213850','wikidata-lastrevid:2532906057'),
  ('Amram_Exo.6.18','Exo.6.18','Q477527','Amram','Amram','https://www.wikidata.org/entity/Q477527','wikidata-lastrevid:2531465499'),
  ('Amram_Ezr.10.34','Ezr.10.34','Q477527','Amram','Amram','https://www.wikidata.org/entity/Q477527','wikidata-lastrevid:2531465499'),
  ('Amraphel_Gen.14.1','Gen.14.1','Q2844493','Amraphel','Anrafel','https://www.wikidata.org/entity/Q2844493','wikidata-lastrevid:2530693889'),
  ('Anak_Num.13.22','Num.13.22','Q1812268','Anak','Anac','https://www.wikidata.org/entity/Q1812268','wikidata-lastrevid:2530692324'),
  ('Ananias_Act.23.2','Act.23.2','Q37946276','Ananias','Ananías','https://www.wikidata.org/entity/Q37946276','wikidata-lastrevid:2530674989'),
  ('Ananias_Act.5.1','Act.5.1','Q37946276','Ananias','Ananías','https://www.wikidata.org/entity/Q37946276','wikidata-lastrevid:2530674989'),
  ('Ananias_Act.9.10','Act.9.10','Q37946276','Ananias','Ananías','https://www.wikidata.org/entity/Q37946276','wikidata-lastrevid:2530674989'),
  ('Andrew_Mat.4.18','Mat.4.18','Q43399','Andrew the Apostle','Andrés el Apóstol','https://www.wikidata.org/entity/Q43399','wikidata-lastrevid:2532906688'),
  ('Aquila_Act.18.2','Act.18.2','Q46512139','Aquila','Aquila','https://www.wikidata.org/entity/Q46512139','wikidata-lastrevid:2528542114'),
  ('Archippus_Col.4.17','Col.4.17','Q468856','Archippus','Archippus','https://www.wikidata.org/entity/Q468856','wikidata-lastrevid:2530686822'),
  ('Arioch_Dan.2.14','Dan.2.14','Q2712606','Arioch','Arioch','https://www.wikidata.org/entity/Q2712606','wikidata-lastrevid:2530693587'),
  ('Arioch_Gen.14.1','Gen.14.1','Q2712606','Arioch','Arioch','https://www.wikidata.org/entity/Q2712606','wikidata-lastrevid:2530693587'),
  ('Armoni_2Sa.21.8','2Sa.21.8','Q40326679','Armoni','Armoni','https://www.wikidata.org/entity/Q40326679','wikidata-lastrevid:2317819867'),
  ('Asa_1Ch.9.16','1Ch.9.16','Q313415','Asa','Asa','https://www.wikidata.org/entity/Q313415','wikidata-lastrevid:2530684466'),
  ('Asa_1Ki.15.8','1Ki.15.8','Q313415','Asa','Asa','https://www.wikidata.org/entity/Q313415','wikidata-lastrevid:2530684466'),
  ('Asaph_1Ch.6.39','1Ch.6.39','Q43280403','Asaph','Asaf (músico)','https://www.wikidata.org/entity/Q43280403','wikidata-lastrevid:2531169773'),
  ('Asaph_1Ch.9.15','1Ch.9.15','Q43280403','Asaph','Asaf (músico)','https://www.wikidata.org/entity/Q43280403','wikidata-lastrevid:2531169773'),
  ('Asaph_2Ki.18.18','2Ki.18.18','Q43280403','Asaph','Asaf (músico)','https://www.wikidata.org/entity/Q43280403','wikidata-lastrevid:2531169773'),
  ('Asaph_Neh.2.8','Neh.2.8','Q43280403','Asaph','Asaf (músico)','https://www.wikidata.org/entity/Q43280403','wikidata-lastrevid:2531169773'),
  ('Asenath_Gen.41.45','Gen.41.45','Q723681','Asenath','Asenat','https://www.wikidata.org/entity/Q723681','wikidata-lastrevid:2530700353'),
  ('Athaliah_1Ch.8.26','1Ch.8.26','Q463934','Athaliah','Atalía','https://www.wikidata.org/entity/Q463934','wikidata-lastrevid:2530676149'),
  ('Athaliah_2Ki.8.26','2Ki.8.26','Q463934','Athaliah','Atalía','https://www.wikidata.org/entity/Q463934','wikidata-lastrevid:2530676149'),
  ('Athaliah_Ezr.8.7','Ezr.8.7','Q463934','Athaliah','Atalía','https://www.wikidata.org/entity/Q463934','wikidata-lastrevid:2530676149'),
  ('Azariah_1Ch.2.38','1Ch.2.38','Q313216','Uzziah','Uzías','https://www.wikidata.org/entity/Q313216','wikidata-lastrevid:2530684424'),
  ('Azariah_1Ch.2.8','1Ch.2.8','Q313216','Uzziah','Uzías','https://www.wikidata.org/entity/Q313216','wikidata-lastrevid:2530684424'),
  ('Azariah_1Ch.6.10','1Ch.6.10','Q313216','Uzziah','Uzías','https://www.wikidata.org/entity/Q313216','wikidata-lastrevid:2530684424'),
  ('Azariah_1Ch.6.13','1Ch.6.13','Q313216','Uzziah','Uzías','https://www.wikidata.org/entity/Q313216','wikidata-lastrevid:2530684424'),
  ('Azariah_1Ki.4.2','1Ki.4.2','Q313216','Uzziah','Uzías','https://www.wikidata.org/entity/Q313216','wikidata-lastrevid:2530684424'),
  ('Azariah_1Ki.4.5','1Ki.4.5','Q313216','Uzziah','Uzías','https://www.wikidata.org/entity/Q313216','wikidata-lastrevid:2530684424'),
  ('Azariah_2Ch.15.1','2Ch.15.1','Q313216','Uzziah','Uzías','https://www.wikidata.org/entity/Q313216','wikidata-lastrevid:2530684424'),
  ('Azariah_2Ch.26.17','2Ch.26.17','Q313216','Uzziah','Uzías','https://www.wikidata.org/entity/Q313216','wikidata-lastrevid:2530684424'),
  ('Azariah_2Ch.28.12','2Ch.28.12','Q313216','Uzziah','Uzías','https://www.wikidata.org/entity/Q313216','wikidata-lastrevid:2530684424'),
  ('Azariah_2Ch.31.10','2Ch.31.10','Q313216','Uzziah','Uzías','https://www.wikidata.org/entity/Q313216','wikidata-lastrevid:2530684424')
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
 'tipnr_wikidata_spanish_anchor_2source_v1',
 source_gloss,
 'verified_derived',
 jsonb_build_object(
   'phase','FASE_H_BLOQUE_3',
   'batch_id','fase_h_es_nombres_wikidata_anchor2_002_20260820',
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
   'anchor_used_for_name_spelling_only',true,
   'context_used_as_meaning',false,
   'rv1909_used_as_meaning',false,
   'strong_number',strong_number
 )
from eligible
on conflict (lexical_entry_id) do nothing;
