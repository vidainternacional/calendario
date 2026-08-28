import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')

test('las plantillas aplican tipografía también al texto libre sin mover ni reemplazar contenido', () => {
  const inicioFuncion = workspace.indexOf('const aplicarPlantilla =')
  const inicio = workspace.indexOf('if (tieneTextoUsuario) {', inicioFuncion)
  const fin = workspace.indexOf('const imagenesActuales =', inicio)
  const ramaTextoUsuario = workspace.slice(inicio, fin)

  assert.match(ramaTextoUsuario, /elemento\.rol === 'libre' \? \(plantilla\.cuerpo \?\? plantilla\.subtitulo \?\? plantilla\.titulo\)/)
  assert.match(ramaTextoUsuario, /return layout \? \{ \.\.\.elemento, fuente: layout\.fuente \} : elemento/)
  assert.doesNotMatch(ramaTextoUsuario, /x: layout\.x|y: layout\.y|w: layout\.w|h: layout\.h/)
  assert.match(ramaTextoUsuario, /patchPaginaSinHistorial\(\{ elementos \}\)/)
})
