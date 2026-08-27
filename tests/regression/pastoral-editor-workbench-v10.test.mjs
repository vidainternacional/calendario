import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')

test('V10 deja de ser autoridad runtime y stable asume su responsabilidad', () => {
  assert.match(layout, /pastoral-editor-stable\.css/)
  assert.doesNotMatch(layout, /pastoral-editor-workbench-v10/)
})

test('modo Editar usa la superficie integrada vigente', () => {
  assert.match(css, /--pastoral-stable-bg: #f4f5f9/)
  assert.doesNotMatch(css, /--pastoral-edit-desk: #626568/)
})

test('páginas permanecen en fila estable y desplazable', () => {
  assert.match(css, /pastoral-pages-strip[\s\S]*overflow-x: auto !important/)
  assert.match(css, /pastoral-pages-strip[\s\S]*justify-content: flex-start !important/)
})

test('dock conserva feedback táctil sobrio y reduce movimiento', () => {
  assert.match(css, /pastoral-tool-button:active[\s\S]*scale\(\.96\)/)
  assert.match(css, /prefers-reduced-motion/)
})
