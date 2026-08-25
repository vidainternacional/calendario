import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-text-controls-v12.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')

test('Texto V12 elimina el vacío inferior del panel móvil', () => {
  assert.match(css, /pastoral-tool-panel\.panel-texto[\s\S]*height: 184px !important/)
  assert.match(css, /pastoral-text-three-rows[\s\S]*grid-template-rows: 46px 50px 58px !important/)
})

test('Caja Título Subtítulo y Cuerpo quedan en cuatro columnas iguales', () => {
  assert.match(css, /pastoral-text-presets[\s\S]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\) !important/)
  assert.match(css, /pastoral-text-presets button[\s\S]*width: 100% !important/)
})

test('Tamaño y Línea conservan controles táctiles grandes sin compresión', () => {
  assert.match(css, /pastoral-font-size[\s\S]*min-width: 226px !important/)
  assert.match(css, /pastoral-line-height[\s\S]*min-width: 210px !important/)
  assert.match(css, /pastoral-step-button[\s\S]*width: 40px !important/)
  assert.match(css, /pastoral-text-tools-row[\s\S]*overflow-x: auto !important/)
})

test('la primera página no se recorta y sigue sin cápsula', () => {
  assert.match(css, /pastoral-pages-strip[\s\S]*justify-content: flex-start !important/)
  assert.match(css, /pastoral-page-chip\.is-active[\s\S]*background: transparent !important/)
})

test('V12 se carga después de V11', () => {
  const v11 = layout.indexOf("./pastoral-editor-text-controls-v11.css")
  const v12 = layout.indexOf("./pastoral-editor-text-controls-v12.css")
  assert.ok(v11 >= 0 && v12 > v11)
})
