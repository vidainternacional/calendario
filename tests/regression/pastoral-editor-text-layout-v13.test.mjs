import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const workspace = fs.readFileSync('components/pastoral/PastoralVisualWorkspaceV4.tsx', 'utf8')
const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')

test('Fondos cambian solo el fondo y conservan el texto existente', () => {
  const fondo = workspace.slice(workspace.indexOf('const aplicarPlantilla'), workspace.indexOf('const nuevaPagina'))
  assert.match(fondo, /registrarHistorial\(\)/)
  assert.match(fondo, /patchPaginaSinHistorial\(\{ plantilla: 'limpia', fondo_modo: 'color', fondo: plantilla\.fondo, fondo_recurso_id: null, recurso_id: null \}\)/)
  assert.match(fondo, /setSeleccion\(null\)/)
  assert.doesNotMatch(fondo, /elementos|tamano_fuente|contenido|textoMuestraPlantilla|layout\./)
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