import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-structure.css', 'utf8')

test('Centro Pastoral carga la capa de jerarquia visual VIDA', () => {
  assert.match(layout, /pastoral-editor-structure\.css/)
  assert.match(css, /jerarquía UX\/UI alineada con VIDA/)
  assert.match(css, /--editor-accent: #C0392B/)
})

test('Borrar no compite con herramientas de insercion', () => {
  assert.match(css, /pastoral-tool-dock > button\.text-rose-600/)
  assert.match(css, /display: none !important/)
  assert.match(css, /Acciones destructivas: al final y con separación/)
})

test('herramientas se ordenan en insertar pagina y formato', () => {
  assert.match(css, /nth-child\(5\).*order: 4/) // Biblia
  assert.match(css, /nth-child\(4\).*order: 5/) // Fondo
  assert.match(css, /nth-child\(7\).*order: 6/) // Diseño
  assert.match(css, /nth-child\(6\).*order: 7/) // Párrafo
})

test('desktop usa navegacion lateral sobria y lienzo flexible', () => {
  assert.match(css, /grid-template-columns: 126px minmax\(0, 1fr\)/)
  assert.match(css, /grid-template-columns: 142px minmax\(0, 1fr\)/)
  assert.match(css, /content: 'Nueva página'/)
  assert.match(css, /pastoral-page-chip\.is-active::before/)
})

test('celular horizontal prioriza lienzo y mueve paginas abajo', () => {
  assert.match(css, /orientation: landscape/)
  assert.match(css, /grid-template-areas:\s*'canvas'\s*'pages'/)
  assert.match(css, /grid-template-rows: minmax\(0, 1fr\) 44px/)
  assert.match(css, /width: min\(292px, 44vw\)/)
})

test('inspector y formato de pagina usan superficies continuas', () => {
  assert.match(css, /pastoral-tool-panel-scroll > div > div \+ div/)
  assert.match(css, /aside\[aria-label='Panel diseno'\] \.grid\.grid-cols-2/)
  assert.match(css, /background: var\(--editor-accent-soft\)/)
})
