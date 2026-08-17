import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const toolbar = fs.readFileSync('components/biblia/NotesEditingToolbar.tsx', 'utf8')
const workspace = fs.readFileSync('components/biblia/BibleNotesWorkspace.tsx', 'utf8')

test('FASE F: el editor muestra formato WYSIWYG sin exponer marcadores al usuario', () => {
  assert.match(toolbar, /contentEditable=!\{readOnly\}/)
  assert.match(toolbar, /canonicalToRichHtml/)
  assert.match(toolbar, /richElementToCanonical/)
  assert.match(toolbar, /document\.execCommand\('formatBlock'/)
  assert.match(toolbar, /document\.execCommand\(command/)
  assert.match(toolbar, /Negrita/)
  assert.match(toolbar, /Cursiva/)
  assert.match(toolbar, /Subrayado/)
  assert.match(toolbar, /Tachado/)
  assert.doesNotMatch(workspace, /<textarea/)
})

test('FASE F: estilos de párrafo equivalentes a Notas permanecen visibles', () => {
  for (const label of ['Título', 'Encabezado', 'Subtítulo', 'Cuerpo', 'Mono']) assert.match(toolbar, new RegExp(label))
  assert.match(toolbar, /styleButton\('h1'/)
  assert.match(toolbar, /styleButton\('h2'/)
  assert.match(toolbar, /styleButton\('h3'/)
  assert.match(toolbar, /styleButton\('p'/)
  assert.match(toolbar, /styleButton\('pre'/)
})

test('FASE F: listas usan estructura editable real y tareas interactivas', () => {
  assert.match(toolbar, /insertUnorderedList/)
  assert.match(toolbar, /insertOrderedList/)
  assert.match(toolbar, /data-task-checkbox/)
  assert.match(toolbar, /target\.dataset\.taskCheckbox/)
  assert.match(toolbar, /handleTaskEnter/)
  assert.match(toolbar, /Enter continúa automáticamente/)
  assert.match(toolbar, /li::marker/)
})

test('FASE F: edición conserva salida segura y no usa dangerouslySetInnerHTML', () => {
  assert.match(toolbar, /event\.clipboardData\.getData\('text\/plain'\)/)
  assert.match(toolbar, /onDrop=\{\(event\) => event\.preventDefault\(\)\}/)
  assert.doesNotMatch(toolbar, /dangerouslySetInnerHTML/)
})
