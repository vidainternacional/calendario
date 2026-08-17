import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const action = fs.readFileSync('app/actions/estudio-interno.ts', 'utf8')

test('Centro de Estudio convierte temas relacionados aprobados en concordancias reales antes de sugerir', () => {
  assert.match(action, /resolverConcordanciasSugeridas/)
  assert.match(action, /suggestions\.slice\(0, 4\)\.map\(suggestion => buscarConcordanciasBiblicas\(suggestion\.query, 80\)\)/)
  assert.match(action, /if \(related\.results\.length > 0\)/)
  assert.match(action, /interpretedAs: related\.labels\.join\(', '\)/)
})

test('Centro de Estudio no vuelve a recomendar referencias internas genéricas cuando no entiende un tema', () => {
  assert.doesNotMatch(action, /referenciasInternasDisponibles/)
  assert.doesNotMatch(action, /Pruebe con otra forma de escribirlo o con/)
  assert.match(action, /No encontramos un tema aprobado suficientemente relacionado/)
})
