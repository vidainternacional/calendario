import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')

test('Plantillas aplican estilo con escala inicial segura sin alterar geometría aprobada del texto existente', () => {
  const plantilla = workspace.slice(workspace.indexOf('const aplicarPlantilla'), workspace.indexOf('const nuevaPagina'))
  const rama = plantilla.slice(plantilla.indexOf('if (tieneTextoUsuario)'), plantilla.indexOf('const imagenesActuales'))
  assert.match(workspace, /const tamanoPlantillaCanvas = \(pt: number\) => Math\.max\(10, Math\.round\(pt \* \.75\)\)/)
  assert.match(rama, /tamano_fuente: tamanoPlantillaCanvas\(layout\.pt\)/)
  assert.match(rama, /alineacion: layout\.alineacion/)
  assert.match(rama, /fuente: layout\.fuente/)
  assert.match(rama, /color: plantilla\.colorTexto/)
  assert.doesNotMatch(rama, /x: layout\.x|y: layout\.y|w: layout\.w|h: layout\.h/)
  const muestras = plantilla.slice(plantilla.indexOf('const crearMuestra'), plantilla.indexOf('const siguientes'))
  assert.match(muestras, /tamano_fuente: tamanoPlantillaCanvas\(layout\.pt\)/)
})

test('imagen seleccionada no muestra Mover y el lienzo completo admite pellizco', () => {
  assert.match(canvas, /\{elemento\.tipo !== 'imagen' && <div[\s\S]*aria-label="Mover elemento"/)
  assert.match(canvas, /const iniciarInteraccionLienzo =/)
  assert.match(canvas, /const imagenSeleccionadaEditable = Boolean/)
  assert.match(canvas, /onPointerDown=\{iniciarInteraccionLienzo\}/)
  assert.match(canvas, /imagenSeleccionadaEditable \? 'touch-none' : 'touch-pan-y'/)
  assert.match(canvas, /activarPellizcoImagen\(elemento\)/)
  assert.match(canvas, /aria-label="Redimensionar elemento"/)
})

test('Capas limpia desplazamientos antes de reordenar en el mismo cierre del gesto', () => {
  const inicio = workspace.indexOf('const terminarArrastreCapa =')
  const fin = workspace.indexOf('const cancelarArrastreCapa =', inicio)
  const terminar = workspace.slice(inicio, fin)
  assert.ok(terminar.indexOf('limpiarEstiloArrastre(arrastre)') < terminar.indexOf('fijarOrdenCapaSinHistorial(id, arrastre.indiceDestino)'))
  assert.doesNotMatch(terminar, /requestAnimationFrame/)
})
