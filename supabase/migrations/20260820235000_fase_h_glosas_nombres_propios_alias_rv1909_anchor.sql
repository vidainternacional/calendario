-- FASE H / Bloque 3 — nombres propios: alias español Wikidata + ancla exacta RV1909.
--
-- El primer intento de aplicar este lote no escribió filas: la consulta en vivo a
-- Wikidata excedió el statement_timeout de Supabase y la sentencia fue revertida.
-- Esta versión congela el subconjunto ya auditado antes de escribir y elimina toda
-- dependencia HTTP durante la migración.
--
-- Criterio del mapa congelado:
-- - TIPNR + crosswalk a Wikidata ya auditados en el draft fuente;
-- - alias marcado como español en la revisión Wikidata indicada por fila;
-- - fuente antes de » = identidad TIPNR antes de @;
-- - una sola forma nominal candidata por entrada, sin espacios y con inicial mayúscula;
-- - alias comprobado read-only en la referencia ancla exacta de RV1909;
-- - esta migración vuelve a comprobar esa superficie contra RV1909 antes de insertar.
--
-- Draft fuente congelado:
-- commit 78d7d9a5ed2aa5766b0c3145887eb9c97700fae8
-- sha256 e45bd7b1e317c9f152c7978b103811c6807841b0f9d895b82cfd0fcf607d7eb6
--
-- Batch id: fase_h_es_nombres_wikidata_alias_rv1909_anchor_002_20260820
-- Máximo esperado: 54 entradas léxicas (52 identidades fuente congeladas).
-- Política: insert-only + ON CONFLICT DO NOTHING.
--
-- Reversión exacta:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' =
--   'fase_h_es_nombres_wikidata_alias_rv1909_anchor_002_20260820';

with map(source_gloss, tipnr_id, wikidata_id, display_gloss_es, source_revision) as (
  values
  ('Abiathar»Abiathar@1Sa.22.20-Mrk','Abiathar_1Sa.22.20','Q321804','Abiathar','wikidata-lastrevid:2530684693'),
  ('Adam»Adam@Gen.2.19-Jud','Adam_Gen.2.19','Q70899','Adam','wikidata-lastrevid:2532887427'),
  ('Amon»Amon@1Ki.22.26-2Ch','Amon_1Ki.22.26','Q313423','Amón','wikidata-lastrevid:2521278995'),
  ('Amon»Amon@2Ki.21.18-Mat','Amon_2Ki.21.18','Q313423','Amón','wikidata-lastrevid:2521278995'),
  ('Amon»Amon@Jer.46.25-Nam','Amon_Jer.46.25','Q313423','Amón','wikidata-lastrevid:2521278995'),
  ('Asenath»Asenath@Gen.41.45-','Asenath_Gen.41.45','Q723681','Asenath','wikidata-lastrevid:2530700353'),
  ('Baasha»Baasha@1Ki.15.16-Jer','Baasha_1Ki.15.16','Q313224','Baasa','wikidata-lastrevid:2530517540'),
  ('Hoshea»Hoshea@1Ch.27.20','Hoshea_1Ch.27.20','Q7734','Oseas','wikidata-lastrevid:2533331185'),
  ('Hoshea»Hoshea@2Ki.15.30-','Hoshea_2Ki.15.30','Q7734','Oseas','wikidata-lastrevid:2533331185'),
  ('Haran»Haran@1Ch.23.9','Haran_1Ch.23.9','Q1199156','Arán','wikidata-lastrevid:2530659244'),
  ('Josiah»Josiah@1Ki.13.2-Mat','Josiah_1Ki.13.2','Q313228','Josías','wikidata-lastrevid:2530684420'),
  ('Josiah»Josiah@Zec.6.10-14','Josiah_Zec.6.10','Q313228','Josías','wikidata-lastrevid:2530684420'),
  ('Jabal»Jabal@Gen.4.20','Jabal_Gen.4.20','Q1676803','Jabal','wikidata-lastrevid:2530691552'),
  ('Jehoiakim»Jehoiakim@2Ki.23.34-Dan','Jehoiakim_2Ki.23.34','Q319034','Joacim','wikidata-lastrevid:2530519715'),
  ('Japheth»Japheth@Gen.5.32-1Ch','Japheth_Gen.5.32','Q200637','Japhet','wikidata-lastrevid:2532887755'),
  ('Miriam»Miriam@Exo.15.20-Mic','Miriam_Exo.15.20','Q1938388','María','wikidata-lastrevid:2530692843'),
  ('Nimrod»Nimrod@Gen.10.8-Mic','Nimrod_Gen.10.8','Q201861','Nimrod','wikidata-lastrevid:2533422587'),
  ('Eber»Eber@1Ch.8.12','Eber_1Ch.8.12','Q502282','Heber','wikidata-lastrevid:2530676655'),
  ('Uzziah»Uzziah@2Ki.14.21-Mat','Uzziah_2Ki.14.21','Q313216','Azarías','wikidata-lastrevid:2530684424'),
  ('Azariah»Azariah@1Ch.2.38-','Azariah_1Ch.2.38','Q313216','Azarías','wikidata-lastrevid:2530684424'),
  ('Azariah»Azariah@1Ch.6.10-Ezr','Azariah_1Ch.6.10','Q313216','Azarías','wikidata-lastrevid:2530684424'),
  ('Azariah»Azariah@1Ch.6.13-Ezr','Azariah_1Ch.6.13','Q313216','Azarías','wikidata-lastrevid:2530684424'),
  ('Azariah»Azariah@1Ki.4.2-1Ch','Azariah_1Ki.4.2','Q313216','Azarías','wikidata-lastrevid:2530684424'),
  ('Azariah»Azariah@2Ch.15.1','Azariah_2Ch.15.1','Q313216','Azarías','wikidata-lastrevid:2530684424'),
  ('Azariah»Azariah@2Ch.26.17-','Azariah_2Ch.26.17','Q313216','Azarías','wikidata-lastrevid:2530684424'),
  ('Azariah»Azariah@2Ch.28.12','Azariah_2Ch.28.12','Q313216','Azarías','wikidata-lastrevid:2530684424'),
  ('Azariah»Azariah@2Ch.31.10-','Azariah_2Ch.31.10','Q313216','Azarías','wikidata-lastrevid:2530684424'),
  ('Azariah»Azariah@Dan.1.6-2.49','Azariah_Dan.1.6','Q313216','Azarías','wikidata-lastrevid:2530684424'),
  ('Azariah»Azariah@Neh.3.23-','Azariah_Neh.3.23','Q313216','Azarías','wikidata-lastrevid:2530684424'),
  ('Azariah»Azariah@Neh.7.7-','Azariah_Neh.7.7','Q313216','Azarías','wikidata-lastrevid:2530684424'),
  ('Azariah»Azariah@Neh.8.7','Azariah_Neh.8.7','Q313216','Azarías','wikidata-lastrevid:2530684424'),
  ('Potiphar»Potiphar@Gen.37.36-','Potiphar_Gen.37.36','Q1148687','Potiphar','wikidata-lastrevid:2530655374'),
  ('Zillah»Zillah@Gen.4.19-','Zillah_Gen.4.19','Q203082','Zilla','wikidata-lastrevid:2530693229'),
  ('Ruth»Ruth@Rut.1.4-Mat','Ruth_Rut.1.4','Q1774982','Ruth','wikidata-lastrevid:2533445042'),
  ('Rahab»Rahab@Jos.2.1-Jas','Rahab_Jos.2.1','Q1135632','Rahab','wikidata-lastrevid:2531661787'),
  ('Ram»Ram@1Ch.2.25-','Ram_1Ch.2.25','Q1824842','Ram','wikidata-lastrevid:2530682311'),
  ('Ram»Ram@Job.32.2','Ram_Job.32.2','Q1824842','Ram','wikidata-lastrevid:2530682311'),
  ('Ram»Ram@Rut.4.19-Luk','Ram_Rut.4.19','Q1824842','Ram','wikidata-lastrevid:2530682311'),
  ('Shealtiel»Shealtiel@1Ch.3.17-Mat','Shealtiel_1Ch.3.17','Q2256348','Salathiel','wikidata-lastrevid:2530669895'),
  ('Shemaiah»Shemaiah@1Ch.3.22','Shemaiah_1Ch.3.22','Q2090113','Semaías','wikidata-lastrevid:2530683703'),
  ('Shemaiah»Shemaiah@1Ch.4.37','Shemaiah_1Ch.4.37','Q2090113','Semaías','wikidata-lastrevid:2530683703'),
  ('Shemaiah»Shemaiah@1Ch.5.4','Shemaiah_1Ch.5.4','Q2090113','Semaías','wikidata-lastrevid:2530683703'),
  ('Shemaiah»Shemaiah@2Ch.31.15','Shemaiah_2Ch.31.15','Q2090113','Semaías','wikidata-lastrevid:2530683703'),
  ('Shemaiah»Shemaiah@Ezr.8.13','Shemaiah_Ezr.8.13','Q2090113','Semaías','wikidata-lastrevid:2530683703'),
  ('Shemaiah»Shemaiah@Ezr.8.16','Shemaiah_Ezr.8.16','Q2090113','Semaías','wikidata-lastrevid:2530683703'),
  ('Shemaiah»Shemaiah@Jer.26.20','Shemaiah_Jer.26.20','Q2090113','Semaías','wikidata-lastrevid:2530683703'),
  ('Shemaiah»Shemaiah@Jer.29.24-','Shemaiah_Jer.29.24','Q2090113','Semaías','wikidata-lastrevid:2530683703'),
  ('Shemaiah»Shemaiah@Neh.12.35','Shemaiah_Neh.12.35','Q2090113','Semaías','wikidata-lastrevid:2530683703'),
  ('Shemaiah»Shemaiah@Neh.12.36','Shemaiah_Neh.12.36','Q2090113','Semaías','wikidata-lastrevid:2530683703'),
  ('Shemaiah»Shemaiah@Neh.3.29','Shemaiah_Neh.3.29','Q2090113','Semaías','wikidata-lastrevid:2530683703'),
  ('Shemaiah»Shemaiah@Neh.6.10','Shemaiah_Neh.6.10','Q2090113','Semaías','wikidata-lastrevid:2530683703'),
  ('Seth»Seth@Gen.4.25-Luk','Seth_Gen.4.25','Q107626','Seth','wikidata-lastrevid:2532887572')
), rv_source as (
  select id, provider_version
  from public.biblical_sources
  where slug = 'rv1909-ebible'
    and review_status = 'approved'
    and enabled = true
  limit 1
), eligible as (
  select
    e.id as lexical_entry_id,
    e.strong_number,
    e.source_gloss,
    map.tipnr_id,
    map.wikidata_id,
    map.display_gloss_es,
    map.source_revision,
    upper(substring(map.tipnr_id from '_([123]?[A-Za-z]{2,3})\.[0-9]+\.[0-9]+$')) as book_code,
    substring(map.tipnr_id from '_[123]?[A-Za-z]{2,3}\.([0-9]+)\.[0-9]+$')::int as chapter,
    substring(map.tipnr_id from '_[123]?[A-Za-z]{2,3}\.[0-9]+\.([0-9]+)$')::int as verse
  from public.biblical_lexical_entries e
  join map on map.source_gloss = e.source_gloss
  left join public.biblical_hebrew_spanish_glosses g on g.lexical_entry_id = e.id
  where e.language = 'hebrew'
    and e.review_status = 'approved'
    and e.enabled = true
    and e.display_gloss_es is null
    and g.lexical_entry_id is null
    and map.tipnr_id =
      btrim(split_part(split_part(e.source_gloss, '»', 2), '@', 1)) || '_' ||
      substring(split_part(e.source_gloss, '@', 2) from '[123]?[A-Za-z]{2,3}[.][0-9]+[.][0-9]+')
    and lower(btrim(split_part(e.source_gloss, '»', 1))) =
        lower(btrim(split_part(split_part(e.source_gloss, '»', 2), '@', 1)))
), verified as (
  select
    eligible.*,
    rv_source.provider_version as rv1909_provider_version
  from eligible
  cross join rv_source
  join public.biblical_verse_texts verse_text
    on verse_text.source_id = rv_source.id
   and verse_text.book_code = eligible.book_code
   and verse_text.chapter = eligible.chapter
   and verse_text.verse = eligible.verse
   and verse_text.review_status = 'approved'
   and verse_text.enabled = true
  where position(
    ' ' || regexp_replace(
      btrim(regexp_replace(lower(eligible.display_gloss_es), '[^[:alnum:]ÁÉÍÓÚÜÑáéíóúüñ-]+', ' ', 'g')),
      '\s+', ' ', 'g'
    ) || ' '
    in
    ' ' || regexp_replace(
      btrim(regexp_replace(lower(verse_text.original_text), '[^[:alnum:]ÁÉÍÓÚÜÑáéíóúüñ-]+', ' ', 'g')),
      '\s+', ' ', 'g'
    ) || ' '
  ) > 0
)
insert into public.biblical_hebrew_spanish_glosses (
  lexical_entry_id,
  display_gloss_es,
  alternative_glosses_es,
  confidence,
  derivation_method,
  source_gloss_snapshot,
  status,
  provenance
)
select
  lexical_entry_id,
  display_gloss_es,
  '{}'::text[],
  99,
  'tipnr_wikidata_es_alias_rv1909_anchor_exact_v1',
  source_gloss,
  'verified_derived',
  jsonb_build_object(
    'phase', 'FASE_H_BLOQUE_3',
    'batch_id', 'fase_h_es_nombres_wikidata_alias_rv1909_anchor_002_20260820',
    'source_identity', 'STEPBible TIPNR',
    'source_identity_license', 'CC BY 4.0',
    'step_tipnr_revision', 'b83a3cf1224af5cf72606d86d6be1789adc69541',
    'tipnr_crosswalk_blob', 'abc3e21b9d08dc310066152f9b62858c4818f4eb',
    'tipnr_id', tipnr_id,
    'wikidata_id', wikidata_id,
    'wikidata_uri', 'https://www.wikidata.org/entity/' || wikidata_id,
    'wikidata_license', 'CC0-1.0',
    'wikidata_revision', source_revision,
    'spanish_display_source', 'frozen Wikidata Spanish alias + exact RV1909 TIPNR anchor',
    'strong_number', strong_number,
    'identity_match', 'source name = TIPNR entity + frozen TIPNR/Wikidata identity',
    'rv1909_validation_source', 'rv1909-ebible',
    'rv1909_provider_version', rv1909_provider_version,
    'rv1909_anchor_validation', 'accent-preserving exact Spanish alias in exact TIPNR anchor verse',
    'context_used_as_meaning', false,
    'rv1909_used_as_meaning', false,
    'rv1909_used_as_validation', true,
    'frozen_candidate_sha256', 'e45bd7b1e317c9f152c7978b103811c6807841b0f9d895b82cfd0fcf607d7eb6'
  )
from verified
on conflict (lexical_entry_id) do nothing;
