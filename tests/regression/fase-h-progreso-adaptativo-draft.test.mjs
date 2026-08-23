import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const basePath = 'supabase/migrations/20260822235632_fase_h_progreso_adaptativo.sql'
const grantsPath = 'supabase/migrations/20260822235704_fase_h_progreso_adaptativo_restringir_grants.sql'
const sql = fs.readFileSync(basePath, 'utf8')
const grants = fs.readFileSync(grantsPath, 'utf8')

test('FASE H bloque 4: las dos migraciones realmente aplicadas quedan versionadas', () => {
  assert.ok(basePath.includes('/migrations/'))
  assert.ok(grantsPath.includes('/migrations/'))
  assert.match(sql, /create table public\.biblical_hebrew_progress_sessions/)
  assert.match(sql, /create table public\.biblical_hebrew_progress_answers/)
  assert.match(grants, /revoke all on table public\.biblical_hebrew_progress_sessions from authenticated/)
  assert.match(grants, /revoke all on table public\.biblical_hebrew_progress_answers from authenticated/)
})

test('FASE H bloque 4: usa solo sesiones y respuestas como persistencia mínima', () => {
  assert.equal((sql.match(/create table public\.biblical_hebrew_progress_/g) ?? []).length, 2)
  assert.doesNotMatch(sql, /create table public\.biblical_hebrew_progress_(stats|metrics|levels|streaks)/)
  assert.doesNotMatch(sql, /create (or replace )?function|create trigger|create view/i)
})

test('FASE H bloque 4: soporta modo adaptativo, dificultad y las nueve áreas aprobadas', () => {
  assert.match(sql, /mode in \('adaptive', 'difficulty'\)/)
  assert.match(sql, /requested_difficulty in \('initial', 'intermediate', 'advanced'\)/)
  for (const skill of ['alef_bet', 'visual_recognition', 'sofit', 'dagesh', 'niqqud', 'sheva', 'vocabulary', 'reading', 'rules']) assert.match(sql, new RegExp(`'${skill}'`))
  assert.match(sql, /review_requested boolean not null default false/)
  assert.match(sql, /is_correct boolean not null/)
})

test('FASE H bloque 4: RLS exige dueño y cuenta activa en ambas tablas', () => {
  assert.match(sql, /alter table public\.biblical_hebrew_progress_sessions enable row level security/)
  assert.match(sql, /alter table public\.biblical_hebrew_progress_answers enable row level security/)
  assert.ok((sql.match(/profile_id = \(select auth\.uid\(\)\)/g) ?? []).length >= 6)
  assert.ok((sql.match(/p\.activo = true/g) ?? []).length >= 6)
  assert.ok((sql.match(/p\.estado_cuenta = 'activo'/g) ?? []).length >= 6)
  assert.match(sql, /s\.id = session_id[\s\S]*s\.profile_id = \(select auth\.uid\(\)\)/)
})

test('FASE H bloque 4: anon no accede y grants finales niegan DELETE/TRUNCATE a authenticated', () => {
  assert.match(sql, /revoke all on table public\.biblical_hebrew_progress_sessions from public, anon/)
  assert.match(sql, /revoke all on table public\.biblical_hebrew_progress_answers from public, anon/)
  assert.match(grants, /grant select, insert, update on table public\.biblical_hebrew_progress_sessions to authenticated/)
  assert.match(grants, /grant select, insert, update on table public\.biblical_hebrew_progress_answers to authenticated/)
  assert.doesNotMatch(grants, /grant[^;]*(delete|truncate)[^;]*to authenticated/i)
  assert.doesNotMatch(sql, /grant[^;]+to anon/i)
})

test('FASE H bloque 4: rollback documentado elimina primero respuestas y después sesiones', () => {
  const answersDrop = sql.indexOf('drop table if exists public.biblical_hebrew_progress_answers')
  const sessionsDrop = sql.indexOf('drop table if exists public.biblical_hebrew_progress_sessions')
  assert.ok(answersDrop > 0)
  assert.ok(sessionsDrop > answersDrop)
})
