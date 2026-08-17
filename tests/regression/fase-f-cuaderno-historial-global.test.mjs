import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/biblia/BibleNotesWorkspace.tsx', 'utf8')

test('FASE F: deshacer y rehacer operan sobre la nota completa y no solo contenido', () => {
  assert.match(workspace, /type NoteHistory = \{/)
  assert.match(workspace, /past: NotaBiblica\[\]/)
  assert.match(workspace, /future: NotaBiblica\[\]/)
  assert.match(workspace, /current: NotaBiblica/)
  assert.match(workspace, /noteHistoryRef/)
  assert.doesNotMatch(workspace, /type ContentHistory =/)
})

test('FASE F: convertir a predicación y sus metadatos pasan por el historial reversible', () => {
  assert.match(workspace, /const cambiarTipo = \(tipo: TipoNota\) =>/)
  assert.match(workspace, /actualizar\(\{ tipo \}, \{ checkpoint: true \}\)/)
  assert.match(workspace, /const actualizarPredicacion =/)
  assert.match(workspace, /tipo: 'predicacion'/)
  assert.match(workspace, /deshacerNota/)
  assert.match(workspace, /rehacerNota/)
  assert.match(workspace, /setNotas\(\(actuales\) => actuales\.map/)
})

test('FASE F: escritura continua se agrupa pero acciones discretas crean checkpoints', () => {
  assert.match(workspace, /options\?\.checkpoint !== false/)
  assert.match(workspace, /now - history\.lastCheckpointAt >= 1200/)
  assert.match(workspace, /actualizar\(\{ titulo: event\.target\.value \}, \{ checkpoint: false \}\)/)
  assert.match(workspace, /actualizar\(\{ referencia: event\.target\.value \}, \{ checkpoint: false \}\)/)
})
