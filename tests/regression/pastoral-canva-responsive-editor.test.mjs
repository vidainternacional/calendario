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
  assert.match(css, /grid-template-rows: minmax\(0, 1fr\) auto 64px !important/)
  assert.match(css, /pastoral-tool-panel[\s\S]*position: relative !important/)
  assert.doesNotMatch(workspace, /pastoral-sheet-handle/)
})

test('celular horizontal conserva la misma arquitectura inferior', () => {
  const horizontal = css.slice(css.indexOf('@media (orientation: landscape)'))
  assert.match(horizontal, /grid-template-rows: minmax\(0, 1fr\) auto 52px !important/)
  assert.doesNotMatch(horizontal, /grid-template-areas:\s*'dock stage'/)
})

test('dock principal contiene exactamente las seis herramientas aprobadas', () => {
  const dock = workspace.match(/const HERRAMIENTAS:[\s\S]*?\n\]/)?.[0] ?? ''
  for (const label of ['Plantillas', 'Elementos', 'Texto', 'Biblia', 'Diseño', 'Capas']) assert.match(dock, new RegExp(`label: '${label}'`))
  assert.doesNotMatch(dock, /label: 'Fondo'|label: 'Párrafo'|label: 'Borrar'/)
  assert.match(css, /grid-template-columns: repeat\(6, minmax\(0, 1fr\)\) !important/)
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
