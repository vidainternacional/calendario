import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')

test('editor pastoral usa una sola capa minimalista estable de VIDA', () => {
  assert.match(layout, /pastoral-editor-stable\.css/)
  assert.doesNotMatch(layout, /pastoral-editor-minimal\.css/)
  assert.match(css, /--pastoral-stable-accent: #c0392b/)
})

test('superficies permanecen blancas e integradas', () => {
  assert.match(css, /--pastoral-stable-bg: #ffffff/)
  assert.match(css, /pastoral-tool-panel,[\s\S]*border-radius: 0 !important/)
})
