import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')

test('una imagen se puede mover desde cualquier punto sin crear historial con un toque simple', () => {
  const inicioInteraccion = canvas.indexOf('const iniciarInteraccionImagen =')
  const finInteraccion = canvas.indexOf('const iniciarInteraccionLienzo =', inicioInteraccion)
  const interaccion = canvas.slice(inicioInteraccion, finInteraccion)
  const inicioMover = canvas.indexOf('const moverGesto =', finInteraccion)
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

test('la imagen editable no muestra Mover, conserva tirador y admite pellizco proporcional desde cualquier punto del lienzo', () => {
  assert.match(canvas, /elemento\.tipo === 'imagen' && editable && !bloqueado\) \{ iniciarInteraccionImagen\(event, elemento\); return \}/)
  assert.match(canvas, /editable && elemento\.tipo === 'imagen' && !bloqueado \? 'touch-none'/)
  assert.match(canvas, /\{elemento\.tipo !== 'imagen' && <div[\s\S]*aria-label="Mover elemento"/)
  assert.match(canvas, /aria-label="Redimensionar elemento"/)
  assert.match(canvas, /const pellizcoImagenRef = useRef<PellizcoImagen \| null>/)
  assert.match(canvas, /const toqueLienzoImagenRef = useRef<number \| null>/)
  assert.match(canvas, /const activarPellizcoImagen =/)
  assert.match(canvas, /punteros\.length < 2/)
  assert.match(canvas, /const iniciarInteraccionLienzo =/)
  assert.match(canvas, /punterosImagenRef\.current\.set\(event\.pointerId, \{ id: elemento\.id, x: event\.clientX, y: event\.clientY \}\)/)
  assert.match(canvas, /onPointerDown=\{iniciarInteraccionLienzo\}/)
  assert.match(canvas, /imagenSeleccionadaEditable \? 'touch-none' : 'touch-pan-y'/)
  assert.match(canvas, /Math\.hypot\(a\.x - b\.x, a\.y - b\.y\) \/ pellizco\.distancia/)
  assert.match(canvas, /let h = w \* \(pellizco\.h \/ Math\.max\(pellizco\.w, \.01\)\)/)
})

test('un toque simple fuera de la imagen conserva la capacidad de deseleccionar', () => {
  const inicio = canvas.indexOf('const terminarGesto =')
  const fin = canvas.indexOf('const estiloLienzo', inicio)
  const terminar = canvas.slice(inicio, fin)
  assert.match(terminar, /eraToqueLienzo && !eraPellizco/)
  assert.match(terminar, /onSelect\?\.\(null\)/)
})
