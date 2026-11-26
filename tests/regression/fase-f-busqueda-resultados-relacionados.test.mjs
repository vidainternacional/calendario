import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const action = fs.readFileSync('app/actions/estudio-interno.ts', 'utf8')

test('Centro de Estudio no sustituye la consulta por los temas relacionados', () => {
  assert.doesNotMatch(action, /resolverConcordanciasSugeridas/)
  assert.match(action, /status: 'suggestions', query, suggestions: assistedTopic.suggestions, suggestionKind: 'related'/)
  assert.ok(action.indexOf('await buscarTextoBiblico(query)') < action.indexOf('await asistirTemaBiblico(query)'))
})

test('Centro de Estudio no vuelve a recomendar referencias internas genéricas cuando no entiende un tema', () => {
  assert.doesNotMatch(action, /referenciasInternasDisponibles/)
  assert.doesNotMatch(action, /Pruebe con otra forma de escribirlo o con/)
  assert.match(action, /No encontramos un tema aprobado suficientemente relacionado/)
})
