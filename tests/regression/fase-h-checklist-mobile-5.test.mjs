import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')
const coach = fs.readFileSync('components/hebreo/HebrewProgressCoach.tsx', 'utf8')

test('FASE H checklist 5: Teclado hebreo es un desplegable directo con altura nativa equivalente', () => {
  assert.match(home, /aria-label="Práctica"/)
  assert.doesNotMatch(home, />Herramientas</)
  assert.match(home, />Teclado hebreo</)
  assert.equal((home.match(/>Teclado hebreo</g) ?? []).length, 1)
  assert.match(home, /onClick=\{\(\) => setKeyboardEnabled\(value => !value\)\}/)
  assert.match(home, /aria-expanded=\{keyboardEnabled\}/)
  assert.equal((home.match(/min-h-\[72px\]/g) ?? []).length >= 2, true)
  assert.match(home, /Practica tu escritura en hebreo/)
  assert.match(home, /<HebrewKeyboardDock enabled=\{keyboardEnabled\}/)
})

test('FASE H checklist 5: progreso usa historial persistente sin caja anidada', () => {
  assert.match(home, /Prueba tu progreso/)
  assert.match(home, /<HebrewProgressCoach \/>/)
  assert.match(home, /Mide tu nivel y descubre qué reforzar/)
  assert.match(home, /border-t border-slate-200/)
  assert.doesNotMatch(home, /<details/)
  assert.match(coach, /Tu historial/)
  assert.match(coach, /loadHebrewProgress/)
  assert.match(coach, /saveHebrewProgressAnswer/)
  assert.doesNotMatch(home + coach, /La persistencia de progreso todavía no está activa\./)
  assert.doesNotMatch(home + coach, /localStorage|sessionStorage/)
})
