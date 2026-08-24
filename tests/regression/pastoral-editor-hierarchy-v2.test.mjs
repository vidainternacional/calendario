import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-hierarchy-v2.css', 'utf8')
const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceCanva.tsx', 'utf8')

test('la jerarquía final se carga después de las capas anteriores', () => {
  const oldIndex = layout.indexOf("./pastoral-editor-structure.css")
  const finalIndex = layout.indexOf("./pastoral-editor-hierarchy-v2.css")
  assert.ok(oldIndex >= 0)
  assert.ok(finalIndex > oldIndex)
})

test('el dock mantiene inserción y página sin borrar como herramienta principal', () => {
  for (const label of ['Plantillas', 'Elementos', 'Texto', 'Biblia', 'Fondo', 'Diseño']) {
    assert.match(workspace, new RegExp(`label: '${label}'`))
  }
  assert.match(css, /button\.text-rose-600[\s\S]*display: none !important/)
  assert.match(css, /nth-child\(5\) \{ order: 4;/)
  assert.match(css, /nth-child\(4\) \{ order: 5;/)
  assert.match(css, /nth-child\(7\) \{ order: 6;/)
})

test('párrafo deja de competir de forma permanente y aparece solo con texto seleccionado', () => {
  assert.match(css, /nth-child\(6\)[\s\S]*display: none !important/)
  assert.match(css, /data-canvas-element='texto'[\s\S]*nth-child\(6\)/)
  assert.match(css, /data-canvas-element='versiculo'[\s\S]*nth-child\(6\)/)
})

test('diseño muestra el formato de página como control segmentado de cuatro opciones', () => {
  assert.match(css, /Panel diseno/)
  assert.match(css, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/)
  assert.match(css, /button \+ button[\s\S]*border-left: 1px solid var\(--vida-editor-line\)/)
})

test('acciones destructivas quedan separadas de organizar', () => {
  assert.match(css, /ELEMENTO SELECCIONADO — ORGANIZAR ≠ ELIMINAR/)
  assert.match(css, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/)
  assert.match(css, /button\[class\*='bg-rose-50'\][\s\S]*grid-column: 1 \/ -1/)
  assert.match(css, /--vida-editor-danger: #dc2626/)
})

test('desktop e iPad usan páginas, lienzo, inspector y dock inferior', () => {
  assert.match(css, /grid-template-areas:\s*'stage panel'\s*'dock panel'/)
  assert.match(css, /grid-template-columns: 120px minmax\(0, 1fr\)/)
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\) 300px/)
  assert.match(css, /max-width: 1100px/)
  assert.match(css, /width: 260px !important/)
})

test('celular horizontal conserva rail, lienzo prioritario, páginas abajo e inspector overlay', () => {
  assert.match(css, /orientation: landscape/)
  assert.match(css, /grid-template-areas: 'dock stage'/)
  assert.match(css, /grid-template-areas:\s*'canvas'\s*'pages'/)
  assert.match(css, /grid-template-rows: minmax\(0, 1fr\) 44px/)
  assert.match(css, /width: min\(280px, 44vw\)/)
})

test('celular vertical conserva bandeja inferior sobria y lienzo prioritario', () => {
  assert.match(css, /orientation: portrait/)
  assert.match(css, /max-height: 43dvh/)
  assert.match(css, /pastoral-sheet-handle/)
  assert.match(css, /box-shadow: 0 -4px 14px/)
})
