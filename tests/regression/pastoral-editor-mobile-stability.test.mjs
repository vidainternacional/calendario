import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-compact-mobile.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')

test('compactacion movil se carga despues de la jerarquia principal', () => {
  assert.match(layout, /pastoral-editor-hierarchy-v2\.css'[\s\S]*pastoral-editor-compact-mobile\.css'/)
})

test('panel movil es overlay y no crea una fila que mueva el lienzo', () => {
  assert.match(css, /grid-template-areas:\s*'stage'\s*'dock'/)
  assert.match(css, /\.pastoral-tool-panel \{[\s\S]*position: absolute !important/)
  assert.match(css, /bottom: 47px !important/)
  assert.match(css, /has-panel \.pastoral-pages-strip \{\s*display: flex !important/)
})

test('dock movil conserva altura compacta e iconos menores', () => {
  assert.match(css, /\.pastoral-tool-dock \{[\s\S]*height: 47px !important/)
  assert.match(css, /\.pastoral-tool-button \{[\s\S]*min-width: 58px !important[\s\S]*height: 46px !important/)
  assert.match(css, /\.pastoral-tool-button svg \{[\s\S]*width: 17px !important[\s\S]*height: 17px !important/)
})

test('texto usa superficie compacta sin cards grandes', () => {
  assert.match(css, /Panel texto'[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/)
  assert.match(css, /Panel texto'[\s\S]*button:first-child[\s\S]*background: transparent !important/)
  assert.match(css, /Tipografías como lista compacta/)
})

test('handles directos del lienzo son discretos', () => {
  assert.match(css, /aria-label='Mover elemento'[\s\S]*width: 30px !important/)
  assert.match(css, /aria-label='Redimensionar elemento'[\s\S]*width: 23px !important/)
})
