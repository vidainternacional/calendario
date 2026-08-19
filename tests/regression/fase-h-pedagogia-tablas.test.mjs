import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const grammar = fs.readFileSync('components/hebreo/GrammarExplorer.tsx', 'utf8')
const pedagogy = fs.readFileSync('docs/FASE_H_REFERENCIA_PEDAGOGICA_HOSHIAH_NA_2026-08-19.md', 'utf8')

test('FASE H pedagogía: Reglas abre con tablas y conserva fichas', () => {
  assert.match(grammar, /type GrammarView = 'tables' \| 'cards' \| 'detail'/)
  assert.match(grammar, /useState<GrammarView>\('tables'\)/)
  assert.match(grammar, /label: 'Tablas'/)
  assert.match(grammar, /label: 'Fichas'/)
  assert.match(grammar, /function CardsView/)
  assert.match(grammar, /function TeachingTables/)
})

test('FASE H pedagogía: tablas cubren comparaciones estructurales clave', () => {
  for (const title of ['Inseparables y prefijos frecuentes', 'Género y número', 'Sufijos posesivos', 'Estado constructo', 'Qere / Ketiv']) {
    assert.match(grammar, new RegExp(title.replace('/', '\\/')))
  }
  assert.match(grammar, /Forma base|Se une como/)
  assert.match(grammar, /Pronunciación/)
  assert.match(grammar, /Español/)
})

test('FASE H pedagogía: no convierte patrones frecuentes en absolutos', () => {
  assert.match(grammar, /reglas absolutas|regla absoluta/)
  assert.match(grammar, /La vocalización exacta puede cambiar/)
  assert.match(grammar, /La base puede cambiar al recibir el sufijo/)
  assert.match(grammar, /sin convertir una interpretación religiosa particular en regla gramatical/)
})

test('FASE H pedagogía: contrato conserva fichas de Alef-Bet y tablas donde comparan mejor', () => {
  assert.match(pedagogy, /Las fichas ya aprobadas del Alef-Bet \*\*se conservan\*\*/)
  assert.match(pedagogy, /\*\*Fichas\*\* — memoria y reconocimiento/)
  assert.match(pedagogy, /\*\*Tablas\*\* — comparación de formas/)
  assert.match(pedagogy, /forma base → cambio → resultado/)
})

test('FASE H pedagogía: contrato fija la secuencia ampliada sin abrir Repaso', () => {
  for (const topic of ['Formas finales / Sofit', 'Dagesh', 'Niqqud completo', 'Sufijos posesivos', 'Qere / Ketiv', 'Lectura bíblica aplicada']) {
    assert.match(pedagogy, new RegExp(topic.replace('/', '\\/')))
  }
  assert.match(pedagogy, /Validar visualmente el rediseño mixto de \*\*Reglas\*\* antes de abrir Repaso/)
})

test('FASE H pedagogía: protege audio y datos sensibles', () => {
  assert.doesNotMatch(grammar, /speechSynthesis|localStorage|sessionStorage|supabase/)
  assert.match(pedagogy, /no usar `speechSynthesis` como audio oficial/)
  assert.match(pedagogy, /No introducir persistencia, nuevas tablas de Supabase, RLS, grants/)
})
