import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import test from 'node:test'

const pipelinePath = 'scripts/hebreo/spanish_gloss_pipeline.py'
const pipeline = fs.readFileSync(pipelinePath, 'utf8')

test('FASE H bloque 3: el pipeline de glosas no escribe ni conecta a Supabase', () => {
  assert.doesNotMatch(pipeline, /createClient|createServiceClient|SUPABASE_|\.from\(|insert\(|upsert\(|update\(|delete\(/)
  assert.match(pipeline, /source_gloss.*permanece como autoridad fuente/)
  assert.match(pipeline, /context_used_as_meaning.*False/)
})

test('FASE H bloque 3: candidatos no verificados no pueden pasar el gate final', () => {
  assert.match(pipeline, /status.*candidate/)
  assert.match(pipeline, /status.*pending/)
  assert.match(pipeline, /expected_pending.*0/)
  assert.match(pipeline, /expected_candidate.*0/)
  assert.match(pipeline, /--require-complete/)
})

test('FASE H bloque 3: el parser TAHOT y lookup verbal pasan su self-test', () => {
  const result = spawnSync('python3', [pipelinePath, '--self-test'], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.match(result.stdout, /self-test OK/)
})
