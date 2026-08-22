import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const draftPath = 'supabase/migration-drafts/20260822235000_fase_h_progreso_adaptativo_draft.sql'
const sql = fs.readFileSync(draftPath, 'utf8')

test('FASE H bloque 4: progreso queda como borrador no aplicado hasta aprobación explícita', () => {
  assert.match(sql, /BORRADOR ÚNICAMENTE\. NO APLICADO EN SUPABASE/)
  assert.ok(draftPath.includes('/migration-drafts/'))
  assert.doesNotMatch(draftPath, /\/migrations\//)
})

test('FASE H bloque 4: usa solo sesiones y respuestas como persistencia mínima', () => {
  assert.equal((sql.match(/create table public\.biblical_hebrew_progress_/g) ?? []).length, 2)
  assert.match(sql, /create table public\.biblical_hebrew_progress_sessions/)
  assert.match(sql, /create table public\.biblical_hebrew_progress_answers/)
  assert.doesNotMatch(sql, /create table public\.biblical_hebrew_progress_(stats|metrics|levels|streaks)/)
  assert.doesNotMatch(sql, /create (or replace )?function|create trigger|create view/i)
})

test('FASE H bloque 4: soporta modo adaptativo y dificultad elegida sin inventar métricas agregadas', () => {
  assert.match(sql, /mode in \('adaptive', 'difficulty'\)/)
  assert.match(sql, /requested_difficulty in \('initial', 'intermediate', 'advanced'\)/)
  for (const skill of ['alef_bet', 'visual_recognition', 'sofit', 'dagesh', 'niqqud', 'sheva', 'vocabulary', 'reading', 'rules']) {
    assert.match(sql, new RegExp(`'${skill}'`))
  }
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

test('FASE H bloque 4: anon no recibe acceso y authenticated solo obtiene lo necesario', () => {
  assert.match(sql, /revoke all on table public\.biblical_hebrew_progress_sessions from public, anon/)
  assert.match(sql, /revoke all on table public\.biblical_hebrew_progress_answers from public, anon/)
  assert.match(sql, /grant select, insert, update on table public\.biblical_hebrew_progress_sessions to authenticated/)
  assert.match(sql, /grant select, insert, update on table public\.biblical_hebrew_progress_answers to authenticated/)
  assert.doesNotMatch(sql, /grant[^;]+to anon/i)
})

test('FASE H bloque 4: rollback elimina primero respuestas y después sesiones', () => {
  const answersDrop = sql.indexOf('drop table if exists public.biblical_hebrew_progress_answers')
  const sessionsDrop = sql.indexOf('drop table if exists public.biblical_hebrew_progress_sessions')
  assert.ok(answersDrop > 0)
  assert.ok(sessionsDrop > answersDrop)
})
