import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function source(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

const migrationPath = 'supabase/migrations/20260818231143_fase_g_exigir_cuenta_activa_rls_calendario_preguntas.sql'

const policyHeaders = [
  'ALTER POLICY subscriptions_manage_admin',
  'ALTER POLICY calendars_manage_authorized',
  'ALTER POLICY reminders_insert_editable',
  'ALTER POLICY reminders_update_editable',
  'ALTER POLICY reminders_delete_editable',
  'ALTER POLICY evento_calendarios_insert',
  'ALTER POLICY evento_calendarios_delete',
  'ALTER POLICY editor_autorizado_gestiona_eventos',
  'ALTER POLICY admin_full_eventos',
  'ALTER POLICY "Admins y pastores ven todas las preguntas"',
  'ALTER POLICY "Admins y pastores pueden actualizar preguntas"',
]

test('RLS sensible exige cuenta activa en las 11 políticas aprobadas', () => {
  const migration = source(migrationPath)
  const statements = migration
    .split(/;\s*(?:\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean)

  for (const header of policyHeaders) {
    const statement = statements.find((candidate) => candidate.includes(header))
    assert.ok(statement, `Falta ${header}`)
    assert.match(statement, /FROM public\.profiles p/)
    assert.match(statement, /p\.id = auth\.uid\(\)/)
    assert.match(statement, /p\.activo = true/)
    assert.match(statement, /p\.estado_cuenta = 'activo'/)
  }
})

test('la migración localizada no redefine funciones ni modifica datos', () => {
  const migration = source(migrationPath)

  assert.doesNotMatch(migration, /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION/i)
  assert.doesNotMatch(migration, /ALTER\s+FUNCTION/i)
  assert.doesNotMatch(migration, /\bINSERT\s+INTO\b/i)
  assert.doesNotMatch(migration, /\bUPDATE\s+public\./i)
  assert.doesNotMatch(migration, /\bDELETE\s+FROM\b/i)
  assert.match(migration, /Rollback:/)
})
