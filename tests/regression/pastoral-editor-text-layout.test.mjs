import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')

test('aplicar Plantilla o Tema no solicita toast de confirmación', () => {
  assert.doesNotMatch(workspace, /Tema “\$\{paleta\.label\}” aplicado|Plantilla “\$\{plantilla\.nombre\}” aplicada/)
})

test('Plantillas ofrece En blanco nativo que crea una página nueva', () => {
  assert.match(workspace, /Crear una página nueva en blanco/)
  assert.match(workspace, /onClick=\{nuevaPagina\}/)
  assert.doesNotMatch(layout, /PastoralEditorRuntimeEnhancements/)
})

test('Texto conserva controles grandes y scroll horizontal', () => {
  assert.match(css, /pastoral-text-tools-row[\s\S]*overflow-x: auto !important/)
  assert.match(css, /pastoral-inline-icon[\s\S]*width: 46px !important/)
})

test('Tamaño e interlineado tienen steppers táctiles React', () => {
  assert.match(workspace, /aria-label="Reducir tamaño de letra"/)
  assert.match(workspace, /aria-label="Aumentar tamaño de letra"/)
  assert.match(workspace, /aria-label="Reducir interlineado"/)
  assert.match(workspace, /aria-label="Aumentar interlineado"/)
})

test('Caja queda alineada con Título Subtítulo y Cuerpo', () => {
  assert.match(css, /pastoral-text-presets[\s\S]*repeat\(4, minmax\(0, 1fr\)\)/)
  assert.doesNotMatch(workspace, /<Plus \/> Caja/)
})

test('página activa queda libre y primera página inicia a la izquierda', () => {
  assert.match(css, /pastoral-pages-strip[\s\S]*justify-content: flex-start/)
  assert.match(css, /pastoral-page-chip\.is-active[\s\S]*background: transparent/)
})

test('cursiva se aplica directamente como italic en el renderer', () => {
  assert.match(canvas, /fontStyle: elemento\.cursiva \? 'italic' : 'normal'/)
  assert.match(canvas, /fontSynthesis: 'style weight'/)
})
