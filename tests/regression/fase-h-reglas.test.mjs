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
  assert.match(navigator, /TOPICS/)
  assert.match(grammar, /function TeachingTables/)
  assert.match(grammar, /type GrammarView = 'tables' \| 'cards' \| 'detail'/)
})

test('FASE H reglas: primera capa usa pasos compactos y detalle desplegable por regla', () => {
  for (const label of ['Sheva', 'Dagesh', 'Shin / Sin', 'Prefijos', 'Género', 'Número', 'Verbos']) assert.match(navigator, new RegExp(label.replace('/', '\\/')))
  assert.match(navigator, /grid grid-cols-3 gap-2\.5/)
  assert.match(navigator, /setOpen/)
  assert.match(navigator, /aria-expanded=\{selected\}/)
  assert.match(navigator, /open===topic\.id/)
  assert.match(navigator, /<RuleCard topic=/)
})

test('FASE H reglas: conserva reglas fundamentales y ejemplos pedagógicos', () => {
  for (const title of ['Artículo · el, la, los, las', 'Prefijos · piezas pegadas al inicio', 'Género · masculino y femenino', 'Número · singular y plural', 'Posesión · mi, tu, su', 'Constructo · relacionar dos nombres', 'Verbos · cómo cambia una acción']) assert.match(navigator, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.match(navigator, /topic\.what/)
  assert.match(navigator, /topic\.how/)
  assert.match(navigator, /topic\.example/)
  assert.match(navigator, /topic\.caution/)
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
