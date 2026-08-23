import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const migration = fs.readFileSync('supabase/migrations/20260823145500_fase_h_progreso_tiempo_respuesta.sql', 'utf8')
const store = fs.readFileSync('lib/hebreo/progress-store.ts', 'utf8')
const coach = fs.readFileSync('components/hebreo/HebrewProgressCoach.tsx', 'utf8')
const translator = fs.readFileSync('app/api/estudios/hebreo/traducir/route.ts', 'utf8')

test('FASE H bloque 4: tiempo de respuesta usa la tabla existente y un rango acotado', () => {
  assert.match(migration, /alter table public\.biblical_hebrew_progress_answers/)
  assert.match(migration, /response_time_ms integer/)
  assert.match(migration, /response_time_ms >= 0/)
  assert.match(migration, /response_time_ms <= 300000/)
  assert.doesNotMatch(migration, /create table|create function|create trigger|create view/i)
})

test('FASE H bloque 4: cada respuesta objetiva puede persistir su tiempo sin afectar repasos', () => {
  assert.match(store, /response_time_ms/)
  assert.match(store, /responseTimeMs\?: number \| null/)
  assert.match(store, /Math\.min\(300000/)
  assert.match(store, /response_time_ms: responseTimeMs/)
  assert.match(store, /responseTimeMs: null/)
})

test('FASE H bloque 4: evaluación mide fluidez contra el historial propio', () => {
  assert.match(coach, /questionStartedAtRef/)
  assert.match(coach, /responseTimeMs/)
  assert.match(coach, /timed\.length < 6/)
  assert.match(coach, /previous \* 0\.85/)
  assert.match(coach, /previous \* 1\.2/)
  assert.match(coach, /Creando línea base/)
  assert.match(coach, /Más fluido/)
  assert.match(coach, /Más pausado/)
  assert.match(coach, />Fluidez</)
  assert.match(coach, />Tiempo típico</)
  assert.doesNotMatch(coach, /responseTimeMs\s*[<>]=?\s*\d+\s*\?\s*isCorrect/)
})

test('FASE H traductor: salida hebrea de aprendizaje rechaza abreviaturas que el audio expandiría', () => {
  assert.match(translator, /no uses abreviaturas, siglas ni sustituciones religiosas/)
  assert.match(translator, /containsHebrewAbbreviation/)
  assert.match(translator, /expansionInstructions/)
  assert.match(translator, /\[׳״\]/u)
  assert.match(translator, /El texto visible debe coincidir con las palabras que una voz leería en voz alta/)
  assert.match(translator, /No se pudo generar una forma hebrea completa sin abreviaturas/)
})
