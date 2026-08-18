import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function source(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

test('RLS de Avisos impide autoaprobación y reserva revisión a Admin o Pastor General', () => {
  const migration = source('supabase/migrations/20260818215421_fase_g_endurecer_rls_avisos.sql')
  const actions = source('app/actions/avisos.ts')

  assert.match(migration, /DROP POLICY IF EXISTS pastor_actualiza_publicaciones/)
  assert.match(migration, /DROP POLICY IF EXISTS autor_gestiona_publicacion/)
  assert.match(migration, /CREATE POLICY autor_actualiza_publicacion_pendiente/)
  assert.match(migration, /autor_id = auth\.uid\(\)\s+AND estado = 'pendiente'/s)
  assert.match(migration, /CREATE POLICY revisor_actualiza_publicacion/)
  assert.match(migration, /p\.rol = 'administrador'/)
  assert.match(migration, /p\.es_pastor_general = true/)
  assert.doesNotMatch(migration, /p\.rol = 'pastor'/)
  assert.match(migration, /estado IN \('aprobado', 'rechazado'\)/)

  assert.match(actions, /perfil\?\.rol !== 'administrador' && !perfil\?\.es_pastor_general/)
  assert.match(actions, /No tienes permisos para aprobar avisos/)
  assert.match(actions, /No tienes permisos para rechazar avisos/)
})
