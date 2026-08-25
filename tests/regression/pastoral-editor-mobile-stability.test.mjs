import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')

test('estabilidad móvil vive dentro de la única autoridad estable', () => {
  assert.match(layout, /pastoral-editor-stable\.css/)
  assert.doesNotMatch(layout, /pastoral-editor-compact-mobile/)
})

test('panel móvil usa contenido y máximo razonable', () => {
  assert.match(css, /pastoral-tool-panel[\s\S]*height: auto !important[\s\S]*max-height: min\(34dvh, 300px\) !important/)
  assert.match(css, /panel-texto[\s\S]*height: 172px !important/)
})

test('horizontal comprime sin rail lateral', () => {
  const horizontal = css.slice(css.indexOf('@media (orientation: landscape)'))
  assert.match(horizontal, /pastoral-tool-panel[\s\S]*max-height: 160px !important/)
  assert.doesNotMatch(horizontal, /grid-template-areas:\s*'dock stage'/)
})
