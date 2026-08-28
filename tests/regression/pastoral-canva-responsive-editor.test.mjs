import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const wrapper = fs.readFileSync('components/pastoral/ProyectoContenidoWorkspace.tsx', 'utf8')
const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')
const presets = fs.readFileSync('components/pastoral/pastoral-editor-presets.ts', 'utf8')

test('Centro Pastoral activa el workspace integrado v4 estable', () => {
  assert.match(wrapper, /PastoralVisualWorkspaceV4/)
  assert.match(workspace, /pastoral-editor-shell has-panel/)
  assert.match(css, /autoridad visual estable del editor/)
})

test('móvil conserva lienzo panel y cinta inferior sin sheet externa', () => {
  assert.match(css, /grid-template-areas: 'stage' 'panel' 'dock' !important/)
  assert.match(css, /grid-template-rows: minmax\(0, 1fr\) 220px 70px !important/)
  assert.match(css, /pastoral-tool-panel[\s\S]*position: relative !important/)
  assert.doesNotMatch(workspace, /pastoral-sheet-handle/)
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
