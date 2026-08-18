import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function source(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

test('Calendario ofrece escritura global solo a Administrador y usa permisos efectivos para los demás', () => {
  const page = source('app/(app)/calendario/page.tsx')

  assert.match(page, /const esAdministrador = profile\?\.rol === 'administrador'/)
  assert.match(page, /if \(cuentaActiva && esAdministrador\)/)
  assert.match(page, /\.from\('calendar_subscriptions'\)/)
  assert.match(page, /\.eq\('user_id', user\.id\)/)
  assert.match(page, /\.eq\('can_edit', true\)/)
  assert.match(page, /!calendar\.ministerio_id \|\|/)
  assert.match(page, /ministeriosLiderados\.includes\(String\(calendar\.ministerio_id\)\)/)
  assert.match(page, /const canCreateEvents = cuentaActiva && creationCalendars\.length > 0/)
  assert.doesNotMatch(page, /esPastorOAdmin/)
  assert.doesNotMatch(page, /profile\?\.rol === 'pastor'/)
})

test('acciones de Calendario no convierten Pastor en editor global', () => {
  const actions = source('app/actions/eventos.ts')

  assert.match(actions, /const esAdministrador = perfil\.rol === 'administrador'/)
  assert.match(actions, /if \(esAdministrador\)/)
  assert.match(actions, /\.from\('calendar_subscriptions'\)/)
  assert.match(actions, /\.eq\('user_id', userId\)/)
  assert.match(actions, /!subscription\?\.can_edit/)
  assert.match(actions, /if \(subscription\.calendars\.ministerio_id\)/)
  assert.match(actions, /\.eq\('es_lider', true\)/)
  assert.doesNotMatch(actions, /esPastorAdmin/)
  assert.doesNotMatch(actions, /perfil\.rol === 'pastor'/)
  assert.doesNotMatch(actions, /Solo administradores, pastores y líderes pueden modificar eventos/)
})

test('RLS de Calendario conserva contexto ministerial y reserva administración global a Administrador', () => {
  const migration = source('supabase/migrations/20260818221805_fase_g_calendario_liderazgo_contextual.sql')

  assert.match(migration, /when v_role = 'administrador' then true/)
  assert.match(migration, /when c\.ministerio_id is not null then exists/)
  assert.match(migration, /mm\.es_lider = true/)
  assert.match(migration, /lower\(trim\(c\.nombre\)\) = 'pastores'/)
  assert.match(migration, /create policy subscriptions_manage_admin[\s\S]*?mi_rol\(\) = 'administrador'/)
  assert.match(migration, /create policy calendars_manage_authorized[\s\S]*?lidera\(calendars\.ministerio_id\)/)
  assert.match(migration, /create policy editor_autorizado_gestiona_eventos[\s\S]*?lidera\(eventos\.ministerio_id\)/)
  assert.doesNotMatch(migration, /es_admin_o_pastor\(\)/)
})
