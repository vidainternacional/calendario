import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const draft = await readFile(
  new URL('../../supabase/migration-drafts/20260821001000_fase_h_nombres_rv1909_misma_grafia_draft.sql', import.meta.url),
  'utf8',
)

test('el lote de nombres RV1909 permanece como borrador no activo', () => {
  assert.match(draft, /BORRADOR NO ACTIVO/)
  assert.match(draft, /supabase\/migration-drafts|Bloque 3/i)
})

test('solo acepta la misma entidad TAHOT y la misma grafía en un versículo de esa entrada', () => {
  assert.match(draft, /split_part\(l\.source_gloss, '»', 1\)/)
  assert.match(draft, /biblical_word_occurrences/)
  assert.match(draft, /v\.book_code = o\.book_code/)
  assert.match(draft, /v\.chapter = o\.chapter/)
  assert.match(draft, /v\.verse = o\.verse/)
  assert.match(draft, /minimum_normalized_name_length/)
  assert.match(draft, /exact_same_surface_required/)
})

test('RV1909 se usa solo como grafía y el cambio futuro es insert-only reversible', () => {
  assert.match(draft, /anchor_used_for_name_spelling_only', true/)
  assert.match(draft, /context_used_as_meaning', false/)
  assert.match(draft, /rv1909_used_as_meaning', false/)
  assert.match(draft, /tahot_exact_entity_rv1909_same_surface_v1/)
  assert.match(draft, /on conflict \(lexical_entry_id\) do nothing/i)
  assert.match(draft, /fase_h_es_nombres_rv1909_misma_grafia_001_20260820/)
  assert.doesNotMatch(draft, /update\s+public\.biblical_lexical_entries/i)
  assert.doesNotMatch(draft, /delete\s+from\s+public\.biblical_lexical_entries/i)
})
