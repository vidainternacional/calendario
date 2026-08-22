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
  ]) assert.ok(dictionary.includes(marker), `Falta marcador léxico: ${marker}`)
  assert.match(dictionary, /normalize\(entry\.spanish\) === needle/)
  assert.match(dictionary, /stripNiqqud\(entry\.hebrew\) === hebrewNeedle/)
  assert.match(dictionary, /source: 'curated-pilot'/)
  assert.doesNotMatch(dictionary, /source: 'kaikki-core'/)
  assert.doesNotMatch(dictionary, /Relacionado con|contextualSpanishSearch|rv1909-context/)
})

test('FASE H diccionario general: endpoint exige sesión y usa la capa general separada', () => {
  assert.match(route, /supabase\.auth\.getUser\(\)/)
  assert.match(route, /searchGeneralDictionary/)
  assert.match(route, /status: 401/)
  assert.match(route, /item\.source === 'curated-pilot'/)
  assert.doesNotMatch(route, /word-catalog|contextualSpanishSearch|biblical_verse_texts/)
})

test('FASE H diccionario general: UI distingue buscar del catálogo y nunca inventa una coincidencia', () => {
  assert.match(explorer, /\/api\/estudios\/hebreo\/diccionario\?q=/)
  assert.match(explorer, /No encontramos esa palabra en el diccionario\./)
  assert.match(explorer, /Volver al grupo/)
  assert.match(explorer, /Buscar gato, casa, שלום…/)
  assert.doesNotMatch(explorer, /contextualSpanishSearch|Relacionado con «/)
})

test('FASE H pager: usa navegación discreta y evita el carrusel horizontal que producía superficies vecinas', () => {
  assert.match(explorer, /const PAGE_SIZE = 60/)
  assert.match(explorer, /const needsPagination = !searchResult && result\.totalPages > 1/)
  assert.match(explorer, /setPage\(value => Math\.max\(1, value - 1\)\)/)
  assert.match(explorer, /setPage\(value => Math\.min\(result\.totalPages, value \+ 1\)\)/)
  assert.match(explorer, /Anterior/)
  assert.match(explorer, /Siguiente/)
  assert.doesNotMatch(explorer, /w-\[300%\]|translate3d|snap-x snap-mandatory/)
})
