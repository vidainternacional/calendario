import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const draftPath = 'supabase/migration-drafts/20260820235900_fase_h_glosas_espanolas_plain_verbs_editorial_draft.sql'
const draft = fs.readFileSync(draftPath, 'utf8')

test('FASE H bloque 3: plain_gloss editorial permanece fuera de migrations', () => {
  assert.match(draftPath, /supabase\/migration-drafts\//)
  assert.match(draft, /BORRADOR NO ACTIVO/)
  assert.match(draft, /NO mover a supabase\/migrations ni aplicar sin aprobación explícita/)
})

test('FASE H bloque 3: el draft traduce solo la glosa fuente verbal exacta', () => {
  assert.match(draft, /join map on map\.source_gloss = e\.source_gloss/)
  assert.match(draft, /e\.part_of_speech = 'verb'/)
  assert.match(draft, /manual_editorial_source_gloss_exact_v1/)
  assert.match(draft, /translation_basis','exact approved English source_gloss \+ verb POS'/)
})

test('FASE H bloque 3: contexto, RV1909 y lema hebreo no deciden el significado', () => {
  assert.match(draft, /context_used_as_meaning',false/)
  assert.match(draft, /rv1909_used_as_meaning',false/)
  assert.match(draft, /hebrew_lemma_used_to_infer_meaning',false/)
  assert.doesNotMatch(draft, /biblical_verse_texts|original_text|rv1909-ebible/)
})

test('FASE H bloque 3: el futuro lote sigue insert-only y reversible', () => {
  assert.match(draft, /on conflict \(lexical_entry_id\) do nothing/)
  assert.match(draft, /fase_h_es_plain_verbs_editorial_001_20260820/)
  assert.match(draft, /DELETE FROM public\.biblical_hebrew_spanish_glosses/)
  assert.doesNotMatch(draft, /update public\.biblical_hebrew_spanish_glosses/i)
  assert.doesNotMatch(draft, /delete from public\.biblical_lexical_entries/i)
})
