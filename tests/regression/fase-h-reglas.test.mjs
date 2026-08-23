import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const grammar = fs.readFileSync('components/hebreo/GrammarExplorer.tsx', 'utf8')
const navigator = fs.readFileSync('components/hebreo/GrammarNavigator.tsx', 'utf8')
const course = fs.readFileSync('components/hebreo/HebrewCourseCenter.tsx', 'utf8')
const architecture = fs.readFileSync('docs/FASE_H_ARQUITECTURA_UX_APRENDIZAJE_2026-08-18.md', 'utf8')

test('FASE H reglas: Aprender integra navegador minimalista y conserva explorador completo', () => {
  assert.match(course, /import GrammarNavigator/)
  assert.match(course, /id: 'grammar',[\s\S]*?title: 'Reglas'/)
  assert.match(course, /if \(id === 'grammar'\) return <GrammarNavigator \/>/)
  assert.match(navigator, /import GrammarExplorer/)
  assert.match(navigator, /Comparaciones y tablas/)
})

test('FASE H reglas: primera capa usa categorías compactas y acordeón por regla', () => {
  for (const label of ['Básicas', 'Prefijos', 'Nombres', 'Verbos', 'Frase']) assert.match(navigator, new RegExp(label))
  assert.match(navigator, /grid grid-cols-2 gap-2/)
  assert.match(navigator, /setOpenRule/)
  assert.match(navigator, /aria-expanded=\{active\}/)
  assert.match(navigator, /openRule === rule\.id/)
})

test('FASE H reglas: conserva reglas fundamentales y ejemplos pedagógicos', () => {
  for (const title of ['Artículo definido', 'Conjunción', 'Preposición בְּ', 'Preposiciones frecuentes', 'Preposición + artículo', 'Pistas de género', 'Pistas de plural', 'Sustantivo + adjetivo', 'Cadena constructa']) assert.match(navigator, new RegExp(title.replace('+', '\\+')))
  assert.match(navigator, /rule\.pronunciation/)
  assert.match(navigator, /rule\.meaning/)
  assert.match(navigator, /rule\.summary/)
})

test('FASE H reglas: explorador avanzado conserva cautelas tablas y detalle', () => {
  assert.match(grammar, /type GrammarView = 'tables' \| 'cards' \| 'detail'/)
  assert.match(grammar, /function TeachingTables/)
  assert.match(grammar, /function RuleDetail/)
  assert.match(grammar, /reglas absolutas|regla absoluta/)
  assert.match(grammar, /Ten en cuenta/)
})

test('FASE H reglas: arquitectura distingue hebreo bíblico de conversación moderna', () => {
  assert.match(architecture, /leer, pronunciar y comprender progresivamente el hebreo bíblico/)
  assert.match(architecture, /no mezcla hebreo moderno conversacional/)
  assert.match(architecture, /\*\*Reglas:\*\* pedagogía mixta Tablas · Fichas · Detalle validada como dirección general/)
})

test('FASE H reglas: no introduce audio falso ni persistencia en gramática', () => {
  assert.doesNotMatch(grammar + navigator, /speechSynthesis|new Audio|Audio\(|localStorage|sessionStorage|supabase/)
  assert.match(architecture, /No mostrar botones falsos de audio/)
})
