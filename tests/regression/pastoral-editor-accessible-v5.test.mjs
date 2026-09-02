import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')

test('la autoridad estable sustituye las capas accesibles históricas', () => {
  assert.match(layout, /pastoral-editor-v3\.css'[\s\S]*pastoral-editor-stable\.css'/)
  assert.doesNotMatch(layout, /pastoral-editor-accessible-v5/)
})

test('el editor móvil oculta navegación global y recupera padding', () => {
  assert.match(css, /\.app-bottom-nav \{ display: none !important; \}/)
  assert.match(css, /\.flex-1\.pb-16 \{ padding-bottom: 0 !important; \}/)
})

test('dock y texto conservan áreas táctiles legibles', () => {
  assert.match(css, /pastoral-tool-dock[\s\S]*min-height: 44px !important/)
  assert.match(css, /pastoral-inline-icon[\s\S]*width: 44px !important[\s\S]*height: 44px !important/)
  assert.match(css, /pastoral-text-presets button[\s\S]*height: 44px !important/)
  assert.match(css, /pastoral-font-strip button[\s\S]*min-height: 44px !important/)
})

test('elementos y Biblia mantienen tamaños útiles', () => {
  assert.match(css, /pastoral-elements-grid[\s\S]*repeat\(2, 72px\)/)
  assert.match(css, /panel-biblia[\s\S]*height: 220px !important/)
  assert.match(css, /pastoral-aspect-control button[\s\S]*min-height: 58px !important/)
})
