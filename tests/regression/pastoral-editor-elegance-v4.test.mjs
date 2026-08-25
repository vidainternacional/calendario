import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-elegance-v4.css', 'utf8')
const finalCss = fs.readFileSync('app/(app)/pastoral/pastoral-editor-elegance-v4-final.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')

test('la capa elegante final se carga al final y neutraliza cualquier caja externa', () => {
  assert.match(layout, /pastoral-editor-elegance-v4\.css'[\s\S]*pastoral-editor-elegance-v4-final\.css'/)
  assert.match(finalCss, /pastoral-tool-panel[\s\S]*border: 0 !important/)
  assert.match(finalCss, /pastoral-tool-panel::before[\s\S]*display: none !important/)
  assert.match(finalCss, /pastoral-panel-content[\s\S]*animation: none !important/)
})

test('Fondo deja de competir como herramienta y permanece unificado dentro de Plantillas', () => {
  assert.match(finalCss, /pastoral-tool-dock > \.pastoral-tool-button:nth-child\(5\)[\s\S]*display: none !important/)
  const plantillas = workspace.slice(workspace.indexOf("panel === 'plantillas'"), workspace.indexOf("panel === 'recursos'"))
  assert.match(plantillas, /Plantillas/)
  assert.match(plantillas, /Temas/)
  assert.match(plantillas, /Fondos/)
  assert.match(plantillas, /PALETAS_PRESENTACION/)
  assert.match(plantillas, /aplicarFondoImagen/)
})

test('mobile usa una fila auto para herramientas y el lienzo recupera todo el espacio libre', () => {
  assert.match(finalCss, /grid-template-rows: minmax\(0, 1fr\) auto 48px !important/)
  assert.match(finalCss, /panel-plantillas[\s\S]*height: auto !important/)
  assert.match(finalCss, /panel-recursos[\s\S]*height: auto !important/)
  assert.match(finalCss, /panel-texto[\s\S]*height: auto !important/)
  assert.match(finalCss, /panel-diseno[\s\S]*height: auto !important/)
  assert.match(finalCss, /panel-capas[\s\S]*height: auto !important/)
  assert.match(finalCss, /panel-biblia[\s\S]*height: clamp\(202px, 27dvh, 236px\)/)
  assert.doesNotMatch(finalCss, /--pastoral-panel-h/)
})

test('dock visible ocupa todo el ancho y queda preparado para scroll horizontal futuro', () => {
  assert.match(finalCss, /pastoral-tool-dock[\s\S]*overflow-x: auto !important/)
  assert.match(finalCss, /width: calc\(100% \/ 6\) !important/)
  assert.match(finalCss, /flex: 0 0 calc\(100% \/ 6\) !important/)
  assert.match(finalCss, /scroll-snap-type: x proximity/)
})

test('Plantillas muestra opciones completas en tres cintas que llenan el ancho', () => {
  assert.match(finalCss, /pastoral-template-grid[\s\S]*grid-auto-columns: calc\(\(100% - \.72rem\) \/ 3\)/)
  assert.match(finalCss, /pastoral-theme-grid[\s\S]*grid-auto-columns: calc\(\(100% - \.9rem\) \/ 4\)/)
  assert.match(finalCss, /pastoral-start-backgrounds[\s\S]*grid-auto-columns: clamp\(40px, calc\(\(100% - 1\.5rem\) \/ 6\), 54px\)/)
})

test('Texto conserva tres líneas compactas y la primera usa cuatro controles iguales', () => {
  assert.match(finalCss, /pastoral-text-three-rows[\s\S]*grid-template-rows: 32px 32px 36px/)
  assert.match(finalCss, /pastoral-text-presets button[\s\S]*width: 25% !important/)
  assert.match(finalCss, /pastoral-font-strip[\s\S]*overflow-x: auto !important/)
  assert.match(finalCss, /pastoral-text-tools-row[\s\S]*overflow-x: auto !important/)
})

test('Elementos aprovecha el ancho con doce miniaturas antes de desplazarse', () => {
  assert.match(finalCss, /pastoral-elements-grid[\s\S]*grid-template-rows: repeat\(2, 40px\)/)
  assert.match(finalCss, /grid-auto-columns: calc\(\(100% - 1\.5rem\) \/ 6\)/)
  assert.match(finalCss, /overflow-x: auto !important/)
})

test('Biblia conserva una excepción de altura porque los versículos son protagonistas', () => {
  assert.match(finalCss, /pastoral-verse-picker\.is-embedded[\s\S]*grid-template-rows: 31px minmax\(0, 1fr\)/)
  assert.match(finalCss, /pastoral-verse-list[\s\S]*overflow-y: auto !important/)
})

test('Diseño es una sola línea integrada y no una tarjeta segmentada', () => {
  assert.match(finalCss, /panel-diseno \.pastoral-panel-content[\s\S]*grid-template-columns: 48px minmax\(0, 1fr\)/)
  assert.match(finalCss, /pastoral-panel-heading::after[\s\S]*content: 'Formato'/)
  assert.match(finalCss, /pastoral-aspect-control[\s\S]*border: 0 !important[\s\S]*background: transparent !important/)
})

test('microinteracciones permanecen sobrias y respetan movimiento reducido', () => {
  assert.match(finalCss, /pastoral-tool-button\.is-active::after/)
  assert.match(finalCss, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(finalCss, /transition: none !important/)
  assert.match(css, /pastoral-tool-button\.is-active/)
})
