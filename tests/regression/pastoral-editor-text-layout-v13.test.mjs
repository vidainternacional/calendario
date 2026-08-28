import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')

test('Plantillas aplican estilo sin alterar geometría aprobada del texto existente', () => {
  const plantilla = workspace.slice(workspace.indexOf('const aplicarPlantilla'), workspace.indexOf('const nuevaPagina'))
  const rama = plantilla.slice(plantilla.indexOf('if (tieneTextoUsuario)'), plantilla.indexOf('const imagenesActuales'))
  assert.match(rama, /tamano_fuente: layout\.pt/)
  assert.match(rama, /alineacion: layout\.alineacion/)
  assert.match(rama, /fuente: layout\.fuente/)
  assert.match(rama, /color: plantilla\.colorTexto/)
  assert.doesNotMatch(rama, /x: layout\.x|y: layout\.y|w: layout\.w|h: layout\.h/)
})

test('imagen seleccionada no muestra Mover y conserva pellizco y tirador', () => {
  assert.match(canvas, /\{elemento\.tipo !== 'imagen' && <div[\s\S]*aria-label="Mover elemento"/)
  assert.match(canvas, /pellizcoImagenRef/)
  assert.match(canvas, /aria-label="Redimensionar elemento"/)
})
