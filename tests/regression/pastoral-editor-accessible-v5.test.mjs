import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-accessible-v5.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')

test('la capa accesible carga después de la autoridad visual previa', () => {
  assert.match(layout, /pastoral-editor-authority\.css'[\s\S]*pastoral-editor-accessible-v5\.css'/)
})

test('el editor móvil oculta la navegación global y recupera su padding inferior', () => {
  assert.match(css, /body:has\(\.pastoral-editor-v4\) \.app-bottom-nav[\s\S]*display: none !important/)
  assert.match(css, /body:has\(\.pastoral-editor-v4\) \.flex-1\.pb-16[\s\S]*padding-bottom: 0 !important/)
})

test('páginas y herramientas conservan un respiro sin crear otra caja', () => {
  assert.match(css, /--pastoral-accessible-gap: 10px/)
  assert.match(css, /pastoral-pages-strip[\s\S]*min-height: 50px !important/)
  assert.match(css, /pastoral-tool-panel[\s\S]*padding-top: var\(--pastoral-accessible-gap\) !important/)
})

test('dock y texto recuperan áreas táctiles legibles', () => {
  assert.match(css, /pastoral-tool-dock[\s\S]*height: 58px !important/)
  assert.match(css, /pastoral-inline-icon[\s\S]*width: 44px !important[\s\S]*height: 44px !important/)
  assert.match(css, /pastoral-text-presets button[\s\S]*height: 44px !important/)
  assert.match(css, /pastoral-font-strip button[\s\S]*min-height: 44px !important/)
})

test('elementos usa miniaturas reconocibles y Plantillas deja de ser microscópica', () => {
  assert.match(css, /pastoral-elements-grid[\s\S]*repeat\(2, 72px\)/)
  assert.match(css, /pastoral-elements-grid button[\s\S]*width: 72px !important[\s\S]*height: 72px !important/)
  assert.match(css, /pastoral-template-preview[\s\S]*height: 48px !important/)
  assert.match(css, /pastoral-theme-option[\s\S]*height: 50px !important/)
})

test('Biblia recibe más superficie pero Diseño evita espacio muerto', () => {
  assert.match(css, /panel-biblia[\s\S]*height: clamp\(270px, 35dvh, 300px\)/)
  assert.match(css, /panel-diseno \.pastoral-panel-content[\s\S]*grid-template-rows: 64px !important/)
  assert.match(css, /pastoral-aspect-control button[\s\S]*height: 58px !important/)
})

test('horizontal conserva controles utilizables y oculta igualmente la navegación global', () => {
  assert.match(css, /orientation: landscape/)
  assert.match(css, /pastoral-tool-dock > \.pastoral-tool-button[\s\S]*min-height: 47px !important/)
  assert.match(css, /pastoral-inline-icon[\s\S]*min-height: 40px !important/)
  assert.match(css, /panel-biblia[\s\S]*height: 150px !important/)
})
