import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const local = fs.readFileSync('lib/biblia/notes-local.ts', 'utf8')
const remote = fs.readFileSync('lib/biblia/notes-remote.ts', 'utf8')
const sync = fs.readFileSync('lib/biblia/notes-sync.ts', 'utf8')

test('FASE F: el modelo local conserva identidad y contexto canónicos', () => {
  for (const field of ['origen:', 'origenKey:', 'pasajeNormalizado:', 'contexto:']) {
    assert.match(local, new RegExp(field))
  }
  assert.match(local, /origen: nota\.origen \?\? 'biblia_notas'/)
  assert.match(local, /pasajeNormalizado: nota\.pasajeNormalizado \?\? ''/)
  assert.match(local, /contexto: normalizarContexto\(nota\.contexto\)/)
})

test('FASE F: Supabase devuelve identidad y contexto sin ampliar todavía los orígenes visibles', () => {
  assert.match(remote, /origen_key/)
  assert.match(remote, /pasaje_normalizado/)
  assert.match(remote, /contexto: contextoValido\(row\.contexto\)/)
  assert.match(remote, /\.eq\('origen', 'biblia_notas'\)/)
})

test('FASE F: la sincronización no destruye origen ni pasaje normalizado', () => {
  assert.match(sync, /const origen = textoONull\(nota\.origen, 100\) \?\? 'biblia_notas'/)
  assert.match(sync, /pasaje_normalizado: textoONull\(nota\.pasajeNormalizado, 1000\)/)
  assert.match(sync, /origen_key: origenKey/)
  assert.match(sync, /contexto: contextoParaNota\(nota\)/)
  assert.doesNotMatch(sync, /pasaje_normalizado:\s*null,/)
})

test('FASE F: el tombstone conserva la identidad canónica', () => {
  assert.match(sync, /La identidad canónica \(origen\/origen_key\/pasaje_normalizado\) no se toca/)
  const deleteSection = sync.slice(sync.indexOf(".update({\n      nota: ''"))
  assert.doesNotMatch(deleteSection, /origen:\s*null/)
  assert.doesNotMatch(deleteSection, /origen_key:\s*null/)
  assert.doesNotMatch(deleteSection, /pasaje_normalizado:\s*null/)
})
