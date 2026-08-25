import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')

test('la jerarquía estable carga después de la base estructural V3', () => {
  const base = layout.indexOf("./pastoral-editor-v3.css")
  const stable = layout.indexOf("./pastoral-editor-stable.css")
  assert.ok(base >= 0 && stable > base)
  assert.doesNotMatch(layout, /pastoral-editor-hierarchy-v2/)
})

test('la jerarquía prioriza lienzo páginas panel y dock', () => {
  assert.match(css, /grid-template-areas: 'stage' 'panel' 'dock'/)
  assert.match(css, /pastoral-pages-strip[\s\S]*justify-content: flex-start/)
})
