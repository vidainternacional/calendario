import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const wrapper = fs.readFileSync('components/pastoral/ProyectoContenidoWorkspace.tsx', 'utf8')
const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV3.tsx', 'utf8')
const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-v3.css', 'utf8')

test('Centro Pastoral activa el shell responsive v3', () => {
  assert.match(wrapper, /PastoralVisualWorkspaceV3/)
  assert.match(workspace, /pastoral-editor-shell/)
  assert.match(workspace, /pastoral-tool-dock/)
  assert.match(workspace, /pastoral-tool-panel/)
})

test('móvil vertical conserva lienzo y superpone bandeja desde abajo', () => {
  assert.match(css, /orientation: portrait/)
  assert.match(css, /max-width: 767px/)
  assert.match(css, /grid-template-areas: 'stage' 'dock' !important/)
  assert.match(css, /height: min\(42dvh, 360px\) !important/)
  assert.match(workspace, /pastoral-sheet-handle/)
})

test('celular horizontal usa rail y panel overlay sin comprimir permanentemente el lienzo', () => {
  assert.match(css, /orientation: landscape/)
  assert.match(css, /grid-template-areas:'dock stage' !important/)
  assert.match(css, /grid-template-columns: 52px minmax\(0,1fr\) !important/)
  assert.match(css, /width:min\(290px,45vw\) !important/)
})

test('iPad y escritorio usan páginas lienzo inspector y dock inferior', () => {
  assert.match(css, /min-width: 768px/)
  assert.match(css, /grid-template-areas:'stage panel' 'dock dock' !important/)
  assert.match(css, /grid-template-areas:'pages canvas' !important/)
  assert.match(css, /grid-template-columns:minmax\(0,1fr\) 300px !important/)
})

test('dock principal incluye creación página y capas sin párrafo redundante', () => {
  for (const label of ['Plantillas', 'Elementos', 'Texto', 'Biblia', 'Fondo', 'Diseño', 'Capas']) assert.match(workspace, new RegExp(`label: '${label}'`))
  assert.doesNotMatch(workspace.match(/const HERRAMIENTAS:[\s\S]*?\n\]/)?.[0] ?? '', /label: 'Párrafo'/)
})

test('plantillas ofrecen familias cristianas minimalistas y generales sin depender de imágenes remotas', () => {
  for (const categoria of ['Cristianas', 'Minimalistas', 'Generales']) assert.match(workspace, new RegExp(categoria))
  for (const nombre of ['Predicación limpia', 'Versículo protagonista', 'Serie dominical', 'Oración serena', 'Minimal claro', 'Minimal oscuro', 'Mensaje central', 'Anuncio simple']) assert.match(workspace, new RegExp(nombre))
  assert.match(workspace, /const aplicarPlantilla =/)
  assert.match(workspace, /registrarHistorial\(\)/)
  assert.match(workspace, /elementos: siguientes/)
})

test('shell v3 conserva edición completa y reutiliza presentación congregación y compartir', () => {
  assert.match(workspace, /onDeleteElement=\{eliminarElemento\}/)
  assert.match(workspace, /onPatchElement=\{patchElementoSinHistorial\}/)
  assert.match(workspace, /editarPaquetePastoral/)
  assert.match(workspace, /vista === 'presentacion'/)
  assert.match(workspace, /vista === 'congregacion'/)
  assert.match(workspace, /PackageDistributionControls/)
  assert.match(workspace, /requestFullscreen/)
  assert.match(workspace, /window\.print\(\)/)
})
