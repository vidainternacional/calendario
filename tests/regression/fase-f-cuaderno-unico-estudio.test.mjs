// Preview reintentado 2026-08-16 tras liberación esperada del límite de builds de Vercel.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const estudio = fs.readFileSync('app/actions/estudio.ts', 'utf8')
const remote = fs.readFileSync('lib/biblia/notes-remote.ts', 'utf8')
const shell = fs.readFileSync('public/offline/notas.html', 'utf8')
const sw = fs.readFileSync('public/sw.js', 'utf8')

test('FASE F: Estudio Profundo y Biblia Notas comparten el mismo cuaderno sin copiar filas', () => {
  assert.match(estudio, /origen: 'estudio_profundo'/)
  assert.match(estudio, /origen_key: `estudio-profundo:\$\{pasajeNormalizado\}`/)
  assert.match(estudio, /onConflict: 'profile_id, pasaje_normalizado'/)
  assert.match(remote, /\.in\('origen', \['biblia_notas', 'estudio_profundo'\]\)/)
})

test('FASE F: el shell offline conserva identidad y contexto de Estudio Profundo', () => {
  assert.match(shell, /origen: typeof value\?\.origen === 'string'/)
  assert.match(shell, /origenKey: typeof value\?\.origenKey === 'string'/)
  assert.match(shell, /pasajeNormalizado: typeof value\?\.pasajeNormalizado === 'string'/)
  assert.match(shell, /contexto: value\?\.contexto && typeof value\.contexto === 'object'/)
  assert.match(shell, /origen: note\?\.origen\?\.trim\(\) \|\| 'biblia_notas'/)
  assert.match(shell, /enqueue\('delete', note\)/)
  assert.doesNotMatch(shell, /enqueue\('delete', note\.id\)/)
})

test('FASE F: renovar el shell no amplía la caché a datos privados', () => {
  assert.match(sw, /vida-shell-v2\.1-notas-origen/)
  assert.match(sw, /OFFLINE_NOTES_SHELL/)
  assert.match(sw, /url\.pathname\.startsWith\('\/api\/'\)/)
  assert.match(sw, /url\.pathname\.startsWith\('\/_next\/'\)/)
  assert.match(sw, /url\.hostname\.includes\('supabase\.co'\)/)
  assert.doesNotMatch(sw, /notas_estudio/)
})
