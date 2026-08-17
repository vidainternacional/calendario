// Preview reintentado 2026-08-16 tras liberación esperada del límite de builds de Vercel.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const estudio = fs.readFileSync('app/actions/estudio.ts', 'utf8')
const remote = fs.readFileSync('lib/biblia/notes-remote.ts', 'utf8')
const notesLocal = fs.readFileSync('lib/biblia/notes-local.ts', 'utf8')
const offlineWorkspace = fs.readFileSync('components/biblia/OfflineBibleNotesWorkspace.tsx', 'utf8')
const sw = fs.readFileSync('public/sw.js', 'utf8')

test('FASE F: Estudio Profundo y Biblia Notas comparten el mismo cuaderno sin copiar filas', () => {
  assert.match(estudio, /origen: 'estudio_profundo'/)
  assert.match(estudio, /origen_key: `estudio-profundo:\$\{pasajeNormalizado\}`/)
  assert.match(estudio, /onConflict: 'profile_id, pasaje_normalizado'/)
  assert.match(remote, /\.in\('origen', \['biblia_notas', 'estudio_profundo'\]\)/)
})

test('FASE F: el cold-start offline conserva identidad y contexto usando el mismo modelo local', () => {
  assert.match(offlineWorkspace, /BibleNotesWorkspace userId=\{ownerId\}/)
  assert.match(notesLocal, /origen: nota\.origen \?\? 'biblia_notas'/)
  assert.match(notesLocal, /origenKey: nota\.origenKey \?\? ''/)
  assert.match(notesLocal, /pasajeNormalizado: nota\.pasajeNormalizado \?\? ''/)
  assert.match(notesLocal, /contexto: normalizarContexto\(nota\.contexto\)/)
})

test('FASE F: la nueva paridad offline solo amplía caché a código público estático', () => {
  assert.match(sw, /vida-shell-v2\.3-cuaderno-react-real/)
  assert.match(sw, /OFFLINE_NOTES_APP/)
  assert.match(sw, /url\.pathname\.startsWith\('\/api\/'\)/)
  assert.match(sw, /url\.pathname\.startsWith\('\/_next\/static\/'\)/)
  assert.match(sw, /if \(url\.pathname\.startsWith\('\/_next\/'\)\) return/)
  assert.match(sw, /url\.hostname\.includes\('supabase\.co'\)/)
  assert.doesNotMatch(sw, /notas_estudio/)
})
