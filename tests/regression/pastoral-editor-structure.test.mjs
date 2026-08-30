import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')
const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')

test('Centro Pastoral carga base V3 y autoridad estable', () => {
  assert.match(layout, /pastoral-editor-v3\.css'[\s\S]*pastoral-editor-stable\.css'/)
  assert.doesNotMatch(layout, /pastoral-editor-structure\.css/)
})

test('Borrar y Fondo no compiten como herramientas principales', () => {
  const dock = workspace.match(/const HERRAMIENTAS:[\s\S]*?\n\]/)?.[0] ?? ''
  assert.doesNotMatch(dock, /Borrar|Fondo|Párrafo/)
})

test('desktop separa páginas lienzo inspector y dock', () => {
  const desktop = css.slice(css.indexOf('@media (min-width: 1024px)'))
  assert.match(desktop, /grid-template-areas: 'stage panel' 'dock dock'/)
  assert.match(desktop, /grid-template-areas: 'pages canvas'/)
})
