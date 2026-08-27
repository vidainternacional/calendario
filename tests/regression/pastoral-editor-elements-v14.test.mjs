import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-feedback-v14.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const enhancer = fs.readFileSync('components/pastoral/PastoralElementsViewEnhancements.tsx', 'utf8')
const picker = fs.readFileSync('components/pastoral/PastoralVersePicker.tsx', 'utf8')

test('versículos consecutivos se agrupan en un solo bloque', () => {
  assert.match(picker, /const grupos: VersiculoElegido\[\]\[\] = \[\]/)
  assert.match(picker, /versiculo\.verso === ultimo\.verso \+ 1/)
  assert.match(picker, /grupo\.map\(v => v\.texto\)\.filter\(Boolean\)\.join\(' '\)/)
  assert.match(picker, /\$\{primero\.verso\}-\$\{ultimo\.verso\}/)
})

test('Elementos ofrece vistas de lista y miniaturas y mantiene densidad adaptable', () => {
  assert.match(layout, /PastoralElementsViewEnhancements/)
  for (const vista of ['lista', 'compacta']) assert.match(enhancer, new RegExp(`id: '${vista}'`))
  assert.match(enhancer, /grid\.dataset\.view = vista/)
  assert.match(css, /pastoral-elements-view-toggle/)
  assert.match(css, /pastoral-elements-grid\[data-view='compacta'\]/)
})

test('Plantillas no repite la biblioteca de imágenes y el panel no dibuja caja exterior', () => {
  assert.match(css, /panel-plantillas \.pastoral-compact-row:has\(\.pastoral-start-backgrounds\)[\s\S]*display: none !important/)
  assert.match(css, /pastoral-tool-panel,[\s\S]*border: 0 !important[\s\S]*box-shadow: none !important[\s\S]*background: transparent !important/)
})

test('botón de subir imagen centra el icono', () => {
  assert.match(css, /pastoral-elements-top \.pastoral-minimal-action[\s\S]*align-items: center !important[\s\S]*justify-content: center !important/)
  assert.match(css, /pastoral-minimal-action > svg[\s\S]*align-self: center !important/)
})
