import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const explorer = fs.readFileSync('components/hebreo/NiqqudExplorer.tsx', 'utf8')
const rules = fs.readFileSync('components/hebreo/NiqqudReadingRules.tsx', 'utf8')
const master = fs.readFileSync('__VIDA_INTERNACIONAL.md', 'utf8')

test('FASE H: Vocales integra reglas avanzadas sin sustituir las vistas aprobadas', () => {
  assert.match(explorer, /import NiqqudReadingRules from '\.\/NiqqudReadingRules'/)
  assert.match(explorer, /<NiqqudReadingRules \/>/)
  for (const label of ['Tarjetas', 'Lista', 'Detalle']) assert.match(explorer, new RegExp(label))
})

test('FASE H: sheva diferencia función vocal y silenciosa con cautela', () => {
  assert.match(rules, /Sheva vocal/)
  assert.match(rules, /Sheva silencioso/)
  assert.match(rules, /בְּרֵאשִׁית/)
  assert.match(rules, /מַלְכָּה/)
  assert.match(rules, /no convertirá una regla inicial en una fórmula absoluta/)
})

test('FASE H: qamats qatan queda separado del qamats común', () => {
  assert.match(rules, /Qamats común/)
  assert.match(rules, /Qamats qatan/)
  assert.match(rules, /כָּל/)
  assert.match(rules, /kol/)
  assert.match(rules, /No se debe convertir todo qamats en a de forma automática/)
})

test('FASE H: pataj furtivo enseña pronunciación anticipada', () => {
  assert.match(rules, /Pataj furtivo/)
  assert.match(rules, /רוּחַ/)
  assert.match(rules, /la vocal se anticipa en la pronunciación/)
})

test('FASE H: lectura silábica progresa de consonante a palabra sin niqqud', () => {
  for (const step of ['1 · consonante', '2 · consonante + vocal', '3 · otra sílaba', '4 · palabra', '5 · sin ayudas']) assert.match(rules, new RegExp(step.replace('+', '\\+')))
  assert.match(rules, /מֶלֶךְ/)
  assert.match(rules, /מלך/)
})

test('FASE H: Bloque 2 autoriza niqqud avanzado y prohíbe audio no aprobado', () => {
  assert.match(master, /sheva vocal\/silencioso, qamats qatan, pataj furtivo/)
  assert.match(master, /No incorporar audio como pronunciación oficial/)
  assert.doesNotMatch(rules, /speechSynthesis|new Audio|supabase|localStorage/)
})
