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

test('las fichas de Palabras siguen mostrando la glosa española del diccionario', () => {
  assert.match(words, /spanishFor\(word\)/)
  assert.match(words, /Buscar en español o hebreo/)
  assert.match(words, /diccionario visual/)
})
