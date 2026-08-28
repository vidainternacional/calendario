import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')

test('las plantillas aplican tipografía también al texto libre sin mover ni reemplazar contenido', () => {
  const inicio = workspace.indexOf('const aplicarPlantilla =')
  const fin = workspace.indexOf('const nuevaPagina =', inicio)
  const bloque = workspace.slice(inicio, fin)

  assert.match(bloque, /elemento\.rol === 'libre' \? \(plantilla\.cuerpo \?\? plantilla\.subtitulo \?\? plantilla\.titulo\)/)
  assert.match(bloque, /return layout \? \{ \.\.\.elemento, fuente: layout\.fuente \} : elemento/)
  assert.doesNotMatch(bloque, /x: layout\.x|y: layout\.y|w: layout\.w|h: layout\.h/)
  assert.match(bloque, /patchPaginaSinHistorial\(\{ elementos \}\)/)
})
