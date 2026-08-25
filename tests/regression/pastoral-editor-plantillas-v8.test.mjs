import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')

test('V8/V10 quedan retiradas del runtime y sus garantías pasan a stable', () => {
  assert.match(layout, /pastoral-editor-stable\.css/)
  assert.doesNotMatch(layout, /pastoral-editor-plantillas-v7|pastoral-editor-workbench-v10/)
})

test('las tres cintas de Plantillas conservan scroll horizontal', () => {
  assert.match(css, /pastoral-template-grid,[\s\S]*pastoral-theme-grid,[\s\S]*pastoral-start-backgrounds[\s\S]*overflow-x: auto !important/)
})

test('Plantillas y Temas conservan 132px y Fondos 58px', () => {
  assert.match(css, /pastoral-template-option,[\s\S]*pastoral-theme-option[\s\S]*flex: 0 0 132px !important/)
  assert.match(css, /pastoral-start-backgrounds > button,[\s\S]*flex: 0 0 58px !important/)
})
