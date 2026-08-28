import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')

test('una imagen se puede mover desde cualquier punto sin crear historial con un toque simple', () => {
  const inicioPreparar = canvas.indexOf('const prepararArrastreImagen =')
  const finPreparar = canvas.indexOf('const moverGesto =', inicioPreparar)
  const preparar = canvas.slice(inicioPreparar, finPreparar)
  const inicioMover = finPreparar
  const finMover = canvas.indexOf('const terminarGesto =', inicioMover)
  const mover = canvas.slice(inicioMover, finMover)

  assert.match(preparar, /elemento\.tipo !== 'imagen'/)
  assert.match(preparar, /elemento\.bloqueado/)
  assert.match(preparar, /arrastreImagenPendienteRef\.current =/)
  assert.doesNotMatch(preparar, /onBeginChange\?\.\(\)/)
  assert.match(mover, /distancia < 4/)
  assert.match(mover, /onBeginChange\?\.\(\)/)
  assert.match(mover, /tipo: 'mover'/)
  assert.match(mover, /100 - siguiente\.w/)
  assert.match(mover, /100 - siguiente\.h/)
})

test('solo las imágenes editables activan el arrastre directo y el redimensionado conserva su tirador', () => {
  assert.match(canvas, /elemento\.tipo === 'imagen' && editable && !bloqueado\) \{ prepararArrastreImagen\(event, elemento\); return \}/)
  assert.match(canvas, /editable && elemento\.tipo === 'imagen' && !bloqueado \? 'touch-none'/)
  assert.match(canvas, /aria-label="Redimensionar elemento"/)
  assert.match(canvas, /aria-label="Mover elemento"/)
})
