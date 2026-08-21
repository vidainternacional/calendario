import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const alef = fs.readFileSync('components/hebreo/AlefBetExplorer.tsx', 'utf8')
const niqqud = fs.readFileSync('components/hebreo/NiqqudExplorer.tsx', 'utf8')
const words = fs.readFileSync('components/hebreo/ReadingWordsExplorer.tsx', 'utf8')
const reading = fs.readFileSync('components/hebreo/ReadingSentencesExplorer.tsx', 'utf8')
const grammar = fs.readFileSync('components/hebreo/GrammarExplorer.tsx', 'utf8')
const contract = fs.readFileSync('docs/FASE_H_CONTRATO_VISUAL_APP_HEBREO_2026-08-19.md', 'utf8')

test('FASE H visual: Alef-Bet usa letras grandes y ficha sin doble ring', () => {
  const list = alef.slice(alef.indexOf('function ListView'), alef.indexOf('function GroupExplanation'))
  assert.match(alef, /text-\[4\.85rem\]/)
  assert.match(alef, /h-\[430px\]/)
  assert.match(list, /min-w-\[650px\]/)
  assert.match(list, /text-\[3\.85rem\]/)
  assert.match(list, /-mx-4 overflow-x-auto/)
  assert.doesNotMatch(alef, /ring-1 ring-white/)
})

test('FASE H visual: Vocales muestra el signo aplicado y tabla de ancho útil', () => {
  const list = niqqud.slice(niqqud.indexOf('function ListView'), niqqud.indexOf('function DetailView'))
  assert.match(list, /\{mark\.example\}/)
  assert.doesNotMatch(list, /\{mark\.visibleSign\}/)
  assert.match(list, /min-w-\[620px\]/)
  assert.match(list, /text-\[3\.65rem\]/)
  assert.match(list, /-mx-4 overflow-x-auto/)
  assert.match(niqqud, /text-\[6\.1rem\]/)
})

test('FASE H visual: Básicas y Todas de niqqud son conjuntos distintos', () => {
  assert.equal((niqqud.match(/group: 'basic'/g) ?? []).length, 8)
  assert.equal((niqqud.match(/group: 'reduced'/g) ?? []).length, 3)
  assert.equal((niqqud.match(/group: 'sheva'/g) ?? []).length, 1)
  assert.match(niqqud, /ocho vocales completas/)
  assert.match(niqqud, /ocho básicas, tres reducidas y sheva/)
})

test('FASE H visual: Palabras prioriza hebreo grande en tarjetas lista y detalle', () => {
  assert.match(words, /text-\[3\.05rem\]/)
  assert.match(words, /text-\[2\.6rem\]/)
  assert.match(words, /text-\[5\.5rem\]/)
  const list = words.slice(words.indexOf('function ListView'), words.indexOf('function DetailView'))
  assert.match(list, /divide-y divide-slate-200 border-y/)
  assert.match(words, /snap-x snap-mandatory/)
})

test('FASE H visual: Lectura amplía hebreo en tarjetas lista y detalle', () => {
  assert.match(reading, /text-\[2\.45rem\]/)
  assert.match(reading, /text-\[2\.15rem\]/)
  assert.match(reading, /text-\[3\.15rem\]/)
  assert.match(reading, /-mx-4 divide-y divide-slate-200 border-y/)
})

test('FASE H visual: Reglas evita tabla comprimida y agranda formas hebreas', () => {
  assert.match(grammar, /min-w-\[760px\]/)
  assert.match(grammar, /-mx-4 border-y border-slate-200 bg-white/)
  assert.match(grammar, /text-\[3rem\]/)
  assert.match(grammar, /text-\[4\.8rem\]/)
  assert.match(grammar, /cellIndex === 0 \? 'text-\[2rem\]/)
})

test('FASE H visual: filtros de Reglas conservan Básicas y agregan Verbos sin mezclar categorías', () => {
  const rules = grammar.slice(grammar.indexOf('const RULES:'), grammar.indexOf('const TABLES:'))
  assert.equal((rules.match(/group: 'base'/g) ?? []).length, 2)
  assert.equal((rules.match(/group: 'prefixes'/g) ?? []).length, 3)
  assert.equal((rules.match(/group: 'nouns'/g) ?? []).length, 2)
  assert.equal((rules.match(/group: 'verbs'/g) ?? []).length, 8)
  assert.equal((rules.match(/group: 'phrase'/g) ?? []).length, 2)
  assert.equal((rules.match(/\{ id: '/g) ?? []).length, 17)
  assert.match(grammar, /\{ id: 'verbs', label: 'Verbos' \}/)
  assert.match(grammar, /group === 'all' \? RULES : RULES\.filter/)
  assert.match(grammar, /\$\{filtered\.length\} de \$\{RULES\.length\} reglas/)
})

test('FASE H gramática: posesivos y Qal usan transformaciones verificables y cautelas temporales', () => {
  for (const marker of [
    "id: 'possessive-transformations'",
    "id: 'qal-map'",
    "id: 'qal-qatal-person'",
    "id: 'qal-yiqtol-person'",
  ]) assert.match(grammar, new RegExp(marker))
  assert.match(grammar, /no equivale mecánicamente a “pasado”/)
  assert.match(grammar, /no equivale mecánicamente a “futuro”/)
})

test('FASE H visual: contrato obliga a mantener dinámica de app en superficies nuevas', () => {
  assert.match(contract, /dinámica de app/i)
  assert.match(contract, /no convertir/i)
})
