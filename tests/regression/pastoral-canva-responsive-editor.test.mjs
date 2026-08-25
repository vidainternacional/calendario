import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const wrapper = fs.readFileSync('components/pastoral/ProyectoContenidoWorkspace.tsx', 'utf8')
const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-capcut-v2.css', 'utf8')
const presets = fs.readFileSync('components/pastoral/pastoral-editor-presets.ts', 'utf8')

test('Centro Pastoral activa el workspace integrado v4', () => {
  assert.match(wrapper, /PastoralVisualWorkspaceV4/)
  assert.match(workspace, /pastoral-editor-shell has-panel/)
  assert.match(workspace, /pastoral-tool-dock/)
  assert.match(workspace, /pastoral-tool-panel/)
})

test('móvil conserva lienzo panel permanente y cinta inferior sin sheet externa', () => {
  assert.match(css, /grid-template-areas: 'stage' 'panel' 'dock' !important/)
  assert.match(css, /grid-template-rows: minmax\(0,1fr\) 188px 48px !important/)
  assert.match(css, /pastoral-tool-panel[\s\S]*position: relative !important/)
  assert.doesNotMatch(workspace, /pastoral-sheet-handle/)
})

test('celular horizontal conserva la misma arquitectura inferior y no reintroduce rail lateral', () => {
  assert.match(css, /orientation: landscape/)
  assert.match(css, /grid-template-areas:'stage' 'panel' 'dock' !important/)
  assert.match(css, /grid-template-rows:minmax\(0,1fr\) 118px 42px !important/)
  assert.doesNotMatch(css, /grid-template-areas:'dock stage'/)
})

test('dock principal conserva todas las herramientas en una cinta horizontal', () => {
  for (const label of ['Plantillas', 'Elementos', 'Texto', 'Biblia', 'Fondo', 'Diseño', 'Capas']) assert.match(workspace, new RegExp(`label: '${label}'`))
  assert.doesNotMatch(workspace.match(/const HERRAMIENTAS:[\s\S]*?\n\]/)?.[0] ?? '', /label: 'Párrafo'/)
  assert.match(css, /pastoral-tool-dock[\s\S]*overflow-x: auto !important/)
  assert.match(css, /flex: 0 0 70px !important/)
})

test('plantillas crecen y conservan familias cristianas minimalistas y generales', () => {
  for (const categoria of ['Cristianas', 'Minimalistas', 'Generales']) assert.match(presets, new RegExp(categoria))
  for (const nombre of ['Predicación limpia', 'Versículo protagonista', 'Texto bíblico', 'Puntos de prédica', 'Editorial', 'Minimal centrado', 'Conferencia', 'Agenda', 'Reflexión']) assert.match(presets, new RegExp(nombre))
  const cantidad = (presets.match(/categoria: '(?:Cristianas|Minimalistas|Generales)'/g) ?? []).length
  assert.ok(cantidad >= 18, `se esperaban al menos 18 plantillas y hay ${cantidad}`)
  assert.match(css, /pastoral-template-grid::after/)
})

test('workspace v4 conserva edición completa presentación congregación y compartir', () => {
  assert.match(workspace, /onDeleteElement=\{eliminarElemento\}/)
  assert.match(workspace, /onPatchElement=\{patchElementoSinHistorial\}/)
  assert.match(workspace, /editarPaquetePastoral/)
  assert.match(workspace, /vista === 'presentacion'/)
  assert.match(workspace, /vista === 'congregacion'/)
  assert.match(workspace, /PackageDistributionControls/)
  assert.match(workspace, /requestFullscreen/)
  assert.match(workspace, /window\.print\(\)/)
})
