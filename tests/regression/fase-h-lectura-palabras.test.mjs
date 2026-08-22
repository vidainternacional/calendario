import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const words = fs.readFileSync('components/hebreo/ReadingWordsExplorer.tsx', 'utf8')
const reading = fs.readFileSync('components/hebreo/HebrewBibleReader.tsx', 'utf8')
const catalog = fs.readFileSync('lib/hebreo/word-catalog.ts', 'utf8')
const readingRoute = fs.readFileSync('app/api/estudios/hebreo/biblia/route.ts', 'utf8')
const learning = fs.readFileSync('lib/hebreo/word-learning.ts', 'utf8')
const course = fs.readFileSync('components/hebreo/HebrewCourseCenter.tsx', 'utf8')

test('FASE H: Aprender separa Palabras de Lectura como módulos reales', () => {
  assert.match(course, /import HebrewBibleReader/)
  assert.match(course, /import HebrewWordsStudy/)
  assert.match(course, /id: 'vocabulary',[\s\S]*?title: 'Palabras y frases'/)
  assert.match(course, /id: 'reading',[\s\S]*?title: 'Lectura bíblica'/)
  assert.match(course, /if \(id === 'vocabulary'\) return <HebrewWordsStudy \/>/)
  assert.match(course, /if \(id === 'reading'\) return <HebrewBibleReader \/>/)
})

test('FASE H: Palabras conserva catálogo completo pero inicia con vocabulario esencial', () => {
  assert.doesNotMatch(words, /const WORDS:/)
  assert.match(words, /useState<HebrewLearningGroupId>\('essentials'\)/)
  assert.match(learning, /id: 'all'/)
  assert.match(learning, /Catálogo hebreo aprobado completo\. La búsqueda sigue disponible para llegar directamente a una palabra\./)
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

test('FASE H: Lectura usa Biblia real con versículos conocidos y navegación canónica', () => {
  assert.match(reading, /Lectura bíblica/)
  assert.match(reading, /Practica versículos conocidos o abre la Biblia en orden por libro y capítulo\./)
  for (const label of ['Génesis 1:1', 'Shemá · Dt 6:4', 'Salmo 23:1']) assert.match(reading, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.match(reading, /HEBREW_BIBLE_BOOKS\.map/)
  assert.match(reading, /showSpanish/)
  assert.match(readingRoute, /from\('biblical_verse_texts'\)/)
  assert.match(readingRoute, /RV1909_SOURCE_ID/)
  assert.match(readingRoute, /\.order\('verse', \{ ascending: true \}\)/)
})

test('FASE H: Palabras y Lectura no persisten estado local; Palabras solo escribe índice derivado', () => {
  for (const content of [words, reading]) assert.doesNotMatch(content, /localStorage|sessionStorage/)
  assert.doesNotMatch(readingRoute, /\.insert\(|\.update\(|\.delete\(|\.upsert\(/)
  assert.match(catalog, /from\('biblical_hebrew_search_resolutions'\)/)
  assert.match(catalog, /\.upsert\(payload/)
  assert.doesNotMatch(catalog, /from\('biblical_lexical_entries'\)[\s\S]{0,500}\.(?:insert|update|delete|upsert)\(/)
})
