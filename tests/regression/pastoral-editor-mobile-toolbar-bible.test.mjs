import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const runtime = fs.readFileSync('components/pastoral/PastoralEditorRuntimeEnhancements.tsx', 'utf8')
const picker = fs.readFileSync('components/pastoral/PastoralVersePicker.tsx', 'utf8')

test('la paleta de colores se fija dentro del visual viewport cuando aparece el teclado', () => {
  assert.match(runtime, /const viewport = window\.visualViewport/)
  assert.match(runtime, /const tecladoVisible = Boolean\(viewport && insetTeclado > 100\)/)
  assert.match(runtime, /carril\.style\.position = 'fixed'/)
  assert.match(runtime, /viewport\.offsetTop \+ viewport\.height - alto - 12/)
  assert.match(runtime, /carril\.style\.overflowX = 'auto'/)
  assert.match(runtime, /carril\.style\.overflowY = 'hidden'/)
  assert.match(runtime, /window\.visualViewport\?\.addEventListener\('resize', sincronizar\)/)
  assert.match(runtime, /window\.visualViewport\?\.addEventListener\('scroll', sincronizar\)/)
})

test('Presentar y Congregación quedan unificados bajo Vista sin perder sus acciones reales', () => {
  assert.match(runtime, /function unificarMenuPresentacion\(\)/)
  assert.match(runtime, /presentar\.hidden = true/)
  assert.match(runtime, /congregacion\.hidden = true/)
  assert.match(runtime, /summary\.textContent = 'Vista ⌄'/)
  assert.match(runtime, /crearOpcion\('Presentar'\)/)
  assert.match(runtime, /crearOpcion\('Congregación'\)/)
  assert.match(runtime, /candidatos\.find\(\(item\) => item\.textContent\?\.trim\(\) === label\)\?\.click\(\)/)
  assert.match(runtime, /nav\.style\.gridTemplateColumns = 'repeat\(3, minmax\(0, 1fr\)\)'/)
})

test('el selector bíblico mantiene abreviatura cerrada y muestra nombres completos en el menú nativo', () => {
  assert.match(picker, /\{etiquetaTraduccion\(traduccionActual\)\}/)
  assert.match(picker, /<option key=\{t\.id\} value=\{t\.id\}>\{t\.name\}<\/option>/)
  assert.doesNotMatch(picker, /<option key=\{t\.id\} value=\{t\.id\}>\{t\.shortName \|\| t\.name\}<\/option>/)
})

test('la selección múltiple aparece a la derecha y usa círculo verde con check', () => {
  const inicio = picker.indexOf("const activo = seleccionados.includes(v.verso)")
  const fin = picker.indexOf('</article>', inicio)
  const fila = picker.slice(inicio, fin)
  assert.ok(inicio >= 0 && fin > inicio)
  assert.ok(fila.indexOf('min-w-0 flex-1') < fila.indexOf('pastoral-verse-check'))
  assert.match(fila, /ml-auto shrink-0/)
  assert.match(fila, /backgroundColor: '#16a34a'/)
  assert.match(fila, /\{activo && <Check \/>\}/)
})
