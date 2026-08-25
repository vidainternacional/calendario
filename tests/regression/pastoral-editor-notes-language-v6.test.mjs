import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')
const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')

test('lenguaje histórico de Notas queda absorbido por autoridad estable', () => {
  assert.match(layout, /pastoral-editor-stable\.css/)
  assert.doesNotMatch(layout, /pastoral-editor-notes-language-v6/)
})

test('seis herramientas visibles conservan lenguaje integrado', () => {
  const dock = workspace.match(/const HERRAMIENTAS:[\s\S]*?\n\]/)?.[0] ?? ''
  assert.doesNotMatch(dock, /Fondo|Párrafo|Borrar/)
  assert.match(css, /pastoral-tool-button[\s\S]*background: transparent !important/)
})

test('acciones de formato mantienen tamaño táctil suficiente', () => {
  assert.match(css, /pastoral-inline-icon[\s\S]*46px/)
  assert.match(css, /pastoral-step-button[\s\S]*44px/)
})
