import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')
const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')

test('biblioteca visual histórica queda absorbida por stable', () => {
  assert.match(layout, /pastoral-editor-stable\.css/)
  assert.doesNotMatch(layout, /pastoral-template-library/)
})

test('Plantillas y Temas conservan el mismo ancho', () => {
  assert.match(css, /pastoral-template-option,[\s\S]*pastoral-theme-option[\s\S]*flex: 0 0 132px !important/)
})

test('miniaturas conservan lenguaje de titular y cuerpo sin decoraciones arbitrarias', () => {
  assert.match(css, /pastoral-template-preview > i:nth-child\(1\)/)
  assert.match(css, /pastoral-template-preview > i:nth-child\(2\)/)
  assert.match(css, /pastoral-template-preview > i,[\s\S]*display: none !important/)
})

test('controles del elemento seleccionado viven fuera y tienen hitbox estable', () => {
  assert.match(canvas, /estiloControlesFlotantes/)
  assert.match(canvas, /data-canvas-floating-controls="true"/)
  assert.match(canvas, /pastoral-canvas-resize-handle/)
  assert.match(css, /pastoral-canvas-action[\s\S]*42px/)
})
