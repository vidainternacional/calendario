import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/biblia/BibleNotesWorkspace.tsx', 'utf8')

test('FASE F: deshacer y rehacer operan sobre acciones de la nota completa y no solo contenido', () => {
  assert.match(workspace, /type NoteHistoryEntry = \{/)
  assert.match(workspace, /before: NotaBiblica \| null/)
  assert.match(workspace, /after: NotaBiblica \| null/)
  assert.match(workspace, /type NoteHistory = \{/)
  assert.match(workspace, /past: NoteHistoryEntry\[\]/)
  assert.match(workspace, /future: NoteHistoryEntry\[\]/)
  assert.match(workspace, /noteHistoryRef/)
  assert.doesNotMatch(workspace, /type ContentHistory =/)
})

test('FASE F: convertir a predicación y sus metadatos pasan por el historial reversible', () => {
  assert.match(workspace, /const cambiarTipo = \(tipo: TipoNota\) =>/)
  assert.match(workspace, /actualizar\(\{ tipo \}, \{ checkpoint: true \}\)/)
  assert.match(workspace, /const actualizarPredicacion =/)
  assert.match(workspace, /actualizar\(\{ tipo: 'predicacion', \.\.\.cambios \}, options\)/)
  assert.match(workspace, /deshacerNota/)
  assert.match(workspace, /rehacerNota/)
  assert.match(workspace, /aplicarEntradaHistorial/)
})

test('FASE F: crear y eliminar notas también son acciones reversibles', () => {
  assert.match(workspace, /const nuevaNota = \(\) =>/)
  assert.match(workspace, /before: null/)
  assert.match(workspace, /after: nota/)
  assert.match(workspace, /const eliminar = \(\) =>/)
  assert.match(workspace, /before: eliminada/)
  assert.match(workspace, /after: null/)
})

test('FASE F: escritura continua se agrupa pero acciones discretas crean checkpoints', () => {
  assert.match(workspace, /const continuous = options\?\.checkpoint === false/)
  assert.match(workspace, /now - history\.lastCheckpointAt < 1200/)
  assert.match(workspace, /actualizar\(\{ titulo: event\.target\.value \}, \{ checkpoint: false \}\)/)
  assert.match(workspace, /actualizar\(\{ referencia: event\.target\.value \}, \{ checkpoint: false \}\)/)
  assert.match(workspace, /paqueteId: event\.target\.value, paquete: paquete\?\.titulo \?\? '' \}, \{ checkpoint: true \}/)
})
