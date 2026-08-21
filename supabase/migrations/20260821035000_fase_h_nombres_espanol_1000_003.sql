-- FASE H / Bloque 3
-- Lote 003: 1,000 nombres/entidades hebreas con forma española anclada en Biblias de VIDA.
-- Alcance: SOLO entradas hebreas aprobadas/habilitadas que aún no tienen fila editorial española.
-- Evidencia: la forma candidata aparece realmente en RV1909/BES/PDPT en versículos donde ocurre
-- la misma entrada léxica y coincide con el nombre fuente por igualdad normalizada o por cambios
-- ortográficos conservadores (ph→f, th→t, sh→s, h final muda, -iah→-ías, -ite→-ita/-itas).
-- No modifica biblical_lexical_entries, Strong, lema, hebreo, ocurrencias, RLS ni grants.
-- Rollback exacto: DELETE por provenance.batch_id.

WITH pending AS (
  SELECT
    e.id,
    e.lexical_id,
    e.source_gloss,
    trim(split_part(e.source_gloss, '»', 1)) AS en_name,
    lower(
      regexp_replace(
        translate(trim(split_part(e.source_gloss, '»', 1)),
          'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun'),
        '[^A-Za-z0-9]+', '', 'g'
      )
    ) AS en_norm
  FROM public.biblical_lexical_entries e
  WHERE e.language = 'hebrew'
    AND e.enabled = true
    AND e.review_status = 'approved'
    AND e.source_gloss LIKE '%»%@%'
    AND NOT EXISTS (
      SELECT 1
      FROM public.biblical_hebrew_spanish_glosses g
      WHERE g.lexical_entry_id = e.id
    )
), tokens AS (
  SELECT
    p.*,
    s.slug,
    regexp_replace(
      tok,
      '^[^[:alnum:]ÁÉÍÓÚÜÑáéíóúüñ-]+|[^[:alnum:]ÁÉÍÓÚÜÑáéíóúüñ-]+$',
      '', 'g'
    ) AS token
  FROM pending p
  JOIN public.biblical_word_occurrences o
    ON o.lexical_entry_id = p.id
   AND o.enabled = true
   AND o.review_status = 'approved'
  JOIN public.biblical_verse_texts v
    ON v.book_code = o.book_code
   AND v.chapter = o.chapter
   AND v.verse = o.verse
   AND v.enabled = true
   AND v.review_status = 'approved'
  JOIN public.biblical_sources s
    ON s.id = v.source_id
   AND s.slug IN ('rv1909-ebible', 'bes-ebible', 'pdpt-ebible')
  CROSS JOIN LATERAL regexp_split_to_table(v.original_text, E'\\s+') tok
), candidates AS (
  SELECT
    *,
    lower(
      regexp_replace(
        translate(token, 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun'),
        '[^A-Za-z0-9]+', '', 'g'
      )
    ) AS tok_norm
  FROM tokens
  WHERE token ~ '^[[:upper:]ÁÉÍÓÚÜÑ]'
), normalized AS (
  SELECT
    *,
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(en_norm, 'ph', 'f', 'g'),
          'th', 't', 'g'
        ),
        'sh', 's', 'g'
      ),
      'h$', '', 'g'
    ) AS en_canon,
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(tok_norm, 'ph', 'f', 'g'),
          'th', 't', 'g'
        ),
        'sh', 's', 'g'
      ),
      'h$', '', 'g'
    ) AS tok_canon
  FROM candidates
), scored AS (
  SELECT
    id,
    lexical_id,
    source_gloss,
    en_name,
    en_norm,
    token,
    tok_norm,
    en_canon,
    tok_canon,
    count(DISTINCT slug) AS sources,
    CASE
      WHEN tok_norm = en_norm THEN 100
      WHEN tok_canon = en_canon THEN 95
      WHEN en_norm ~ 'iah$'
       AND tok_norm ~ 'ias$'
       AND regexp_replace(en_norm, 'iah$', '') = regexp_replace(tok_norm, 'ias$', '')
        THEN 94
      WHEN en_norm ~ 'ite$'
       AND (tok_norm ~ 'ita$' OR tok_norm ~ 'itas$')
       AND regexp_replace(en_norm, 'ite$', '') = regexp_replace(tok_norm, 'itas?$', '')
        THEN 94
      ELSE 0
    END AS sim
  FROM normalized
  GROUP BY
    id, lexical_id, source_gloss, en_name, en_norm,
    token, tok_norm, en_canon, tok_canon
), ranked AS (
  SELECT
    *,
    row_number() OVER (
      PARTITION BY id
      ORDER BY
        (sim + least(sources, 3) * 5) DESC,
        sources DESC,
        length(token) ASC,
        token ASC
    ) AS rn,
    lead(sim + least(sources, 3) * 5) OVER (
      PARTITION BY id
      ORDER BY
        (sim + least(sources, 3) * 5) DESC,
        sources DESC,
        length(token) ASC,
        token ASC
    ) AS next_score
  FROM scored
  WHERE sim > 0
), targets AS MATERIALIZED (
  SELECT
    id,
    lexical_id,
    source_gloss,
    en_name,
    token,
    tok_norm,
    en_norm,
    sources,
    sim,
    CASE
      WHEN en_norm ~ 'ite$' AND tok_norm ~ 'itas$'
        THEN regexp_replace(token, 'itas$', 'ita', 'i')
      ELSE token
    END AS display_es
  FROM ranked
  WHERE rn = 1
    AND sim >= 94
    AND (next_score IS NULL OR (sim + least(sources, 3) * 5) - next_score >= 5)
  ORDER BY lexical_id
  LIMIT 1000
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
  t.id,
  t.display_es,
  ARRAY[]::text[],
  CASE WHEN t.sources >= 2 THEN 99 ELSE 97 END::smallint,
  'spanish_bible_name_anchor_canonical_v1',
  t.source_gloss,
  'verified_derived',
  jsonb_build_object(
    'batch_id', 'fase_h_es_nombres_1000_003_20260820',
    'translation_basis', 'Spanish Bible surface form attested at an occurrence of the same lexical entry',
    'source_name_en', t.en_name,
    'spanish_surface', t.display_es,
    'spanish_source_count', t.sources,
    'match_score', t.sim,
    'spanish_sources', jsonb_build_array('rv1909-ebible', 'bes-ebible', 'pdpt-ebible'),
    'context_used_as_meaning', false
  )
FROM targets t
ON CONFLICT (lexical_entry_id) DO NOTHING;

-- ROLLBACK EXACTO:
-- DELETE FROM public.biblical_hebrew_spanish_glosses
-- WHERE provenance->>'batch_id' = 'fase_h_es_nombres_1000_003_20260820';
