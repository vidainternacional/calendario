import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const master = fs.readFileSync('__VIDA_INTERNACIONAL.md', 'utf8')
const explorer = fs.readFileSync('components/hebreo/AlefBetExplorer.tsx', 'utf8')
const foundations = fs.readFileSync('components/hebreo/AlefBetFoundations.tsx', 'utf8')

test('FASE H: los cuatro bloques permanecen cerrados y la fase no se reabre', () => {
  assert.match(master, /FASE H \| Centro de Hebreo Bíblico \| \*\*COMPLETADA Y APROBADA/)
  assert.match(master, /Bloque 1 — Línea base de fuentes y arquitectura didáctica — COMPLETADO Y APROBADO/)
  assert.match(master, /Bloque 2 — Fundamentos de lectura y gramática progresiva — COMPLETADO Y APROBADO/)
  assert.match(master, /Bloque 3 — Cobertura léxica progresiva y búsqueda inteligente — COMPLETADO Y APROBADO/)
  assert.match(master, /Bloque 4 — Progreso personal y práctica adaptativa — COMPLETADO Y APROBADO/)
  assert.match(master, /FASE H no debe reabrirse salvo bug comprobable/)
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
})

test('FASE H: Matres se enseña como función de lectura y no como vocal independiente', () => {
  for (const value of ['ה', 'ו', 'י']) assert.match(foundations, new RegExp(value))
  assert.match(foundations, /ayudas de lectura/)
  assert.match(foundations, /No son “vocales independientes”/)
})

test('FASE H: fundamentos no crean persistencia ni escrituras de datos', () => {
  assert.doesNotMatch(explorer, /localStorage|sessionStorage|\.insert\(|\.upsert\(|\.update\(/)
  assert.doesNotMatch(foundations, /localStorage|sessionStorage|\.insert\(|\.upsert\(|\.update\(/)
})
