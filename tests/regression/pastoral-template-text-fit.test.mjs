import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')

test('texto jerárquico se reduce según su caja real sin salir del canvas', () => {
  assert.match(canvas, /const debeEncajar = elemento\.rol !== 'libre'/)
  assert.match(canvas, /for \(let candidato = preferido; candidato >= 8; candidato -= 1\)/)
  assert.match(canvas, /editor\.scrollWidth <= caja\.clientWidth \+ 1/)
  assert.match(canvas, /editor\.scrollHeight <= caja\.clientHeight \+ 1/)
  assert.match(canvas, /new ResizeObserver\(programarEncaje\)/)
})

test('formatos parciales nunca pueden superar el tamaño final que cabe en la plantilla', () => {
  assert.match(canvas, /const sizeAplicado = Math\.min\(size, limite\)/)
  assert.match(canvas, /aplicarAtributosInlineVida\(editor, baseWidth, limitarInline \? tamano : undefined\)/)
})
