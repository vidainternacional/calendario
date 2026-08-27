import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')

test('estabilidad móvil vive dentro de la única autoridad estable', () => {
  assert.match(layout, /pastoral-editor-stable\.css/)
  assert.doesNotMatch(layout, /pastoral-editor-compact-mobile/)
})

test('panel móvil conserva altura útil y Texto controles táctiles grandes', () => {
  assert.match(css, /pastoral-tool-panel\.panel-texto,[\s\S]*height: 220px !important[\s\S]*min-height: 220px !important[\s\S]*max-height: 220px !important/)
  assert.match(css, /panel-texto \.pastoral-text-three-rows[\s\S]*grid-template-rows: 54px 54px 72px !important/)
  assert.match(css, /panel-texto \.pastoral-inline-icon[\s\S]*width: 54px !important[\s\S]*height: 54px !important/)
})

test('horizontal conserva rail compacto sin bajar de 44px táctiles', () => {
  const horizontal = css.slice(css.indexOf('@media (orientation: landscape)'))
  assert.match(horizontal, /pastoral-tool-panel[\s\S]*height: 174px !important[\s\S]*max-height: 174px !important/)
  assert.match(horizontal, /pastoral-inline-icon,[\s\S]*width: 48px !important[\s\S]*height: 48px !important/)
  assert.doesNotMatch(horizontal, /grid-template-areas:\s*'dock stage'/)
})