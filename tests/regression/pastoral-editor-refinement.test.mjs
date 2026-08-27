import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')

test('refinamiento mantiene autoridad visual estable sin blur permanente', () => {
  assert.match(layout, /pastoral-editor-v3\.css'[\s\S]*pastoral-editor-stable\.css'/)
  assert.doesNotMatch(layout, /pastoral-editor-(?:workbench|surface-white|text-controls|accessible|capcut|elegance|notes-language)/)
  assert.match(css, /pastoral-editor-v4 > header[\s\S]*backdrop-filter: none !important/)
  const toolbar = css.slice(css.indexOf("[data-canvas-floating-controls='true']"), css.indexOf('.pastoral-editor-v4 .pastoral-canvas-action {'))
  assert.doesNotMatch(toolbar, /backdrop-filter:\s*blur/)
  assert.match(css, /--pastoral-stable-ease: cubic-bezier\(\.32, \.72, 0, 1\)/)
})

test('editor hereda la identidad visual real del Centro Pastoral', () => {
  assert.match(css, /--pastoral-stable-bg: #f4f5f9/)
  assert.match(css, /--pastoral-stable-ink: #0f172a/)
  assert.match(css, /--pastoral-stable-muted: #64748b/)
  assert.match(css, /--pastoral-stable-soft: #94a3b8/)
  assert.match(css, /--pastoral-stable-accent: #4f46e5/)
  assert.match(css, /--pastoral-stable-surface-strong: #eef2ff/)
  assert.match(css, /font-family: var\(--font-inter\), Inter, ui-sans-serif, system-ui, -apple-system/)
})

test('cabecera y navegación integrada conservan targets de 44px', () => {
  assert.match(css, /pastoral-editor-v4 > header > div > button[\s\S]*min-width: 44px !important[\s\S]*min-height: 44px !important/)
  assert.match(css, /pastoral-editor-v4 > header nav[\s\S]*background: transparent !important/)
  assert.match(css, /pastoral-editor-v4 > header nav button[\s\S]*min-height: 44px !important/)
  assert.match(css, /button\[class\*='text-\[#C0392B\]'\][\s\S]*color: var\(--pastoral-stable-accent\) !important/)
})

test('controles táctiles principales no bajan de 44px', () => {
  assert.match(css, /pastoral-text-presets button[\s\S]*min-height: 44px !important/)
  assert.match(css, /pastoral-inline-icon[\s\S]*min-width: 44px !important[\s\S]*min-height: 44px !important/)
  assert.match(css, /pastoral-step-button[\s\S]*min-width: 44px !important[\s\S]*min-height: 44px !important/)
  assert.match(css, /pastoral-canvas-action[\s\S]*min-width: 44px !important[\s\S]*min-height: 44px !important/)
  assert.match(css, /pastoral-canvas-resize-handle[\s\S]*min-width: 44px !important[\s\S]*min-height: 44px !important/)
})

test('Biblia conserva lista protagonista con controles VIDA de 44px', () => {
  assert.match(css, /pastoral-verse-toolbar select,[\s\S]*min-height: 44px !important/)
  assert.match(css, /pastoral-verse-toolbar select \{[\s\S]*background: #ffffff !important/)
  assert.match(css, /pastoral-verse-search[\s\S]*min-height: 44px !important/)
  assert.match(css, /pastoral-verse-check,[\s\S]*min-width: 44px !important[\s\S]*min-height: 44px !important/)
  assert.match(css, /pastoral-verse-list[\s\S]*overflow-y: auto !important/)
  assert.match(css, /rgba\(79,\s*70,\s*229,\s*\.08\)/)
})

test('toolbar contextual usa superficie blanca del Centro Pastoral sin glassmorphism', () => {
  const toolbar = css.slice(css.indexOf("[data-canvas-floating-controls='true']"), css.indexOf('.pastoral-editor-v4 .pastoral-canvas-action {'))
  assert.match(toolbar, /background: #ffffff !important/)
  assert.match(toolbar, /box-shadow: 0 6px 18px rgba\(15,\s*23,\s*42,\s*\.10\) !important/)
  assert.doesNotMatch(toolbar, /backdrop-filter:\s*blur/)
})

test('swatches de texto conservan el backgroundColor React real', () => {
  const bloque = css.match(/\.pastoral-editor-v4 \.pastoral-color-strip button \{([\s\S]*?)\}/)?.[1] ?? ''
  assert.ok(bloque.length > 0)
  assert.doesNotMatch(bloque, /background(?:-color)?:/)
  assert.match(bloque, /width: 44px !important/)
})

test('dock mantiene las seis herramientas como navegación pastoral integrada', () => {
  assert.match(css, /pastoral-tool-dock[\s\S]*grid-template-columns: repeat\(6, minmax\(0, 1fr\)\) !important/)
  assert.match(css, /pastoral-tool-dock > \.pastoral-tool-button[\s\S]*border-radius: 0 !important[\s\S]*background: transparent !important/)
  assert.match(css, /pastoral-tool-button\.is-active[\s\S]*color: var\(--pastoral-stable-accent\) !important/)
  assert.match(css, /pastoral-tool-button\.is-active::before[\s\S]*background: #eef2ff !important/)
})

test('landscape conserva hitboxes mayores al mínimo de 44px en Texto', () => {
  const landscape = css.slice(css.indexOf('@media (orientation: landscape)'))
  assert.ok(landscape.length > 0)
  assert.match(landscape, /pastoral-text-three-rows[\s\S]*grid-template-rows: 46px 46px 66px !important/)
  assert.match(landscape, /pastoral-inline-icon,[\s\S]*width: 48px !important[\s\S]*height: 48px !important/)
  assert.match(landscape, /pastoral-step-button[\s\S]*width: 48px !important[\s\S]*height: 48px !important/)
})