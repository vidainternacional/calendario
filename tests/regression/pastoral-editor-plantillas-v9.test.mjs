import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-plantillas-v9.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')

test('V9 carga después de V8 como autoridad visual final de Plantillas', () => {
  assert.match(layout, /pastoral-editor-plantillas-v8\.css'[\s\S]*pastoral-editor-plantillas-v9\.css'/)
})

test('Plantillas y Temas comparten exactamente 132px de ancho', () => {
  assert.match(css, /pastoral-template-option,[\s\S]*pastoral-theme-option[\s\S]*flex: 0 0 132px !important[\s\S]*width: 132px !important/)
})

test('las etiquetas evitan recorte lateral y mantienen padding de seguridad', () => {
  assert.match(css, /pastoral-template-option > span:last-child[\s\S]*padding: 0 4px !important[\s\S]*text-indent: 0 !important/)
  assert.match(css, /pastoral-theme-option > span:last-child[\s\S]*padding: 0 2px !important[\s\S]*text-indent: 0 !important/)
})

test('los carruseles conservan scroll horizontal táctil y muestran continuidad', () => {
  assert.match(css, /pastoral-template-grid,[\s\S]*pastoral-theme-grid,[\s\S]*pastoral-start-backgrounds[\s\S]*overflow-x: auto !important[\s\S]*touch-action: pan-x !important/)
  assert.match(css, /padding: 2px 34px 7px 4px !important/)
})

test('Plantillas sube contenido y deja espacio seguro antes del dock', () => {
  assert.match(css, /panel-plantillas \{[\s\S]*padding-top: 4px !important/)
  assert.match(css, /pastoral-tool-panel-scroll[\s\S]*padding: 2px 14px 12px !important/)
  assert.match(css, /panel-plantillas \{[\s\S]*height: 300px !important/)
})

test('el modo edición usa superficie gris clara y el dock permanece claro', () => {
  assert.match(css, /--pastoral-edit-surface: #eceff1/)
  assert.match(css, /pastoral-tool-dock[\s\S]*background: rgba\(250,251,252,.96\) !important/)
})

test('el dock elimina pills cromáticos y conserva selección VIDA minimalista', () => {
  assert.match(css, /pastoral-tool-button:nth-child\(7\)[\s\S]*border-radius: 0 !important[\s\S]*background: transparent !important/)
  assert.match(css, /pastoral-tool-button\.is-active[\s\S]*color: #c0392b !important/)
  assert.match(css, /pastoral-tool-button svg[\s\S]*stroke-width: 1.55 !important/)
})
