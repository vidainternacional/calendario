import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const reading = fs.readFileSync('components/hebreo/ReadingWordsExplorer.tsx', 'utf8')
const catalog = fs.readFileSync('lib/hebreo/word-catalog.ts', 'utf8')
const learning = fs.readFileSync('lib/hebreo/word-learning.ts', 'utf8')
const route = fs.readFileSync('app/api/estudios/hebreo/palabras/route.ts', 'utf8')

test('FASE H: lectura diferencia únicamente con niqqud y sin niqqud', () => {
  assert.match(reading, /type ReadingMode = 'nikud' \| 'plain'/)
  assert.match(reading, /label: 'Con niqqud'/)
  assert.match(reading, /label: 'Sin niqqud'/)
  assert.doesNotMatch(reading, /label: 'Con ayuda'/)
  assert.match(reading, /function withoutNiqqud/)
  assert.match(reading, /mode === 'nikud' \? word\.lemma : withoutNiqqud\(word\.lemma\)/)
})

test('FASE H: tarjetas muestran hebreo pronunciación y español sin Strong visible', () => {
  const cards = reading.slice(reading.indexOf('function CardsView'), reading.indexOf('function ListView'))
  assert.match(cards, /<WordText/)
  assert.match(cards, /pronunciationFor\(word\)/)
  assert.match(cards, /spanishFor\(word\)/)
  assert.doesNotMatch(cards, /strongNumber|Abrir detalle|Ver detalle|Glosa fuente/)
  assert.match(cards, /chunkWords\(words, 2\)/)
  assert.match(cards, /<LearningDetail word=\{selected\} mode=\{mode\} compact \/>/)
})

test('FASE H: tocar tarjeta expande en su fila y no cambia a vista detalle', () => {
  assert.match(reading, /function toggleCard\(word: CatalogWord\)/)
  assert.match(reading, /setClosingId\(word\.lexicalId\)/)
  assert.match(reading, /setSelectedId\(current => current === word\.lexicalId \? null : current\)/)
  const toggle = reading.slice(reading.indexOf('function toggleCard'), reading.indexOf('function changeView'))
  assert.doesNotMatch(toggle, /setView\('detail'\)/)
})

test('FASE H: lista queda simple con pronunciación debajo y español a la derecha', () => {
  const list = reading.slice(reading.indexOf('function ListView'), reading.indexOf('function DetailView'))
  assert.match(list, /<WordText/)
  assert.match(list, /pronunciationFor\(word\)/)
  assert.match(list, /spanishFor\(word\)/)
  assert.match(list, /text-right/)
  assert.doesNotMatch(list, /button|Ver detalle|Glosa fuente|strongNumber/)
})

test('FASE H: detalle prioriza escritura pronunciación formación y significado', () => {
  const detail = reading.slice(reading.indexOf('function LearningDetail'), reading.indexOf('function CardsView'))
  for (const label of ['Cómo se pronuncia', 'Cómo se forma', 'Qué significa']) assert.match(detail, new RegExp(label))
  assert.match(detail, /formationParts\(word\.lemma\)/)
  assert.match(detail, /word\.meaningNoteEs/)
  assert.doesNotMatch(detail, /Fuente|Glosa de la fuente|sourceLocator|providerVersion|contentHash|strongNumber/)
})

test('FASE H: vocabulario se organiza por temas y categorías gramaticales', () => {
  for (const label of ['Esenciales', 'Familia', 'Vida diaria', 'Naturaleza', 'Cuerpo y vida', 'Fe y conceptos', 'Acciones', 'Sustantivos', 'Verbos', 'Adjetivos', 'Todas']) assert.match(learning, new RegExp(label))
  assert.match(reading, /HEBREW_LEARNING_GROUPS\.map/)
  assert.match(catalog, /lexicalIdsForLearningGroup/)
  assert.match(catalog, /group === 'nouns'/)
  assert.match(catalog, /group === 'verbs'/)
  assert.match(catalog, /group === 'adjectives'/)
})

test('FASE H: búsqueda acepta español y hebreo y restaurar vacío devuelve listado anterior', () => {
  assert.match(reading, /placeholder="Buscar en español o hebreo"/)
  assert.match(catalog, /lexicalIdsForSpanishSearch\(search\)/)
  assert.match(catalog, /query = query\.ilike\('lemma', hebrewSearchPattern\(search\)\)/)
  assert.match(reading, /const pageBeforeSearch = useRef\(1\)/)
  assert.match(reading, /if \(value === '' && search\) clearSearch\(\)/)
  assert.match(reading, /setPage\(pageBeforeSearch\.current\)/)
  assert.match(reading, /Borra la búsqueda para volver al listado anterior/)
})

test('FASE H: búsqueda es global y no queda restringida al grupo activo', () => {
  assert.match(catalog, /if \(!search\) \{/)
  assert.match(catalog, /Una búsqueda es global/)
  assert.match(catalog, /if \(search\) \{/)
})

test('FASE H: búsqueda hebrea funciona aunque el usuario omita niqqud', () => {
  assert.match(catalog, /const HEBREW_MARKS/)
  assert.match(catalog, /function hebrewSearchPattern/)
  assert.match(catalog, /replace\(HEBREW_MARKS, ''\)/)
  assert.match(catalog, /Array\.from\(consonants\)\.join\('%'\)/)
})

test('FASE H: catálogo sigue paginado y reutiliza biblical_lexical_entries solo lectura', () => {
  assert.match(reading, /pageSize: '24'/)
  assert.match(reading, /\/api\/estudios\/hebreo\/palabras/)
  assert.match(reading, /Página \{result\.page\} de \{result\.totalPages\}/)
  assert.match(catalog, /from\('biblical_lexical_entries'\)/)
  assert.match(catalog, /\.eq\('language', 'hebrew'\)/)
  assert.match(catalog, /\.eq\('enabled', true\)/)
  assert.match(catalog, /\.eq\('review_status', 'approved'\)/)
  assert.match(catalog, /count: 'exact'/)
  assert.match(catalog, /\.range\(offset, offset \+ pageSize - 1\)/)
  assert.doesNotMatch(catalog, /\.insert\(|\.update\(|\.delete\(|\.upsert\(/)
})

test('FASE H: grupos didácticos aportan español sin reemplazar el catálogo completo', () => {
  assert.match(learning, /spanish: 'padre'/)
  assert.match(learning, /spanish: 'casa'/)
  assert.match(learning, /spanish: 'rey'/)
  assert.match(learning, /spanish: 'paz'/)
  assert.match(learning, /spanish: 'hacer'/)
  assert.match(catalog, /row\.display_gloss_es \?\? pedagogical\?\.spanish \?\? null/)
  assert.match(reading, /“Todas” conserva acceso al catálogo hebreo aprobado completo/)
})

test('FASE H: endpoint mantiene sesión privada y acepta group', () => {
  assert.match(route, /url\.searchParams\.get\('group'\)/)
  assert.match(route, /listarCatalogoHebreoParaAprendizaje\(\{ page, pageSize, search, group \}\)/)
  assert.match(route, /result\.status === 'sin-sesion'/)
  assert.match(route, /status: 401/)
  assert.match(route, /'Cache-Control': 'private, no-store'/)
})

test('FASE H: no introduce audio ni persistencia local ni escritura de base', () => {
  assert.doesNotMatch(reading, /speechSynthesis|new Audio|Audio\(|localStorage|sessionStorage/)
  assert.doesNotMatch(catalog, /insert\(|update\(|delete\(|upsert\(/)
})
