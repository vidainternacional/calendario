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
  assert.match(learning, /Catálogo hebreo aprobado completo/)
  assert.match(catalog, /from\('biblical_lexical_entries'\)/)
})

test('FASE H: Palabras practica niqqud dentro de la ficha abierta', () => {
  assert.match(words, /type ReadingMode = 'nikud' \| 'plain'/)
  assert.match(words, /function withoutNiqqud/)
  assert.match(words, /Ocultar niqqud/)
  assert.match(words, /Mostrar niqqud/)
  assert.match(words, /El cambio afecta únicamente esta palabra abierta/)
})

test('FASE H: Palabras usa Lista y Tarjetas con detalle expandible y paginación discreta', () => {
  assert.match(words, /type WordView = 'list' \| 'cards'/)
  assert.match(words, /function PrimaryList/)
  assert.match(words, /function CardsView/)
  assert.match(words, /function LearningDetail/)
  assert.match(words, /function toggleWord/)
  assert.match(words, /const PAGE_SIZE = 60/)
  assert.match(words, /const needsPagination = !searchResult && result\.totalPages > 1/)
  assert.doesNotMatch(words, /snap-x snap-mandatory|function DetailView|function PageControl/)
})

test('FASE H: ficha de Palabras elimina información técnica y explica formación', () => {
  const detail = words.slice(words.indexOf('function LearningDetail'), words.indexOf('function PrimaryList'))
  assert.match(detail, /Cómo se pronuncia/)
  assert.match(detail, /Cómo se forma/)
  assert.match(detail, /Qué significa/)
  assert.doesNotMatch(detail, /Fuente|Glosa de la fuente|Strong|sourceLocator|providerVersion|contentHash/)
})

test('FASE H: Palabras se agrupa por temas y español preparado', () => {
  for (const label of ['Más comunes', 'Conectores', 'Preposiciones', 'Sujetos y pronombres', 'Personas y familia', 'Cosas y vida diaria', 'Naturaleza', 'Cuerpo y vida', 'Biblia y fe', 'Acciones']) assert.match(learning, new RegExp(label))
  assert.match(learning, /spanish: 'padre'/)
  assert.match(learning, /spanish: 'agua'/)
  assert.match(learning, /spanish: 'Dios'/)
  assert.match(learning, /spanish: 'decir'/)
})

test('FASE H: búsqueda visible usa diccionario exacto y al limpiar vuelve al grupo', () => {
  assert.match(words, /placeholder="Buscar gato, casa, שלום…"/)
  assert.match(words, /\/api\/estudios\/hebreo\/diccionario\?q=/)
  assert.match(words, /function clearSearch\(\)/)
  assert.match(words, /setSearchResult\(null\)/)
  assert.match(words, /Volver al grupo/)
})

test('FASE H: motor léxico conserva rutas hebrea transliteración Strong y contextual como resolución interna', () => {
  assert.match(catalog, /hebrewSearchPattern/)
  assert.match(catalog, /transliteration/)
  assert.match(catalog, /strong/)
  assert.match(catalog, /contextualSpanishSearch/)
  assert.match(catalog, /biblical_hebrew_search_resolutions/)
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

test('FASE H: Palabras y Lectura no persisten estado local; Palabras solo escribe índice derivado', () => {
  for (const content of [words, reading]) assert.doesNotMatch(content, /localStorage|sessionStorage/)
  assert.doesNotMatch(readingCatalog, /\.insert\(|\.update\(|\.delete\(|\.upsert\(/)
  assert.match(catalog, /from\('biblical_hebrew_search_resolutions'\)/)
  assert.match(catalog, /\.upsert\(payload/)
  assert.doesNotMatch(catalog, /from\('biblical_lexical_entries'\)[\s\S]{0,500}\.(?:insert|update|delete|upsert)\(/)
})
