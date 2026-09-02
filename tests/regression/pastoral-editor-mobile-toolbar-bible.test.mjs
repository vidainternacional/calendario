import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const runtime = fs.readFileSync('components/pastoral/PastoralEditorRuntimeEnhancements.tsx', 'utf8')
const picker = fs.readFileSync('components/pastoral/PastoralVersePicker.tsx', 'utf8')

test('formato y colores permanecen juntos sobre el teclado con colores debajo de las herramientas', () => {
  assert.match(runtime, /const viewport = window\.visualViewport/)
  assert.match(runtime, /const tecladoVisible = Boolean\(viewport && insetTeclado > 100\)/)
  assert.match(runtime, /const seccion = document\.querySelector<HTMLElement>\('\.pastoral-editor-v4 \.panel-texto \[data-pastoral-format-section="true"\]'\)/)
  assert.match(runtime, /seccion\.style\.position = 'fixed'/)
  assert.match(runtime, /viewport\.offsetTop \+ viewport\.height - alto - 6/)
  assert.match(runtime, /carril\.style\.overflowX = 'auto'/)
  assert.match(runtime, /carril\.style\.overflowY = 'hidden'/)
  assert.doesNotMatch(runtime, /carril\.style\.position = 'fixed'/)
  assert.match(runtime, /window\.visualViewport\?\.addEventListener\('resize', sincronizar\)/)
  assert.match(runtime, /window\.visualViewport\?\.addEventListener\('scroll', sincronizar\)/)
})

test('Editar Presentar y Congregación permanecen como vistas directas visibles', () => {
  assert.match(runtime, /function unificarVistaPresentacion\(\)/)
  assert.match(runtime, /congregacion\.hidden = false/)
  assert.match(runtime, /congregacion\.style\.removeProperty\('display'\)/)
  assert.match(runtime, /grid-template-columns', '54px 80px 92px minmax\(0, 1fr\)'/)
  assert.doesNotMatch(runtime, /summary\.textContent = 'Vista ⌄'/)
  assert.doesNotMatch(runtime, /crearOpcion\('Congregación'\)/)
})

test('el número de página queda interactivo pero sin píldora visual', () => {
  assert.match(runtime, /select\[aria-label\^="Página "\]/)
  assert.match(runtime, /selectorPagina\.style\.border = '0'/)
  assert.match(runtime, /selectorPagina\.style\.background = 'transparent'/)
  assert.match(runtime, /selectorPagina\.style\.setProperty\('-webkit-appearance', 'none'\)/)
  assert.match(runtime, /button\[aria-label="Nueva página"\]/)
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
  assert.ok(fila.indexOf('min-w-0 flex-1') < fila.indexOf('ml-auto grid h-7 w-7'))
  assert.match(fila, /ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-full border-2/)
  assert.match(fila, /border-emerald-600 bg-emerald-600 text-white/)
  assert.match(fila, /\{\(activo \|\| agregado\) && <Check className="h-4 w-4" strokeWidth=\{3\} \/>\}/)
})
