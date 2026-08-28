import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')

test('CapCut histórico queda fuera del runtime y lo sustituye la autoridad estable', () => {
  assert.match(layout, /pastoral-editor-stable\.css/)
  assert.doesNotMatch(layout, /pastoral-editor-capcut/)
})

test('herramientas viven en una sola cinta centrada de tres opciones', () => {
  assert.match(css, /pastoral-tool-dock[\s\S]*display: flex !important[\s\S]*justify-content: center !important/)
  assert.match(css, /pastoral-tool-dock > \.pastoral-tool-button[\s\S]*border-radius: 999px !important/)
  const dock = workspace.match(/const HERRAMIENTAS:[\s\S]*?\n\]/)?.[0] ?? ''
  for (const label of ['Plantillas', 'Texto', 'Capas']) assert.match(dock, new RegExp(`label: '${label}'`))
  assert.doesNotMatch(dock, /Fondo|Párrafo|Borrar|Elementos|Biblia|Diseño/)
})

test('panel contextual ya no es un sheet flotante', () => {
  assert.match(css, /pastoral-tool-panel[\s\S]*position: relative !important/)
  assert.match(css, /pastoral-tool-panel[\s\S]*border-radius: 0 !important/)
})

test('catálogos densos conservan desplazamiento horizontal', () => {
  assert.match(css, /pastoral-template-grid[\s\S]*overflow-x: auto !important/)
  assert.match(css, /pastoral-elements-grid[\s\S]*overflow-x: auto !important/)
  assert.match(css, /pastoral-layer-list[\s\S]*overflow-x: auto !important/)
})
