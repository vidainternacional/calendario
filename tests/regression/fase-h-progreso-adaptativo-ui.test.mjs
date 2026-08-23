import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')
const coach = fs.readFileSync('components/hebreo/HebrewProgressCoach.tsx', 'utf8')
const progress = fs.readFileSync('lib/hebreo/progress.ts', 'utf8')
const store = fs.readFileSync('lib/hebreo/progress-store.ts', 'utf8')

test('FASE H bloque 4: Inicio usa instructor persistente y CTA principal simple', () => {
  assert.match(home, /HebrewProgressCoach/)
  assert.match(home, /Mide tu nivel y descubre qué reforzar/)
  assert.match(home, /Empecemos/)
  assert.match(home, /hebrew-glimmer/)
  assert.doesNotMatch(home, /TEST_QUESTIONS/)
  assert.doesNotMatch(home, /progreso persistente todavía no está activo/i)
})

test('FASE H bloque 4: ofrece práctica adaptativa, niveles y personalización en acordeón', () => {
  for (const label of ['Según mi progreso', 'Elegir nivel', 'Básico', 'Intermedio', 'Avanzado', 'Nivel 1', 'Nivel 2', 'Nivel 3', 'Personalizar práctica', 'Áreas que quieres reforzar']) assert.match(coach, new RegExp(label))
  assert.match(coach, /LENGTHS = \[10, 15, 20\]/)
  assert.match(coach, /selectAdaptiveQuestions/)
  assert.match(coach, /selectDifficultyQuestions/)
  assert.match(coach, /SKILL_ORDER\.map/)
})

test('FASE H bloque 4: cada respuesta se valida, guarda y permite Quiero repasar', () => {
  assert.match(coach, /optionIndex === current\.correctIndex/)
  assert.match(coach, /saveHebrewProgressAnswer/)
  assert.match(coach, /setHebrewReviewRequested/)
  assert.match(coach, /Quiero repasar/)
  assert.match(coach, /Correcto/)
  assert.match(coach, /Necesita repaso/)
  assert.match(coach, /Aciertos/)
})

test('FASE H bloque 4: historial deriva métricas reales sin tabla estadística', () => {
  for (const token of ['deriveProgressMetrics', 'accuracy', 'areas', 'evolution', 'retention', 'trend', 'recurringErrors', 'recommendation']) assert.match(progress, new RegExp(token))
  assert.match(progress, /!answer\.question_key\.startsWith\('review:'\)/)
  assert.match(coach, /Tu historial/)
  assert.match(coach, /Qué estudiar después/)
  for (const state of ['Reforzar', 'En progreso', 'Dominado']) assert.match(progress, new RegExp(state))
})

test('FASE H bloque 4: marcas de Repaso conservan clave compatible con la práctica adaptativa', () => {
  assert.match(store, /REVIEW_TO_PRACTICE_KEY/)
  assert.match(store, /bet: 'letter-bet'/)
  assert.match(store, /pataj: 'niqqud-patah'/)
  assert.match(store, /'bereshit-bara': 'reading-bereshit-bara'/)
  assert.match(store, /questionKey: `review:\$\{practiceKey\}`/)
  assert.match(progress, /answer\.question_key\.replace\(\/\^review:\//)
})

test('FASE H bloque 4: acceso usa sesión autenticada y tablas RLS aprobadas', () => {
  assert.match(store, /auth\.getUser\(\)/)
  assert.match(store, /biblical_hebrew_progress_sessions/)
  assert.match(store, /biblical_hebrew_progress_answers/)
  assert.match(store, /profile_id: owner/)
  assert.match(store, /finishHebrewProgressSession/)
})
