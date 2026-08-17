import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const layout = fs.readFileSync('app/layout.tsx', 'utf8')
const fixes = fs.readFileSync('app/notebook-fixes.css', 'utf8')
const toolbar = fs.readFileSync('components/biblia/NotesEditingToolbar.tsx', 'utf8')
const bottomNav = fs.readFileSync('components/layout/BottomNav.tsx', 'utf8')

test('FASE F: el cuaderno crece con el documento y el teclado no levanta el menú global sobre la nota', () => {
  assert.match(layout, /import '\.\/notebook-fixes\.css'/)
  assert.match(fixes, /body:has\(\.note-rich-editor\)/)
  assert.match(fixes, /height: auto/)
  assert.match(fixes, /max-height: none/)
  assert.match(fixes, /overflow-y: auto !important/)
  assert.match(fixes, /main:has\(\.note-rich-editor\)/)
  assert.match(fixes, /padding-bottom: calc\(8rem \+ env\(safe-area-inset-bottom, 0px\)\) !important/)
  assert.doesNotMatch(fixes, /overflow: hidden !important/)
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

test('FASE F: estilos de párrafo responden al primer toque y el segundo toque los devuelve a cuerpo', () => {
  assert.match(toolbar, /function blockStyleAtSelection/)
  assert.match(toolbar, /blockSelectionStateRef = useRef<BlockStyle>\('p'\)/)
  assert.match(toolbar, /const previousBlock = blockSelectionStateRef\.current/)
  assert.match(toolbar, /const nextBlock: BlockStyle = block !== 'p' && previousBlock === block \? 'p' : block/)
  assert.match(toolbar, /blockSelectionStateRef\.current = nextBlock/)
  assert.match(toolbar, /setFormatState\(\(current\) => \(\{ \.\.\.current, block: nextBlock \}\)\)/)
  assert.match(toolbar, /formatBlock', false, nextBlock/)
})

test('FASE F: negrita cursiva subrayado y tachado son estados independientes, combinables y visualmente estables', () => {
  assert.match(toolbar, /type InlineFormatKey = 'bold' \| 'italic' \| 'underline' \| 'strike'/)
  assert.match(toolbar, /inlineStateAtSelection/)
  assert.match(toolbar, /selectionSyncLockRef/)
  assert.match(toolbar, /inlineSelectionStateRef = useRef<InlineState>/)
  assert.match(toolbar, /inlineCaretOverrideRef = useRef</)
  assert.match(toolbar, /const previousInline = inlineSelectionStateRef\.current/)
  assert.match(toolbar, /const nextInline: InlineState = \{ \.\.\.previousInline, \[key\]: !previousInline\[key\] \}/)
  assert.match(toolbar, /inlineSelectionStateRef\.current = nextInline/)
  assert.match(toolbar, /setFormatState\(\(current\) => \(\{ \.\.\.current, \.\.\.nextInline \}\)\)/)
  assert.match(toolbar, /state: nextInline/)
  assert.match(toolbar, /data-format-active=\{active \? 'true' : 'false'\}/)
  assert.match(toolbar, /ring-violet-300\/60/)
  assert.match(toolbar, /onPointerDown=\{\(event\) => event\.preventDefault\(\)\}/)
  assert.match(toolbar, /Triple asterisco se procesa primero/)
  assert.match(toolbar, /<strong><em>\$1<\/em><\/strong>/)
  assert.doesNotMatch(toolbar, /queryCommandState/)
})
