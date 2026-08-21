import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const dictionary = await readFile(new URL('../../lib/hebreo/general-dictionary.ts', import.meta.url), 'utf8')
const route = await readFile(new URL('../../app/api/estudios/hebreo/diccionario/route.ts', import.meta.url), 'utf8')
const explorer = await readFile(new URL('../../components/hebreo/ReadingWordsExplorer.tsx', import.meta.url), 'utf8')

test('FASE H diccionario general: incluye vocabulario común exacto sin aproximaciones contextuales', () => {
  for (const marker of [
    "hebrew: 'חָתוּל'",
    "spanish: 'gato'",
    "hebrew: 'כֶּלֶב'",
    "spanish: 'perro'",
    "hebrew: 'בַּיִת'",
    "spanish: 'casa'",
    "hebrew: 'אֶבֶן'",
    "spanish: 'piedra'",
    "hebrew: 'מֶלֶךְ'",
    "spanish: 'rey'",
    "hebrew: 'שָׁלוֹם'",
    "spanish: 'paz'",
  ]) assert.match(dictionary, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.match(dictionary, /normalize\(entry\.spanish\) === needle/)
  assert.match(dictionary, /stripNiqqud\(entry\.hebrew\) === hebrewNeedle/)
  assert.doesNotMatch(dictionary, /Relacionado con|contextualSpanishSearch|rv1909-context/)
})

test('FASE H diccionario general: endpoint exige sesión y usa la capa general separada', () => {
  assert.match(route, /supabase\.auth\.getUser\(\)/)
  assert.match(route, /searchGeneralDictionary/)
  assert.match(route, /status: 401/)
  assert.doesNotMatch(route, /word-catalog|contextualSpanishSearch|biblical_verse_texts/)
})

test('FASE H diccionario general: UI distingue buscar del catálogo y nunca inventa una coincidencia', () => {
  assert.match(explorer, /\/api\/estudios\/hebreo\/diccionario\?q=/)
  assert.match(explorer, /No encontramos esa palabra en el diccionario\./)
  assert.match(explorer, /Volver al catálogo/)
  assert.match(explorer, /coincidencias exactas/)
})

test('FASE H pager: precarga varias páginas, activa cache al terminar y recorta cada superficie', () => {
  assert.match(explorer, /PREFETCH_FORWARD = 5/)
  assert.match(explorer, /PREFETCH_BACK = 2/)
  assert.match(explorer, /cacheRef\.current\.set\(target,data\)/)
  assert.match(explorer, /bumpCache\(version=>version\+1\)/)
  assert.match(explorer, /w-\[300%\]/)
  assert.match(explorer, /w-1\/3 shrink-0 overflow-hidden/)
  assert.match(explorer, /touch-pan-y/)
  assert.match(explorer, /translate3d/)
})
