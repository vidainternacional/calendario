import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/biblia/BibleNotesWorkspace.tsx', 'utf8')
const offlineWorkspace = fs.readFileSync('components/biblia/OfflineBibleNotesWorkspace.tsx', 'utf8')
const sw = fs.readFileSync('public/sw.js', 'utf8')

test('FASE F: Predicación muestra sus metadatos sin afectar otros tipos', () => {
  assert.match(workspace, /seleccionada\.tipo === 'predicacion'/)
  assert.match(workspace, /Datos de predicación/)
  assert.match(workspace, /N\.º de prédica/)
  assert.match(workspace, /fechaPredicacion/)
  assert.match(workspace, /serie/)
  assert.match(workspace, /lugar/)
  assert.match(workspace, /predicador/)
  assert.match(workspace, /estadoPredicacion/)
})

test('FASE F: el correlativo vuelve a la pantalla después de sincronizar', () => {
  assert.match(workspace, /VIDA_BIBLE_NOTES_SYNC_EVENT/)
  assert.match(workspace, /window\.addEventListener\(VIDA_BIBLE_NOTES_SYNC_EVENT, recuperar\)/)
  assert.match(workspace, /seleccionada\.numeroPredicacion \? `#\$\{seleccionada\.numeroPredicacion\}` : '—'/)
  assert.match(workspace, /reemplazarNotasBiblicasLocalesDesdeServidor\(resultado\.notas, usuarioId\)/)
  assert.match(workspace, /establecerNotas\(resultado\.notas\)/)
})

test('FASE F: exportación usa exactamente la misma implementación online y offline', () => {
  assert.match(workspace, /window\.print\(\)/)
  assert.match(workspace, /Exportar predicación PDF/)
  assert.match(offlineWorkspace, /BibleNotesWorkspace userId=\{ownerId\}/)
})

test('FASE F: el modo offline conserva los metadatos porque monta el mismo workspace canónico', () => {
  assert.match(offlineWorkspace, /BibleNotesWorkspace userId=\{ownerId\}/)
  for (const field of ['numeroPredicacion','fechaPredicacion','serie','lugar','predicador','estadoPredicacion']) assert.match(workspace, new RegExp(field))
})

test('FASE F/G: el shell cachea código estático y los datos autenticados quedan aislados por usuario', () => {
  assert.match(sw, /CACHE_NAME = `vida-shell-\$\{CACHE_VERSION\}`/)
  assert.match(sw, /USER_CACHE_PREFIX = `vida-user-\$\{CACHE_VERSION\}-`/)
  assert.match(sw, /OFFLINE_NOTES_APP/)
  assert.match(sw, /url\.pathname\.startsWith\('\/_next\/static\/'\)/)
  assert.match(sw, /url\.hostname\.includes\('supabase\.co'\)/)
  assert.match(sw, /clearActiveOwner/)
  assert.match(sw, /caches\.delete\(userCacheName/)
  assert.doesNotMatch(sw, /notas_estudio/)
})
