import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')

test('superficie blanca forma parte de la autoridad estable', () => {
  assert.match(layout, /pastoral-editor-stable\.css/)
  assert.doesNotMatch(layout, /pastoral-editor-surface-white|pastoral-editor-workbench-v10/)
  assert.match(css, /--pastoral-stable-bg: #ffffff/)
})

test('Editar pinta blanco en zonas estructurales', () => {
  assert.match(css, /pastoral-editor-v4 > header,[\s\S]*pastoral-tool-dock[\s\S]*background: var\(--pastoral-stable-bg\) !important/)
})

test('selección conserva acento VIDA sin recrear cajas', () => {
  assert.match(css, /--pastoral-stable-accent: #c0392b/)
  assert.match(css, /pastoral-tool-button\.is-active[\s\S]*color: var\(--pastoral-stable-accent\)/)
})
