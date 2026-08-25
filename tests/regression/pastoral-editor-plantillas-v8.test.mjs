import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-workbench-v10.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')

test('V8 queda retirada del runtime y sus garantías pasan a V10', () => {
  assert.doesNotMatch(layout, /pastoral-editor-plantillas-v8\.css'/)
  assert.match(layout, /pastoral-editor-plantillas-v7\.css'[\s\S]*pastoral-editor-workbench-v10\.css'/)
})

test('las tres cintas conservan viewport acotado y scroll horizontal real en V10', () => {
  assert.match(css, /pastoral-template-grid,[\s\S]*inline-size: 100% !important[\s\S]*max-width: 100% !important[\s\S]*overflow-x: auto !important/)
  assert.match(css, /touch-action: pan-x !important/)
  assert.match(css, /-webkit-overflow-scrolling: touch !important/)
})

test('Plantillas y Temas comparten ancho y Fondos conserva su tamaño', () => {
  assert.match(css, /pastoral-template-option,[\s\S]*pastoral-theme-option[\s\S]*flex: 0 0 132px !important[\s\S]*max-width: 132px !important/)
  assert.match(css, /pastoral-start-backgrounds > button,[\s\S]*pastoral-upload-tile[\s\S]*flex: 0 0 58px !important/)
})

test('la franja de páginas sigue fija y visible sin separador blanco', () => {
  assert.match(css, /pastoral-stage[\s\S]*grid-template-rows: minmax\(0,1fr\) 52px !important/)
  assert.match(css, /pastoral-pages-strip[\s\S]*grid-row: 2 !important[\s\S]*height: 52px !important/)
  assert.match(css, /pastoral-page-chip > button:first-child[\s\S]*visibility: visible !important/)
  assert.match(css, /pastoral-pages-strip[\s\S]*background: var\(--pastoral-edit-desk\) !important/)
})

test('el dock heredado de V8 ya no puede volver a pintar una barra blanca', () => {
  assert.doesNotMatch(layout, /pastoral-editor-plantillas-v8\.css'/)
  assert.match(css, /pastoral-tool-dock[\s\S]*background: var\(--pastoral-edit-desk\) !important/)
  assert.match(css, /pastoral-tool-button svg[\s\S]*stroke: #fff !important[\s\S]*stroke-width: 1.9 !important/)
})
