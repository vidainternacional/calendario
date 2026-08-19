import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function source(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

test('Avisos separa publicación pastoral de revisión administrativa', () => {
  const client = source('components/avisos/AvisosClient.tsx')
  const pendientes = source('app/(app)/avisos/pendientes-aprobacion/page.tsx')
  const actions = source('app/actions/avisos.ts')

  assert.match(client, /const puedePublicarGlobal = rol === 'pastor' \|\| rol === 'administrador' \|\| esPastorGeneral/)
  assert.match(client, /const puedeRevisar = rol === 'administrador' \|\| esPastorGeneral/)
  assert.match(client, /\{puedeRevisar && \(/)
  assert.match(client, /esPastorAdmin=\{puedePublicarGlobal\}/)
  assert.match(client, /const CACHE_SCOPE = 'avisos:v5'/)

  assert.match(pendientes, /const puedeRevisar = p\?\.rol === 'administrador' \|\| p\?\.es_pastor_general === true/)
  assert.doesNotMatch(pendientes, /p\?\.rol === 'pastor'/)

  assert.match(actions, /const esPastorAdmin = perfil\?\.rol === 'administrador' \|\| perfil\?\.rol === 'pastor' \|\| perfil\?\.es_pastor_general/)
  assert.match(actions, /perfil\?\.rol !== 'administrador' && !perfil\?\.es_pastor_general/)
})
