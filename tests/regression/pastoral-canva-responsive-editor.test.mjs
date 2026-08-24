import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const wrapper = fs.readFileSync('components/pastoral/ProyectoContenidoWorkspace.tsx', 'utf8')
const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceCanva.tsx', 'utf8')

test('Centro Pastoral activa el shell responsive nuevo', () => {
  assert.match(wrapper, /PastoralVisualWorkspaceCanva/)
  assert.match(workspace, /pastoral-editor-shell/)
  assert.match(workspace, /pastoral-tool-dock/)
  assert.match(workspace, /pastoral-tool-panel/)
})

test('móvil vertical divide lienzo y bandeja desde abajo', () => {
  assert.match(workspace, /orientation:portrait/)
  assert.match(workspace, /max-width:767px/)
  assert.match(workspace, /grid-template-areas:'stage' 'panel' 'dock'/)
  assert.match(workspace, /max-height:46dvh/)
  assert.match(workspace, /pastoral-sheet-handle/)
})

test('horizontal iPad y escritorio reacomodan herramientas lateralmente', () => {
  assert.match(workspace, /orientation:landscape/)
  assert.match(workspace, /min-width:768px/)
  assert.match(workspace, /grid-template-areas:'dock stage panel'/)
  assert.match(workspace, /flex-direction:column/)
  assert.match(workspace, /minmax\(300px,34vw\)/)
})

test('bandeja principal incluye plantillas elementos texto fondo biblia párrafo y diseño', () => {
  for (const label of ['Plantillas', 'Elementos', 'Texto', 'Fondo', 'Biblia', 'Párrafo', 'Diseño']) assert.match(workspace, new RegExp(`label: '${label}'`))
})

test('plantillas ofrecen familias cristianas minimalistas y generales sin depender de imágenes remotas', () => {
  for (const categoria of ['Cristianas', 'Minimalistas', 'Generales']) assert.match(workspace, new RegExp(categoria))
  for (const nombre of ['Predicación limpia', 'Versículo protagonista', 'Serie dominical', 'Oración serena', 'Minimal claro', 'Minimal oscuro', 'Mensaje central', 'Anuncio simple']) assert.match(workspace, new RegExp(nombre))
  assert.match(workspace, /const aplicarPlantilla =/)
  assert.match(workspace, /registrarHistorial\(\)/)
  assert.match(workspace, /elementos: siguientes/)
})

test('nuevo shell conserva edición completa y reutiliza presentación congregación y compartir', () => {
  assert.match(workspace, /onDeleteElement=\{eliminarElemento\}/)
  assert.match(workspace, /onPatchElement=\{patchElementoSinHistorial\}/)
  assert.match(workspace, /editarPaquetePastoral/)
  assert.match(workspace, /vista === 'presentacion'/)
  assert.match(workspace, /vista === 'congregacion'/)
  assert.match(workspace, /PackageDistributionControls/)
  assert.match(workspace, /requestFullscreen/)
  assert.match(workspace, /window\.print\(\)/)
})
