import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-plantillas-v8.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')

test('V8 carga después de V7 como autoridad puntual de Plantillas', () => {
  assert.match(layout, /pastoral-editor-plantillas-v7\.css'[\s\S]*pastoral-editor-plantillas-v8\.css'/)
})

test('las tres cintas de Plantillas tienen viewport acotado y scroll horizontal real', () => {
  assert.match(css, /pastoral-compact-row[\s\S]*max-width: 100% !important[\s\S]*overflow: hidden !important/)
  assert.match(css, /pastoral-template-grid,[\s\S]*inline-size: 100% !important[\s\S]*max-width: 100% !important[\s\S]*overflow-x: scroll !important/)
  assert.match(css, /touch-action: pan-x !important/)
  assert.match(css, /-webkit-overflow-scrolling: touch !important/)
})

test('Plantillas y Temas conservan sus anchos aprobados mientras desbordan lateralmente', () => {
  assert.match(css, /pastoral-template-option[\s\S]*flex: 0 0 132px !important[\s\S]*max-width: 132px !important/)
  assert.match(css, /pastoral-theme-option[\s\S]*flex: 0 0 104px !important[\s\S]*max-width: 104px !important/)
  assert.match(css, /pastoral-start-backgrounds > button[\s\S]*flex: 0 0 58px !important/)
})

test('la franja de páginas tiene una fila fija visible y no puede ser cubierta por Plantillas', () => {
  assert.match(css, /pastoral-stage[\s\S]*grid-template-rows: minmax\(0, 1fr\) 52px !important/)
  assert.match(css, /pastoral-pages-strip[\s\S]*grid-row: 2 !important[\s\S]*height: 52px !important[\s\S]*flex-direction: row !important/)
  assert.match(css, /pastoral-tool-panel\.panel-plantillas[\s\S]*position: relative !important[\s\S]*grid-area: panel !important/)
})

test('el número activo de página permanece visible, estable y sin barra vertical legacy', () => {
  assert.match(css, /pastoral-page-chip > button:first-child[\s\S]*visibility: visible !important[\s\S]*font-size: \.82rem !important/)
  assert.match(css, /pastoral-page-chip::before,[\s\S]*display: none !important/)
  assert.match(css, /pastoral-page-chip\.is-active[\s\S]*background: rgba\(192,57,43,\.075\) !important/)
})

test('el dock conserva posición y recibe un tratamiento minimalista de iconos', () => {
  assert.match(css, /pastoral-tool-dock[\s\S]*background: rgba\(255,255,255,\.94\) !important[\s\S]*backdrop-filter: blur\(18px\) !important/)
  assert.match(css, /pastoral-tool-button svg[\s\S]*width: 21px !important[\s\S]*stroke-width: 1\.65 !important/)
  assert.match(css, /pastoral-tool-button\.is-active::after[\s\S]*width: 24px !important[\s\S]*height: 2px !important/)
})
