import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const layout = fs.readFileSync('app/layout.tsx', 'utf8')
const fixes = fs.readFileSync('app/notebook-fixes.css', 'utf8')
const toolbar = fs.readFileSync('components/biblia/NotesEditingToolbar.tsx', 'utf8')
const bottomNav = fs.readFileSync('components/layout/BottomNav.tsx', 'utf8')

test('FASE F: el menú global conserva el borde inferior del layout y no sube con el teclado', () => {
  assert.match(layout, /import '\.\/notebook-fixes\.css'/)
  assert.match(fixes, /body:has\(\.note-rich-editor\)/)
  assert.match(fixes, /overflow: hidden !important/)
  assert.match(fixes, /main:has\(\.note-rich-editor\)/)
  assert.match(fixes, /overflow-y: auto/)
  assert.doesNotMatch(fixes, /body:has\(\.note-rich-editor\) \.app-bottom-nav/)
  assert.match(bottomNav, /bottom: 0/)
  assert.match(bottomNav, /data-keyboard-policy="layout-bottom"/)
  assert.doesNotMatch(bottomNav, /window\.visualViewport/)
  assert.doesNotMatch(bottomNav, /visualBottomGap/)
})

test('FASE F: deshacer y rehacer quedan en extremos opuestos y el guardado permanece discreto', () => {
  assert.match(fixes, /Historial global del cuaderno/)
  assert.match(fixes, /justify-content: space-between !important/)
  assert.match(fixes, /margin-right: auto/)
  assert.match(fixes, /margin-left: auto/)
  assert.match(toolbar, /note-rich-editor-shell/)
  assert.match(toolbar, /Guardado automático/)
  assert.match(fixes, /Estado de guardado discreto/)
})

test('FASE F: la barra de edición es compacta y conserva selección visual', () => {
  assert.match(fixes, /Barra de edición compacta/)
  assert.match(fixes, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\) !important/)
  assert.match(fixes, /button:nth-child\(1\)::before/)
  assert.match(fixes, /content: 'T'/)
  assert.match(fixes, /button:nth-child\(4\)::before/)
  assert.match(fixes, /content: 'Aa'/)
  assert.match(fixes, /button:has\(svg\) > span/)
  assert.match(toolbar, /aria-pressed=\{active\}/)
  assert.match(toolbar, /bg-violet-600 text-white shadow-sm/)
})

test('FASE F: numeración visible y referencia se insertan como bloques deterministas', () => {
  assert.match(toolbar, /list-style-type: decimal !important/)
  assert.match(toolbar, /list-style-position: outside !important/)
  assert.match(toolbar, /toggleStandardList\('numbered'\)/)
  assert.match(toolbar, /handleStandardListEnter/)
  assert.match(toolbar, /insertStandaloneBlock\(editor, block, text\)/)
  assert.match(toolbar, /\[data-note-reference\]::before/)
})

test('FASE F: los estilos tipo Notas mantienen nombres accesibles sin iconos H1 H2 H3 visibles', () => {
  assert.match(toolbar, /styleButton\('h1', 'Título'/)
  assert.match(toolbar, /styleButton\('h2', 'Encabezado'/)
  assert.match(toolbar, /styleButton\('h3', 'Subtítulo'/)
  assert.doesNotMatch(toolbar, /Heading1/)
  assert.doesNotMatch(toolbar, /Heading2/)
  assert.doesNotMatch(toolbar, /Heading3/)
})
