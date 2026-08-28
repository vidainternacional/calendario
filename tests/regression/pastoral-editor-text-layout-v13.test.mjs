import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')

test('Plantillas aplican composición con escala moderada y límites seguros al texto existente', () => {
  const plantilla = workspace.slice(workspace.indexOf('const aplicarPlantilla'), workspace.indexOf('const nuevaPagina'))
  const rama = plantilla.slice(plantilla.indexOf('if (tieneTextoUsuario)'), plantilla.indexOf('const imagenesActuales'))
  assert.match(workspace, /const tamanoPlantillaCanvas = \(pt: number\) => Math\.max\(9, Math\.round\(pt \* \.56\)\)/)
  assert.match(rama, /const x = clamp\(layout\.x, 0, 95\)/)
  assert.match(rama, /const y = clamp\(layout\.y, 0, 95\)/)
  assert.match(rama, /w: clamp\(layout\.w, 5, 100 - x\)/)
  assert.match(rama, /h: clamp\(layout\.h, 5, 100 - y\)/)
  assert.match(rama, /tamano_fuente: tamanoPlantillaCanvas\(layout\.pt\)/)
  assert.match(rama, /alineacion: layout\.alineacion/)
  assert.match(rama, /fuente: layout\.fuente/)
  assert.match(rama, /color: plantilla\.colorTexto/)
  assert.doesNotMatch(rama, /\?\? layoutsDisponibles\[layoutsDisponibles\.length - 1\]/)
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

test('Capas limita el arrastre visible y limpia desplazamientos antes de reordenar', () => {
  const inicioMover = workspace.indexOf('const moverArrastreCapa =')
  const inicioTerminar = workspace.indexOf('const terminarArrastreCapa =', inicioMover)
  const mover = workspace.slice(inicioMover, inicioTerminar)
  assert.match(mover, /const deltaMinimo = -arrastre\.indiceOrigen \* arrastre\.altoFila/)
  assert.match(mover, /const deltaMaximo = \(arrastre\.ordenIds\.length - 1 - arrastre\.indiceOrigen\) \* arrastre\.altoFila/)
  assert.match(mover, /const delta = Math\.max\(deltaMinimo, Math\.min\(deltaMaximo, deltaLibre\)\)/)
  const fin = workspace.indexOf('const cancelarArrastreCapa =', inicioTerminar)
  const terminar = workspace.slice(inicioTerminar, fin)
  assert.ok(terminar.indexOf('limpiarEstiloArrastre(arrastre)') < terminar.indexOf('fijarOrdenCapaSinHistorial(id, arrastre.indiceDestino)'))
  assert.doesNotMatch(terminar, /requestAnimationFrame/)
})