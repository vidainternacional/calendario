import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import test from 'node:test'

const pipelinePath = 'scripts/hebreo/proper_name_spanish_pipeline.py'

test('FASE H bloque 3: nombres propios requieren mapping bilingüe licenciado', () => {
  const pipeline = fs.readFileSync(pipelinePath, 'utf8')
  assert.match(pipeline, /CC0/)
  assert.match(pipeline, /public-domain/)
  assert.match(pipeline, /strong_number/)
  assert.match(pipeline, /english_label/)
  assert.match(pipeline, /spanish_label/)
  assert.match(pipeline, /exact_named_entity/)
})

test('FASE H bloque 3: nombres propios no usan contexto como significado ni escriben Supabase', () => {
  const pipeline = fs.readFileSync(pipelinePath, 'utf8')
  assert.match(pipeline, /context_used_as_meaning.*False/)
  assert.match(pipeline, /rv1909_used_as_meaning.*False/)
  assert.doesNotMatch(pipeline, /createClient|createServiceClient|SUPABASE_|\.from\(|insert\(|upsert\(|update\(|delete\(/)
})

test('FASE H bloque 3: self-test de nombres propios pasa', () => {
  const result = spawnSync('python3', [pipelinePath, '--self-test'], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.match(result.stdout, /proper-name self-test OK/)
})
