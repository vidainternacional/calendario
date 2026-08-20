import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import test from 'node:test'

const fetcher = fs.readFileSync('scripts/hebreo/fetch_wikidata_labels.py', 'utf8')
const builder = fs.readFileSync('scripts/hebreo/build_tipnr_wikidata_mapping.py', 'utf8')
const resolver = fs.readFileSync('scripts/hebreo/proper_name_spanish_pipeline.py', 'utf8')

test('FASE H bloque 3: adapters de nombres propios pasan self-test sin red', () => {
  execFileSync('python3', ['scripts/hebreo/fetch_wikidata_labels.py', '--self-test'], { stdio: 'pipe' })
  execFileSync('python3', ['scripts/hebreo/build_tipnr_wikidata_mapping.py', '--self-test'], { stdio: 'pipe' })
  execFileSync('python3', ['scripts/hebreo/proper_name_spanish_pipeline.py', '--self-test'], { stdio: 'pipe' })
})

test('FASE H bloque 3: labels españoles vienen de Wikidata CC0 y fijan revisión', () => {
  assert.match(fetcher, /wbgetentities/)
  assert.match(fetcher, /languages[^\n]*en\|es/)
  assert.match(fetcher, /lastrevid/)
  assert.match(fetcher, /CC0-1\.0/)
  assert.doesNotMatch(fetcher, /supabase|service_role|SUPABASE/i)
})

test('FASE H bloque 3: crosswalk TIPNR solo resuelve identidad exacta, sin fuzzy matching', () => {
  assert.match(builder, /TIPNR_ID/)
  assert.match(builder, /WIKIDATA_ID/)
  assert.match(builder, /english_matches/)
  assert.match(builder, /normalize_key\(value\) == wanted/)
  assert.match(builder, /"fuzzy_name_matching": False/)
  assert.match(builder, /TIPNR_CROSSWALK_BLOB/)
  assert.match(builder, /STEP_TIPNR_REVISION/)
})

test('FASE H bloque 3: nombres no usan RV1909 ni contexto como significado', () => {
  assert.match(builder, /"context_used_as_meaning": False/)
  assert.match(builder, /"rv1909_used_as_meaning": False/)
  assert.match(resolver, /rv1909_used_as_meaning/)
  assert.doesNotMatch(builder, /original_text\.ilike|contextualSpanishSearch/)
})

test('FASE H bloque 3: pipeline de nombres no escribe en Supabase', () => {
  assert.match(builder, /"writes_supabase": False/)
  assert.doesNotMatch(builder, /insert\(|upsert\(|update\(|delete\(/)
  assert.doesNotMatch(fetcher, /insert\(|upsert\(|update\(|delete\(/)
})
