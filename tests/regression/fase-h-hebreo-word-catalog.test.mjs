import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const words = fs.readFileSync('components/hebreo/ReadingWordsExplorer.tsx', 'utf8')
const catalog = fs.readFileSync('lib/hebreo/word-catalog.ts', 'utf8')
const learning = fs.readFileSync('lib/hebreo/word-learning.ts', 'utf8')
const route = fs.readFileSync('app/api/estudios/hebreo/palabras/route.ts', 'utf8')

test('FASE H: palabras diferencia únicamente con niqqud y sin niqqud', () => {
  assert.match(words, /type ReadingMode = 'nikud' \| 'plain'/)
  assert.match(words, /label: 'Con niqqud'/)
  assert.match(words, /label: 'Sin niqqud'/)
  assert.doesNotMatch(words, /label: 'Con ayuda'/)
  assert.match(words, /function withoutNiqqud/)
})

test('FASE H: tarjetas muestran hebreo pronunciación y español sin Strong visible', () => {
  const cards = words.slice(words.indexOf('function CardsView'), words.indexOf('function ListView'))
  assert.match(cards, /<WordText/)
  assert.match(cards, /pronunciationFor\(word\)/)
  assert.match(cards, /spanishFor\(word\)/)
  assert.doesNotMatch(cards, /strongNumber|Abrir detalle|Ver detalle|Glosa fuente/)
  assert.match(cards, /chunkWords\(words, 2\)/)
  assert.match(cards, /<LearningDetail word=\{selected\} mode=\{mode\} compact \/>/)
})

test('FASE H: tocar tarjeta expande en su fila y no cambia a vista detalle', () => {
  assert.match(words, /function toggleCard\(word: CatalogWord\)/)
  assert.match(words, /setClosingId\(word\.lexicalId\)/)
  const toggle = words.slice(words.indexOf('function toggleCard'), words.indexOf('function changeView'))
  assert.doesNotMatch(toggle, /setView\('detail'\)/)
})

test('FASE H: lista queda simple con pronunciación debajo y español a la derecha', () => {
  const list = words.slice(words.indexOf('function ListView'), words.indexOf('function DetailView'))
  assert.match(list, /<WordText/)
  assert.match(list, /pronunciationFor\(word\)/)
  assert.match(list, /spanishFor\(word\)/)
  assert.match(list, /text-right/)
  assert.doesNotMatch(list, /button|Ver detalle|Glosa fuente|strongNumber/)
})

test('FASE H: detalle prioriza escritura pronunciación formación y significado', () => {
  const detail = words.slice(words.indexOf('function LearningDetail'), words.indexOf('function CardsView'))
  for (const label of ['Cómo se pronuncia', 'Cómo se forma', 'Qué significa']) assert.match(detail, new RegExp(label))
  assert.match(detail, /formationParts\(word\.lemma\)/)
  assert.match(detail, /word\.meaningNoteEs/)
  assert.doesNotMatch(detail, /Fuente|Glosa de la fuente|sourceLocator|providerVersion|contentHash|strongNumber|Sustantivo|Verbo|Adjetivo/)
})

test('FASE H: vocabulario se organiza por temas y categorías gramaticales', () => {
  for (const label of ['Esenciales', 'Familia', 'Vida diaria', 'Naturaleza', 'Cuerpo y vida', 'Fe y conceptos', 'Acciones', 'Sustantivos', 'Verbos', 'Adjetivos', 'Todas']) assert.match(learning, new RegExp(label))
  assert.match(words, /HEBREW_LEARNING_GROUPS\.map/)
  assert.match(catalog, /lexicalIdsForLearningGroup/)
})

test('FASE H: búsqueda acepta español y hebreo y restaurar vacío devuelve listado anterior', () => {
  assert.match(words, /placeholder="Buscar en español o hebreo"/)
  assert.match(catalog, /lexicalIdsForSpanishSearch\(search\)/)
  assert.match(catalog, /hebrewSearchPattern\(search\)/)
  assert.match(words, /const pageBeforeSearch = useRef\(1\)/)
  assert.match(words, /if \(value === '' && search\) clearSearch\(\)/)
  assert.match(words, /setPage\(pageBeforeSearch\.current\)/)
})

test('FASE H: búsqueda española amplía recuperación mediante contexto RV1909', () => {
  assert.match(catalog, /function contextualSpanishSearch/)
  assert.match(catalog, /RV1909_SOURCE_ID/)
  assert.match(catalog, /from\('biblical_verse_texts'\)/)
  assert.match(catalog, /from\('biblical_word_occurrences'\)/)
  assert.match(catalog, /Relacionado con «\$\{search\}»/)
  assert.match(catalog, /No se presenta como equivalencia uno-a-uno/)
})

test('FASE H: búsqueda hebrea funciona aunque el usuario omita niqqud', () => {
  assert.match(catalog, /const HEBREW_MARKS/)
  assert.match(catalog, /function hebrewSearchPattern/)
  assert.match(catalog, /replace\(HEBREW_MARKS, ''\)/)
  assert.match(catalog, /Array\.from\(consonants\)\.join\('%'\)/)
})

test('FASE H: catálogo muestra navegación de página arriba y abajo', () => {
  assert.match(words, /function PageControl/)
  assert.match(words, /Página \{result\.page\}/)
  assert.match(words, /Cada página muestra 24 palabras/)
  assert.ok((words.match(/<PageControl result=\{result\}/g) ?? []).length >= 2)
  assert.match(catalog, /count: 'exact'/)
  assert.match(catalog, /\.range\(offset, offset \+ pageSize - 1\)/)
})

test('FASE H: grupos didácticos aportan español sin reemplazar el catálogo completo', () => {
  assert.match(learning, /spanish: 'padre'/)
  assert.match(learning, /spanish: 'casa'/)
  assert.match(learning, /spanish: 'rey'/)
  assert.match(learning, /spanish: 'paz'/)
  assert.match(learning, /spanish: 'hacer'/)
  assert.match(catalog, /row\.display_gloss_es \?\? pedagogical\?\.spanish \?\? null/)
  assert.match(words, /“Todas” conserva acceso al catálogo hebreo aprobado completo/)
})

test('FASE H: endpoint mantiene sesión privada y acepta group', () => {
  assert.match(route, /url\.searchParams\.get\('group'\)/)
  assert.match(route, /listarCatalogoHebreoParaAprendizaje\(\{ page, pageSize, search, group \}\)/)
  assert.match(route, /result\.status === 'sin-sesion'/)
  assert.match(route, /status: 401/)
  assert.match(route, /'Cache-Control': 'private, no-store'/)
})

test('FASE H: no introduce audio ni persistencia local y limita la escritura al índice derivado', () => {
  assert.doesNotMatch(words, /speechSynthesis|new Audio|Audio\(|localStorage|sessionStorage/)
  assert.match(catalog, /import \{ createServiceClient \} from '@\/lib\/supabase\/service'/)
  assert.match(catalog, /from\('biblical_hebrew_search_resolutions'\)/)
  assert.match(catalog, /\.upsert\(payload/)
  assert.doesNotMatch(catalog, /from\('biblical_lexical_entries'\)[\s\S]{0,500}\.upsert\(/)
  assert.doesNotMatch(catalog, /from\('biblical_lexical_entries'\)[\s\S]{0,500}\.(?:insert|update|delete)\(/)
  assert.doesNotMatch(catalog, /profile_id|user_id|auth\.uid/)
})
