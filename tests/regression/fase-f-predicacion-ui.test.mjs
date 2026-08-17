import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/biblia/BibleNotesWorkspace.tsx', 'utf8')
const shell = fs.readFileSync('public/offline/notas.html', 'utf8')
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
  assert.match(workspace, /setNotas\(resultado\.notas\)/)
})

test('FASE F: exportación reutiliza el patrón de impresión aprobado', () => {
  assert.match(workspace, /window\.print\(\)/)
  assert.match(workspace, /Exportar predicación PDF/)
  assert.match(shell, /id="sermon-export"/)
  assert.match(shell, /window\.print\(\)/)
})

test('FASE F: el shell offline conserva y encola metadatos de predicación', () => {
  for (const id of ['sermon-number','sermon-date','sermon-series','sermon-place','sermon-preacher','sermon-state']) assert.match(shell, new RegExp(`id="${id}"`))
  assert.match(shell, /numeroPredicacion:/)
  assert.match(shell, /fechaPredicacion:/)
  assert.match(shell, /estadoPredicacion:/)
  assert.match(shell, /enqueue\('upsert', note\)/)
  assert.doesNotMatch(shell, /supabase\.co/i)
})

test('FASE F: el service worker renueva únicamente el shell offline', () => {
  assert.match(sw, /vida-shell-v2\.2-cuaderno-profesional/)
  assert.match(sw, /OFFLINE_NOTES_SHELL/)
  assert.match(sw, /url\.pathname\.startsWith\('\/_next\/'\)/)
  assert.match(sw, /url\.hostname\.includes\('supabase\.co'\)/)
})
