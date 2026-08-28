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

test('tres herramientas visibles conservan lenguaje integrado', () => {
  const dock = workspace.match(/const HERRAMIENTAS:[\s\S]*?\n\]/)?.[0] ?? ''
  const reglaPildora = css.match(/\.pastoral-editor-v4 \.pastoral-tool-dock > \.pastoral-tool-button \{([\s\S]*?)\}/)?.[1] ?? ''
  for (const label of ['Plantillas', 'Texto', 'Capas']) assert.match(dock, new RegExp(`label: '${label}'`))
  assert.doesNotMatch(dock, /Fondo|Párrafo|Borrar|Elementos|Biblia|Diseño/)
  assert.match(reglaPildora, /background: #ffffff !important/)
  assert.match(reglaPildora, /border-radius: 999px !important/)
})

test('acciones de formato mantienen tamaño táctil suficiente', () => {
  assert.match(css, /pastoral-inline-icon[\s\S]*width: 44px !important[\s\S]*height: 44px !important/)
  assert.match(css, /pastoral-step-button[\s\S]*44px/)
})
