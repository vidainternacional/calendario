import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const layout = fs.readFileSync('app/layout.tsx', 'utf8')
const fixes = fs.readFileSync('app/notebook-fixes.css', 'utf8')
const toolbar = fs.readFileSync('components/biblia/NotesEditingToolbar.tsx', 'utf8')
const bottomNav = fs.readFileSync('components/layout/BottomNav.tsx', 'utf8')

test('FASE F: el cuaderno mantiene el menú global fuera del scroll y el teclado no lo levanta sobre la nota', () => {
  assert.match(layout, /import '\.\/notebook-fixes\.css'/)
  assert.match(fixes, /body:has\(\.note-rich-editor\)/)
  assert.match(fixes, /overflow: hidden !important/)
  assert.match(fixes, /main:has\(\.note-rich-editor\)/)
  assert.match(fixes, /overflow-y: auto/)
  assert.match(bottomNav, /elementoEditableActivo/)
  assert.match(bottomNav, /document\.addEventListener\('focusin', syncKeyboardImmediately\)/)
  assert.match(bottomNav, /setKeyboardOpen\(mobile && elementoEditableActivo\(\)\)/)
  assert.match(bottomNav, /data-keyboard-policy="layout-bottom-covered"/)
  assert.match(bottomNav, /keyboardOpen \? 'hidden' : 'block'/)
  assert.doesNotMatch(bottomNav, /baselineViewportRef|visualViewport|translate3d/)
})

test('FASE F: edición usa una sola superficie visual y conserva áreas táctiles suficientes', () => {
  assert.match(fixes, /Principio visual del Cuaderno/)
  assert.match(fixes, /#cuaderno-panel-herramientas/)
  assert.match(fixes, /border: 0 !important/)
  assert.match(fixes, /background: transparent !important/)
  assert.match(fixes, /min-height: 2\.55rem !important/)
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
  assert.match(toolbar, /text\.textContent = reference\.trim\(\)/)
  assert.match(toolbar, /\[data-note-reference-text\]:empty::before/)
  assert.match(toolbar, /Escribe una referencia bíblica/)
})

test('FASE F: los estilos tipo Notas muestran nombres visuales sin iconos H1 H2 H3', () => {
  assert.match(toolbar, /styleButton\('h1', 'Título'/)
  assert.match(toolbar, /styleButton\('h2', 'Encabezado'/)
  assert.match(toolbar, /styleButton\('h3', 'Subtítulo'/)
  assert.doesNotMatch(toolbar, /Heading1/)
  assert.doesNotMatch(toolbar, /Heading2/)
  assert.doesNotMatch(toolbar, /Heading3/)
})

test('FASE F: estilos de párrafo se aplican una sola vez y el segundo toque los devuelve a cuerpo', () => {
  assert.match(toolbar, /function blockStyleAtSelection/)
  assert.match(toolbar, /const currentBlock = blockStyleAtSelection\(editor, selection\)/)
  assert.match(toolbar, /const nextBlock: BlockStyle = block !== 'p' && currentBlock === block \? 'p' : block/)
  assert.match(toolbar, /formatBlock', false, nextBlock/)
  assert.match(toolbar, /block: nextBlock/)
})

test('FASE F: negrita cursiva subrayado y tachado son estados independientes y combinables', () => {
  assert.match(toolbar, /type InlineFormatKey = 'bold' \| 'italic' \| 'underline' \| 'strike'/)
  assert.match(toolbar, /inlineStateAtSelection/)
  assert.match(toolbar, /selectionSyncLockRef/)
  assert.match(toolbar, /const nextActive = !inlineBefore\[key\]/)
  assert.match(toolbar, /setFormatState\(\(current\) => \(\{ \.\.\.current, \[key\]: nextActive \}\)\)/)
  assert.match(toolbar, /onPointerDown=\{\(event\) => event\.preventDefault\(\)\}/)
  assert.match(toolbar, /Triple asterisco se procesa primero/)
  assert.match(toolbar, /<strong><em>\$1<\/em><\/strong>/)
  assert.doesNotMatch(toolbar, /queryCommandState/)
})
