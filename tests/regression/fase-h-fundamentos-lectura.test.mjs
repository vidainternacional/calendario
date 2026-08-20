import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const master = fs.readFileSync('__VIDA_INTERNACIONAL.md', 'utf8')
const explorer = fs.readFileSync('components/hebreo/AlefBetExplorer.tsx', 'utf8')
const foundations = fs.readFileSync('components/hebreo/AlefBetFoundations.tsx', 'utf8')

test('FASE H: Bloque 1 está cerrado y Bloque 2 queda activo', () => {
  assert.match(master, /Bloque 1 — Línea base de fuentes y arquitectura didáctica — COMPLETADO Y APROBADO/)
  assert.match(master, /Bloque 2 — Fundamentos de lectura y gramática progresiva — ACTIVO/)
  assert.match(master, /Empezar por Sofit, Dagesh\/Begadkefat y matres lectionis/)
})

test('FASE H: Alef-Bet integra tablas fundamentales sin sustituir las fichas', () => {
  assert.match(explorer, /import AlefBetFoundations from '\.\/AlefBetFoundations'/)
  assert.match(explorer, /<AlefBetFoundations \/>/)
  for (const label of ['Tarjetas', 'Lista', 'Detalle']) assert.match(explorer, new RegExp(label))
})

test('FASE H: Sofit separa valor ordinario de gematría extendida', () => {
  for (const pair of [['כ', 'ך', '20', '500'], ['מ', 'ם', '40', '600'], ['נ', 'ן', '50', '700'], ['פ', 'ף', '80', '800'], ['צ', 'ץ', '90', '900']]) {
    for (const value of pair) assert.match(foundations, new RegExp(value))
  }
  assert.match(foundations, /Valor ordinario/)
  assert.match(foundations, /Convención ampliada/)
  assert.match(foundations, /convención extendida de gematría/)
})

test('FASE H: Dagesh distingue aprendizaje inicial de variación histórica', () => {
  for (const pair of ['בּ', 'גּ', 'דּ', 'כּ', 'פּ', 'תּ']) assert.match(foundations, new RegExp(pair))
  assert.match(foundations, /No todo dagesh hace exactamente lo mismo/)
  assert.match(foundations, /dagesh qal/)
  assert.match(foundations, /tradición de lectura/)
})

test('FASE H: Matres se enseña como función de lectura y no como vocal independiente', () => {
  for (const letter of ['א', 'ה', 'ו', 'י']) assert.match(foundations, new RegExp(letter))
  assert.match(foundations, /función de lectura/)
  assert.match(foundations, /no una categoría de vocal independiente/)
})

test('FASE H: fundamentos no crean persistencia ni escrituras de datos', () => {
  assert.doesNotMatch(foundations, /supabase|\.insert\(|\.update\(|\.delete\(|\.upsert\(|localStorage|sessionStorage/)
})
