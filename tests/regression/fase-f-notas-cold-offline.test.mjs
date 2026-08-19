import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const sw = fs.readFileSync('public/sw.js', 'utf8')
const legacyShell = fs.readFileSync('public/offline/notas.html', 'utf8')
const offlinePage = fs.readFileSync('app/(app)/biblia/notas-offline/page.tsx', 'utf8')
const offlineWorkspace = fs.readFileSync('components/biblia/OfflineBibleNotesWorkspace.tsx', 'utf8')
const page = fs.readFileSync('app/(app)/biblia/notas/page.tsx', 'utf8')
const logout = fs.readFileSync('components/auth/LogoutButton.tsx', 'utf8')
const marker = fs.readFileSync('components/biblia/OfflineNotesOwnerMarker.tsx', 'utf8')
const proxy = fs.readFileSync('proxy.ts', 'utf8')

test('el service worker usa el Cuaderno React real como fallback solo para Biblia Notas', () => {
  assert.match(sw, /OFFLINE_NOTES_APP = '\/biblia\/notas-offline'/)
  assert.match(sw, /pathname === '\/biblia\/notas'/)
  assert.match(sw, /respuestaNotasPrincipal/)
  assert.match(sw, /respuestaOfflineNotesApp/)
  assert.match(sw, /Response\.redirect\(fallbackUrl\.toString\(\), 302\)/)
  assert.match(sw, /url\.pathname\.startsWith\('\/api\/'\)/)
  assert.match(sw, /url\.pathname\.startsWith\('\/_next\/'\)/)
  assert.match(sw, /url\.hostname\.includes\('supabase\.co'\)/)
  assert.doesNotMatch(sw, /OFFLINE_NOTES_SHELL|respuestaNotasOffline/)
})

test('la pantalla offline comparte el workspace canónico y el HTML legado deja de ser fallback activo', () => {
  assert.match(offlinePage, /dynamic = 'force-static'/)
  assert.match(offlinePage, /OfflineBibleNotesWorkspace/)
  assert.match(offlineWorkspace, /BibleNotesWorkspace userId=\{ownerId\}/)
  assert.doesNotMatch(sw, /\/offline\/notas\.html/)
  assert.match(legacyShell, /vida-biblia-notas-v3/)
  assert.doesNotMatch(legacyShell, /supabase\.co/i)
  assert.doesNotMatch(legacyShell, /notas_estudio/i)
})

test('FASE G: el bootstrap React exige dueño activo o sesión y no infiere identidad desde notas residuales', () => {
  assert.match(offlineWorkspace, /VIDA_BIBLE_NOTES_ACTIVE_OWNER_KEY/)
  assert.match(offlineWorkspace, /OWNER_UUID_RE/)
  assert.match(offlineWorkspace, /resolverUsuarioActualNotas/)
  assert.match(offlineWorkspace, /setOwnerId\(null\)/)
  assert.doesNotMatch(offlineWorkspace, /VIDA_BIBLE_NOTES_USER_STORAGE_PREFIX/)
  assert.doesNotMatch(offlineWorkspace, /function resolverUnicoOwnerLocal/)
})

test('el service worker respalda solo el UUID activo y nunca guarda el contenido de las notas', () => {
  assert.match(sw, /OFFLINE_NOTES_OWNER_MARKER = '\/offline\/notas-owner'/)
  assert.match(sw, /VIDA_NOTES_OWNER_SET/)
  assert.match(sw, /VIDA_NOTES_OWNER_CLEAR/)
  assert.match(sw, /OWNER_UUID_RE\.test/)
  assert.match(sw, /cache\.put\(OFFLINE_NOTES_OWNER_MARKER/)
  assert.doesNotMatch(sw, /vida-biblia-notas-v3/)
  assert.doesNotMatch(sw, /vida-biblia-notas-sync-v1/)
  assert.doesNotMatch(sw, /notas_estudio/)
})

test('solo la ruta React pública de soporte offline queda fuera del proxy, no Biblia Notas autenticada', () => {
  assert.match(proxy, /biblia\/notas-offline/)
  assert.doesNotMatch(proxy, /\|biblia\/notas\|/)
  assert.match(offlineWorkspace, /OfflineNotesOwnerMarker userId=\{ownerId\}/)
})

test('la ruta autenticada recuerda el dueño y logout lo olvida en ambos almacenamientos', () => {
  assert.match(page, /OfflineNotesOwnerMarker userId=\{user\.id\}/)
  assert.match(marker, /localStorage\.setItem\(VIDA_BIBLE_NOTES_ACTIVE_OWNER_KEY, userId\)/)
  assert.match(marker, /VIDA_BIBLE_NOTES_OWNER_SET_MESSAGE/)
  assert.match(marker, /controllerchange/)
  assert.match(logout, /localStorage\.removeItem\(VIDA_BIBLE_NOTES_ACTIVE_OWNER_KEY\)/)
  assert.match(logout, /VIDA_BIBLE_NOTES_OWNER_CLEAR_MESSAGE/)
})
