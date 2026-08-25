import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-text-controls-v11.css', 'utf8')
const toast = fs.readFileSync('lib/ui/toast.ts', 'utf8')
const runtime = fs.readFileSync('components/pastoral/PastoralEditorRuntimeEnhancements.tsx', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')

test('aplicar Plantilla o Tema no muestra toast de confirmación', () => {
  assert.match(toast, /\(Plantilla\|Tema\)/)
  assert.match(toast, /aplicad\[oa\]/)
  assert.match(toast, /tipo === 'ok'/)
})

test('Plantillas ofrece una entrada segura para empezar en blanco', () => {
  assert.match(runtime, /dataset\.pastoralBlankTemplate/)
  assert.match(runtime, /Empezar con una página en blanco/)
  assert.match(runtime, /aria-label="Nueva página"/)
  assert.match(layout, /PastoralEditorRuntimeEnhancements/)
})

test('Texto conserva controles grandes y usa scroll horizontal en vez de comprimirlos', () => {
  assert.match(css, /pastoral-text-presets button[\s\S]*min-width: 92px !important/)
  assert.match(css, /pastoral-font-strip[\s\S]*overflow-x: auto !important/)
  assert.match(css, /pastoral-text-tools-row[\s\S]*flex-wrap: nowrap !important/)
  assert.match(css, /pastoral-text-tools-row[\s\S]*overflow-x: auto !important/)
  assert.match(css, /pastoral-inline-icon[\s\S]*width: 48px !important/)
})

test('Tamaño e interlineado tienen steppers táctiles reales', () => {
  assert.match(runtime, /pastoral-number-stepper/)
  assert.match(runtime, /Reducir tamaño de letra/)
  assert.match(runtime, /Aumentar tamaño de letra/)
  assert.match(runtime, /Reducir interlineado/)
  assert.match(runtime, /Aumentar interlineado/)
  assert.match(css, /pastoral-step-button[\s\S]*width: 32px !important/)
})

test('Caja queda alineada con Título Subtítulo y Cuerpo', () => {
  assert.match(css, /pastoral-text-presets button[\s\S]*display: inline-flex !important/)
  assert.match(css, /pastoral-text-presets button[\s\S]*align-items: center !important/)
  assert.match(css, /pastoral-text-presets button svg[\s\S]*width: 14px !important/)
})

test('página activa queda libre sobre el fondo y sin cápsula', () => {
  assert.match(css, /pastoral-page-chip\.is-active[\s\S]*background: transparent !important/)
  assert.match(css, /pastoral-page-chip\.is-active > button:first-child[\s\S]*border-bottom-color: #c0392b !important/)
  assert.match(css, /aria-label='Nueva página'[\s\S]*background: transparent !important/)
})

test('cursiva fuerza una variante itálica visible en Safari iOS', () => {
  assert.match(css, /font-style: oblique/)
  assert.match(css, /font-style: italic !important/)
  assert.match(css, /font-synthesis: style weight !important/)
})

test('Texto conserva una variante compacta en horizontal', () => {
  assert.match(css, /orientation: landscape[\s\S]*panel-texto[\s\S]*height: 176px !important/)
  assert.match(css, /orientation: landscape[\s\S]*pastoral-text-tools-row[\s\S]*height: 54px !important/)
})
