import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function source(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

test('el middleware conserva autenticación y guardia de estado de cuenta', () => {
  const middleware = source('lib/supabase/middleware.ts')

  assert.match(middleware, /await supabase\.auth\.getUser\(\)/)
  assert.match(middleware, /\.select\('estado_cuenta'\)/)
  assert.match(middleware, /estado !== 'activo'/)
  assert.match(middleware, /url\.pathname = '\/pendiente'/)
})

test('la navegación inferior evita precarga masiva', () => {
  const bottomNav = source('components/layout/BottomNav.tsx')
  const prefetchCalls = bottomNav.match(/router\.prefetch\(/g) ?? []

  assert.match(bottomNav, /prefetch=\{false\}/)
  assert.equal(prefetchCalls.length, 1, 'BottomNav debe mantener un único punto de prefetch por intención')
  assert.match(bottomNav, /onPointerDown=\{prepareDestination\}/)
  assert.match(bottomNav, /onPointerEnter=\{prepareDestination\}/)
  assert.doesNotMatch(bottomNav, /setTimeout\([^)]*router\.prefetch/s)
})

test('un push de Avisos solicita refresco inmediato del badge', () => {
  const pushSync = source('components/pwa/PushSubscriptionSync.tsx')

  assert.match(pushSync, /VIDA_PUSH_RECEIVED/)
  assert.match(pushSync, /event\.data\.url\?\.startsWith\('\/avisos'\)/)
  assert.match(pushSync, /requestUnreadPublicationsRefresh\(\)/)
})

test('un refresco forzado no se pierde si ya hay una consulta en vuelo', () => {
  const publicationReads = source('components/avisos/usePublicationReads.ts')

  assert.match(publicationReads, /let unreadCountForceRefreshQueued = false/)
  assert.match(publicationReads, /if \(options\.force\) unreadCountForceRefreshQueued = true/)
  assert.match(publicationReads, /if \(unreadCountForceRefreshQueued\)/)
  assert.match(publicationReads, /void refreshUnreadCount\(\{ force: true \}\)/)
})

test('el contador de Avisos escucha el regreso de Internet', () => {
  const publicationReads = source('components/avisos/usePublicationReads.ts')

  assert.match(publicationReads, /window\.addEventListener\('online', handleOnline\)/)
  assert.match(publicationReads, /window\.removeEventListener\('online', handleOnline\)/)
})

test('push reintenta sincronización al volver Internet', () => {
  const pushSync = source('components/pwa/PushSubscriptionSync.tsx')

  assert.match(pushSync, /const handleOnline = \(\) => void sincronizar\(\)/)
  assert.match(pushSync, /window\.addEventListener\('online', handleOnline\)/)
  assert.match(pushSync, /window\.removeEventListener\('online', handleOnline\)/)
})

test('la lista completa de Avisos refresca al volver Internet', () => {
  const avisosClient = source('components/avisos/AvisosClient.tsx')

  assert.match(avisosClient, /const handleOnline = \(\) => void refresh\(\)/)
  assert.match(avisosClient, /window\.addEventListener\('online', handleOnline\)/)
  assert.match(avisosClient, /window\.removeEventListener\('online', handleOnline\)/)
})

test('Inicio remonta su contenido al volver Internet', () => {
  const inicioOnlineRefresh = source('components/inicio/InicioOnlineRefresh.tsx')
  const inicioPage = source('app/(app)/inicio/page.tsx')

  assert.match(inicioOnlineRefresh, /window\.addEventListener\('online', handleOnline\)/)
  assert.match(inicioOnlineRefresh, /setRefreshKey\(\(current\) => current \+ 1\)/)
  assert.match(inicioOnlineRefresh, /<InicioClient key=\{refreshKey\}/)
  assert.match(inicioPage, /<InicioOnlineRefresh userId=\{user\.id\}/)
})
