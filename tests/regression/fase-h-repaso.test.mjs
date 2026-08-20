import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')
const review = fs.readFileSync('components/hebreo/ReviewExplorer.tsx', 'utf8')

test('FASE H repaso: Aprender abre Repaso como módulo real dentro del Bloque 1', () => {
  assert.match(home, /import ReviewExplorer/)
  assert.match(home, /id: 'review',[\s\S]*?available: true/)
  assert.match(home, /activeSection\.id === 'review' \? <ReviewExplorer \/>/)
})

test('FASE H repaso: distingue repaso de examen y mezcla áreas ya estudiadas', () => {
  assert.match(review, /Repaso no es un examen/)
  for (const label of ['Mixto', 'Letras', 'Vocales', 'Palabras', 'Lectura', 'Reglas']) assert.match(review, new RegExp(label))
  for (const area of ["area: 'letters'", "area: 'vowels'", "area: 'words'", "area: 'reading'", "area: 'rules'"]) assert.match(review, new RegExp(area))
})

test('FASE H repaso: usa sesiones cortas y autoevaluación explícita', () => {
  assert.match(review, /slice\(0, 8\)/)
  assert.match(review, /Mostrar respuesta/)
  assert.match(review, /Lo sé/)
  assert.match(review, /Necesito practicar/)
  assert.match(review, /Repasar después/)
  assert.match(review, /Solo esta sesión/)
})

test('FASE H repaso: incluye práctica de escritura compatible con el teclado hebreo', () => {
  assert.match(review, /data-hebrew-practice="true"/)
  assert.match(review, /placeholder="כתוב כאן…"/)
  assert.match(review, /activar el teclado hebreo de VIDA arriba/)
  assert.match(review, /writingTarget/)
})

test('FASE H repaso: el resumen describe únicamente la sesión actual', () => {
  assert.match(review, /Sesión terminada/)
  assert.match(review, /No se guarda como progreso/)
  assert.match(review, /counts\.know/)
  assert.match(review, /counts\.practice/)
  assert.match(review, /counts\.later/)
})

test('FASE H repaso: no introduce persistencia ni audio falso', () => {
  assert.doesNotMatch(review, /supabase|localStorage|sessionStorage|speechSynthesis|new Audio|Audio\(/)
})
