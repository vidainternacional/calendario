import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')
const coach = fs.readFileSync('components/hebreo/HebrewProgressCoach.tsx', 'utf8')
const summary = fs.readFileSync('components/hebreo/HebrewProgressSummary.tsx', 'utf8')
const progress = fs.readFileSync('lib/hebreo/progress.ts', 'utf8')
const mastery = fs.readFileSync('lib/hebreo/progress-mastery.ts', 'utf8')
const store = fs.readFileSync('lib/hebreo/progress-store.ts', 'utf8')

test('FASE H bloque 4: Inicio usa instructor persistente dentro de navegación horizontal compacta', () => {
  assert.match(home, /HebrewProgressCoach/); assert.match(home, /HebrewProgressSummary/); assert.match(home, /evaluation:\s*\{\s*title:\s*'Evaluación'/); assert.match(home, /progress:\s*\{\s*title:\s*'Mi progreso'/); assert.match(home, /Entrena a tu ritmo/); assert.match(home, /Empecemos/); assert.match(home, /cta-neon-orbit/); assert.doesNotMatch(home, /hebrew-glimmer/); assert.match(home, /function PracticeTab/); assert.match(home, /grid grid-cols-4 gap-2/); assert.match(home, /useState<PracticePanelId\s*\|\s*null>\(null\)/); assert.match(home, /HelpCircle/); assert.match(home, /bg-indigo-600 text-white/); assert.doesNotMatch(home, /absolute bottom-1\.5 h-1 w-5/); assert.doesNotMatch(home, /TEST_QUESTIONS/)
})

test('FASE H bloque 4: nivel adaptativo exige cobertura real y barra verde', () => {
  for (const label of ['Según mi progreso','Elegir nivel','Básico','Intermedio','Avanzado','Nivel 1','Nivel 2','Nivel 3','¿Qué te espera en']) assert.match(coach,new RegExp(label.replace('?','\\?')))
  assert.match(mastery,/deriveStrictAdaptiveLevel/)
  assert.match(mastery,/mastered === pool\.length && accuracy >= 85/)
  assert.match(coach,/bg-emerald-500/)
  assert.match(coach,/adaptiveLevel\.progress/)
  assert.match(coach,/fundamentalsComplete/)
})

test('FASE H bloque 4: banco ampliado y personalización no mezclan dificultad', () => {
  assert.match(coach,/LENGTHS = \[10, 15, 20\]/)
  assert.match(coach,/Personalizar práctica/)
  assert.match(coach,/SKILL_ORDER/)
  assert.match(coach,/focusAreas/)
  assert.match(mastery,/ALL_HEBREW_PRACTICE_QUESTIONS/)
  assert.match(coach,/selectStrictAdaptiveQuestions/)
  assert.match(coach,/selectMasteryQuestions/)
  assert.ok((mastery.match(/difficulty: 'initial'/g)??[]).length>=20)
})

test('FASE H bloque 4: acierto sale de la rotación normal hasta retención', () => {
  assert.match(mastery,/RETENTION_AFTER_MS/)
  assert.match(mastery,/latest\.is_correct/)
  assert.match(mastery,/return -1000/)
  assert.match(mastery,/retentionDue/)
})

test('FASE H bloque 4: cada respuesta se valida guarda y los errores entran a Repaso', () => {
  assert.match(coach,/optionIndex === current\.correctIndex/)
  assert.match(coach,/saveHebrewProgressAnswer/)
  assert.match(coach,/reviewRequested: !isCorrect/)
  assert.match(store,/review_requested/)
  assert.match(coach,/setCorrect/)
  assert.match(coach,/aciertos/)
})

test('FASE H bloque 4: pronunciación es checkpoint independiente al final de la evaluación', () => {
  assert.match(coach,/ORAL_CHECKPOINTS/)
  assert.match(coach,/interaction:\s*'pronunciation'/)
  assert.match(coach,/\[\.\.\.normalQuestions, checkpointFor\(requested\)\]/)
  assert.match(coach,/Prueba oral final/)
  assert.match(coach,/submitPronunciation/)
  assert.match(coach,/question_key\.startsWith\('oral-/)
  assert.doesNotMatch(coach,/Prueba tu pronunciación/)
})

test('FASE H bloque 4: 100 por ciento abre perfeccionamiento sin inflar la escala', () => {
  assert.match(coach,/Fundamentos dominados · 100%/)
  assert.match(coach,/Perfeccionamiento/)
  assert.match(coach,/no sube artificialmente de 100%/)
  assert.match(coach,/oralPassed\.initial/)
  assert.match(coach,/oralPassed\.intermediate/)
  assert.match(coach,/oralPassed\.advanced/)
})

test('FASE H bloque 4: cierre da retroalimentación y recomendación derivada', () => {
  assert.match(coach,/finalFeedback/)
  assert.match(coach,/Excelente sesión/)
  assert.match(coach,/reforzar fundamentos/)
  assert.match(coach,/metrics\.recommendation/)
})

test('FASE H bloque 4: Mi progreso concentra notas dominio retención y recomendación', () => { for(const token of ['deriveProgressMetrics','accuracy','areas','evolution','retention','trend','recurringErrors','recommendation']) assert.match(progress,new RegExp(token)); assert.match(summary,/deriveSessionGrades/); assert.match(summary,/deriveStrictAdaptiveLevel/); assert.match(summary,/Evaluaciones registradas/); assert.match(summary,/Dominio por área/); assert.match(summary,/Precisión/); assert.match(summary,/Retención/); assert.match(summary,/Qué estudiar después/); assert.match(home,/data-evaluation-only/); for(const state of ['Reforzar','En progreso','Dominado']) assert.match(progress,new RegExp(state)) })
test('FASE H bloque 4: marcas de Repaso conservan clave compatible', () => { assert.match(store,/REVIEW_TO_PRACTICE_KEY/); assert.match(store,/bet: 'letter-bet'/); assert.match(store,/pataj: 'niqqud-patah'/); assert.match(store,/'bereshit-bara': 'reading-bereshit-bara'/); assert.match(store,/questionKey: `review:\$\{practiceKey\}`/); assert.match(progress,/answer\.question_key\.replace\(\/\^review:\//) })
test('FASE H bloque 4: acceso usa sesión autenticada y tablas RLS aprobadas', () => { assert.match(store,/auth\.getUser\(\)/); assert.match(store,/biblical_hebrew_progress_sessions/); assert.match(store,/biblical_hebrew_progress_answers/); assert.match(store,/profile_id: owner/); assert.match(store,/finishHebrewProgressSession/) })
