import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const words = fs.readFileSync('components/hebreo/ReadingWordsExplorer.tsx', 'utf8')
const reading = fs.readFileSync('components/hebreo/ReadingSentencesExplorer.tsx', 'utf8')
const catalog = fs.readFileSync('lib/hebreo/word-catalog.ts', 'utf8')
const readingCatalog = fs.readFileSync('lib/hebreo/reading-catalog.ts', 'utf8')
const learning = fs.readFileSync('lib/hebreo/word-learning.ts', 'utf8')
const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')

test('FASE H: Aprender separa Palabras de Lectura como módulos reales', () => {
  assert.match(home, /import ReadingWordsExplorer/)
  assert.match(home, /import ReadingSentencesExplorer/)
  assert.match(home, /id: 'vocabulary',[\s\S]*?short: 'Palabras'[\s\S]*?available: true/)
  assert.match(home, /id: 'reading',[\s\S]*?short: 'Lectura'[\s\S]*?available: true/)
  assert.match(home, /activeSection\.id === 'vocabulary' \? <ReadingWordsExplorer \/>/)
  assert.match(home, /activeSection\.id === 'reading' \? <ReadingSentencesExplorer \/>/)
})

test('FASE H: Palabras conserva catálogo completo pero inicia con vocabulario esencial', () => {
  assert.doesNotMatch(words, /const WORDS:/)
  assert.match(words, /useState<HebrewLearningGroupId>\('essentials'\)/)
  assert.match(learning, /id: 'all'/)
  assert.match(learning, /Acceso al catálogo hebreo aprobado completo/)
  assert.match(catalog, /from\('biblical_lexical_entries'\)/)
})

test('FASE H: Palabras distingue con niqqud y sin niqqud sin ayuda redundante', () => {
  assert.match(words, /type ReadingMode = 'nikud' \| 'plain'/)
  assert.match(words, /label: 'Con niqqud'/)
  assert.match(words, /label: 'Sin niqqud'/)
  assert.doesNotMatch(words, /label: 'Con ayuda'/)
  assert.match(words, /function withoutNiqqud/)
})

test('FASE H: Palabras usa tarjetas lista detalle y páginas de vocabulario', () => {
  assert.match(words, /type WordView = 'cards' \| 'list' \| 'detail'/)
  assert.match(words, /function CardsView/)
  assert.match(words, /function ListView/)
  assert.match(words, /function DetailView/)
  assert.match(words, /function toggleCard/)
  assert.match(words, /function PageControl/)
  assert.match(words, /pageSize: '24'/)
})

test('FASE H: ficha de Palabras elimina información técnica y explica formación', () => {
  const detail = words.slice(words.indexOf('function LearningDetail'), words.indexOf('function CardsView'))
  assert.match(detail, /Cómo se pronuncia/)
  assert.match(detail, /Cómo se forma/)
  assert.match(detail, /Qué significa/)
  assert.doesNotMatch(detail, /Fuente|Glosa de la fuente|Strong|sourceLocator|providerVersion|contentHash/)
})

test('FASE H: Palabras se agrupa por temas y español preparado', () => {
  for (const label of ['Esenciales', 'Familia', 'Vida diaria', 'Naturaleza', 'Cuerpo y vida', 'Fe y conceptos', 'Acciones']) assert.match(learning, new RegExp(label))
  assert.match(learning, /spanish: 'padre'/)
  assert.match(learning, /spanish: 'agua'/)
  assert.match(learning, /spanish: 'Dios'/)
  assert.match(learning, /spanish: 'decir'/)
})

test('FASE H: búsqueda de Palabras es global y al borrar restaura la página previa', () => {
  assert.match(words, /placeholder="Buscar en español o hebreo"/)
  assert.match(words, /if \(value === '' && search\) clearSearch\(\)/)
  assert.match(words, /setPage\(pageBeforeSearch\.current\)/)
  assert.match(catalog, /if \(!search\) \{/)
  assert.match(catalog, /Script=Hebrew/)
  assert.match(catalog, /test\(search\)/)
  assert.match(catalog, /contextualSpanishSearch/)
  assert.match(catalog, /transliterationSearch/)
  const noSearch = catalog.indexOf('if (!search) {')
  const hebrewSearch = catalog.indexOf('Script=Hebrew')
  assert.ok(noSearch >= 0 && hebrewSearch > noSearch)
})

test('FASE H: Lectura usa frases y oraciones reales con corpus paginado', () => {
  assert.match(reading, /Lectura de frases y oraciones/)
  for (const label of ['Iniciales', 'Cortas', 'Medias', 'Largas', 'Todas']) assert.match(reading, new RegExp(label))
  assert.match(reading, /Buscar frase en español o hebreo/)
  assert.match(reading, /function Pagination/)
  assert.match(readingCatalog, /from\('biblical_verse_texts'\)/)
  assert.match(readingCatalog, /RV1909_SOURCE_ID/)
  assert.match(readingCatalog, /STARTER_REFERENCES/)
})

test('FASE H: Palabras y Lectura no introducen audio ni persistencia local; Palabras solo escribe índice derivado', () => {
  for (const content of [words, reading]) assert.doesNotMatch(content, /speechSynthesis|new Audio|Audio\(|localStorage|sessionStorage/)
  assert.doesNotMatch(readingCatalog, /\.insert\(|\.update\(|\.delete\(|\.upsert\(/)
  assert.match(catalog, /from\('biblical_hebrew_search_resolutions'\)/)
  assert.match(catalog, /\.upsert\(payload/)
  assert.doesNotMatch(catalog, /from\('biblical_lexical_entries'\)[\s\S]{0,500}\.(?:insert|update|delete|upsert)\(/)
})
