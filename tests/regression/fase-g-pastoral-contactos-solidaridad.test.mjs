import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function source(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

test('Centro Pastoral recupera Buzón y Ayuda Solidaria sin devolver acceso a Admin', () => {
  const pastoral = source('app/(app)/pastoral/page.tsx')
  const preguntas = source('app/(app)/pastoral/preguntas/page.tsx')
  const ayuda = source('app/(app)/pastoral/ayuda-solidaria/page.tsx')
  const adminLayout = source('app/(app)/admin/layout.tsx')

  assert.match(pastoral, /const puedeGestionarAtencion = .*rol === 'pastor'/s)
  assert.match(pastoral, /href="\/pastoral\/preguntas"/)
  assert.match(pastoral, /href="\/pastoral\/ayuda-solidaria"/)

  assert.match(preguntas, /profile\?\.rol === 'pastor'/)
  assert.match(preguntas, /profile\?\.rol === 'administrador'/)
  assert.match(preguntas, /profile\?\.es_pastor_general === true/)
  assert.match(preguntas, /pregunta\.es_anonima \? \{ \.\.\.pregunta, profiles: null \} : pregunta/)

  assert.match(ayuda, /profile\?\.rol === 'pastor'/)
  assert.match(ayuda, /profile\?\.rol === 'administrador'/)
  assert.match(ayuda, /profile\?\.es_pastor_general === true/)
  assert.match(ayuda, /item\.anonimo \? null : item\.aportante/)

  assert.match(adminLayout, /rol !== 'administrador'/)
  assert.doesNotMatch(adminLayout, /rol === 'pastor'/)
})

test('Ayuda Solidaria no ejecuta telemetría del Piloto mientras permanece pausado', () => {
  const actions = source('app/actions/solidaridad.ts')

  assert.doesNotMatch(actions, /pilot_usage_events/)
  assert.doesNotMatch(actions, /solidarity_request_created/)
  assert.doesNotMatch(actions, /solidarity_contribution_created/)
  assert.match(actions, /revalidatePath\('\/pastoral\/ayuda-solidaria'\)/)
})

test('Buzón pastoral revalida su superficie y protege preguntas ya resueltas', () => {
  const actions = source('app/actions/preguntas.ts')

  assert.match(actions, /revalidatePath\('\/pastoral\/preguntas'\)/)
  assert.match(actions, /\.eq\('estado', 'pendiente'\)\.select\('id'\)\.maybeSingle\(\)/)
  assert.match(actions, /La pregunta ya no está pendiente/)
})

test('Contactos mantiene validación de destinatario en server action; RLS se audita por separado', () => {
  const actions = source('app/actions/contactos.ts')

  assert.match(actions, /\.eq\('destinatario_id', user\.id\)/)
  assert.match(actions, /sol\.estado !== 'pendiente'/)
})
