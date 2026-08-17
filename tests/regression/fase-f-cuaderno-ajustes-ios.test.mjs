import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const layout = fs.readFileSync('app/layout.tsx', 'utf8')
const fixes = fs.readFileSync('app/notebook-fixes.css', 'utf8')
const toolbar = fs.readFileSync('components/biblia/NotesEditingToolbar.tsx', 'utf8')
const bottomNav = fs.readFileSync('components/layout/BottomNav.tsx', 'utf8')

test('FASE F: el cuaderno mantiene el menú global fuera del scroll y sigue el viewport visible de iOS', () => {
  assert.match(layout, /import '\.\/notebook-fixes\.css'/)
  assert.match(fixes, /body:has\(\.note-rich-editor\)/)
  assert.match(fixes, /overflow: hidden !important/)
  assert.match(fixes, /main:has\(\.note-rich-editor\)/)
  assert.match(fixes, /overflow-y: auto/)
  assert.match(fixes, /\.app-bottom-nav/)
  assert.match(fixes, /position: fixed !important/)
  assert.match(bottomNav, /window\.visualViewport/)
  assert.match(bottomNav, /visualBottomGap/)
  assert.match(bottomNav, /bottom: `\$\{visualBottomGap\}px`/)
  assert.doesNotMatch(fixes, /bottom: 0 !important/)
})

test('FASE F: deshacer y rehacer quedan en extremos opuestos y el guardado aparece al inicio de la nota', () => {
  assert.match(fixes, /Historial global del cuaderno/)
  assert.match(fixes, /justify-content: space-between !important/)
  assert.match(fixes, /margin-right: auto/)
  assert.match(fixes, /margin-left: auto/)
  assert.match(toolbar, /note-rich-editor-shell/)
  assert.match(toolbar, /Guardado automático/)
  assert.match(toolbar, /note-rich-editor-shell ~ p:last-child/)
})

test('FASE F: numeración visible y referencia se insertan como bloques deterministas', () => {
  assert.match(toolbar, /list-style-type: decimal !important/)
  assert.match(toolbar, /list-style-position: outside !important/)
  assert.match(toolbar, /toggleStandardList\('numbered'\)/)
  assert.match(toolbar, /handleStandardListEnter/)
  assert.match(toolbar, /insertStandaloneBlock\(editor, block, text\)/)
  assert.match(toolbar, /\[data-note-reference\]::before/)
})

test('FASE F: los estilos tipo Notas muestran nombres visuales sin iconos H1 H2 H3', () => {
  assert.match(toolbar, /styleButton\('h1', 'Título'/)
  assert.match(toolbar, /styleButton\('h2', 'Encabezado'/)
  assert.match(toolbar, /styleButton\('h3', 'Subtítulo'/)
  assert.doesNotMatch(toolbar, /Heading1/)
  assert.doesNotMatch(toolbar, /Heading2/)
  assert.doesNotMatch(toolbar, /Heading3/)
})
