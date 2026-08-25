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

test('la colección curada conserva 12 estilos diferenciados al inicio de Plantillas', () => {
  for (const id of curadas) assert.match(presets, new RegExp(`id: '${id}'`))
  const posiciones = curadas.map((id) => presets.indexOf(`id: '${id}'`))
  assert.ok(posiciones.every((pos, i) => pos >= 0 && (i === 0 || pos > posiciones[i - 1])))
})

test('la biblioteca combina fondos lisos, degradados y texturas sin imágenes remotas', () => {
  assert.match(presets, /radial-gradient\(/)
  assert.match(presets, /repeating-linear-gradient\(/)
  assert.match(presets, /linear-gradient\(/)
  assert.doesNotMatch(presets, /https?:\/\//)
  assert.doesNotMatch(presets, /url\(/)
})

test('las plantillas nuevas varían tipografía y composición, no solo color', () => {
  for (const fuente of ['Georgia', 'Garamond', 'Palatino Linotype', 'Arial Black', 'Impact', 'Trebuchet MS', 'Helvetica', 'Times New Roman']) {
    assert.match(presets, new RegExp(`fuente: '${fuente.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`))
  }
  assert.match(presets, /alineacion: 'derecha'/)
  assert.match(presets, /alineacion: 'centro'/)
  assert.match(presets, /alineacion: 'izquierda'/)
})

test('las miniaturas de las primeras 12 plantillas representan composiciones distintas', () => {
  assert.match(css, /nth-child\(-n\+12\)/)
  for (let i = 1; i <= 12; i += 1) assert.match(css, new RegExp(`nth-child\\(${i}\\)`))
  assert.match(css, /position: absolute !important/)
})

test('la biblioteca visual carga después de la superficie blanca y no cambia el workspace', () => {
  assert.match(layout, /pastoral-editor-surface-white\.css'[\s\S]*pastoral-template-library\.css'/)
  assert.doesNotMatch(css, /pastoral-editor-shell/)
  assert.doesNotMatch(css, /pastoral-tool-dock/)
})
