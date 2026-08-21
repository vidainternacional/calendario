import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const words = fs.readFileSync('components/hebreo/ReadingWordsExplorer.tsx', 'utf8')
const route = fs.readFileSync('app/api/estudios/hebreo/palabras/route.ts', 'utf8')
const strictDictionary = fs.readFileSync('lib/hebreo/strict-word-dictionary.ts', 'utf8')
const translatorUi = fs.readFileSync('components/hebreo/HebrewTranslator.tsx', 'utf8')
const translatorRoute = fs.readFileSync('app/api/estudios/hebreo/traducir/route.ts', 'utf8')

test('FASE H: búsqueda española de Palabras usa diccionario estricto y nunca fallback contextual', () => {
  assert.match(route, /buscarPalabraEspanolaExactaEnDiccionario/)
  assert.match(route, /latinDictionarySearch/)
  assert.match(strictDictionary, /biblical_hebrew_spanish_glosses/)
  assert.match(strictDictionary, /\['verified_derived', 'manual_approved'\]/)
  assert.match(strictDictionary, /\.ilike\('display_gloss_es', query\)/)
  assert.doesNotMatch(strictDictionary, /contextualSpanishSearch|RV1909_SOURCE_ID|Relacionado con/)
  assert.match(words, /No encontramos esa palabra en el diccionario\./)
})

test('FASE H: swipe promueve la página ya cargada antes de preparar la nueva vecina', () => {
  assert.match(words, /function promoteLoadedPage\(target:CatalogResponse\)/)
  assert.match(words, /setPrevious\(result\);setResult\(target\);setNext\(null\)/)
  assert.match(words, /setNext\(result\);setResult\(target\);setPrevious\(null\)/)
  assert.match(words, /if\(previous\?\.page===target\)return promoteLoadedPage\(previous\)/)
  assert.match(words, /if\(next\?\.page===target\)return promoteLoadedPage\(next\)/)
  assert.match(words, /\[-webkit-overflow-scrolling:touch\]/)
  assert.match(words, /snap-x snap-mandatory/)
})

test('FASE H: traductor permite elegir explícitamente español o hebreo', () => {
  assert.match(translatorUi, /useState<Language>\('es'\)/)
  assert.match(translatorUi, /function swapDirection\(\)/)
  assert.match(translatorUi, /Cambiar dirección de traducción/)
  assert.match(translatorUi, /JSON\.stringify\(\{ text: value, sourceLanguage \}\)/)
  assert.match(translatorRoute, /body\.sourceLanguage === 'es' \|\| body\.sourceLanguage === 'he'/)
  assert.match(translatorRoute, /const target: Language = source === 'es' \? 'he' : 'es'/)
})

test('FASE H: voz hebrea prioriza una voz local he-IL y un ritmo más natural cuando existe', () => {
  assert.match(translatorUi, /function preferredHebrewVoice/)
  assert.match(translatorUi, /voice\.lang\.toLowerCase\(\) === 'he-il'/)
  assert.match(translatorUi, /voice\.localService/)
  assert.match(translatorUi, /utterance\.rate = 0\.84/)
  assert.match(translatorUi, /utterance\.pitch = 1/)
})
