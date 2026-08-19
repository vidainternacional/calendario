import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function source(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

test('Preguntas pastorales exigen cuenta activa y no convierten Pastor en Administrador', () => {
  const actions = source('app/actions/preguntas.ts')
  const adminPage = source('app/(app)/admin/preguntas/page.tsx')
  const pastoralPage = source('app/(app)/pastoral/preguntas/page.tsx')

  assert.match(actions, /select\('rol, es_pastor_general, activo, estado_cuenta'\)/)
  assert.match(actions, /!p\?\.activo \|\|/)
  assert.match(actions, /p\?\.estado_cuenta !== 'activo'/)
  assert.match(actions, /p\?\.rol !== 'administrador' && p\?\.rol !== 'pastor'/)

  assert.match(adminPage, /profile\?\.rol === 'administrador'/)
  assert.doesNotMatch(adminPage, /profile\?\.rol === 'pastor'/)
  assert.doesNotMatch(adminPage, /profile\?\.es_pastor_general/)

  assert.match(pastoralPage, /profile\?\.rol === 'pastor'/)
  assert.match(pastoralPage, /profile\?\.rol === 'administrador'/)
  assert.match(pastoralPage, /profile\?\.es_pastor_general === true/)
})

test('Ayuda Solidaria mantiene gestión pastoral en Pastoral y Admin-only bajo admin', () => {
  const actions = source('app/actions/solidaridad.ts')
  const adminPage = source('app/(app)/admin/ayuda-solidaria/page.tsx')
  const pastoralPage = source('app/(app)/pastoral/ayuda-solidaria/page.tsx')

  assert.match(actions, /context\.profile\?\.rol === 'pastor'/)
  assert.match(actions, /context\.profile\?\.rol === 'administrador'/)
  assert.match(actions, /context\.profile\?\.es_pastor_general === true/)
  assert.match(actions, /!profile\?\.activo \|\| profile\?\.estado_cuenta !== 'activo'/)

  assert.match(adminPage, /profile\?\.rol === 'administrador'/)
  assert.doesNotMatch(adminPage, /profile\?\.rol === 'pastor'/)
  assert.doesNotMatch(adminPage, /profile\?\.es_pastor_general/)

  assert.match(pastoralPage, /profile\?\.rol === 'pastor'/)
  assert.match(pastoralPage, /profile\?\.rol === 'administrador'/)
  assert.match(pastoralPage, /profile\?\.es_pastor_general === true/)
})
