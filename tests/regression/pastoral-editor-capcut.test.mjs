import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-capcut.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV3.tsx', 'utf8')

test('la capa CapCut se carga despues de todos los estilos del editor', () => {
  assert.match(layout, /pastoral-editor-v3-reset\.css'[\s\S]*pastoral-editor-capcut\.css'/)
})

test('todas las herramientas viven en una sola cinta inferior con scroll lateral', () => {
  assert.match(css, /\.pastoral-tool-dock[\s\S]*display: flex !important/)
  assert.match(css, /overflow-x: auto !important/)
  assert.match(css, /scroll-snap-type: x proximity !important/)
  assert.match(css, /flex: 0 0 74px !important/)
  assert.doesNotMatch(css, /grid-template-columns: repeat\(7/)
  for (const label of ['Plantillas', 'Elementos', 'Texto', 'Biblia', 'Fondo', 'Diseño', 'Capas']) {
    assert.match(workspace, new RegExp(`label: '${label}'`))
  }
})

test('el canvas conserva altura natural arriba y las paginas quedan inmediatamente debajo', () => {
  assert.match(css, /\.pastoral-canvas-wrap[\s\S]*flex: 0 0 auto !important/)
  assert.match(css, /\.pastoral-canvas-wrap > div[\s\S]*height: auto !important/)
  assert.match(css, /\.pastoral-pages-strip[\s\S]*flex: 0 0 38px !important/)
})

test('una sola bandeja contextual abre encima de la cinta sin empujar el lienzo', () => {
  assert.match(css, /\.pastoral-tool-panel[\s\S]*position: absolute !important/)
  assert.match(css, /bottom: 58px !important/)
  assert.match(css, /height: min\(39dvh, 330px\) !important/)
  assert.match(css, /border-radius: 12px 12px 0 0 !important/)
})

test('catálogos densos usan desplazamiento horizontal dentro de la bandeja', () => {
  assert.match(css, /Panel plantillas[\s\S]*overflow-x: auto !important/)
  assert.match(css, /\.pastoral-elements-grid[\s\S]*grid-auto-flow: column !important/)
  assert.match(css, /\.pastoral-theme-grid[\s\S]*display: flex !important[\s\S]*overflow-x: auto !important/)
  assert.match(css, /\.pastoral-layer-list[\s\S]*display: flex !important[\s\S]*overflow-x: auto !important/)
})

test('celular horizontal también conserva una única cinta inferior', () => {
  const horizontal = css.slice(css.indexOf('@media (orientation: landscape)'))
  assert.match(horizontal, /grid-template-areas: 'stage' 'dock'/)
  assert.match(horizontal, /\.pastoral-tool-dock[\s\S]*display: flex !important/)
  assert.match(horizontal, /overflow-x: auto !important/)
  assert.doesNotMatch(horizontal, /grid-template-areas:'dock stage'/)
})
