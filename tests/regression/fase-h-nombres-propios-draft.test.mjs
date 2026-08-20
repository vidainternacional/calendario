import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import test from 'node:test'

const builder = fs.readFileSync('scripts/hebreo/build_tipnr_wikidata_draft.py', 'utf8')
const workflow = fs.readFileSync('.github/workflows/fase-h-preparar-nombres-propios.yml', 'utf8')

test('FASE H bloque 3: generador TIPNR/Wikidata pasa self-test sin red', () => {
  execFileSync('python3', ['scripts/hebreo/build_tipnr_wikidata_draft.py', '--self-test'], { stdio: 'pipe' })
})

test('FASE H bloque 3: identidad de nombre propio usa TIPNR exacto y Wikidata CC0', () => {
  assert.match(builder, /TIPNR_CROSSWALK_BLOB = "abc3e21b9d08dc310066152f9b62858c4818f4eb"/)
  assert.match(builder, /STEP_TIPNR_REVISION = "b83a3cf1224af5cf72606d86d6be1789adc69541"/)
  assert.match(builder, /english_matches/)
  assert.match(builder, /english_identity_mismatch/)
  assert.match(builder, /CC0-1\.0/)
  assert.doesNotMatch(builder, /fuzzywuzzy|levenshtein|rapidfuzz/i)
})

test('FASE H bloque 3: el lote generado permanece borrador e insert-only', () => {
  assert.match(workflow, /supabase\/migration-drafts\/20260820233000_fase_h_glosas_nombres_propios_wikidata_draft\.sql/)
  assert.doesNotMatch(workflow, /supabase\/migrations\/20260820233000/)
  assert.match(builder, /g\.lexical_entry_id is null/)
  assert.match(builder, /on conflict \(lexical_entry_id\) do nothing/)
  assert.match(builder, /DELETE FROM public\.biblical_hebrew_spanish_glosses/)
})

test('FASE H bloque 3: contexto y RV1909 no se convierten en significado', () => {
  assert.match(builder, /'context_used_as_meaning',false/)
  assert.match(builder, /'rv1909_used_as_meaning',false/)
  assert.doesNotMatch(builder, /original_text\.ilike|contextualSpanishSearch/)
})

test('FASE H bloque 3: preparación en GitHub no recibe credenciales de Supabase', () => {
  assert.doesNotMatch(workflow, /SUPABASE|service_role|database_url/i)
  assert.match(workflow, /git hash-object/)
  assert.match(workflow, /abc3e21b9d08dc310066152f9b62858c4818f4eb/)
})
