import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-workbench-v10.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')

test('V10 carga después de V9 como autoridad final del entorno de edición', () => {
  assert.match(layout, /pastoral-editor-plantillas-v9\.css'[\s\S]*pastoral-editor-workbench-v10\.css'/)
})

test('todo el modo edición comparte una sola superficie gris continua', () => {
  assert.match(css, /--pastoral-edit-desk: #626568/)
  assert.match(css, /pastoral-editor-v4 > header,[\s\S]*pastoral-editor-section,[\s\S]*pastoral-editor-shell,[\s\S]*pastoral-stage[\s\S]*background: var\(--pastoral-edit-desk\) !important/)
  assert.match(css, /pastoral-canvas-wrap,[\s\S]*pastoral-pages-strip,[\s\S]*pastoral-tool-panel,[\s\S]*pastoral-tool-panel-scroll[\s\S]*background: transparent !important/)
})

test('la cabecera también entra al modo gris y usa texto claro', () => {
  assert.match(css, /pastoral-editor-v4 > header \{[\s\S]*backdrop-filter: none !important/)
  assert.match(css, /pastoral-editor-v4 > header input \{[\s\S]*color: #fff !important/)
  assert.match(css, /pastoral-editor-v4 > header nav button:first-child[\s\S]*color: #fff !important/)
})

test('no quedan separadores decorativos blancos entre zonas del editor', () => {
  assert.match(css, /pastoral-editor-shell::before,[\s\S]*pastoral-tool-dock::after[\s\S]*display: none !important[\s\S]*content: none !important/)
  assert.match(css, /pastoral-pages-strip,[\s\S]*pastoral-tool-panel[\s\S]*border: 0 !important[\s\S]*outline: 0 !important[\s\S]*box-shadow: none !important/)
})

test('Plantillas permite desplazamiento vertical y cada cinta conserva desplazamiento horizontal', () => {
  assert.match(css, /panel-plantillas \.pastoral-tool-panel-scroll[\s\S]*overflow-y: auto !important[\s\S]*touch-action: pan-y !important/)
  assert.match(css, /pastoral-template-grid,[\s\S]*pastoral-theme-grid,[\s\S]*pastoral-start-backgrounds[\s\S]*overflow-x: auto !important[\s\S]*touch-action: pan-x !important/)
})

test('el dock comparte el gris y prioriza legibilidad sobre glow', () => {
  assert.match(css, /pastoral-tool-dock \{[\s\S]*background: var\(--pastoral-edit-desk\) !important[\s\S]*background-image: none !important/)
  assert.match(css, /pastoral-tool-button svg[\s\S]*stroke-width: 1\.8 !important[\s\S]*drop-shadow\(0 0 1px rgba\(255,255,255,.16\)\)/)
  assert.match(css, /pastoral-tool-button\.is-active svg[\s\S]*drop-shadow\(0 0 2\.5px rgba\(255,255,255,.36\)\)/)
  assert.doesNotMatch(css, /drop-shadow\(0 0 7px/)
})

test('el dock responde al toque con feedback breve y accesible', () => {
  assert.match(css, /pastoral-tool-button:active[\s\S]*translateY\(1px\) scale\(\.94\)/)
  assert.match(css, /pastoral-tool-button:active svg[\s\S]*scale\(\.90\)/)
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*transition: none !important/)
})
