import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const migration = fs.readFileSync(
  'supabase/migrations/20260820235000_fase_h_glosas_nombres_propios_alias_rv1909_anchor.sql',
  'utf8',
)

test('FASE H bloque 3: alias español exige identidad de nombre fuente y ancla exacta', () => {
  assert.match(migration, /lower\(btrim\(split_part\(e\.source_gloss, '»', 1\)\)\)/)
  assert.match(migration, /having count\(distinct alias_es\) = 1/)
  assert.match(migration, /spanish_aliases\.alias_es !~ '\\\\s'/)
  assert.match(migration, /position\(' ' \|\| alias_norm \|\| ' ' in ' ' \|\| verse_norm \|\| ' '\) > 0/)
})

test('FASE H bloque 3: lote alias fija revisión y no usa contexto como significado', () => {
  assert.match(migration, /wikidata-lastrevid:/)
  assert.match(migration, /frozen_candidate_sha256/)
  assert.match(migration, /rv1909_used_as_validation', true/)
  assert.match(migration, /rv1909_used_as_meaning', false/)
  assert.match(migration, /context_used_as_meaning', false/)
})

test('FASE H bloque 3: lote alias sigue insert-only y reversible', () => {
  assert.match(migration, /on conflict \(lexical_entry_id\) do nothing/)
  assert.match(migration, /fase_h_es_nombres_wikidata_alias_rv1909_anchor_002_20260820/)
  assert.match(migration, /DELETE FROM public\.biblical_hebrew_spanish_glosses/)
  assert.doesNotMatch(migration, /update public\.biblical_hebrew_spanish_glosses/i)
  assert.doesNotMatch(migration, /delete from public\.biblical_lexical_entries/i)
})
