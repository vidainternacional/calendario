import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

import {
  normalizeBiblicalSearchQuery,
  scoreBiblicalSearchCandidate,
} from '../../lib/estudios/biblical-search-ranking.ts'
import { relatedApprovedThemeLabels } from '../../lib/estudios/biblical-search-relations.ts'

const assist = fs.readFileSync('lib/estudios/biblical-search-assist.ts', 'utf8')
const router = fs.readFileSync('lib/ai/vida-ai.ts', 'utf8')
const action = fs.readFileSync('app/actions/estudio-interno.ts', 'utf8')
const deepLink = fs.readFileSync('components/biblia/BibliaDeepLinkNavigation.tsx', 'utf8')

function score(query, values) {
  return scoreBiblicalSearchCandidate(query, values)
}

test('Centro de Estudio normaliza acentos, mayúsculas, puntuación y conserva referencias', () => {
  assert.equal(normalizeBiblicalSearchQuery('PERDÓN'), 'perdon')
  assert.equal(normalizeBiblicalSearchQuery('¿Amor de Dios?'), 'amor de dios')
  assert.equal(normalizeBiblicalSearchQuery('Juan 3:16'), 'juan 3 16')
})

test('Centro de Estudio relaciona formas léxicas y preguntas naturales sin depender de etiqueta literal', () => {
  assert.ok(score('amor de Dios', ['Amor', 'amor de Dios']) >= 0.9)
  assert.ok(score('versículos sobre perdonar', ['Perdón', 'perdonar']) >= 0.82)
  assert.ok(score('perdonando a alguien', ['Perdón', 'perdonar']) >= 0.75)
  assert.ok(score('qué hacer cuando tengo miedo', ['Miedo y valentía', 'miedo', 'temor']) >= 0.82)
  assert.ok(score('TEMÓR', ['Miedo y valentía', 'temor']) >= 0.9)
})

test('Centro de Estudio tolera errores ortográficos razonables', () => {
  assert.ok(score('perodnar', ['perdonar']) >= 0.62)
  assert.ok(score('ansiedaad', ['ansiedad']) >= 0.62)
})

test('Odio/odiar y otros conceptos sin concordancia propia producen temas aprobados relacionados, no referencias inventadas', () => {
  const odio = relatedApprovedThemeLabels('Odio')
  const pregunta = relatedApprovedThemeLabels('¿Qué dice la Biblia sobre odiar a alguien?')
  assert.deepEqual(odio.slice(0, 3), ['Amor', 'Perdón', 'Paz'])
  assert.deepEqual(pregunta.slice(0, 3), ['Amor', 'Perdón', 'Paz'])
  assert.ok(relatedApprovedThemeLabels('estoy muy triste').includes('Esperanza'))
  assert.deepEqual(relatedApprovedThemeLabels('zxqv inexistente 999'), [])
})

test('Nivel 1 solo interpreta hacia temas aprobados y un fallo de proveedor mantiene fallback determinístico', () => {
  assert.match(router, /'interpretar_busqueda_biblica'/)
  assert.match(router, /maxInputChars: 5_000/)
  assert.match(router, /maxOutputTokens: 240/)
  assert.match(assist, /temas_aprobados/)
  assert.match(assist, /No cites ni inventes versículos/)
  assert.match(assist, /allowed\.get\(normalizeBiblicalSearchQuery/)
  assert.match(assist, /if \(error instanceof VidaAiError\) return null/)
  assert.match(assist, /relatedApprovedThemeLabels\(query\)/)
})

test('La navegación de concordancias conserva libro, capítulo y versículo exactos', () => {
  assert.match(deepLink, /params\.get\('book'\)/)
  assert.match(deepLink, /params\.get\('chapter'\)/)
  assert.match(deepLink, /params\.get\('verse'\)/)
  assert.match(deepLink, /dispararCambio\(verseSelect, String\(verse\)\)/)
  assert.match(action, /buscarConcordanciasBiblicas\(query, 80\)/)
})
