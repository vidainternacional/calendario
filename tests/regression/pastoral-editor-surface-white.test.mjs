import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-surface-white.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')

test('la superficie blanca carga después de V10 sin alterar su estructura', () => {
  assert.match(layout, /pastoral-editor-workbench-v10\.css'[\s\S]*pastoral-editor-surface-white\.css'/)
})

test('Editar vuelve a blanco en todas sus zonas estructurales', () => {
  assert.match(css, /pastoral-visual-system[\s\S]*background: #ffffff !important/)
  assert.match(css, /pastoral-editor-shell,[\s\S]*pastoral-stage,[\s\S]*pastoral-pages-strip,[\s\S]*pastoral-tool-panel,[\s\S]*pastoral-tool-dock[\s\S]*background: #ffffff !important/)
})

test('texto, páginas y dock recuperan contraste oscuro sobre blanco', () => {
  assert.match(css, /> header input[\s\S]*color: #0f172a !important/)
  assert.match(css, /pastoral-page-chip[\s\S]*color: #475569 !important/)
  assert.match(css, /pastoral-tool-button svg[\s\S]*stroke: #64748b !important/)
})

test('la selección conserva el acento VIDA sin recrear cajas', () => {
  assert.match(css, /pastoral-page-chip\.is-active[\s\S]*rgba\(192,57,43,.07\)/)
  assert.match(css, /pastoral-tool-button\.is-active[\s\S]*background: transparent !important[\s\S]*color: #c0392b !important/)
  assert.match(css, /pastoral-tool-button\.is-active::after[\s\S]*background: #c0392b !important/)
})
