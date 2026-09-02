import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')
const model = fs.readFileSync('components/pastoral/pastoral-canvas-model.ts', 'utf8')

test('el teclado nativo da más recorrido a las herramientas sin mover la navegación global', () => {
  assert.match(workspace, /window\.visualViewport/)
  assert.match(workspace, /setTecladoAbierto\(abierto\)/)
  assert.match(workspace, /data-pastoral-format-section="true"/)
  assert.match(workspace, /scrollIntoView\(\{ block: 'nearest', behavior: 'smooth' \}\)/)
  assert.match(workspace, /paddingBottom: `\$\{Math\.max\(160, tecladoInset \+ 32\)\}px`/)
  assert.doesNotMatch(workspace, /app-bottom-nav/)
})

test('tamaño e interlineado distinguen selección parcial de caja completa', () => {
  assert.match(workspace, /const seleccionCubreTodo =/)
  assert.match(workspace, /data-vida-size/)
  assert.match(workspace, /data-vida-line-height/)
  assert.match(workspace, /haySeleccionDePalabras\(editor\) && !seleccionCubreTodo\(editor\)/)
  assert.match(workspace, /actualizarElemento\(textoSeleccionado\.id, \{ tamano_fuente:/)
  assert.match(workspace, /actualizarElemento\(textoSeleccionado\.id, \{ interlineado: siguiente \}\)/)
})

test('el interlineado admite un rango más amplio', () => {
  assert.match(workspace, /Math\.min\(3, Math\.max\(\.8, actual \+ delta\)\)/)
  assert.match(model, /interlineado: clamp\(Number\(item\.interlineado \?\? INTERLINEADO_BASE_POR_ROL\[rol\]\), \.8, 3\)/)
})

test('el formato parcial se guarda como atributos VIDA seguros y vuelve a renderizarse', () => {
  assert.match(model, /'SPAN'/)
  assert.match(model, /data-vida-size/)
  assert.match(model, /data-vida-line-height/)
  assert.match(model, /data-vida-color/)
  assert.match(canvas, /aplicarAtributosInlineVida/)
  assert.match(canvas, /span\[data-vida-size\], span\[data-vida-line-height\], span\[data-vida-color\]/)
})

test('seleccionar todo el contenido usa el tamaño de la caja para que viñetas y texto escalen juntos', () => {
  assert.match(workspace, /normalizar\(seleccionVentana\.toString\(\)\) === normalizar\(editor\.innerText\)/)
  assert.match(canvas, /\[contenteditable='true'\] ul \{ list-style:disc; padding-left:1\.35em; \}/)
  assert.match(canvas, /\[contenteditable='true'\] ol \{ list-style:decimal; padding-left:1\.35em; \}/)
})
