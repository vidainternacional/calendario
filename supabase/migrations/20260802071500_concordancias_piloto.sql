-- FASE D · Bloque 4
-- Piloto editorial mínimo para validar búsqueda temática y preguntas breves.
-- No contiene texto bíblico copiado; solo referencias y relaciones revisadas.

with source as (
  select id
  from public.biblical_sources
  where slug = 'open-cross-ref'
    and enabled = true
    and review_status = 'approved'
  limit 1
)
insert into public.biblical_concordance_terms (
  canonical_term,
  normalized_term,
  language,
  description,
  source_id,
  source_locator,
  provider_version,
  content_hash,
  review_status,
  enabled,
  metadata
)
select values_table.canonical_term,
       values_table.normalized_term,
       'es',
       values_table.description,
       source.id,
       'editorial-concordance-pilot-v1',
       'pilot-v1-2026-08-02',
       md5(values_table.normalized_term || ':pilot-v1'),
       'approved',
       true,
       jsonb_build_object('editorial_review', true, 'contains_verse_text', false)
from source
cross join (values
  ('Oración', 'oracion', 'Comunicación consciente y confiada con Dios.'),
  ('Amor', 'amor', 'Entrega, cuidado y fidelidad expresados hacia Dios y el prójimo.'),
  ('Pastor', 'pastor', 'Imagen bíblica de guía, cuidado, protección y responsabilidad.'),
  ('Vida eterna', 'vida eterna', 'Vida recibida de Dios y definida por la relación con Él.')
) as values_table(canonical_term, normalized_term, description)
on conflict (normalized_term, language, source_id) do update set
  description = excluded.description,
  review_status = 'approved',
  enabled = true,
  updated_at = now();

with terms as (
  select id, normalized_term
  from public.biblical_concordance_terms
  where normalized_term in ('oracion', 'amor', 'pastor', 'vida eterna')
)
insert into public.biblical_concordance_aliases (
  term_id,
  alias,
  normalized_alias,
  alias_kind,
  review_status,
  enabled
)
select terms.id,
       aliases.alias,
       aliases.normalized_alias,
       aliases.alias_kind,
       'approved',
       true
from terms
join (values
  ('oracion', 'orar', 'orar', 'keyword'),
  ('oracion', 'cómo orar', 'como orar', 'question_intent'),
  ('oracion', 'Dios escucha mis oraciones', 'dios escucha mis oraciones', 'question_intent'),
  ('amor', 'amar', 'amar', 'keyword'),
  ('amor', 'qué es el amor', 'que es el amor', 'question_intent'),
  ('amor', 'amor de Dios', 'amor de dios', 'synonym'),
  ('pastor', 'buen pastor', 'buen pastor', 'synonym'),
  ('pastor', 'Dios me cuida', 'dios me cuida', 'question_intent'),
  ('vida eterna', 'salvación', 'salvacion', 'synonym'),
  ('vida eterna', 'cómo tener vida eterna', 'como tener vida eterna', 'question_intent')
) as aliases(term_key, alias, normalized_alias, alias_kind)
  on aliases.term_key = terms.normalized_term
on conflict (term_id, normalized_alias) do update set
  alias = excluded.alias,
  alias_kind = excluded.alias_kind,
  review_status = 'approved',
  enabled = true;

with source as (
  select id
  from public.biblical_sources
  where slug = 'open-cross-ref'
    and enabled = true
    and review_status = 'approved'
  limit 1
), terms as (
  select id, normalized_term
  from public.biblical_concordance_terms
  where normalized_term in ('oracion', 'amor', 'pastor', 'vida eterna')
)
insert into public.biblical_concordance_occurrences (
  term_id,
  book_code,
  book_name,
  chapter,
  verse,
  reference_label,
  verse_excerpt,
  relevance,
  relation_kind,
  source_id,
  source_locator,
  provider_version,
  content_hash,
  review_status,
  enabled,
  metadata
)
select terms.id,
       refs.book_code,
       refs.book_name,
       refs.chapter,
       refs.verse,
       refs.reference_label,
       null,
       refs.relevance,
       refs.relation_kind,
       source.id,
       'editorial-concordance-pilot-v1:' || refs.reference_label,
       'pilot-v1-2026-08-02',
       md5(terms.normalized_term || ':' || refs.reference_label || ':' || refs.relation_kind),
       'approved',
       true,
       jsonb_build_object('editorial_review', true, 'contains_verse_text', false)
from source
cross join terms
join (values
  ('oracion', 'MAT', 'Mateo', 6, 7, 'Mateo 6:7', 100, 'direct'),
  ('oracion', '1SA', '1 Samuel', 1, 10, '1 Samuel 1:10', 90, 'conceptual'),
  ('oracion', 'PHP', 'Filipenses', 4, 6, 'Filipenses 4:6', 90, 'conceptual'),
  ('amor', 'JHN', 'Juan', 3, 16, 'Juan 3:16', 100, 'direct'),
  ('amor', '1CO', '1 Corintios', 13, 4, '1 Corintios 13:4', 95, 'direct'),
  ('amor', '1JN', '1 Juan', 4, 8, '1 Juan 4:8', 95, 'direct'),
  ('pastor', 'PSA', 'Salmos', 23, 1, 'Salmos 23:1', 100, 'direct'),
  ('pastor', 'JHN', 'Juan', 10, 11, 'Juan 10:11', 100, 'direct'),
  ('pastor', 'EZK', 'Ezequiel', 34, 12, 'Ezequiel 34:12', 85, 'conceptual'),
  ('vida eterna', 'JHN', 'Juan', 3, 16, 'Juan 3:16', 100, 'direct'),
  ('vida eterna', 'JHN', 'Juan', 17, 3, 'Juan 17:3', 100, 'direct'),
  ('vida eterna', 'ROM', 'Romanos', 6, 23, 'Romanos 6:23', 95, 'direct')
) as refs(term_key, book_code, book_name, chapter, verse, reference_label, relevance, relation_kind)
  on refs.term_key = terms.normalized_term
on conflict (term_id, book_code, chapter, verse, relation_kind, source_id) do update set
  relevance = excluded.relevance,
  review_status = 'approved',
  enabled = true,
  updated_at = now();
