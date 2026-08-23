import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')
const coach = fs.readFileSync('components/hebreo/HebrewProgressCoach.tsx', 'utf8')

test('FASE H checklist 5: Teclado hebreo vive como submenú del bloque de progreso', () => {
  assert.match(home, /aria-label="Práctica"/)
  assert.doesNotMatch(home, />Herramientas</)
  assert.match(home, /keyboard: \{ title: 'Teclado hebreo'/)
  assert.match(home, /openPractice === 'keyboard'/)
  assert.match(home, /<HebrewKeyboardDock enabled \/>/)
  assert.match(home, /Escritura y reconocimiento de letras/)
})

test('FASE H checklist 5: evaluación conserva cuadro de notas persistente dentro del acordeón', () => {
  assert.match(home, /Prueba tu progreso/)
  assert.match(home, /Evaluación y progreso/)
  assert.match(home, /<HebrewProgressCoach \/>/)
  assert.match(home, /Evalúa, practica y revisa tu avance/)
  assert.doesNotMatch(home, /<details/)
  assert.match(coach, /Cuadro de notas/)
  assert.match(coach, /evaluaciones registradas/)
  assert.match(coach, /loadHebrewProgress/)
  assert.match(coach, /saveHebrewProgressAnswer/)
  assert.doesNotMatch(home + coach, /La persistencia de progreso todavía no está activa\./)
  assert.doesNotMatch(home + coach, /localStorage|sessionStorage/)
})
