import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const sw = fs.readFileSync('public/sw.js', 'utf8')
const shell = fs.readFileSync('public/offline/notas.html', 'utf8')
const page = fs.readFileSync('app/(app)/biblia/notas/page.tsx', 'utf8')
const logout = fs.readFileSync('components/auth/LogoutButton.tsx', 'utf8')
const marker = fs.readFileSync('components/biblia/OfflineNotesOwnerMarker.tsx', 'utf8')
const proxy = fs.readFileSync('proxy.ts', 'utf8')

test('el service worker usa fallback offline solo para Biblia Notas', () => {
  assert.match(sw, /OFFLINE_NOTES_SHELL = '\/offline\/notas\.html'/)
  assert.match(sw, /pathname === '\/biblia\/notas'/)
  assert.match(sw, /fetch\(event\.request\)\.catch/)
  assert.match(sw, /cache\.match\(OFFLINE_NOTES_SHELL\)/)
  assert.match(sw, /url\.pathname\.startsWith\('\/api\/'\)/)
  assert.match(sw, /url\.pathname\.startsWith\('\/_next\/'\)/)
  assert.match(sw, /url\.hostname\.includes\('supabase\.co'\)/)
})

test('el shell offline no incluye datos privados y usa la caché y cola canónicas', () => {
  assert.match(shell, /vida-biblia-notas-active-owner-v1/)
  assert.match(shell, /vida-biblia-notas-v3/)
  assert.match(shell, /vida-biblia-notas-sync-v1/)
  assert.match(shell, /ownerId/)
  assert.match(shell, /tipo: 'upsert'/)
  assert.match(shell, /tipo: 'delete'/)
  assert.doesNotMatch(shell, /supabase\.co/i)
  assert.doesNotMatch(shell, /notas_estudio/i)
  assert.doesNotMatch(shell, /\/_next\//)
})

test('solo el shell estático offline queda fuera del proxy autenticado', () => {
  assert.match(proxy, /offline\/notas\\\\\.html/)
  assert.doesNotMatch(proxy, /biblia\/notas/)
})

test('la ruta autenticada recuerda el dueño y logout lo olvida', () => {
  assert.match(page, /OfflineNotesOwnerMarker userId=\{user\.id\}/)
  assert.match(marker, /localStorage\.setItem\(VIDA_BIBLE_NOTES_ACTIVE_OWNER_KEY, userId\)/)
  assert.match(logout, /localStorage\.removeItem\(VIDA_BIBLE_NOTES_ACTIVE_OWNER_KEY\)/)
})
