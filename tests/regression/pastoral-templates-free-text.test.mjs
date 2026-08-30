import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')

test('las plantillas conservan contenido e imágenes y aplican composición segura al texto existente', () => {
  const inicioFuncion = workspace.indexOf('const aplicarPlantilla =')
  const inicio = workspace.indexOf('if (tieneTextoUsuario) {', inicioFuncion)
  const fin = workspace.indexOf('const imagenesActuales =', inicio)
  const bloqueFuncion = workspace.slice(inicioFuncion, fin)
  const ramaTextoUsuario = workspace.slice(inicio, fin)

  assert.match(bloqueFuncion, /registrarHistorial\(\)/)
  assert.match(ramaTextoUsuario, /const sinMuestras = actuales\.filter\(\(item\) => item\.tipo === 'imagen' \|\| !esTextoMuestraPlantilla\(item\)\)/)
  assert.match(ramaTextoUsuario, /if \(elemento\.tipo === 'imagen'\) return elemento/)
  assert.match(ramaTextoUsuario, /const x = clamp\(layout\.x, 0, 95\)/)
  assert.match(ramaTextoUsuario, /const y = clamp\(layout\.y, 0, 95\)/)
  assert.match(ramaTextoUsuario, /w: clamp\(layout\.w, 5, 100 - x\)/)
  assert.match(ramaTextoUsuario, /h: clamp\(layout\.h, 5, 100 - y\)/)
  assert.match(ramaTextoUsuario, /tamano_fuente: tamanoPlantillaCanvas\(layout\.pt\)/)
  assert.match(ramaTextoUsuario, /alineacion: layout\.alineacion/)
  assert.match(ramaTextoUsuario, /fuente: layout\.fuente/)
  assert.match(ramaTextoUsuario, /color: plantilla\.colorTexto/)
  assert.match(ramaTextoUsuario, /fondo: plantilla\.fondo/)
  assert.match(ramaTextoUsuario, /color_texto: plantilla\.colorTexto/)
  assert.doesNotMatch(ramaTextoUsuario, /contenido: textoMuestraPlantilla/)
  assert.doesNotMatch(ramaTextoUsuario, /\?\? layoutsDisponibles\[layoutsDisponibles\.length - 1\]/)
  assert.match(workspace, /const tamanoPlantillaCanvas = \(pt: number\) => Math\.max\(9, Math\.round\(pt \* \.56\)\)/)
})