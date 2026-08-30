import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')

test('la autoridad estable neutraliza cajas externas sin capas V4 históricas', () => {
  assert.match(layout, /pastoral-editor-stable\.css/)
  assert.doesNotMatch(layout, /pastoral-editor-elegance-v4/)
  assert.match(css, /pastoral-tool-panel,[\s\S]*border: 0 !important/)
})

test('Fondos queda como grupo principal e Imágenes conserva conversión reversible a fondo', () => {
  const dock = workspace.match(/const HERRAMIENTAS:[\s\S]*?\n\]/)?.[0] ?? ''
  const fondos = workspace.match(/plantillas:\s*\[[\s\S]*?\],/)?.[0] ?? ''
  const imagenes = workspace.slice(workspace.indexOf("panel === 'recursos'"), workspace.indexOf("panel === 'texto'"))
  assert.match(dock, /label: 'Fondos'/)
  assert.match(fondos, /label: 'Fondos'/)
  assert.match(fondos, /label: 'Imágenes'/)
  assert.doesNotMatch(fondos, /label: 'Plantillas'|label: 'Temas'/)
  assert.match(imagenes, /Como fondo/)
  assert.match(imagenes, /aplicarFondoImagen/)
  assert.match(imagenes, /prepararSubida\(destinoSubida\)/)
})

test('Texto conserva tres líneas compactas y cuatro controles iguales', () => {
  assert.match(css, /pastoral-text-three-rows[\s\S]*grid-template-rows: 44px 48px 56px/)
  assert.match(css, /pastoral-text-presets[\s\S]*repeat\(4, minmax\(0, 1fr\)\)/)
})

test('Biblia conserva superficie protagonista y Diseño permanece simple', () => {
  assert.match(css, /panel-biblia[\s\S]*height: 220px !important/)
  assert.match(css, /pastoral-aspect-control[\s\S]*repeat\(4, minmax\(0, 1fr\)\)/)
})

test('microinteracciones respetan movimiento reducido', () => {
  assert.match(css, /pastoral-tool-button\.is-active::before/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
})