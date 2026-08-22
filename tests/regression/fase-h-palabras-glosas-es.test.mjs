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
  assert.match(words, /splitMeanings\(word\.spanish\)/)
  assert.match(words, /Significado en revisión/)
  assert.match(words, /placeholder="Buscar gato, casa, שלום…"/)
  assert.match(words, /Diccionario para aprender/)
  assert.doesNotMatch(words, /Español pendiente/)
})

test('el catálogo usa paginación discreta y evita el carrusel horizontal anterior', () => {
  assert.match(words, /const PAGE_SIZE = 60/)
  assert.match(words, /const needsPagination = !searchResult && result\.totalPages > 1/)
  assert.match(words, /Anterior/)
  assert.match(words, /Siguiente/)
  assert.doesNotMatch(words, /snap-x snap-mandatory|handleCarouselScroll|swipeOffset|translate3d/)
})
