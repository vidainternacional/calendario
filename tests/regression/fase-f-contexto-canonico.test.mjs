import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const local = fs.readFileSync('lib/biblia/notes-local.ts', 'utf8')
const remote = fs.readFileSync('lib/biblia/notes-remote.ts', 'utf8')
const sync = fs.readFileSync('lib/biblia/notes-sync.ts', 'utf8')
const shell = fs.readFileSync('public/offline/notas.html', 'utf8')

test('FASE F: el modelo local conserva identidad y contexto canónicos', () => {
  for (const field of ['origen:', 'origenKey:', 'pasajeNormalizado:', 'contexto:']) {
    assert.match(local, new RegExp(field))
  }
  assert.match(local, /origen: nota\.origen \?\? 'biblia_notas'/)
  assert.match(local, /pasajeNormalizado: nota\.pasajeNormalizado \?\? ''/)
  assert.match(local, /contexto: normalizarContexto\(nota\.contexto\)/)
})

test('FASE F: Supabase devuelve un único cuaderno multiorigen del usuario', () => {
  assert.match(remote, /origen_key/)
  assert.match(remote, /pasaje_normalizado/)
  assert.match(remote, /contexto: contextoValido\(row\.contexto\)/)
  assert.match(remote, /tipoDesdeFila/)
  assert.match(remote, /origenDesdeFila/)
  assert.match(remote, /row\.pasaje_normalizado \? 'estudio_profundo' : 'legado'/)
  assert.match(remote, /`estudio-profundo:\$\{row\.pasaje_normalizado\}`/)
  assert.doesNotMatch(remote, /\.eq\('origen', 'biblia_notas'\)/)
})

test('FASE F: la sincronización no destruye origen ni pasaje normalizado', () => {
  assert.match(sync, /const origen = textoONull\(nota\.origen, 100\) \?\? 'biblia_notas'/)
  assert.match(sync, /pasaje_normalizado: textoONull\(nota\.pasajeNormalizado, 1000\)/)
  assert.match(sync, /origen_key: origenKey/)
  assert.match(sync, /contexto: contextoParaNota\(nota\)/)
  assert.doesNotMatch(sync, /pasaje_normalizado:\s*null,/)
})

test('FASE F: el tombstone conserva identidad y funciona para cualquier origen propio', () => {
  assert.match(sync, /La identidad canónica \(origen\/origen_key\/pasaje_normalizado\) no se toca/)
  const deleteSection = sync.slice(sync.indexOf(".update({\n      nota: ''"))
  assert.doesNotMatch(deleteSection, /origen:\s*null/)
  assert.doesNotMatch(deleteSection, /origen_key:\s*null/)
  assert.doesNotMatch(deleteSection, /pasaje_normalizado:\s*null/)
  assert.doesNotMatch(deleteSection, /\.eq\('origen', 'biblia_notas'\)/)
  assert.match(deleteSection, /\.eq\('profile_id', userId\)/)
})

test('FASE F: el shell offline preserva identidad multiorigen al editar', () => {
  assert.match(shell, /origen: typeof value\?\.origen/)
  assert.match(shell, /origenKey: typeof value\?\.origenKey/)
  assert.match(shell, /pasajeNormalizado: typeof value\?\.pasajeNormalizado/)
  assert.match(shell, /contexto: value\?\.contexto/)
  assert.match(shell, /origen: 'biblia_notas'/)
  assert.match(shell, /enqueue\('upsert', note\)/)
})
