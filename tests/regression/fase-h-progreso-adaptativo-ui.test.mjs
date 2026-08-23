import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')
const coach = fs.readFileSync('components/hebreo/HebrewProgressCoach.tsx', 'utf8')
const progress = fs.readFileSync('lib/hebreo/progress.ts', 'utf8')
const mastery = fs.readFileSync('lib/hebreo/progress-mastery.ts', 'utf8')
const store = fs.readFileSync('lib/hebreo/progress-store.ts', 'utf8')

test('FASE H bloque 4: Inicio usa instructor persistente dentro de navegación compacta', () => {
  assert.match(home, /HebrewProgressCoach/)
  assert.match(home, /Evaluación y progreso/)
  assert.match(home, /Evalúa, practica y revisa tu avance/)
  assert.match(home, /Empecemos/)
  assert.match(home, /hebrew-glimmer/)
  assert.match(home, /function PracticeRow/)
  assert.doesNotMatch(home, /TEST_QUESTIONS/)
})

test('FASE H bloque 4: nivel adaptativo exige cobertura real y barra verde', () => {
  for (const label of ['Según mi progreso', 'Elegir nivel', 'Básico', 'Intermedio', 'Avanzado', 'Nivel 1', 'Nivel 2', 'Nivel 3', '¿Qué te espera en']) assert.match(coach, new RegExp(label.replace('?', '\\?')))
  assert.match(mastery, /deriveStrictAdaptiveLevel/)
  assert.match(mastery, /mastered === pool\.length && accuracy >= 85/)
  assert.match(coach, /Una racha de errores puede bajarlo/)
  assert.match(coach, /bg-emerald-500/)
  assert.match(coach, /adaptiveLevel\.progress/)
  assert.match(coach, /una sola prueba buena no basta/)
})

test('FASE H bloque 4: banco ampliado y personalización no mezclan dificultad', () => {
  assert.match(coach, /LENGTHS = \[10, 15, 20\]/)
  assert.match(coach, /Personalizar práctica/)
  assert.match(coach, /Áreas que quieres reforzar/)
  assert.match(mastery, /ALL_HEBREW_PRACTICE_QUESTIONS/)
  assert.match(coach, /selectStrictAdaptiveQuestions/)
  assert.match(coach, /selectMasteryQuestions/)
  assert.match(coach, /no mezclará niveles para rellenar el número/)
  assert.ok((mastery.match(/difficulty: 'initial'/g) ?? []).length >= 20)
})

test('FASE H bloque 4: acierto sale de la rotación normal hasta retención', () => {
  assert.match(mastery, /RETENTION_AFTER_MS/)
  assert.match(mastery, /latest\.is_correct/)
  assert.match(mastery, /return -1000/)
  assert.match(coach, /Acertar retira esa pregunta de la práctica normal/)
  assert.match(coach, /solo vuelve más adelante como control de retención/)
})

test('FASE H bloque 4: cada respuesta se valida guarda y permite repaso', () => {
  assert.match(coach, /optionIndex === current\.correctIndex/)
  assert.match(coach, /saveHebrewProgressAnswer/)
  assert.match(coach, /setHebrewReviewRequested/)
  assert.match(coach, /Quiero repasar/)
  assert.match(coach, /Correcto/)
  assert.match(coach, /Necesita repaso/)
  assert.match(coach, /aciertos/)
})

test('FASE H bloque 4: cierre da retroalimentación y recomendación derivada', () => {
  assert.match(coach, /finalFeedback/)
  assert.match(coach, /Excelente dominio en esta sesión/)
  assert.match(coach, /conviene reforzar fundamentos/)
  assert.match(coach, />Recomendación</)
  assert.match(coach, /metrics\.recommendation/)
})

test('FASE H bloque 4: historial es cuadro de notas derivado de intentos reales', () => {
  for (const token of ['deriveProgressMetrics', 'accuracy', 'areas', 'evolution', 'retention', 'trend', 'recurringErrors', 'recommendation']) assert.match(progress, new RegExp(token))
  assert.match(mastery, /deriveSessionGrades/)
  assert.match(coach, /Cuadro de notas/)
  assert.match(coach, /evaluaciones registradas/)
  assert.match(coach, /Aciertos/)
  assert.match(coach, /Nota/)
  assert.match(coach, /Qué estudiar después/)
  assert.match(coach, /El historial es privado por usuario/)
  for (const state of ['Reforzar', 'En progreso', 'Dominado']) assert.match(progress, new RegExp(state))
})

test('FASE H bloque 4: marcas de Repaso conservan clave compatible', () => {
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
