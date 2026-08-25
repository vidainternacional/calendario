import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-workbench-v10.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')

test('V9 queda retirada del runtime y V10 asume su responsabilidad visual', () => {
  assert.doesNotMatch(layout, /pastoral-editor-plantillas-v9\.css'/)
  assert.match(layout, /pastoral-editor-workbench-v10\.css'/)
})

test('Plantillas y Temas conservan exactamente 132px de ancho', () => {
  assert.match(css, /pastoral-template-option,[\s\S]*pastoral-theme-option[\s\S]*flex: 0 0 132px !important[\s\S]*width: 132px !important/)
})

test('las etiquetas conservan padding de seguridad y ya no se recortan', () => {
  assert.match(css, /pastoral-template-option > span:last-child[\s\S]*padding: 0 4px !important[\s\S]*text-indent: 0 !important/)
  assert.match(css, /pastoral-theme-option > span:last-child[\s\S]*padding: 0 2px !important[\s\S]*text-indent: 0 !important/)
})

test('los carruseles admiten gesto horizontal sin bloquear el scroll vertical del panel', () => {
  assert.match(css, /pastoral-template-grid,[\s\S]*pastoral-theme-grid,[\s\S]*pastoral-start-backgrounds[\s\S]*overflow-x: auto !important[\s\S]*touch-action: pan-x pan-y !important/)
  assert.match(css, /panel-plantillas \.pastoral-tool-panel-scroll[\s\S]*overflow-y: auto !important[\s\S]*touch-action: pan-y !important/)
})

test('el modo edición ya no usa la superficie clara ni dock claro de V9', () => {
  assert.doesNotMatch(css, /--pastoral-edit-surface: #eceff1/)
  assert.doesNotMatch(css, /background: rgba\(250,251,252,.96\) !important/)
  assert.match(css, /--pastoral-edit-desk: #626568/)
})

test('el dock conserva iconografía clara sin pills ni caja blanca', () => {
  assert.match(css, /pastoral-tool-button:nth-child\(7\)[\s\S]*border-radius: 0 !important[\s\S]*background: var\(--pastoral-edit-desk\) !important/)
  assert.match(css, /pastoral-tool-button svg[\s\S]*stroke: #fff !important[\s\S]*stroke-width: 1.9 !important/)
})
