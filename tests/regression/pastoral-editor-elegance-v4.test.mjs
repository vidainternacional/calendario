import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-elegance-v4.css', 'utf8')
const finalCss = fs.readFileSync('app/(app)/pastoral/pastoral-editor-elegance-v4-final.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')

test('las capas elegantes se cargan al final y neutralizan la caja externa', () => {
  assert.match(layout, /pastoral-editor-capcut-v2\.css'[\s\S]*pastoral-editor-elegance-v4\.css'[\s\S]*pastoral-editor-elegance-v4-final\.css'/)
  assert.match(css, /\.pastoral-editor-v4 \.pastoral-tool-panel[\s\S]*border: 0 !important/)
  assert.match(css, /border-radius: 0 !important/)
  assert.match(css, /background: transparent !important/)
  assert.match(css, /box-shadow: none !important/)
  assert.match(finalCss, /pastoral-tool-button\.is-active::before[\s\S]*display: none !important/)
})

test('Fondo deja de competir como herramienta y permanece unificado dentro de Plantillas', () => {
  assert.match(css, /\.pastoral-tool-dock > \.pastoral-tool-button:nth-child\(5\)[\s\S]*display: none !important/)
  const plantillas = workspace.slice(workspace.indexOf("panel === 'plantillas'"), workspace.indexOf("panel === 'recursos'"))
  assert.match(plantillas, /Plantillas/)
  assert.match(plantillas, /Temas/)
  assert.match(plantillas, /Fondos/)
  assert.match(plantillas, /PALETAS_PRESENTACION/)
  assert.match(plantillas, /aplicarFondoImagen/)
})

test('cada herramienta móvil reserva solo la altura que necesita', () => {
  assert.match(css, /:has\(\.panel-plantillas\)[\s\S]*--pastoral-panel-h: 162px/)
  assert.match(css, /:has\(\.panel-biblia\)[\s\S]*clamp\(218px, 30dvh, 258px\)/)
  assert.match(css, /grid-template-rows: minmax\(0, 1fr\) var\(--pastoral-panel-h\) 49px/)
  assert.match(finalCss, /:has\(\.panel-recursos\)[\s\S]*--pastoral-panel-h: 148px/)
  assert.match(finalCss, /:has\(\.panel-texto\)[\s\S]*--pastoral-panel-h: 116px/)
  assert.match(finalCss, /:has\(\.panel-diseno\)[\s\S]*--pastoral-panel-h: 88px/)
})

test('Texto conserva tres líneas compactas y estados activos visibles', () => {
  assert.match(css, /pastoral-text-three-rows[\s\S]*grid-template-rows: 32px 32px 36px/)
  assert.match(css, /pastoral-inline-icon\.is-active[\s\S]*color: var\(--pastoral-accent\)/)
  assert.match(css, /pastoral-color-strip button[\s\S]*width: 18px/)
  assert.match(css, /opacity: \.55 !important/)
})

test('Diseño deja de usar una caja exterior y el estado activo conserva jerarquía', () => {
  assert.match(css, /pastoral-aspect-control[\s\S]*border: 0 !important[\s\S]*background: transparent !important/)
  assert.match(css, /pastoral-aspect-control button\.is-active[\s\S]*background: linear-gradient/)
  assert.match(css, /pastoral-panel-heading p \{ display: none !important; \}/)
})

test('microanimaciones respetan accesibilidad de movimiento reducido', () => {
  assert.match(css, /@keyframes pastoral-panel-reveal/)
  assert.match(css, /pastoral-tool-button\.is-active::after/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(css, /animation: none !important/)
  assert.match(css, /transition: none !important/)
})
