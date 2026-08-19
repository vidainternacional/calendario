import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function source(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

const serviceWorker = source('public/sw.js')
const pushSync = source('components/pwa/PushSubscriptionSync.tsx')
const themeSync = source('components/biblia/BibleThemeRouteSync.tsx')
const notebookCss = source('app/notebook-fixes.css')
const offlineNotebook = source('components/biblia/OfflineBibleNotesWorkspace.tsx')
const logoutButton = source('components/auth/LogoutButton.tsx')

test('Cuaderno queda aislado del tema oscuro o sepia de Biblia en PWA', () => {
  assert.match(themeSync, /function esRutaCuaderno/)
  assert.match(themeSync, /pathname === '\/biblia\/notas'/)
  assert.match(themeSync, /pathname === '\/biblia\/notas-offline'/)
  assert.match(themeSync, /retirarTema\(\)/)

  assert.match(notebookCss, /html:has\(\.note-rich-editor\)/)
  assert.match(notebookCss, /--background: #f7f7f4/)
  assert.match(notebookCss, /color-scheme: light !important/)
  assert.match(notebookCss, /main:has\(\.note-rich-editor\) \[class\*="bg-slate-900\/48"\]/)
})

test('service worker conserva navegación offline por usuario sin cachear APIs', () => {
  assert.doesNotThrow(() => new Function(serviceWorker))
  assert.match(serviceWorker, /USER_CACHE_PREFIX/)
  assert.match(serviceWorker, /CORE_OFFLINE_ROUTES/)
  assert.match(serviceWorker, /userCacheName\(userId\)/)
  assert.match(serviceWorker, /VIDA_OFFLINE_CACHE_ROUTE/)
  assert.match(serviceWorker, /offlineFallbackResponse/)
  assert.match(serviceWorker, /respuestaNavegacionApp/)
  assert.match(serviceWorker, /url\.pathname\.startsWith\('\/api\/'\)/)
  assert.match(serviceWorker, /url\.hostname\.includes\('supabase\.co'\)/)
  assert.match(serviceWorker, /caches\.delete\(userCacheName\(previous\)\)/)
})

test('cliente PWA identifica sesión, calienta rutas y fuerza navegación de documento cuando está offline', () => {
  assert.match(pushSync, /supabase\.auth\.getSession\(\)/)
  assert.match(pushSync, /supabase\.auth\.onAuthStateChange/)
  assert.match(pushSync, /VIDA_BIBLE_NOTES_OWNER_SET_MESSAGE/)
  assert.match(pushSync, /VIDA_OFFLINE_CACHE_ROUTE/)
  assert.match(pushSync, /navigator\.onLine/)
  assert.match(pushSync, /window\.location\.assign\(url\.href\)/)
  assert.match(pushSync, /Sin conexión · usando datos guardados/)
})

test('cerrar sesión elimina la identidad offline y no se infiere otro propietario desde notas residuales', () => {
  assert.match(logoutButton, /VIDA_BIBLE_NOTES_OWNER_CLEAR_MESSAGE/)
  assert.match(serviceWorker, /clearActiveOwner/)
  assert.doesNotMatch(offlineNotebook, /resolverUnicoOwnerLocal/)
  assert.doesNotMatch(offlineNotebook, /VIDA_BIBLE_NOTES_USER_STORAGE_PREFIX/)
  assert.match(offlineNotebook, /No inferimos identidad a partir de notas residuales/)
})
