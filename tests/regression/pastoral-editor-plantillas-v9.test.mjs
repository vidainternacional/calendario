import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')

test('V9/V10 quedan fuera del runtime', () => {
  assert.match(layout, /pastoral-editor-stable\.css/)
  assert.doesNotMatch(layout, /pastoral-editor-workbench-v10/)
})

test('carruseles de Plantillas admiten gesto horizontal', () => {
  assert.match(css, /pastoral-template-grid,[\s\S]*touch-action: pan-x !important/)
  assert.match(css, /-webkit-overflow-scrolling: touch !important/)
})

test('dock usa tres píldoras centradas sin ocultamientos por nth-child', () => {
  assert.match(css, /pastoral-tool-dock[\s\S]*display: flex !important[\s\S]*justify-content: center !important/)
  assert.match(css, /pastoral-tool-dock > \.pastoral-tool-button[\s\S]*border-radius: 999px !important/)
  assert.doesNotMatch(css, /tool-button:nth-child\(5\)[\s\S]*display: none/)
})
