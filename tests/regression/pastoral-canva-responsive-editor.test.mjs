import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const wrapper = fs.readFileSync('components/pastoral/ProyectoContenidoWorkspace.tsx', 'utf8')
const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')
const presets = fs.readFileSync('components/pastoral/pastoral-editor-presets.ts', 'utf8')

test('Centro Pastoral fija el lienzo y desplaza únicamente las herramientas inferiores', () => {
  assert.match(wrapper, /PastoralVisualWorkspaceV4/)
  const shell = workspace.indexOf('pastoral-editor-shell-flow')
  const lienzo = workspace.indexOf('pastoral-stage-flow', shell)
  const scroll = workspace.indexOf('pastoral-editor-controls-scroll', lienzo)
  const grupos = workspace.indexOf('pastoral-tool-dock', scroll)
  const submenus = workspace.indexOf('pastoral-tool-panel-flow', grupos)
  const paginas = workspace.indexOf('pastoral-pages-strip', submenus)
  assert.ok(shell >= 0 && lienzo > shell && scroll > lienzo)
  assert.ok(grupos > scroll && submenus > grupos && paginas > submenus)
  assert.match(css, /autoridad visual estable del editor/)
})

test('móvil conserva lienzo panel y cinta inferior sin sheet externa', () => {
  assert.match(css, /grid-template-areas: 'stage' 'panel' 'dock' !important/)
  assert.match(css, /grid-template-rows: minmax\(0, 1fr\) 220px 70px !important/)
  assert.match(css, /pastoral-tool-panel[\s\S]*position: relative !important/)
  assert.doesNotMatch(workspace, /pastoral-sheet-handle/)
})

test('controles principales y submenús quedan centrados en píldoras con lienzo móvil compacto', () => {
  const dock = css.slice(css.indexOf('/* Dock */'), css.indexOf('/* Móvil / tablet'))
  const movil = css.slice(css.indexOf('/* Móvil / tablet'), css.indexOf('/* Móvil horizontal */'))
  const paneles = css.slice(css.indexOf('.pastoral-editor-v4 .pastoral-tool-panel-flow-scroll'), css.indexOf('/* Páginas */'))
  assert.match(dock, /display: flex !important/)
  assert.match(dock, /justify-content: center !important/)
  assert.match(dock, /border-radius: 999px !important/)
  assert.match(dock, /min-width: 94px !important/)
  assert.match(paneles, /\[aria-label\^='Opciones de '\][\s\S]*justify-content: center !important/)
  assert.match(paneles, /border-radius: 999px !important/)
  assert.match(movil, /pastoral-stage-flow[\s\S]*height: clamp\(210px, 32dvh, 300px\) !important/)
  assert.match(movil, /pastoral-canvas-wrap[\s\S]*padding: 5px 10px !important/)
})

test('celular horizontal conserva la misma arquitectura inferior', () => {
  const horizontal = css.slice(css.indexOf('@media (orientation: landscape)'))
  assert.match(horizontal, /grid-template-rows: minmax\(0, 1fr\) 174px 54px !important/)
  assert.doesNotMatch(horizontal, /grid-template-areas:\s*'dock stage'/)
})

test('dock principal contiene exactamente los tres grupos aprobados y conserva las funciones en submenús', () => {
  const dock = workspace.match(/const HERRAMIENTAS:[\s\S]*?\n\]/)?.[0] ?? ''
  for (const label of ['Plantillas', 'Texto', 'Capas']) assert.match(dock, new RegExp(`label: '${label}'`))
  for (const label of ['Elementos', 'Biblia', 'Diseño', 'Fondo', 'Párrafo', 'Borrar']) assert.doesNotMatch(dock, new RegExp(`label: '${label}'`))
  assert.match(workspace, /plantillas:[\s\S]*label: 'Plantillas'[\s\S]*label: 'Temas'[\s\S]*label: 'Fondo'[\s\S]*label: 'Imágenes'/)
  assert.match(workspace, /texto:[\s\S]*label: 'Herramientas'[\s\S]*label: 'Biblia'/)
  assert.match(workspace, /capas:[\s\S]*label: 'Capas'[\s\S]*label: 'Relación'[\s\S]*label: 'Ajustes'/)
  assert.match(workspace, /pastoral-tool-button col-span-2/)
})

test('plantillas conservan familias visuales amplias', () => {
  for (const categoria of ['Cristianas', 'Minimalistas', 'Generales']) assert.match(presets, new RegExp(categoria))
  const cantidad = (presets.match(/categoria: '(?:Cristianas|Minimalistas|Generales)'/g) ?? []).length
  assert.ok(cantidad >= 18)
})

test('workspace conserva edición presentación congregación y compartir', () => {
  assert.match(workspace, /onDeleteElement=\{eliminarElemento\}/)
  assert.match(workspace, /editarPaquetePastoral/)
  assert.match(workspace, /vista === 'presentacion'/)
  assert.match(workspace, /vista === 'congregacion'/)
  assert.match(workspace, /PackageDistributionControls/)
})