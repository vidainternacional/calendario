import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')

test('workspace fijo histórico se reemplaza por autoridad estable', () => {
  assert.match(layout, /pastoral-editor-stable\.css/)
  assert.doesNotMatch(layout, /pastoral-editor-fixed-workspace|pastoral-editor-compact-mobile/)
})

test('edición móvil ocupa el viewport y bloquea scroll de página', () => {
  assert.match(css, /body:has\(\.pastoral-editor-v4 > \.pastoral-editor-section\)[\s\S]*overflow: hidden !important/)
  assert.match(css, /pastoral-canva-workspace\.pastoral-editor-v4[\s\S]*position: fixed !important[\s\S]*inset: 0 !important/)
})

test('stage conserva lienzo arriba páginas debajo y dock al final', () => {
  assert.match(css, /grid-template-areas: 'stage' 'panel' 'dock'/)
  assert.match(css, /pastoral-stage[\s\S]*grid-template-rows: minmax\(0, 1fr\) 52px/)
})
