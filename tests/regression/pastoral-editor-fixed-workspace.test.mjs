import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-fixed-workspace.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')

test('workspace fijo se carga despues de compactacion movil', () => {
  assert.match(layout, /pastoral-editor-compact-mobile\.css'[\s\S]*pastoral-editor-fixed-workspace\.css'/)
})

test('edicion movil bloquea scroll de pagina y ocupa viewport disponible', () => {
  assert.match(css, /body:has\(\.pastoral-canva-workspace \.pastoral-editor-shell\) \{[\s\S]*overflow: hidden !important/)
  assert.match(css, /\.pastoral-canva-workspace \{[\s\S]*position: fixed !important[\s\S]*bottom: calc\(4rem \+ env\(safe-area-inset-bottom, 0px\)\) !important/)
})

test('header es la unica referencia superior y shell absorbe espacio restante', () => {
  assert.match(css, /> header \{[\s\S]*flex: 0 0 auto !important/)
  assert.match(css, /\.pastoral-editor-shell,[\s\S]*flex: 1 1 auto !important[\s\S]*min-height: 0 !important/)
})

test('lienzo comienza arriba y no se centra verticalmente', () => {
  assert.match(css, /\.pastoral-stage \{[\s\S]*align-content: start !important/)
  assert.match(css, /\.pastoral-canvas-wrap[\s\S]*align-self: start !important/)
  assert.match(css, /orientation: portrait[\s\S]*align-items: start !important/)
})

test('dock y panel mantienen posicion estable', () => {
  assert.match(css, /\.pastoral-tool-dock \{[\s\S]*z-index: 44 !important[\s\S]*flex: 0 0 auto !important/)
  assert.match(css, /\.pastoral-tool-panel \{[\s\S]*bottom: 47px !important/)
  assert.match(css, /\.pastoral-tool-panel-scroll \{[\s\S]*overflow-y: auto !important/)
})
