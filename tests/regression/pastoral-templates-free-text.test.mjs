import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')

test('las plantillas aplican estilo al texto existente sin reemplazar contenido imágenes ni geometría', () => {
  const inicioFuncion = workspace.indexOf('const aplicarPlantilla =')
  const inicio = workspace.indexOf('if (tieneTextoUsuario) {', inicioFuncion)
  const fin = workspace.indexOf('const imagenesActuales =', inicio)
  const bloqueFuncion = workspace.slice(inicioFuncion, fin)
  const ramaTextoUsuario = workspace.slice(inicio, fin)

  assert.match(bloqueFuncion, /registrarHistorial\(\)/)
  assert.match(ramaTextoUsuario, /const sinMuestras = actuales\.filter\(\(item\) => item\.tipo === 'imagen' \|\| !esTextoMuestraPlantilla\(item\)\)/)
  assert.match(ramaTextoUsuario, /if \(elemento\.tipo === 'imagen'\) return elemento/)
  assert.doesNotMatch(ramaTextoUsuario, /x: layout\.x/)
  assert.doesNotMatch(ramaTextoUsuario, /y: layout\.y/)
  assert.doesNotMatch(ramaTextoUsuario, /w: layout\.w/)
  assert.doesNotMatch(ramaTextoUsuario, /h: layout\.h/)
  assert.match(ramaTextoUsuario, /tamano_fuente: tamanoPlantillaCanvas\(layout\.pt\)/)
  assert.match(ramaTextoUsuario, /alineacion: layout\.alineacion/)
  assert.match(ramaTextoUsuario, /fuente: layout\.fuente/)
  assert.match(ramaTextoUsuario, /color: plantilla\.colorTexto/)
  assert.match(ramaTextoUsuario, /fondo: plantilla\.fondo/)
  assert.match(ramaTextoUsuario, /color_texto: plantilla\.colorTexto/)
  assert.match(workspace, /const tamanoPlantillaCanvas = \(pt: number\) => Math\.max\(10, Math\.round\(pt \* \.75\)\)/)
})
