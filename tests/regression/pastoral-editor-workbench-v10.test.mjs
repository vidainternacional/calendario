import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-workbench-v10.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')

test('V10 es la única autoridad final de Plantillas después de V7', () => {
  assert.match(layout, /pastoral-editor-plantillas-v7\.css'[\s\S]*pastoral-editor-workbench-v10\.css'/)
  assert.doesNotMatch(layout, /pastoral-editor-plantillas-v8\.css'/)
  assert.doesNotMatch(layout, /pastoral-editor-plantillas-v9\.css'/)
})

test('el modo Editar usa una autoridad local y una sola superficie gris', () => {
  assert.match(css, /--pastoral-edit-desk: #626568/)
  assert.match(css, /\.pastoral-editor-v4:has\(> \.pastoral-editor-section\),[\s\S]*pastoral-editor-v4:has\(> \.pastoral-editor-section\) \.pastoral-tool-dock[\s\S]*background: var\(--pastoral-edit-desk\) !important/)
  assert.match(css, /pastoral-canvas-wrap,[\s\S]*pastoral-tool-panel-scroll,[\s\S]*pastoral-panel-content,[\s\S]*pastoral-compact-row,[\s\S]*pastoral-tool-dock[\s\S]*background: var\(--pastoral-edit-desk\) !important/)
})

test('no quedan líneas, bordes ni pseudoelementos entre las zonas del editor', () => {
  assert.match(css, /pastoral-editor-shell::before,[\s\S]*pastoral-tool-dock::after[\s\S]*display: none !important[\s\S]*content: none !important/)
  assert.match(css, /pastoral-pages-strip,[\s\S]*pastoral-tool-panel,[\s\S]*pastoral-tool-dock[\s\S]*border: 0 !important[\s\S]*outline: 0 !important[\s\S]*box-shadow: none !important/)
})

test('la página activa permanece visible y estable en su propia fila', () => {
  assert.match(css, /pastoral-stage[\s\S]*grid-template-rows: minmax\(0,1fr\) 52px !important/)
  assert.match(css, /pastoral-page-chip > button:first-child[\s\S]*visibility: visible !important[\s\S]*font-size: \.82rem !important/)
})

test('Plantillas mantiene scroll vertical y las tres cintas admiten scroll horizontal', () => {
  assert.match(css, /panel-plantillas \.pastoral-tool-panel-scroll[\s\S]*overflow-y: auto !important[\s\S]*touch-action: pan-y !important/)
  assert.match(css, /pastoral-template-grid,[\s\S]*pastoral-theme-grid,[\s\S]*pastoral-start-backgrounds[\s\S]*overflow-x: auto !important[\s\S]*touch-action: pan-x pan-y !important/)
})

test('Plantillas y Temas conservan el mismo ancho aprobado', () => {
  assert.match(css, /pastoral-template-option,[\s\S]*pastoral-theme-option[\s\S]*flex: 0 0 132px !important[\s\S]*width: 132px !important/)
})

test('el dock pinta la misma mesa gris y sus iconos son blancos y legibles', () => {
  assert.match(css, /pastoral-tool-dock > \.pastoral-tool-button:nth-child\(7\)[\s\S]*background: var\(--pastoral-edit-desk\) !important/)
  assert.match(css, /pastoral-tool-button svg[\s\S]*width: 23px !important[\s\S]*stroke: #fff !important[\s\S]*stroke-width: 1.9 !important/)
  assert.match(css, /pastoral-tool-button\.is-active svg[\s\S]*drop-shadow\(0 0 2px rgba\(255,255,255,.30\)\)/)
})

test('el dock conserva feedback táctil breve y reduce movimiento cuando corresponde', () => {
  assert.match(css, /pastoral-tool-button:active[\s\S]*translateY\(1px\) scale\(\.95\)/)
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*transition: none !important[\s\S]*animation: none !important/)
})
