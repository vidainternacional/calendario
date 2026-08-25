import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-notes-language-v6.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')

test('el lenguaje de Notas carga como autoridad visual final', () => {
  assert.match(layout, /pastoral-editor-accessible-v5-authority\.css'[\s\S]*pastoral-editor-notes-language-v6\.css'/)
})

test('los seis tabs visibles usan cápsulas y Fondo continúa fuera del dock', () => {
  assert.match(css, /pastoral-tool-dock > \.pastoral-tool-button[\s\S]*border-radius: 999px !important/)
  assert.match(css, /nth-child\(5\)[\s\S]*display: none !important/)
  assert.match(css, /nth-child\(1\)\.is-active[\s\S]*pastoral-v6-plantillas/)
  assert.match(css, /nth-child\(7\)\.is-active[\s\S]*pastoral-v6-capas/)
})

test('el panel es una sola superficie sin borde exterior y empieza arriba', () => {
  assert.match(css, /pastoral-tool-panel[\s\S]*padding-top: var\(--pastoral-v6-panel-gap\) !important/)
  assert.match(css, /pastoral-tool-panel,[\s\S]*border: 0 !important[\s\S]*background: var\(--pastoral-work-bg\) !important/)
  assert.match(css, /pastoral-panel-content \{ align-content: start !important; \}/)
})

test('las acciones de formato de Texto tienen área táctil de 60px', () => {
  assert.match(css, /pastoral-inline-icon[\s\S]*width: 60px !important[\s\S]*height: 60px !important/)
  assert.match(css, /pastoral-inline-icon\.is-active[\s\S]*background: var\(--pastoral-v6-texto\) !important/)
  assert.match(css, /pastoral-toolbar-divider \{ display: none !important; \}/)
})

test('Plantillas adopta jerarquía etiqueta arriba y acciones debajo', () => {
  assert.match(css, /pastoral-compact-row[\s\S]*grid-template-columns: minmax\(0, 1fr\) !important[\s\S]*grid-template-rows: 18px minmax\(0, 1fr\) !important/)
  assert.match(css, /pastoral-template-preview[\s\S]*border-radius: 14px !important[\s\S]*box-shadow: var\(--pastoral-v6-shadow-soft\) !important/)
})

test('Diseño elimina la tabla y convierte formatos en acciones redondeadas', () => {
  assert.match(css, /panel-diseno \.pastoral-panel-content[\s\S]*grid-template-rows: 28px 96px !important/)
  assert.match(css, /pastoral-aspect-control button[\s\S]*min-height: 92px !important[\s\S]*border-radius: 16px !important/)
  assert.match(css, /pastoral-aspect-control button\.is-active[\s\S]*pastoral-v6-diseno/)
})

test('las alturas del panel quedan acotadas entre Diseño y Biblia', () => {
  assert.match(css, /panel-plantillas \{ height: 248px !important/)
  assert.match(css, /panel-recursos \{ height: 236px !important/)
  assert.match(css, /panel-texto \{ height: 216px !important/)
  assert.match(css, /panel-biblia \{ height: 304px !important/)
  assert.match(css, /panel-diseno \{ height: 182px !important/)
  assert.match(css, /panel-capas \{ height: 224px !important/)
})

test('edición inmersiva elimina el espacio reservado de la navegación global', () => {
  assert.match(css, /app-bottom-nav \{ display: none !important; \}/)
  assert.match(css, /class~="shrink-0"[\s\S]*safe-area-inset-bottom[\s\S]*display: none !important/)
})
