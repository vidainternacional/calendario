import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const presets = fs.readFileSync('components/pastoral/pastoral-editor-presets.ts', 'utf8')
const css = fs.readFileSync('app/(app)/pastoral/pastoral-template-library.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')

const curadas = [
  'editorial-marfil', 'versiculo-luz', 'serie-horizonte', 'biblia-papel',
  'conferencia-nitida', 'palabra-central', 'juventud-suave', 'noche-elegante',
  'clasico-liturgico', 'creativo-pastel', 'pizarra-moderna', 'amanecer-minimal',
]

const temas = [
  'editorial-blanco', 'crema-serif', 'papel-biblia', 'tipografico-azul', 'negro-oro',
  'noche-azul', 'rojo-crema', 'salvia-elegante', 'bosque-clasico', 'purpura-gradiente',
  'coral-editorial', 'juventud-neon', 'blanco-negro', 'grafito', 'arena-organica',
  'azul-clasico', 'agua-moderna', 'lavanda-editorial', 'borgona-clasico', 'amanecer',
]

test('la colección curada conserva 12 estilos diferenciados al inicio de Plantillas', () => {
  for (const id of curadas) assert.match(presets, new RegExp(`id: '${id}'`))
  const posiciones = curadas.map((id) => presets.indexOf(`id: '${id}'`))
  assert.ok(posiciones.every((pos, i) => pos >= 0 && (i === 0 || pos > posiciones[i - 1])))
})

test('Temas ofrece 20 identidades visuales diferenciadas', () => {
  for (const id of temas) assert.match(presets, new RegExp(`id: '${id}'`))
  assert.equal(temas.length, 20)
  assert.match(presets, /fuenteTitulo: 'Impact'/)
  assert.match(presets, /fuenteTitulo: 'Palatino Linotype'/)
  assert.match(presets, /fuenteTitulo: 'Times New Roman'/)
  assert.match(presets, /fuenteTitulo: 'Arial Black'/)
})

test('la biblioteca combina fondos lisos, degradados y texturas sin imágenes remotas', () => {
  assert.match(presets, /radial-gradient\(/)
  assert.match(presets, /repeating-linear-gradient\(/)
  assert.match(presets, /linear-gradient\(/)
  assert.doesNotMatch(presets, /https?:\/\//)
  assert.doesNotMatch(presets, /url\(/)
})

test('las miniaturas usan un solo lenguaje de barras y conservan 24 composiciones', () => {
  assert.match(css, /pastoral-template-preview > i/)
  assert.match(css, /height: 3px !important/)
  assert.match(css, /border-radius: 999px !important/)
  assert.doesNotMatch(css, /border-radius: 50%/)
  for (let i = 1; i <= 24; i += 1) assert.match(css, new RegExp(`nth-child\\(${i}\\)`))
})

test('Plantillas y Temas comparten 132px y Temas usa muestras de color propias', () => {
  assert.match(css, /pastoral-template-option,[\s\S]*pastoral-theme-option[\s\S]*width: 132px !important/)
  assert.match(css, /pastoral-theme-swatches/)
  assert.match(css, /pastoral-theme-option::after/)
})

test('la biblioteca visual carga después de la superficie blanca y no cambia el workspace', () => {
  assert.match(layout, /pastoral-editor-surface-white\.css'[\s\S]*pastoral-template-library\.css'/)
  assert.doesNotMatch(css, /pastoral-editor-shell/)
  assert.doesNotMatch(css, /pastoral-tool-dock/)
})
