import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const words = fs.readFileSync('components/hebreo/ReadingWordsExplorer.tsx', 'utf8')
const catalog = fs.readFileSync('lib/hebreo/word-catalog.ts', 'utf8')
const learning = fs.readFileSync('lib/hebreo/word-learning.ts', 'utf8')
const route = fs.readFileSync('app/api/estudios/hebreo/palabras/route.ts', 'utf8')
const dictionaryRoute = fs.readFileSync('app/api/estudios/hebreo/diccionario/route.ts', 'utf8')

test('FASE H: el detalle de palabra permite practicar con y sin niqqud', () => {
  assert.match(words, /type ReadingMode = 'nikud' \| 'plain'/)
  assert.match(words, /function withoutNiqqud/)
  assert.match(words, /Ocultar niqqud/)
  assert.match(words, /Mostrar niqqud/)
  assert.match(words, /El cambio afecta únicamente esta palabra abierta/)
})

test('FASE H: la vista principal conserva Lista y Tarjetas sin una tercera superficie redundante', () => {
  assert.match(words, /type WordView = 'list' \| 'cards'/)
  assert.match(words, /function PrimaryList/)
  assert.match(words, /function CardsView/)
  assert.doesNotMatch(words, /type WordView = 'cards' \| 'list' \| 'detail'/)
  assert.doesNotMatch(words, /function DetailView/)
})

test('FASE H: tocar una palabra abre la ficha de estudio dentro de la superficie actual', () => {
  assert.match(words, /function toggleWord\(word: CatalogWord\)/)
  assert.match(words, /setSelectedId\(current => \(current === word\.lexicalId \? null : word\.lexicalId\)\)/)
  assert.match(words, /<LearningDetail word=\{word\} onClose=\{\(\) => onToggle\(word\)\} \/>/)
  assert.match(words, /<LearningDetail word=\{selectedWord\} onClose=\{\(\) => onToggle\(selectedWord\)\} \/>/)
})

test('FASE H: ficha prioriza pronunciación significado y formación sin datos técnicos', () => {
  const detail = words.slice(words.indexOf('function LearningDetail'), words.indexOf('function PrimaryList'))
  for (const label of ['Cómo se pronuncia', 'Qué significa', 'Cómo se forma']) assert.match(detail, new RegExp(label))
  assert.match(detail, /formationParts\(word\.lemma\)/)
  assert.match(detail, /word\.meaningNoteEs/)
  assert.doesNotMatch(detail, /Fuente|Glosa de la fuente|sourceLocator|providerVersion|contentHash|strongNumber/)
})

test('FASE H: vocabulario se organiza por temas y categorías pedagógicas', () => {
  for (const label of ['Esenciales', 'Familia', 'Vida diaria', 'Naturaleza', 'Cuerpo y vida', 'Fe y conceptos', 'Acciones', 'Sustantivos', 'Verbos', 'Adjetivos', 'Todas']) assert.match(learning, new RegExp(label))
  assert.match(words, /HEBREW_LEARNING_GROUPS\.map/)
  assert.match(catalog, /lexicalIdsForLearningGroup/)
})

test('FASE H: búsqueda visible usa el diccionario exacto y conserva retorno al grupo', () => {
  assert.match(words, /placeholder="Buscar gato, casa, שלום…"/)
  assert.match(words, /\/api\/estudios\/hebreo\/diccionario\?q=/)
  assert.match(words, /No encontramos esa palabra en el diccionario\./)
  assert.match(words, /Volver al grupo/)
  assert.match(dictionaryRoute, /searchGeneralDictionary/)
})

test('FASE H: motor léxico conserva búsqueda hebrea sin niqqud y resolución derivada', () => {
  assert.match(catalog, /const HEBREW_MARKS/)
  assert.match(catalog, /function hebrewSearchPattern/)
  assert.match(catalog, /replace\(HEBREW_MARKS, ''\)/)
  assert.match(catalog, /from\('biblical_hebrew_search_resolutions'\)/)
  assert.match(catalog, /\.upsert\(payload/)
})

test('FASE H: catálogo navega por páginas discretas de hasta 60 entradas', () => {
  assert.match(words, /const PAGE_SIZE = 60/)
  assert.match(words, /const needsPagination = !searchResult && result\.totalPages > 1/)
  assert.match(words, /setPage\(value => Math\.max\(1, value - 1\)\)/)
  assert.match(words, /setPage\(value => Math\.min\(result\.totalPages, value \+ 1\)\)/)
  assert.match(words, /Anterior/)
  assert.match(words, /Siguiente/)
  assert.doesNotMatch(words, /snap-x snap-mandatory|translate3d/)
  assert.match(catalog, /return Math\.min\(Math\.max\(value as number, 12\), 60\)/)
})

test('FASE H: grupos didácticos aportan español sin reemplazar el catálogo completo', () => {
  assert.match(learning, /spanish: 'padre'/)
  assert.match(learning, /spanish: 'casa'/)
  assert.match(learning, /spanish: 'rey'/)
  assert.match(learning, /spanish: 'paz'/)
  assert.match(learning, /spanish: 'hacer'/)
  assert.match(catalog, /row\.display_gloss_es \?\? pedagogical\?\.spanish \?\? null/)
})

test('FASE H: endpoint mantiene sesión privada y acepta group', () => {
  assert.match(route, /url\.searchParams\.get\('group'\)/)
  assert.match(route, /result\.status === 'sin-sesion'/)
  assert.match(route, /status: 401/)
  assert.match(route, /'Cache-Control': 'private, no-store'/)
})

test('FASE H: Palabras no introduce audio ni persistencia local y limita escritura al índice derivado', () => {
  assert.doesNotMatch(words, /speechSynthesis|new Audio|Audio\(|localStorage|sessionStorage/)
  assert.match(catalog, /import \{ createServiceClient \} from '@\/lib\/supabase\/service'/)
  assert.match(catalog, /from\('biblical_hebrew_search_resolutions'\)/)
  assert.match(catalog, /\.upsert\(payload/)
  assert.doesNotMatch(catalog, /from\('biblical_lexical_entries'\)[\s\S]{0,500}\.(?:insert|update|delete|upsert)\(/)
  assert.doesNotMatch(catalog, /profile_id|user_id|auth\.uid/)
})
