import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')

test('una imagen se puede mover desde cualquier punto sin crear historial con un toque simple', () => {
  const inicioInteraccion = canvas.indexOf('const iniciarInteraccionImagen =')
  const finInteraccion = canvas.indexOf('const moverGesto =', inicioInteraccion)
  const interaccion = canvas.slice(inicioInteraccion, finInteraccion)
  const inicioMover = finInteraccion
  const finMover = canvas.indexOf('const terminarGesto =', inicioMover)
  const mover = canvas.slice(inicioMover, finMover)

  assert.match(interaccion, /elemento\.tipo !== 'imagen'/)
  assert.match(interaccion, /elemento\.bloqueado/)
  assert.match(interaccion, /arrastreImagenPendienteRef\.current =/)
  assert.match(mover, /distancia < 4/)
  assert.match(mover, /onBeginChange\?\.\(\)/)
  assert.match(mover, /tipo: 'mover'/)
  assert.match(mover, /100 - siguiente\.w/)
  assert.match(mover, /100 - siguiente\.h/)
})

test('la imagen editable no muestra Mover, conserva tirador y admite pellizco proporcional', () => {
  assert.match(canvas, /elemento\.tipo === 'imagen' && editable && !bloqueado\) \{ iniciarInteraccionImagen\(event, elemento\); return \}/)
  assert.match(canvas, /editable && elemento\.tipo === 'imagen' && !bloqueado \? 'touch-none'/)
  assert.match(canvas, /\{elemento\.tipo !== 'imagen' && <div[\s\S]*aria-label="Mover elemento"/)
  assert.match(canvas, /aria-label="Redimensionar elemento"/)
  assert.match(canvas, /const pellizcoImagenRef = useRef<PellizcoImagen \| null>/)
  assert.match(canvas, /punteros\.length >= 2/)
  assert.match(canvas, /Math\.hypot\(a\.x - b\.x, a\.y - b\.y\) \/ pellizco\.distancia/)
  assert.match(canvas, /let h = w \* \(pellizco\.h \/ Math\.max\(pellizco\.w, \.01\)\)/)
})
