import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
const proyecto = fs.readFileSync('components/pastoral/ProyectoContenidoWorkspace.tsx', 'utf8')

test('Plantillas usa el catálogo visual vigente dentro del editor pastoral', () => {
  assert.match(proyecto, /PastoralVisualWorkspaceV4/)
  assert.doesNotMatch(proyecto, /PastoralTemplateRuntime/)
  assert.match(workspace, /PLANTILLAS_VISUALES/)
  assert.match(workspace, /type PlantillaVisual/)
  assert.match(workspace, /function textoMuestraPlantilla\(plantilla: PlantillaVisual, rol: RolTexto\)/)
  assert.match(workspace, /PLANTILLAS_VISUALES\.some\(\(plantilla\) =>/)
  assert.match(workspace, /const tamanoPlantillaCanvas = \(pt: number\) => Math\.max\(9, Math\.round\(pt \* \.56\)\)/)
  assert.match(workspace, /normalizarPaginaCanvas\(item\)/)
  assert.match(workspace, /PastoralVisualCanvas/)
})
