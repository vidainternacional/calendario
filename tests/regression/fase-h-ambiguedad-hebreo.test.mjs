import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const ambiguity = fs.readFileSync('lib/hebreo/hebrew-ambiguity.ts', 'utf8')
const route = fs.readFileSync('app/api/estudios/hebreo/palabras/route.ts', 'utf8')

test('FASE H bloque 3: homógrafos hebreos se priorizan sin ocultar alternativas', () => {
  assert.match(ambiguity, /consonantalForm/)
  assert.match(ambiguity, /candidates = page\.items\.filter/)
  assert.match(ambiguity, /Resultado principal/)
  assert.match(ambiguity, /Alternativa real/)
  assert.match(ambiguity, /items: \[\.\.\.annotated, \.\.\.page\.items\.filter/)
})

test('FASE H bloque 3: niqqud exacto tiene prioridad antes de frecuencia', () => {
  assert.match(ambiguity, /HEBREW_NIQQUD/)
  assert.match(ambiguity, /requestedPointing/)
  assert.match(ambiguity, /pointedForm\(a\.lemma\) === requestedPointing/)
  assert.match(ambiguity, /if \(aExact !== bExact\) return bExact - aExact/)
})

test('FASE H bloque 3: escritura sin niqqud usa frecuencia real del corpus aprobado', () => {
  assert.match(ambiguity, /from\('biblical_word_occurrences'\)/)
  assert.match(ambiguity, /count: 'exact', head: true/)
  assert.match(ambiguity, /\.eq\('enabled', true\)/)
  assert.match(ambiguity, /\.eq\('review_status', 'approved'\)/)
  assert.match(ambiguity, /frequencyDiff/)
})

test('FASE H bloque 3: ambigüedad es solo lectura y no fabrica raíces', () => {
  assert.doesNotMatch(ambiguity, /createServiceClient|\.insert\(|\.upsert\(|\.update\(|\.delete\(/)
  assert.match(ambiguity, /VIDA no infiere una raíz ni fusiona homógrafos distintos/)
})

test('FASE H bloque 3: API enriquece glosa y después ordena ambigüedad hebrea', () => {
  assert.match(route, /enriquecerCatalogoConGlosasEspanolas/)
  assert.match(route, /priorizarAmbiguedadHebrea/)
  assert.ok(route.indexOf('enriquecerCatalogoConGlosasEspanolas') < route.lastIndexOf('priorizarAmbiguedadHebrea'))
})
