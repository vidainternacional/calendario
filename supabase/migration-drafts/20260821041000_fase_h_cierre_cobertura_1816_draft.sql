-- FASE H / Bloque 3
-- DRAFT: lote final único para completar las 1,816 entradas hebreas aún sin capa ES.
-- NO APLICAR sin aprobación explícita del método final.
--
-- Alcance esperado al preparar este draft:
--   1,816 entradas pendientes totales.
--   1,812 source_gloss estructuradas TAHOT (nombres/entidades).
--   4 casos no estructurados tratados de forma explícita.
--
-- Política editorial del lote:
-- 1) nombres simples: usar forma observada en Biblias españolas aprobadas cuando
--    exista coincidencia ortográfica suficientemente fuerte y no ambigua;
-- 2) si no existe evidencia suficiente para localizar la grafía, conservar la
--    grafía fuente TAHOT del nombre propio (sin inventar otra identidad);
-- 3) expresiones estructuradas: traducir solo envoltorios genéricos seguros
--    (Monte, Puerta, Mar, de, etc.) y conservar el núcleo del nombre;
-- 4) cuatro casos especiales se fijan por evidencia directa de RV1909/PDPT/BES;
-- 5) NO modifica biblical_lexical_entries, lema, Strong, hebreo, ocurrencias,
--    RLS, grants ni permisos.
--
-- Rollback exacto: DELETE por provenance.batch_id al final.

DO $$
DECLARE
  pending_count integer;
BEGIN
  SELECT count(*) INTO pending_count
  FROM public.biblical_lexical_entries e
  LEFT JOIN public.biblical_hebrew_spanish_glosses g
    ON g.lexical_entry_id = e.id
   AND g.status IN ('verified_derived', 'manual_approved')
  WHERE e.language = 'hebrew'
    AND e.enabled = true
    AND e.review_status = 'approved'
    AND g.lexical_entry_id IS NULL;

  IF pending_count <> 1816 THEN
    RAISE EXCEPTION 'FASE H cierre 1816 abortado: se esperaban 1816 pendientes y hay %', pending_count;
  END IF;
END $$;

WITH pending AS MATERIALIZED (
  SELECT
    e.id,
    e.lexical_id,
    e.source_gloss,
    CASE
      WHEN e.source_gloss LIKE '%»%'
        THEN btrim(split_part(e.source_gloss, '»', 1), ' "')
      ELSE e.source_gloss
    END AS source_name,
    CASE
      WHEN e.source_gloss LIKE '%»%'
        THEN regexp_replace(
          replace(replace(replace(replace(replace(replace(
            translate(lower(btrim(split_part(e.source_gloss, '»', 1), ' "')), 'áéíóúüñ', 'aeiouun'),
            'ph', 'f'), 'th', 't'), 'sh', 's'), 'ijah', 'ia'), 'iah', 'ia'), 'h', ''),
          '[^a-z0-9]', '', 'g'
        )
      ELSE NULL
    END AS source_norm,
    e.source_gloss LIKE '%»%' AS structured
  FROM public.biblical_lexical_entries e
  LEFT JOIN public.biblical_hebrew_spanish_glosses g
    ON g.lexical_entry_id = e.id
   AND g.status IN ('verified_derived', 'manual_approved')
  WHERE e.language = 'hebrew'
    AND e.enabled = true
    AND e.review_status = 'approved'
    AND g.lexical_entry_id IS NULL
),
simple_names AS MATERIALIZED (
  SELECT *
  FROM pending
  WHERE structured
    AND source_name ~ '^[A-Z][A-Za-z-]+$'
),
refs AS (
  SELECT
    p.id,
    p.lexical_id,
    p.source_gloss,
    p.source_name,
    p.source_norm,
    o.book_code,
    o.chapter,
    o.verse,
    row_number() OVER (
      PARTITION BY p.id
      ORDER BY o.book_code, o.chapter, o.verse
    ) AS rn
  FROM simple_names p
  JOIN public.biblical_word_occurrences o
    ON o.lexical_entry_id = p.id
   AND o.enabled = true
  GROUP BY
    p.id, p.lexical_id, p.source_gloss, p.source_name, p.source_norm,
    o.book_code, o.chapter, o.verse
),
verses AS (
  SELECT r.*, s.slug, v.original_text
  FROM refs r
  JOIN public.biblical_verse_texts v
    ON v.book_code = r.book_code
   AND v.chapter = r.chapter
   AND v.verse = r.verse
  JOIN public.biblical_sources s ON s.id = v.source_id
  WHERE r.rn <= 10
    AND v.language = 'spanish'
    AND v.enabled = true
    AND v.review_status = 'approved'
    AND s.slug IN ('rv1909-ebible', 'pdpt-ebible', 'bes-ebible')
),
tokens AS (
  SELECT
    v.id,
    v.lexical_id,
    v.source_gloss,
    v.source_name,
    v.source_norm,
    v.book_code,
    v.chapter,
    v.verse,
    v.slug,
    m[1] AS candidate,
    regexp_replace(
      replace(replace(replace(replace(replace(replace(
        translate(lower(m[1]), 'áéíóúüñ', 'aeiouun'),
        'ph', 'f'), 'th', 't'), 'sh', 's'), 'ijah', 'ia'), 'iah', 'ia'), 'h', ''),
      '[^a-z0-9]', '', 'g'
    ) AS cand_norm
  FROM verses v
  CROSS JOIN LATERAL regexp_matches(
    v.original_text,
    '([A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ-]{2,})',
    'g'
  ) m
),
candidates AS (
  SELECT
    id,
    lexical_id,
    source_gloss,
    source_name,
    source_norm,
    candidate,
    cand_norm,
    count(DISTINCT slug) AS spanish_sources,
    count(DISTINCT (book_code, chapter, verse)) AS spanish_refs
  FROM tokens
  GROUP BY
    id, lexical_id, source_gloss, source_name, source_norm,
    candidate, cand_norm
),
scored AS (
  SELECT
    c.*,
    CASE
      WHEN length(source_norm) < 2 OR length(cand_norm) < 2 THEN 0::numeric
      ELSE (
        SELECT 2.0 * count(*)::numeric /
          ((length(source_norm) - 1) + (length(cand_norm) - 1))
        FROM (
          SELECT DISTINCT substring(source_norm FROM i FOR 2) AS bg
          FROM generate_series(1, greatest(length(source_norm) - 1, 1)) i
          INTERSECT
          SELECT DISTINCT substring(cand_norm FROM j FOR 2) AS bg
          FROM generate_series(1, greatest(length(cand_norm) - 1, 1)) j
        ) q
      )
    END AS dice
  FROM candidates c
),
ranked AS (
  SELECT
    s.*,
    row_number() OVER (
      PARTITION BY id
      ORDER BY dice DESC, spanish_sources DESC, spanish_refs DESC, length(candidate) DESC
    ) AS rk,
    lead(dice) OVER (
      PARTITION BY id
      ORDER BY dice DESC, spanish_sources DESC, spanish_refs DESC, length(candidate) DESC
    ) AS next_dice
  FROM scored s
),
best AS (
  SELECT
    r.*,
    coalesce(r.dice - r.next_dice, r.dice) AS margin
  FROM ranked r
  WHERE rk = 1
),
localized_simple AS (
  SELECT
    s.id,
    s.lexical_id,
    s.source_gloss,
    s.source_name,
    CASE
      WHEN b.dice >= 0.85 AND (b.spanish_sources >= 2 OR b.margin >= 0.15)
        THEN b.candidate
      WHEN b.dice >= 0.70 AND b.spanish_sources >= 2 AND b.margin >= 0.15
        THEN b.candidate
      WHEN s.source_name = 'Lord' THEN 'Señor'
      WHEN s.source_name = 'God' THEN 'Dios'
      WHEN s.source_name = 'Valley' THEN 'valle'
      WHEN s.source_name = 'Egypt' THEN 'Egipto'
      WHEN s.source_name = 'Syrian' THEN 'sirio'
      WHEN s.source_name = 'Libyan' THEN 'libio'
      ELSE s.source_name
    END AS display_gloss_es,
    CASE
      WHEN b.dice >= 0.85 AND (b.spanish_sources >= 2 OR b.margin >= 0.15)
        THEN 'spanish_bible_name_similarity_high_v2'
      WHEN b.dice >= 0.70 AND b.spanish_sources >= 2 AND b.margin >= 0.15
        THEN 'spanish_bible_name_similarity_consensus_v2'
      WHEN s.source_name IN ('Lord','God','Valley','Egypt','Syrian','Libyan')
        THEN 'direct_generic_name_label_es_v1'
      ELSE 'proper_name_source_spelling_fallback_v1'
    END AS derivation_method,
    CASE
      WHEN b.dice >= 0.85 AND (b.spanish_sources >= 2 OR b.margin >= 0.15) THEN 98
      WHEN b.dice >= 0.70 AND b.spanish_sources >= 2 AND b.margin >= 0.15 THEN 97
      WHEN s.source_name IN ('Lord','God','Valley','Egypt','Syrian','Libyan') THEN 98
      ELSE 90
    END::smallint AS confidence,
    b.candidate AS observed_candidate,
    b.dice,
    b.margin,
    b.spanish_sources,
    b.spanish_refs
  FROM simple_names s
  LEFT JOIN best b ON b.id = s.id
),
complex_names AS (
  SELECT
    p.id,
    p.lexical_id,
    p.source_gloss,
    p.source_name,
    regexp_replace(p.source_name, '\s+\((KJV|NIV):.*$', '', 'i') AS clean_name
  FROM pending p
  WHERE p.structured
    AND p.source_name !~ '^[A-Z][A-Za-z-]+$'
),
localized_complex AS (
  SELECT
    c.id,
    c.lexical_id,
    c.source_gloss,
    c.source_name,
    CASE
      WHEN c.source_name = 'his father' THEN 'su padre'
      WHEN c.source_name = 'brother' THEN 'hermano'
      WHEN c.source_name = 'sons' THEN 'hijos'
      WHEN c.source_name = 'men' THEN 'hombres'
      WHEN c.source_name = 'Do Not Destroy' THEN 'No destruyas'
      WHEN c.source_name = 'Day Star' THEN 'lucero'
      WHEN c.source_name = 'No Mercy' THEN 'sin misericordia'
      WHEN c.source_name = 'The Lord' THEN 'el Señor'
      WHEN c.source_name = 'the king' THEN 'el rey'
      WHEN c.source_name = 'steward' THEN 'mayordomo'
      WHEN c.source_name = 'great' THEN 'grande'
      WHEN c.source_name = 'great stature' THEN 'gran estatura'
      WHEN c.source_name = 'valor' THEN 'valor'
      WHEN c.source_name = 'spear' THEN 'lanza'
      WHEN c.source_name = 'tribute' THEN 'tributo'
      WHEN c.source_name = 'Terror on Every Side' THEN 'terror por todas partes'
      WHEN c.source_name = 'City of Salt' THEN 'Ciudad de Sal'
      WHEN c.source_name = 'Rock of Escape' THEN 'Roca de Escape'
      WHEN c.source_name = 'Red( Sea)' THEN 'Mar Rojo'
      WHEN c.source_name = 'Corner( Gate)' THEN 'Puerta de la Esquina'
      WHEN c.source_name LIKE 'Muster( Gate)%' THEN 'Puerta de la Inspección'
      WHEN c.source_name LIKE 'Dragon( Spring)%' THEN 'Fuente del Dragón'
      WHEN c.clean_name ~ '^\(Mount \).+$'
        THEN 'Monte ' || regexp_replace(c.clean_name, '^\(Mount \)', '')
      WHEN c.clean_name ~ '^\(Gate of \).+$'
        THEN 'Puerta de ' || regexp_replace(c.clean_name, '^\(Gate of \)', '')
      WHEN c.clean_name ~ '^\(Sea of the \).+$'
        THEN 'Mar de ' || regexp_replace(c.clean_name, '^\(Sea of the \)', '')
      WHEN c.clean_name ~ '^\(Sea of \).+$'
        THEN 'Mar de ' || regexp_replace(c.clean_name, '^\(Sea of \)', '')
      WHEN c.clean_name ~ '^of the .+$'
        THEN 'de ' || regexp_replace(c.clean_name, '^of the ', '')
      WHEN c.clean_name ~ '^of .+$'
        THEN 'de ' || regexp_replace(c.clean_name, '^of ', '')
      WHEN c.clean_name ~ '^.+\( Gate\)$'
        THEN 'Puerta de ' || regexp_replace(c.clean_name, '\( Gate\)$', '')
      WHEN c.clean_name ~ '^.+ the great$'
        THEN regexp_replace(c.clean_name, ' the great$', '') || ' el Grande'
      WHEN c.clean_name ~ '^tower of .+$'
        THEN 'Torre de ' || regexp_replace(c.clean_name, '^tower of ', '')
      WHEN c.clean_name ~ '^-.+$'
        THEN ltrim(c.clean_name, '-')
      ELSE c.clean_name
    END AS display_gloss_es,
    'structured_name_wrapper_es_v1'::text AS derivation_method,
    92::smallint AS confidence
  FROM complex_names c
),
special_map(lexical_id, display_gloss_es, confidence, evidence) AS (
  VALUES
    ('H1567',  'Galaad',     99::smallint, 'RV1909+PDPT; BES conserva Galeed'),
    ('H2428B', 'Jelec',      97::smallint, 'PDPT Ezequiel 27:11; otras dos fuentes omiten el nombre'),
    ('H4229C', 'médula',     98::smallint, 'PDPT médula; RV1909 tuétanos; source_gloss be marrow'),
    ('H5483A', 'golondrina', 99::smallint, 'RV1909+PDPT+BES en Isaías/Jeremías')
),
localized_special AS (
  SELECT
    p.id,
    p.lexical_id,
    p.source_gloss,
    p.source_name,
    m.display_gloss_es,
    'manual_final_special_v1'::text AS derivation_method,
    m.confidence,
    m.evidence
  FROM pending p
  JOIN special_map m ON m.lexical_id = p.lexical_id
  WHERE NOT p.structured
),
final_rows AS MATERIALIZED (
  SELECT
    id, lexical_id, source_gloss, source_name,
    display_gloss_es, derivation_method, confidence,
    jsonb_build_object(
      'observed_candidate', observed_candidate,
      'dice', dice,
      'margin', margin,
      'spanish_sources', spanish_sources,
      'spanish_refs', spanish_refs
    ) AS evidence
  FROM localized_simple

  UNION ALL

  SELECT
    id, lexical_id, source_gloss, source_name,
    display_gloss_es, derivation_method, confidence,
    jsonb_build_object('wrapper_translation_only', true) AS evidence
  FROM localized_complex

  UNION ALL

  SELECT
    id, lexical_id, source_gloss, source_name,
    display_gloss_es, derivation_method, confidence,
    jsonb_build_object('manual_evidence', evidence) AS evidence
  FROM localized_special
),
final_count AS (
  SELECT
    count(*) AS n,
    count(*) FILTER (WHERE nullif(btrim(display_gloss_es), '') IS NOT NULL) AS nonempty,
    count(DISTINCT id) AS distinct_ids
  FROM final_rows
)
INSERT INTO public.biblical_hebrew_spanish_glosses (
  lexical_entry_id,
  display_gloss_es,
  alternative_glosses_es,
  confidence,
  derivation_method,
  source_gloss_snapshot,
  status,
  provenance
)
SELECT
  f.id,
  f.display_gloss_es,
  ARRAY[]::text[],
  f.confidence,
  f.derivation_method,
  f.source_gloss,
  'verified_derived',
  jsonb_build_object(
    'batch_id', 'fase_h_es_cierre_1816_001_20260820',
    'translation_basis', 'final practical dictionary coverage: Spanish Bible evidence when sufficiently strong; otherwise conservative source spelling for proper names; deterministic Spanish wrappers for structured labels; four explicit special mappings',
    'source_name', f.source_name,
    'evidence', f.evidence,
    'context_used_as_meaning', false,
    'no_lexical_identity_reassignment', true
  )
FROM final_rows f
CROSS JOIN final_count c
WHERE c.n = 1816
  AND c.nonempty = 1816
  AND c.distinct_ids = 1816
ON CONFLICT (lexical_entry_id) DO NOTHING;

-- ROLLBACK EXACTO:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_cierre_1816_001_20260820';
