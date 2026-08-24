import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-fixed-workspace.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')

test('workspace fijo se carga despues de compactacion movil', () => {
  assert.match(layout, /pastoral-editor-compact-mobile\.css'[\s\S]*pastoral-editor-fixed-workspace\.css'/)
})

test('edicion movil bloquea scroll de pagina y ocupa viewport disponible', () => {
  assert.match(css, /body:has\(\.pastoral-canva-workspace \.pastoral-editor-shell\) \{[\s\S]*overflow: hidden !important/)
  assert.match(css, /\.pastoral-canva-workspace \{[\s\S]*position: fixed !important[\s\S]*bottom: calc\(4rem \+ env\(safe-area-inset-bottom, 0px\)\) !important/)
})

test('section de edicion absorbe el espacio restante y evita colapso del canvas', () => {
  assert.match(css, /> section:has\(> \.pastoral-editor-shell\) \{[\s\S]*display: flex !important[\s\S]*flex: 1 1 auto !important[\s\S]*min-height: 0 !important/)
  assert.match(css, /> section:has\(> \.pastoral-editor-shell\)[\s\S]*padding-top: 0 !important[\s\S]*padding-bottom: 0 !important/)
})

test('stage conserva orden lienzo primero y paginas despues', () => {
  assert.match(css, /\.pastoral-stage \{[\s\S]*display: flex !important[\s\S]*flex-direction: column !important[\s\S]*justify-content: flex-start !important/)
  assert.match(css, /\.pastoral-canvas-wrap,[\s\S]*flex: 1 1 auto !important[\s\S]*align-self: stretch !important/)
  assert.match(css, /\.pastoral-pages-strip \{[\s\S]*flex: 0 0 auto !important/)
})

test('portrait usa stage flexible arriba y dock fijo abajo', () => {
  assert.match(css, /orientation: portrait[\s\S]*grid-template-areas:[\s\S]*'stage'[\s\S]*'dock'/)
  assert.match(css, /grid-template-rows: minmax\(0, 1fr\) 47px !important/)
  assert.match(css, /orientation: portrait[\s\S]*\.pastoral-stage \{[\s\S]*grid-area: stage !important/)
  assert.match(css, /orientation: portrait[\s\S]*\.pastoral-tool-dock,[\s\S]*grid-area: dock !important/)
})

test('panel es overlay y solo su contenido interno puede desplazarse', () => {
  assert.match(css, /\.pastoral-tool-panel-scroll \{[\s\S]*overflow-y: auto !important/)
  assert.match(css, /orientation: portrait[\s\S]*\.pastoral-tool-panel \{[\s\S]*position: absolute !important[\s\S]*bottom: 47px !important/)
})
