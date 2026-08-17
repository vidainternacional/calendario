import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const layout = fs.readFileSync('app/layout.tsx', 'utf8')
const fixes = fs.readFileSync('app/notebook-fixes.css', 'utf8')
const toolbar = fs.readFileSync('components/biblia/NotesEditingToolbar.tsx', 'utf8')

test('FASE F: el cuaderno mantiene el menú global fuera del scroll en iOS', () => {
  assert.match(layout, /import '\.\/notebook-fixes\.css'/)
  assert.match(fixes, /body:has\(\.note-rich-editor\)/)
  assert.match(fixes, /overflow: hidden !important/)
  assert.match(fixes, /main:has\(\.note-rich-editor\)/)
  assert.match(fixes, /overflow-y: auto/)
  assert.match(fixes, /\.app-bottom-nav/)
  assert.match(fixes, /bottom: 0 !important/)
})

test('FASE F: deshacer y rehacer quedan separados y el guardado aparece al inicio', () => {
  assert.match(fixes, /Historial global del cuaderno/)
  assert.match(fixes, /justify-content: space-between !important/)
  assert.match(fixes, /order: -1/)
})

test('FASE F: numeración visible y referencia se insertan como bloque independiente', () => {
  assert.match(toolbar, /list-style: decimal outside !important/)
  assert.match(toolbar, /insertOrderedList/)
  assert.match(toolbar, /insertStandaloneBlock\(editor, block, text\)/)
  assert.match(toolbar, /data-note-reference-icon/)
})

test('FASE F: los estilos tipo Notas muestran nombres visuales sin iconos H1 H2 H3', () => {
  assert.match(toolbar, /styleButton\('h1', 'Título'/)
  assert.match(toolbar, /styleButton\('h2', 'Encabezado'/)
  assert.match(toolbar, /styleButton\('h3', 'Subtítulo'/)
  assert.doesNotMatch(toolbar, /Heading1/)
  assert.doesNotMatch(toolbar, /Heading2/)
  assert.doesNotMatch(toolbar, /Heading3/)
})
