import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')

test('refinamiento mantiene una sola autoridad visual sin blur permanente', () => {
  assert.match(layout, /pastoral-editor-v3\.css'[\s\S]*pastoral-editor-stable\.css'/)
  assert.doesNotMatch(layout, /pastoral-editor-(?:workbench|surface-white|text-controls|accessible|capcut|elegance|notes-language)/)
  assert.match(css, /pastoral-editor-v4 > header[\s\S]*backdrop-filter: none !important/)
  assert.match(css, /--pastoral-stable-ease: cubic-bezier\(\.32,\.72,0,1\)/)
})

test('lenguaje iOS usa tipografía de sistema y grises nativos sin perder rojo VIDA', () => {
  assert.match(css, /--pastoral-stable-ink: #1c1c1e/)
  assert.match(css, /--pastoral-stable-soft: #8e8e93/)
  assert.match(css, /--pastoral-stable-surface: #f2f2f7/)
  assert.match(css, /font-family: -apple-system, BlinkMacSystemFont/)
  assert.match(css, /--pastoral-stable-accent: #c0392b/)
})

test('cabecera y navegación conservan targets iOS de 44px sin material permanente', () => {
  assert.match(css, /pastoral-editor-v4 > header > div > button[\s\S]*min-width: 44px !important[\s\S]*min-height: 44px !important/)
  assert.match(css, /pastoral-editor-v4 > header nav button[\s\S]*min-height: 44px !important/)
  assert.match(css, /pastoral-editor-v4 > header[\s\S]*background: #fff !important[\s\S]*backdrop-filter: none !important/)
})

test('controles táctiles principales no bajan de 44px', () => {
  assert.match(css, /pastoral-inline-icon[\s\S]*min-width: 46px !important[\s\S]*min-height: 46px !important/)
  assert.match(css, /pastoral-step-button[\s\S]*min-width: 44px !important[\s\S]*min-height: 44px !important/)
  assert.match(css, /pastoral-canvas-action[\s\S]*min-width: 44px !important[\s\S]*min-height: 44px !important/)
  assert.match(css, /pastoral-canvas-resize-handle[\s\S]*min-width: 44px !important[\s\S]*min-height: 44px !important/)
})

test('Biblia conserva lista protagonista con controles de 44px estilo iOS', () => {
  assert.match(css, /pastoral-verse-toolbar select[\s\S]*min-height: 44px !important[\s\S]*background-color: var\(--pastoral-stable-surface\) !important/)
  assert.match(css, /pastoral-verse-search[\s\S]*min-height: 44px !important[\s\S]*background: var\(--pastoral-stable-surface\) !important/)
  assert.match(css, /pastoral-verse-check,[\s\S]*min-width: 44px !important[\s\S]*min-height: 44px !important/)
  assert.match(css, /pastoral-verse-list[\s\S]*overflow-y: auto !important/)
})

test('material iOS se limita a la toolbar contextual del elemento seleccionado', () => {
  const toolbar = css.slice(css.indexOf("[data-canvas-floating-controls='true']"), css.indexOf('.pastoral-editor-v4 .pastoral-canvas-action {'))
  assert.match(toolbar, /background: rgba\(255,255,255,\.86\) !important/)
  assert.match(toolbar, /backdrop-filter: saturate\(180%\) blur\(12px\) !important/)
  assert.match(css, /pastoral-editor-v4 > header[\s\S]*backdrop-filter: none !important/)
})

test('swatches de texto conservan el backgroundColor React real', () => {
  const inicio = css.indexOf('.pastoral-editor-v4 .pastoral-color-strip button {')
  const fin = css.indexOf('.pastoral-editor-v4 .pastoral-color-strip button::before', inicio)
  const bloque = css.slice(inicio, fin)
  assert.ok(inicio >= 0 && fin > inicio)
  assert.doesNotMatch(bloque, /background(?:-color)?:/)
  assert.match(bloque, /width: 44px !important/)
})

test('dock mantiene las seis herramientas como tab bar integrada sin cápsulas', () => {
  assert.match(css, /pastoral-tool-dock[\s\S]*grid-template-columns: repeat\(6, minmax\(0, 1fr\)\) !important/)
  assert.match(css, /pastoral-tool-dock > \.pastoral-tool-button[\s\S]*border-radius: 0 !important[\s\S]*background: transparent !important/)
  assert.match(css, /pastoral-tool-button\.is-active[\s\S]*color: var\(--pastoral-stable-accent\) !important/)
})

test('landscape conserva hitboxes de 44px en Texto', () => {
  const landscape = css.slice(css.indexOf('@media (orientation: landscape)'))
  assert.match(landscape, /pastoral-inline-icon[\s\S]*min-width: 44px !important[\s\S]*min-height: 44px !important/)
  assert.match(landscape, /pastoral-step-button[\s\S]*min-width: 44px !important[\s\S]*min-height: 44px !important/)
})
