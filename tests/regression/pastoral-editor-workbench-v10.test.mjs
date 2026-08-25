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
  assert.doesNotMatch(css, /--pastoral-edit-panel/)
  assert.match(css, /pastoral-editor-section,[\s\S]*pastoral-editor-shell,[\s\S]*pastoral-stage,[\s\S]*pastoral-pages-strip,[\s\S]*pastoral-tool-panel,[\s\S]*pastoral-tool-dock[\s\S]*background: var\(--pastoral-edit-desk\) !important/)
})

test('las etiquetas de Plantillas viven directamente sobre el gris en blanco', () => {
  assert.match(css, /panel-plantillas \.pastoral-panel-label,[\s\S]*pastoral-template-option > span:last-child[\s\S]*color: var\(--pastoral-edit-ink\) !important/)
  assert.match(css, /panel-plantillas \.pastoral-compact-row[\s\S]*border: 0 !important[\s\S]*box-shadow: none !important/)
})

test('Plantillas permite desplazamiento vertical y cada cinta conserva desplazamiento horizontal', () => {
  assert.match(css, /panel-plantillas \.pastoral-tool-panel-scroll[\s\S]*overflow-y: auto !important[\s\S]*touch-action: pan-y !important/)
  assert.match(css, /pastoral-template-grid,[\s\S]*pastoral-theme-grid,[\s\S]*pastoral-start-backgrounds[\s\S]*overflow-x: auto !important[\s\S]*touch-action: pan-x !important/)
})

test('el dock comparte el gris y usa iconos blancos con brillo contenido', () => {
  assert.match(css, /pastoral-tool-dock[\s\S]*background: var\(--pastoral-edit-desk\) !important/)
  assert.match(css, /pastoral-tool-button svg[\s\S]*color: #fff !important[\s\S]*drop-shadow\(0 0 4px rgba\(255,255,255,.34\)\)/)
  assert.match(css, /pastoral-tool-button\.is-active svg[\s\S]*drop-shadow\(0 0 7px rgba\(255,255,255,.58\)\)/)
})

test('el dock responde al toque con feedback breve y accesible', () => {
  assert.match(css, /pastoral-tool-button:active[\s\S]*translateY\(1px\) scale\(\.94\)/)
  assert.match(css, /pastoral-tool-button:active svg[\s\S]*scale\(\.88\)/)
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*transition: none !important/)
})
