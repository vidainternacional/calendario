import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const display = fs.readFileSync('lib/hebreo/learning-display.ts', 'utf8')
const route = fs.readFileSync('app/api/estudios/hebreo/palabras/route.ts', 'utf8')

test('FASE H bloque 3: una coincidencia contextual no se presenta como traducción', () => {
  assert.match(display, /CONTEXTUAL_LABEL/)
  assert.match(display, /spanish: contextualLabel \? null : item\.spanish/)
  assert.match(display, /meaningNoteEs: contextualNote \? null : item\.meaningNoteEs/)
  assert.match(display, /La búsqueda contextual sirve para descubrir una entrada, no para definirla/)
})

test('FASE H bloque 3: la limpieza pedagógica ocurre después de glosas y ambigüedad', () => {
  assert.match(route, /limpiarPresentacionPedagogica/)
  assert.ok(route.indexOf('enriquecerCatalogoConGlosasEspanolas') < route.lastIndexOf('limpiarPresentacionPedagogica'))
  assert.ok(route.indexOf('priorizarAmbiguedadHebrea') < route.lastIndexOf('limpiarPresentacionPedagogica'))
})
