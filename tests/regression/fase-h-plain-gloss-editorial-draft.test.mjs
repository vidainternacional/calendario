import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const migrationPath = 'supabase/migrations/20260821000700_fase_h_glosas_espanolas_plain_verbs_editorial.sql'
const migration = fs.readFileSync(migrationPath, 'utf8')

test('FASE H bloque 3: lote aplicado traduce solo glosa fuente verbal exacta', () => {
  assert.match(migrationPath, /supabase\/migrations\//)
  assert.match(migration, /join map on map\.source_gloss = e\.source_gloss/)
  assert.match(migration, /e\.part_of_speech = 'verb'/)
  assert.match(migration, /manual_editorial_source_gloss_exact_v1/)
  assert.match(migration, /translation_basis','exact approved English source_gloss \+ verb POS'/)
})

test('FASE H bloque 3: contexto, RV1909 y lema hebreo no deciden el significado', () => {
  assert.match(migration, /context_used_as_meaning',false/)
  assert.match(migration, /rv1909_used_as_meaning',false/)
  assert.match(migration, /hebrew_lemma_used_to_infer_meaning',false/)
  assert.doesNotMatch(migration, /biblical_verse_texts|original_text|rv1909-ebible/)
})

test('FASE H bloque 3: lote aplicado sigue insert-only y reversible', () => {
  assert.match(migration, /on conflict \(lexical_entry_id\) do nothing/)
  assert.match(migration, /fase_h_es_plain_verbs_editorial_001_20260820/)
  assert.match(migration, /DELETE FROM public\.biblical_hebrew_spanish_glosses/)
  assert.doesNotMatch(migration, /update public\.biblical_hebrew_spanish_glosses/i)
  assert.doesNotMatch(migration, /delete from public\.biblical_lexical_entries/i)
})

test('FASE H bloque 3: lote conserva sentidos separados dentro del mismo Strong base', () => {
  assert.match(migration, /\('to grow','crecer'\)/)
  assert.match(migration, /\('to increase','aumentar'\)/)
  assert.match(migration, /\('to delight','deleitar'\)/)
  assert.match(migration, /\('to smear','untar'\)/)
  assert.match(migration, /on conflict \(lexical_entry_id\) do nothing/)
})
