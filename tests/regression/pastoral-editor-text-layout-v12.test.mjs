import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')

test('Texto estable usa tres cintas compactas sin reserva histórica V11/V12', () => {
  assert.match(css, /pastoral-text-three-rows[\s\S]*grid-template-rows: 46px 50px 58px !important/)
  assert.match(css, /pastoral-tool-panel\.panel-texto[\s\S]*height: 172px !important/)
})

test('Caja Título Subtítulo y Cuerpo quedan en cuatro columnas iguales', () => {
  assert.match(css, /pastoral-text-presets[\s\S]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\) !important/)
  assert.match(css, /pastoral-text-presets button[\s\S]*width: 100% !important/)
  assert.doesNotMatch(workspace, /<Plus \/> Caja/)
})

test('Tamaño y Línea tienen steppers React táctiles y la cinta conserva scroll horizontal', () => {
  assert.match(css, /pastoral-font-size[\s\S]*min-width: 226px !important/)
  assert.match(css, /pastoral-line-height[\s\S]*min-width: 210px !important/)
  assert.match(css, /pastoral-step-button[\s\S]*width: 44px !important/)
  assert.match(css, /pastoral-text-tools-row[\s\S]*overflow-x: auto !important/)
  assert.match(workspace, /aria-label="Reducir tamaño de letra"/)
  assert.match(workspace, /aria-label="Aumentar interlineado"/)
})

test('la primera página inicia a la izquierda y sigue sin cápsula', () => {
  assert.match(css, /pastoral-pages-strip[\s\S]*justify-content: flex-start !important/)
  assert.match(css, /pastoral-page-chip\.is-active[\s\S]*background: transparent !important/)
})

test('el layout carga una sola autoridad visual después de la base V3', () => {
  const v3 = layout.indexOf("./pastoral-editor-v3.css")
  const stable = layout.indexOf("./pastoral-editor-stable.css")
  assert.ok(v3 >= 0 && stable > v3)
  assert.doesNotMatch(layout, /pastoral-editor-workbench-v10|pastoral-editor-surface-white|pastoral-editor-text-controls-v11|pastoral-editor-text-controls-v12|PastoralEditorRuntimeEnhancements/)
})

test('la arquitectura real del dock contiene solo las seis herramientas aprobadas', () => {
  assert.match(workspace, /type Herramienta = 'plantillas' \| 'recursos' \| 'texto' \| 'biblia' \| 'diseno' \| 'capas'/)
  assert.doesNotMatch(workspace, /id: 'fondo', label: 'Fondo'/)
  assert.match(workspace, /Crear una página nueva en blanco/)
  assert.doesNotMatch(workspace, /Tema .* aplicado|Plantilla .* aplicada/)
})
