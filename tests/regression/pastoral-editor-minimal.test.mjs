import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')

test('editor pastoral usa la autoridad minimalista estable de VIDA', () => {
  assert.match(layout, /pastoral-editor-stable\.css/)
  assert.doesNotMatch(layout, /pastoral-editor-minimal\.css/)
  assert.match(css, /--pastoral-stable-accent: #4f46e5/)
})

test('superficies permanecen integradas al fondo de VIDA', () => {
  assert.match(css, /--pastoral-stable-bg: #f4f5f9/)
  assert.match(css, /pastoral-tool-panel,[\s\S]*border-radius: 0 !important/)
})
