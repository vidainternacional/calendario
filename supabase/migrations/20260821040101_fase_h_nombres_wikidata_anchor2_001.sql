-- — FASE H / Bloque 3 — nombres propios TIPNR + Wikidata + gate bíblico español.
-- Chunk 001; candidatos=40.
-- Gate estructural auditado; aplicación insert-only reversible.
-- La referencia ancla se usa SOLO para confirmar la grafía española, no como significado.
-- Gate: source_gloss debe representar exactamente la misma entidad a ambos lados de ».
-- Gate: la etiqueta española debe aparecer como frase completa en >= 2 fuentes españolas verificadas.
-- Política futura: insert-only + ON CONFLICT DO NOTHING.
-- Reversión exacta si se activa:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nombres_wikidata_anchor2_001_20260820';

with map(tipnr_id, anchor_ref, wikidata_id, english_label, display_gloss_es, source_uri, source_revision) as (
 values
  ('Aaron_Exo.4.14','Exo.4.14','Q51676','Aaron','Aarón','https://www.wikidata.org/entity/Q51676','wikidata-lastrevid:2530697539'),
  ('Abdon_1Ch.8.23','1Ch.8.23','Q308320','Abdon','Abdón','https://www.wikidata.org/entity/Q308320','wikidata-lastrevid:2530694381'),
  ('Abdon_1Ch.8.30','1Ch.8.30','Q308320','Abdon','Abdón','https://www.wikidata.org/entity/Q308320','wikidata-lastrevid:2530694381'),
  ('Abdon_Jdg.12.13','Jdg.12.13','Q308320','Abdon','Abdón','https://www.wikidata.org/entity/Q308320','wikidata-lastrevid:2530694381'),
  ('Abel_Gen.4.2','Gen.4.2','Q313421','Abel','Abel','https://www.wikidata.org/entity/Q313421','wikidata-lastrevid:2530684437'),
  ('Abiathar_1Sa.22.20','1Sa.22.20','Q321804','Abiathar','Abiatar','https://www.wikidata.org/entity/Q321804','wikidata-lastrevid:2530684693'),
  ('Abidan_Num.1.11','Num.1.11','Q3494535','Abidan','Abidán','https://www.wikidata.org/entity/Q3494535','wikidata-lastrevid:2530694881'),
  ('Abihud_1Ch.8.3','1Ch.8.3','Q321170','Abiud','Abiud','https://www.wikidata.org/entity/Q321170','wikidata-lastrevid:2530694547'),
  ('Abishag_1Ki.1.3','1Ki.1.3','Q321469','Avishag','Abisag','https://www.wikidata.org/entity/Q321469','wikidata-lastrevid:2533397844'),
  ('Abishai_1Sa.26.6','1Sa.26.6','Q1154317','Abishai','Abisai','https://www.wikidata.org/entity/Q1154317','wikidata-lastrevid:2530942436'),
  ('Abishur_1Ch.2.28','1Ch.2.28','Q4667955','Abishur','Abishur','https://www.wikidata.org/entity/Q4667955','wikidata-lastrevid:2530696879'),
  ('Abiud_Mat.1.13','Mat.1.13','Q321170','Abiud','Abiud','https://www.wikidata.org/entity/Q321170','wikidata-lastrevid:2530694547'),
  ('Abner_1Sa.14.50','1Sa.14.50','Q1133337','Abner','Abner','https://www.wikidata.org/entity/Q1133337','wikidata-lastrevid:2530654286'),
  ('Abraham_Gen.11.26','Gen.11.26','Q9181','Abraham','Abraham','https://www.wikidata.org/entity/Q9181','wikidata-lastrevid:2532896226'),
  ('Absalom_2Sa.3.3','2Sa.3.3','Q205372','Absalom','Absalón','https://www.wikidata.org/entity/Q205372','wikidata-lastrevid:2530693389'),
  ('Achaicus_1Co.16.17','1Co.16.17','Q982939','Achaicus of Corinth','Acaico de Corinto','https://www.wikidata.org/entity/Q982939','wikidata-lastrevid:2487138141'),
  ('Achish_1Sa.21.10','1Sa.21.10','Q167185','Achish','Achish','https://www.wikidata.org/entity/Q167185','wikidata-lastrevid:2530691517'),
  ('Adam_Gen.2.19','Gen.2.19','Q70899','Adam','Adán','https://www.wikidata.org/entity/Q70899','wikidata-lastrevid:2532887427'),
  ('Adoni-zedek_Jos.10.1','Jos.10.1','Q2468894','Adonizedek','Adonisedec','https://www.wikidata.org/entity/Q2468894','wikidata-lastrevid:2530671423'),
  ('Adonijah_2Ch.17.8','2Ch.17.8','Q360378','Adonijah','Adonías','https://www.wikidata.org/entity/Q360378','wikidata-lastrevid:2530695049'),
  ('Adonijah_2Sa.3.4','2Sa.3.4','Q360378','Adonijah','Adonías','https://www.wikidata.org/entity/Q360378','wikidata-lastrevid:2530695049'),
  ('Adonijah_Neh.10.16','Neh.10.16','Q360378','Adonijah','Adonías','https://www.wikidata.org/entity/Q360378','wikidata-lastrevid:2530695049'),
  ('Adriel_1Sa.18.19','1Sa.18.19','Q2825091','Adriel','Adriel','https://www.wikidata.org/entity/Q2825091','wikidata-lastrevid:2530693861'),
  ('Aeneas_Act.9.33','Act.9.33','Q3725177','Aeneas','Eneas (Biblia)','https://www.wikidata.org/entity/Q3725177','wikidata-lastrevid:2530695605'),
  ('Agag_1Sa.15.8','1Sa.15.8','Q390086','Agag','Agag','https://www.wikidata.org/entity/Q390086','wikidata-lastrevid:2530695936'),
  ('Agag_Num.24.7','Num.24.7','Q390086','Agag','Agag','https://www.wikidata.org/entity/Q390086','wikidata-lastrevid:2530695936'),
  ('Ahasbai_2Sa.23.34','2Sa.23.34','Q8183672','Ahasbai','Aasbai','https://www.wikidata.org/entity/Q8183672','wikidata-lastrevid:2530701294'),
  ('Ahaz_1Ch.8.35','1Ch.8.35','Q30914','Ahaz','Ajaz','https://www.wikidata.org/entity/Q30914','wikidata-lastrevid:2521171599'),
  ('Ahinoam_1Sa.14.50','1Sa.14.50','Q400266','Ahinoam','Ahinoam','https://www.wikidata.org/entity/Q400266','wikidata-lastrevid:2530696067'),
  ('Ahinoam_1Sa.25.43','1Sa.25.43','Q400266','Ahinoam','Ahinoam','https://www.wikidata.org/entity/Q400266','wikidata-lastrevid:2530696067'),
  ('Almodad_Gen.10.26','Gen.10.26','Q2905798','Almodad','Almodad','https://www.wikidata.org/entity/Q2905798','wikidata-lastrevid:2530684172'),
  ('Amalek_Gen.36.12','Gen.36.12','Q372091','Amalek','Amalec','https://www.wikidata.org/entity/Q372091','wikidata-lastrevid:2530695617'),
  ('Amasa_2Ch.28.12','2Ch.28.12','Q2689456','Amasa','Amasa','https://www.wikidata.org/entity/Q2689456','wikidata-lastrevid:2530683760'),
  ('Amasa_2Sa.17.25','2Sa.17.25','Q2689456','Amasa','Amasa','https://www.wikidata.org/entity/Q2689456','wikidata-lastrevid:2530683760'),
  ('Amittai_2Ki.14.25','2Ki.14.25','Q4746955','Amittai','Amittai','https://www.wikidata.org/entity/Q4746955','wikidata-lastrevid:2530676343'),
  ('Ammihud_1Ch.9.4','1Ch.9.4','Q85852675','Ammihud','Amihud','https://www.wikidata.org/entity/Q85852675','wikidata-lastrevid:2530703618'),
  ('Ammihud_Num.1.10','Num.1.10','Q85852675','Ammihud','Amihud','https://www.wikidata.org/entity/Q85852675','wikidata-lastrevid:2530703618'),
  ('Ammihud_Num.34.20','Num.34.20','Q85852675','Ammihud','Amihud','https://www.wikidata.org/entity/Q85852675','wikidata-lastrevid:2530703618'),
  ('Ammihud_Num.34.28','Num.34.28','Q85852675','Ammihud','Amihud','https://www.wikidata.org/entity/Q85852675','wikidata-lastrevid:2530703618'),
  ('Amminadab_1Ch.15.10','1Ch.15.10','Q2038223','Amminadab','Aminadab','https://www.wikidata.org/entity/Q2038223','wikidata-lastrevid:2530693302')
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
   'batch_id','fase_h_es_nombres_wikidata_anchor2_001_20260820',
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
