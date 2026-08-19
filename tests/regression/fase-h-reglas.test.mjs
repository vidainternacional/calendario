import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const grammar = fs.readFileSync('components/hebreo/GrammarExplorer.tsx', 'utf8')
const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')
const architecture = fs.readFileSync('docs/FASE_H_ARQUITECTURA_UX_APRENDIZAJE_2026-08-18.md', 'utf8')

test('FASE H reglas: Aprender integra Reglas como módulo real', () => {
  assert.match(home, /import GrammarExplorer/)
  assert.match(home, /id: 'grammar',[\s\S]*?available: true/)
  assert.match(home, /activeSection\.id === 'grammar' \? <GrammarExplorer \/>/)
})

test('FASE H reglas: usa Tarjetas Lista y Detalle con apertura bajo la fila', () => {
  assert.match(grammar, /type GrammarView = 'cards' \| 'list' \| 'detail'/)
  for (const label of ['Tarjetas', 'Lista', 'Detalle']) assert.match(grammar, new RegExp(label))
  assert.match(grammar, /function CardsView/)
  assert.match(grammar, /function ListView/)
  assert.match(grammar, /function DetailView/)
  assert.match(grammar, /function toggleRule/)
  assert.match(grammar, /setClosingId\(rule\.id\)/)
})

test('FASE H reglas: organiza la primera capa por función didáctica', () => {
  for (const label of ['Básicas', 'Prefijos', 'Nombres', 'Frase', 'Todas']) assert.match(grammar, new RegExp(label))
  for (const title of ['Artículo definido', 'Conjunción', 'Preposición בְּ', 'Preposiciones frecuentes', 'Preposición + artículo', 'Pistas de género', 'Pistas de plural', 'Sustantivo + adjetivo', 'Cadena constructa']) assert.match(grammar, new RegExp(title.replace('+', '\\+')))
})

test('FASE H reglas: conserva cautelas y no deduce raíces inexistentes', () => {
  assert.match(grammar, /no se presentan como reglas absolutas/)
  assert.match(grammar, /No se deducirán raíces automáticamente/)
  assert.match(grammar, /no tenga verificada/)
  assert.match(grammar, /Ten en cuenta/)
})

test('FASE H reglas: cada regla prioriza forma ejemplo pronunciación significado y explicación', () => {
  assert.match(grammar, /Cómo funciona/)
  assert.match(grammar, /rule\.pronunciation/)
  assert.match(grammar, /rule\.meaning/)
  assert.match(grammar, /rule\.explanation/)
  assert.match(grammar, /rule\.reference/)
  assert.doesNotMatch(grammar, /Strong|sourceLocator|providerVersion|contentHash/)
})

test('FASE H reglas: arquitectura distingue hebreo bíblico de conversación moderna', () => {
  assert.match(architecture, /leer, pronunciar y comprender progresivamente el hebreo bíblico/)
  assert.match(architecture, /no mezcla hebreo moderno conversacional/)
  assert.match(architecture, /Gate actual: \*\*Reglas esenciales\*\*/)
  assert.match(architecture, /Repaso.*siguiente área después de validar Reglas/)
})

test('FASE H reglas: no introduce audio falso ni persistencia', () => {
  assert.doesNotMatch(grammar, /speechSynthesis|new Audio|Audio\(|localStorage|sessionStorage|supabase/)
  assert.match(architecture, /No mostrar botones falsos de audio/)
})
