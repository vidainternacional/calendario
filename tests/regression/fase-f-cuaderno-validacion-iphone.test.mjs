import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const verseActions = fs.readFileSync('components/biblia/BibleVerseActionsPersistent.tsx', 'utf8')
const fixes = fs.readFileSync('app/notebook-fixes.css', 'utf8')
const offlinePage = fs.readFileSync('app/(app)/biblia/notas-offline/page.tsx', 'utf8')
const offlineWorkspace = fs.readFileSync('components/biblia/OfflineBibleNotesWorkspace.tsx', 'utf8')
const sw = fs.readFileSync('public/sw.js', 'utf8')

test('FASE F: crear nota desde Biblia escribe primero en el cuaderno canónico con versículo y contexto', () => {
  assert.match(verseActions, /agregarNotaBiblicaDelUsuario/)
  assert.match(verseActions, /contenido,/)
  assert.match(verseActions, /tipo: 'versiculo'/)
  assert.match(verseActions, /referencia,/)
  assert.match(verseActions, /pasajeNormalizado: normalizarReferencia\(referencia\)/)
  assert.match(verseActions, /contexto: \{ superficieOrigen: 'biblia' \}/)
  assert.match(verseActions, /await guardarNotaBiblica/)
  assert.doesNotMatch(verseActions, /const NOTAS_KEY = 'vida-biblia-notas-v2'/)
  assert.doesNotMatch(verseActions, /localStorage\.setItem\(NOTAS_KEY/)
})

test('FASE F: el editor no queda atrapado en un viewport fijo y reserva espacio real al final', () => {
  assert.match(fixes, /La nota usa el flujo natural del documento/)
  assert.match(fixes, /max-height: none/)
  assert.match(fixes, /padding-bottom: calc\(8rem \+ env\(safe-area-inset-bottom, 0px\)\) !important/)
  assert.match(fixes, /padding-bottom: calc\(6rem \+ env\(safe-area-inset-bottom, 0px\)\) !important/)
  assert.doesNotMatch(fixes, /overflow: hidden !important/)
})

test('FASE F: cold-start offline monta exactamente el mismo Cuaderno React y no una réplica visual', () => {
  assert.match(offlinePage, /dynamic = 'force-static'/)
  assert.match(offlineWorkspace, /BibleNotesWorkspace userId=\{ownerId\}/)
  assert.match(sw, /OFFLINE_NOTES_APP = '\/biblia\/notas-offline'/)
  assert.match(sw, /precacheOfflineNotesApp/)
  assert.match(sw, /cacheStaticAssetsFromHtml/)
  assert.match(sw, /Response\.redirect\(fallbackUrl\.toString\(\), 302\)/)
  assert.doesNotMatch(sw, /OFFLINE_NOTES_PARITY_STYLE|OFFLINE_NOTES_PARITY_SCRIPT|OFFLINE_NOTES_SHELL/)
})

test('FASE F: la paridad visual completa sigue sin cachear datos privados', () => {
  assert.match(sw, /url\.pathname\.startsWith\('\/api\/'\)/)
  assert.match(sw, /url\.hostname\.includes\('supabase\.co'\)/)
  assert.match(sw, /url\.pathname\.startsWith\('\/_next\/static\/'\)/)
  assert.match(sw, /if \(url\.pathname\.startsWith\('\/_next\/'\)\) return/)
  assert.doesNotMatch(sw, /notas_estudio/)
})
