import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const glosses = await readFile(new URL('../../lib/hebreo/spanish-glosses.ts', import.meta.url), 'utf8')
const words = await readFile(new URL('../../components/hebreo/ReadingWordsExplorer.tsx', import.meta.url), 'utf8')

test('Palabras resuelve el UUID interno antes de leer la glosa española', () => {
  assert.match(glosses, /\.from\('biblical_lexical_entries'\)/)
  assert.match(glosses, /\.select\('id, lexical_id'\)/)
  assert.match(glosses, /uuidByLexicalId/)
  assert.match(glosses, /lexicalIdByUuid/)
  assert.match(glosses, /\.from\('biblical_hebrew_spanish_glosses'\)/)
  assert.match(glosses, /\.in\('lexical_entry_id', entryIds\)/)
  assert.doesNotMatch(glosses, /\.in\('lexical_entry_id', lexicalIds\)/)
})

test('un placeholder contextual nunca bloquea la glosa española final', () => {
  assert.match(glosses, /CONTEXTUAL_SPANISH_PLACEHOLDER/)
  assert.match(glosses, /hasFinalSpanish/)
  assert.match(glosses, /!CONTEXTUAL_SPANISH_PLACEHOLDER\.test\(value\)/)
  assert.match(glosses, /if \(hasFinalSpanish\(item\.spanish\)\) return item/)
})

test('las fichas usan español real y no exponen Español pendiente', () => {
  assert.match(words, /spanishFor\(word\)/)
  assert.match(words, /Buscar en español o hebreo/)
  assert.match(words, /diccionario visual/)
  assert.doesNotMatch(words, /Español pendiente/)
})

test('el catálogo pagina con scroll horizontal nativo y snap', () => {
  assert.match(words, /snap-x snap-mandatory/)
  assert.match(words, /overflow-x-auto/)
  assert.match(words, /-webkit-overflow-scrolling:touch/)
  assert.match(words, /onScroll=\{handleCarouselScroll\}/)
  assert.doesNotMatch(words, /swipeOffset|translate3d/)
})
