import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const offlinePage = fs.readFileSync('app/(app)/biblia/notas-offline/page.tsx', 'utf8')
const offlineWorkspace = fs.readFileSync('components/biblia/OfflineBibleNotesWorkspace.tsx', 'utf8')
const workspace = fs.readFileSync('components/biblia/BibleNotesWorkspace.tsx', 'utf8')
const sw = fs.readFileSync('public/sw.js', 'utf8')
const proxy = fs.readFileSync('proxy.ts', 'utf8')

test('FASE F: el cold-start offline usa el mismo Cuaderno React aprobado online', () => {
  assert.match(offlinePage, /dynamic = 'force-static'/)
  assert.match(offlinePage, /OfflineBibleNotesWorkspace/)
  assert.match(offlineWorkspace, /BibleNotesWorkspace userId=\{ownerId\}/)
  assert.match(offlineWorkspace, /OfflineNotesOwnerMarker userId=\{ownerId\}/)
  assert.match(workspace, /Buscar en todo el cuaderno/)
  assert.doesNotMatch(offlineWorkspace, /<textarea|id="format-tools"|data-origin=/)
})

test('FASE F: la identidad offline sigue ligada al dueño local validado', () => {
  assert.match(offlineWorkspace, /VIDA_BIBLE_NOTES_ACTIVE_OWNER_KEY/)
  assert.match(offlineWorkspace, /OWNER_UUID_RE/)
  assert.match(offlineWorkspace, /resolverUsuarioActualNotas/)
  assert.match(proxy, /biblia\/notas-offline/)
})

test('FASE F/G: el service worker mantiene un shell React público versionado y sus bundles estáticos', () => {
  assert.match(sw, /CACHE_VERSION = 'v2\.4-app-offline'/)
  assert.match(sw, /CACHE_NAME = `vida-shell-\$\{CACHE_VERSION\}`/)
  assert.match(sw, /OFFLINE_NOTES_APP = '\/biblia\/notas-offline'/)
  assert.match(sw, /precacheOfflineNotesApp/)
  assert.match(sw, /cacheStaticAssetsFromHtml/)
  assert.match(sw, /\/_next\/static\//)
  assert.doesNotMatch(sw, /OFFLINE_NOTES_PARITY_STYLE|OFFLINE_NOTES_PARITY_SCRIPT|OFFLINE_NOTES_SHELL/)
})

test('FASE F/G: el shell no cachea notas, API ni respuestas privadas de Supabase', () => {
  assert.match(sw, /url\.pathname\.startsWith\('\/api\/'\)/)
  assert.match(sw, /url\.hostname\.includes\('supabase\.co'\)/)
  assert.match(sw, /url\.pathname\.startsWith\('\/_next\/static\/'\)/)
  assert.match(sw, /if \(url\.pathname\.startsWith\('\/_next\/'\)\) return/)
  assert.match(sw, /USER_CACHE_PREFIX/)
  assert.match(sw, /userCacheName\(userId\)/)
  assert.doesNotMatch(sw, /notas_estudio/)
})
