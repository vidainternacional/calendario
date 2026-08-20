import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import test from 'node:test'

const path = 'scripts/hebreo/build_spanish_gloss_batch.py'
const source = fs.readFileSync(path, 'utf8')

test('FASE H bloque 3: lote español es insert-only y reversible por batch_id', () => {
  assert.match(source, /insert_only_on_conflict_do_nothing/)
  assert.match(source, /batch_id/)
  assert.match(source, /batch_sha256/)
  assert.match(source, /delete from public\.biblical_hebrew_spanish_glosses/)
  assert.match(source, /rows_inserted_by_batch_id_only/)
})

test('FASE H bloque 3: empaquetador no conecta ni escribe en Supabase', () => {
  assert.doesNotMatch(source, /createClient|createServiceClient|SUPABASE_|psycopg|supabase-js/)
  assert.match(source, /touches_authoritative_lexicon.*False/)
})

test('FASE H bloque 3: require-complete bloquea candidate y pending', () => {
  assert.match(source, /statuses\["candidate"\]/)
  assert.match(source, /statuses\["pending"\]/)
  assert.match(source, /--require-complete/)
})

test('FASE H bloque 3: self-test del empaquetador pasa', () => {
  const result = spawnSync('python3', [path, '--self-test'], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.match(result.stdout, /self-test OK/)
})
