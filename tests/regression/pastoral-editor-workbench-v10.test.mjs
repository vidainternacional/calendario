import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-workbench-v10.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')

test('V10 carga después de V9 como autoridad final del entorno de edición', () => {
  assert.match(layout, /pastoral-editor-plantillas-v9\.css'[\s\S]*pastoral-editor-workbench-v10\.css'/)
})

test('la mesa de trabajo usa gris medio sin volver oscuras las herramientas', () => {
  assert.match(css, /--pastoral-edit-desk: #626568/)
  assert.match(css, /--pastoral-edit-panel: #e7e9eb/)
  assert.match(css, /pastoral-stage,[\s\S]*pastoral-canvas-wrap[\s\S]*background: var\(--pastoral-edit-desk\) !important/)
  assert.match(css, /pastoral-pages-strip,[\s\S]*pastoral-tool-panel[\s\S]*background: var\(--pastoral-edit-panel\) !important/)
})

test('Plantillas permite desplazamiento vertical y cada cinta conserva desplazamiento horizontal', () => {
  assert.match(css, /panel-plantillas \.pastoral-tool-panel-scroll[\s\S]*overflow-y: auto !important[\s\S]*touch-action: pan-y !important/)
  assert.match(css, /pastoral-template-grid,[\s\S]*pastoral-theme-grid,[\s\S]*pastoral-start-backgrounds[\s\S]*overflow-x: auto !important[\s\S]*touch-action: pan-x !important/)
})

test('el dock responde al toque con feedback breve y accesible', () => {
  assert.match(css, /pastoral-tool-button:active[\s\S]*translateY\(1px\) scale\(\.94\)/)
  assert.match(css, /pastoral-tool-button:active svg[\s\S]*scale\(\.88\)/)
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*transition: none !important/)
})
