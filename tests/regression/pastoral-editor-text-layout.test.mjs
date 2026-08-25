import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-surface-white.css', 'utf8')
const toast = fs.readFileSync('lib/ui/toast.ts', 'utf8')

test('aplicar una plantilla no muestra toast de confirmación', () => {
  assert.match(toast, /\^Plantilla “\.\+” aplicada\$/)
  assert.match(toast, /tipo === 'ok'/)
})

test('Texto usa más altura útil y elimina el vacío superior excesivo', () => {
  assert.match(css, /pastoral-tool-panel\.panel-texto[\s\S]*height: clamp\(280px, 37dvh, 310px\) !important/)
  assert.match(css, /pastoral-text-three-rows[\s\S]*grid-template-rows: 46px 56px minmax\(150px, 1fr\) !important/)
})

test('Texto ordena presets fuentes y formato sin volver a encerrar el panel', () => {
  assert.match(css, /pastoral-text-presets button[\s\S]*flex: 1 1 0 !important/)
  assert.match(css, /pastoral-font-strip[\s\S]*overflow-x: auto !important/)
  assert.match(css, /pastoral-text-tools-row[\s\S]*flex-wrap: wrap !important/)
  assert.match(css, /pastoral-color-strip[\s\S]*flex: 1 0 100% !important/)
  assert.doesNotMatch(css, /panel-texto[\s\S]*box-shadow:[^\n]*var\(--pastoral-v6-shadow/)
})

test('Texto conserva una variante compacta en horizontal', () => {
  assert.match(css, /orientation: landscape[\s\S]*panel-texto[\s\S]*height: 174px !important/)
  assert.match(css, /orientation: landscape[\s\S]*pastoral-text-tools-row[\s\S]*flex-wrap: nowrap !important/)
})
