-- FASE H / Bloque 3
-- Lote 001 de 1,000 formas españolas de nombres/entidades hebreas pendientes.
--
-- Criterio principal (996 filas):
-- - entrada hebrea aprobada/habilitada sin glosa española final;
-- - source_gloss estructurada TAHOT con nombre fuente antes de «»»;
-- - nombre fuente simple (letras/guiones), excluyendo gentilicios ingleses -ite/-ites;
-- - la forma española aparece EXACTAMENTE igual en al menos 2 de las fuentes
--   bíblicas españolas aprobadas (RV1909, PDPT, BES) en referencias donde ocurre
--   esa misma entrada léxica;
-- - similitud ortográfica conservadora: prefijo normalizado >= 5 caracteres;
-- - diferencia de longitud normalizada <= 4;
-- - candidato superior no empatado por longitud de prefijo.
--
-- Criterio adicional (4 filas): gentilicios verificados manualmente y además
-- respaldados por >=2 fuentes españolas y >=3 referencias:
--   H7767 Shunammite -> Sunamita
--   H5284 Naamathite -> Naamatita
--   H2772 Horonite -> Horonita
--   H2843 Hushathite -> Husatita
--
-- Este lote NO modifica biblical_lexical_entries, lema, Strong, hebreo,
-- ocurrencias, RLS ni grants. Solo INSERTA filas nuevas en la capa editorial ES.
-- Rollback exacto: DELETE por provenance.batch_id al final del archivo.

WITH pending AS (
  SELECT
    e.id,
    e.lexical_id,
    e.source_gloss,
    btrim(split_part(e.source_gloss, '»', 1), ' "') AS source_name,
    regexp_replace(
      replace(replace(replace(replace(replace(
        translate(lower(btrim(split_part(e.source_gloss, '»', 1), ' "')), 'áéíóúüñ', 'aeiouun'),
        'ph', 'f'), 'th', 't'), 'sh', 's'), 'ijah', 'ia'), 'iah', 'ia'),
      '[^a-z0-9]', '', 'g'
    ) AS source_norm
  FROM public.biblical_lexical_entries e
  LEFT JOIN public.biblical_hebrew_spanish_glosses g
    ON g.lexical_entry_id = e.id
   AND g.status IN ('verified_derived', 'manual_approved')
  WHERE e.language = 'hebrew'
    AND e.enabled = true
    AND e.review_status = 'approved'
    AND g.lexical_entry_id IS NULL
    AND e.source_gloss LIKE '%»%'
), refs AS (
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
  FROM pending p
  JOIN public.biblical_word_occurrences o
    ON o.lexical_entry_id = p.id
   AND o.enabled = true
  GROUP BY
    p.id, p.lexical_id, p.source_gloss, p.source_name, p.source_norm,
    o.book_code, o.chapter, o.verse
), verses AS (
  SELECT
    r.*,
    s.slug,
    v.original_text
  FROM refs r
  JOIN public.biblical_verse_texts v
    ON v.book_code = r.book_code
   AND v.chapter = r.chapter
   AND v.verse = r.verse
  JOIN public.biblical_sources s
    ON s.id = v.source_id
  WHERE r.rn <= 6
    AND v.language = 'spanish'
    AND v.enabled = true
    AND v.review_status = 'approved'
    AND s.slug IN ('rv1909-ebible', 'pdpt-ebible', 'bes-ebible')
), tokens AS (
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
      regexp_replace(
        translate(lower(m[1]), 'áéíóúüñ', 'aeiouun'),
        '[^a-z0-9]', '', 'g'
      ),
      'ias$', 'ia'
    ) AS cand_norm
  FROM verses v
  CROSS JOIN LATERAL regexp_matches(
    v.original_text,
    '([A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ-]{2,})',
    'g'
  ) m
), scored AS (
  SELECT
    t.*,
    (
      SELECT coalesce(max(n), 0)
      FROM generate_series(
        1,
        least(length(t.source_norm), length(t.cand_norm))
      ) n
      WHERE left(t.source_norm, n) = left(t.cand_norm, n)
    ) AS prefix_len
  FROM tokens t
), aggregated AS (
  SELECT
    id,
    lexical_id,
    source_gloss,
    source_name,
    source_norm,
    candidate,
    cand_norm,
    max(prefix_len) AS prefix_len,
    count(DISTINCT slug) AS spanish_sources,
    count(DISTINCT (book_code, chapter, verse)) AS spanish_refs
  FROM scored
  WHERE prefix_len >= 5
  GROUP BY
    id, lexical_id, source_gloss, source_name, source_norm,
    candidate, cand_norm
), ranked AS (
  SELECT
    a.*,
    row_number() OVER (
      PARTITION BY id
      ORDER BY prefix_len DESC, spanish_sources DESC, spanish_refs DESC, length(candidate) DESC
    ) AS rk,
    lead(prefix_len) OVER (
      PARTITION BY id
      ORDER BY prefix_len DESC, spanish_sources DESC, spanish_refs DESC, length(candidate) DESC
    ) AS next_prefix
  FROM aggregated a
  WHERE spanish_sources >= 2
), selected_simple AS (
  SELECT
    r.*,
    'consenso_nombre'::text AS selection_gate
  FROM ranked r
  WHERE r.rk = 1
    AND (r.next_prefix IS NULL OR r.prefix_len > r.next_prefix)
    AND r.source_name ~ '^[A-Z][A-Za-z-]+$'
    AND lower(r.source_name) !~ '(ite|ites)$'
    AND abs(length(r.source_norm) - length(r.cand_norm)) <= 4
  ORDER BY
    r.spanish_sources DESC,
    r.spanish_refs DESC,
    r.prefix_len DESC,
    r.lexical_id
  LIMIT 996
), vetted_expected(lexical_id, candidate) AS (
  VALUES
    ('H7767', 'Sunamita'),
    ('H5284', 'Naamatita'),
    ('H2772', 'Horonita'),
    ('H2843', 'Husatita')
), selected_vetted AS (
  SELECT
    r.*,
    'gentilicio_verificado'::text AS selection_gate
  FROM ranked r
  JOIN vetted_expected x
    ON x.lexical_id = r.lexical_id
   AND x.candidate = r.candidate
  WHERE r.rk = 1
    AND (r.next_prefix IS NULL OR r.prefix_len > r.next_prefix)
    AND r.spanish_sources >= 2
    AND r.spanish_refs >= 3
), selected AS (
  SELECT * FROM selected_simple
  UNION ALL
  SELECT * FROM selected_vetted
), selected_count AS (
  SELECT count(*) AS n FROM selected
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
  s.id,
  s.candidate,
  ARRAY[]::text[],
  CASE
    WHEN s.spanish_sources >= 3 AND s.spanish_refs >= 2 THEN 99
    ELSE 98
  END::smallint,
  'spanish_bible_consensus_name_v1',
  s.source_gloss,
  'verified_derived',
  jsonb_build_object(
    'batch_id', 'fase_h_es_nombres_consenso_1000_001_20260820',
    'translation_basis', 'forma española observada directamente en traducciones bíblicas aprobadas para referencias donde ocurre la misma entrada léxica',
    'source_name', s.source_name,
    'spanish_candidate', s.candidate,
    'spanish_sources', s.spanish_sources,
    'spanish_refs', s.spanish_refs,
    'prefix_len', s.prefix_len,
    'selection_gate', s.selection_gate,
    'source_slugs', jsonb_build_array('rv1909-ebible', 'pdpt-ebible', 'bes-ebible'),
    'context_used_as_meaning', false,
    'orthographic_name_form_only', true
  )
FROM selected s
CROSS JOIN selected_count c
WHERE c.n = 1000
ON CONFLICT (lexical_entry_id) DO NOTHING;

-- ROLLBACK EXACTO (las 1,000 filas no existían antes de este lote):
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nombres_consenso_1000_001_20260820';
