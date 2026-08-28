import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')

test('las plantillas aplican composición completa al texto existente sin reemplazar contenido ni imágenes', () => {
  const inicioFuncion = workspace.indexOf('const aplicarPlantilla =')
  const inicio = workspace.indexOf('if (tieneTextoUsuario) {', inicioFuncion)
  const fin = workspace.indexOf('const imagenesActuales =', inicio)
  const ramaTextoUsuario = workspace.slice(inicio, fin)

  assert.match(ramaTextoUsuario, /const sinMuestras = actuales\.filter\(\(item\) => item\.tipo === 'imagen' \|\| !esTextoMuestraPlantilla\(item\)\)/)
  assert.match(ramaTextoUsuario, /if \(elemento\.tipo === 'imagen'\) return elemento/)
  assert.match(ramaTextoUsuario, /x: layout\.x/)
  assert.match(ramaTextoUsuario, /y: layout\.y/)
  assert.match(ramaTextoUsuario, /w: layout\.w/)
  assert.match(ramaTextoUsuario, /h: layout\.h/)
  assert.match(ramaTextoUsuario, /tamano_fuente: layout\.pt/)
  assert.match(ramaTextoUsuario, /alineacion: layout\.alineacion/)
  assert.match(ramaTextoUsuario, /fuente: layout\.fuente/)
  assert.match(ramaTextoUsuario, /color: plantilla\.colorTexto/)
  assert.match(ramaTextoUsuario, /fondo: plantilla\.fondo/)
  assert.match(ramaTextoUsuario, /color_texto: plantilla\.colorTexto/)
  assert.match(ramaTextoUsuario, /registrarHistorial\(\)/)
})
