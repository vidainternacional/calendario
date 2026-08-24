import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const page = fs.readFileSync('app/(app)/pastoral/paquetes/[id]/page.tsx', 'utf8')
const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-minimal.css', 'utf8')

test('editor pastoral carga una capa visual minimalista propia de VIDA', () => {
  assert.match(layout, /pastoral-editor-minimal\.css/)
  assert.match(css, /Centro Pastoral — edición visual con la jerarquía minimalista de VIDA/)
  assert.match(css, /pastoral-canva-workspace > header/)
  assert.match(css, /pastoral-tool-dock/)
  assert.match(css, /pastoral-tool-panel/)
})

test('móvil conserva lienzo más bandeja sin tarjeta gigante', () => {
  assert.match(css, /max-height: 37dvh !important/)
  assert.match(css, /border-radius: 1\.1rem 1\.1rem 0 0 !important/)
  assert.match(css, /box-shadow: 0 -5px 18px/)
  assert.match(css, /orientation: portrait/)
})

test('herramientas usan estado activo discreto y no bloque morado permanente', () => {
  assert.match(css, /pastoral-tool-button\.is-active/)
  assert.match(css, /background: transparent !important/)
  assert.match(css, /is-active::before/)
})

test('selección del lienzo conserva mover borrar y redimensionar con controles compactos', () => {
  assert.match(css, /aria-label='Mover elemento'/)
  assert.match(css, /aria-label='Eliminar elemento'/)
  assert.match(css, /aria-label='Redimensionar elemento'/)
  assert.match(css, /width: 1\.8rem !important/)
})

test('iPad y escritorio aprovechan ancho completo y panel inspector lateral', () => {
  assert.match(page, /pastoral-package-page/)
  assert.match(page, /max-w-none/)
  assert.match(css, /orientation: landscape/)
  assert.match(css, /minmax\(270px, 30vw\)/)
})
