import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const reading = fs.readFileSync('components/hebreo/ReadingWordsExplorer.tsx', 'utf8')
const catalog = fs.readFileSync('lib/hebreo/word-catalog.ts', 'utf8')
const route = fs.readFileSync('app/api/estudios/hebreo/palabras/route.ts', 'utf8')

test('FASE H: lectura diferencia únicamente con niqqud y sin niqqud', () => {
  assert.match(reading, /type ReadingMode = 'nikud' \| 'plain'/)
  assert.match(reading, /label: 'Con niqqud'/)
  assert.match(reading, /label: 'Sin niqqud'/)
  assert.doesNotMatch(reading, /label: 'Con ayuda'/)
  assert.match(reading, /function withoutNiqqud/)
  assert.match(reading, /mode === 'nikud' \? word\.lemma : withoutNiqqud\(word\.lemma\)/)
})

test('FASE H: palabras ofrece tarjetas, lista y detalle como vistas distintas', () => {
  assert.match(reading, /type WordView = 'cards' \| 'list' \| 'detail'/)
  assert.match(reading, /Tarjetas/)
  assert.match(reading, /Lista/)
  assert.match(reading, /Detalle/)
  assert.match(reading, /function CardsView/)
  assert.match(reading, /function ListView/)
  assert.match(reading, /function DetailView/)
})

test('FASE H: catálogo se pagina y busca sin cargar toda la base en cliente', () => {
  assert.match(reading, /pageSize: '24'/)
  assert.match(reading, /\/api\/estudios\/hebreo\/palabras/)
  assert.match(reading, /Página \{result\.page\} de \{result\.totalPages\}/)
  assert.match(reading, /Buscar hebreo, Strong o glosa fuente/)
  assert.match(reading, /result\.total\.toLocaleString/)
})

test('FASE H: búsqueda hebrea funciona aunque el usuario omita niqqud', () => {
  assert.match(catalog, /const HEBREW_MARKS/)
  assert.match(catalog, /function hebrewSearchPattern/)
  assert.match(catalog, /replace\(HEBREW_MARKS, ''\)/)
  assert.match(catalog, /Array\.from\(consonants\)\.join\('%'\)/)
  assert.match(catalog, /query = query\.ilike\('lemma', hebrewSearchPattern\(search\)\)/)
})

test('FASE H: adaptador reutiliza biblical_lexical_entries aprobado y solo lectura', () => {
  assert.match(catalog, /from\('biblical_lexical_entries'\)/)
  assert.match(catalog, /\.eq\('language', 'hebrew'\)/)
  assert.match(catalog, /\.eq\('enabled', true\)/)
  assert.match(catalog, /\.eq\('review_status', 'approved'\)/)
  assert.match(catalog, /count: 'exact'/)
  assert.match(catalog, /\.range\(offset, offset \+ pageSize - 1\)/)
  assert.doesNotMatch(catalog, /\.insert\(|\.update\(|\.delete\(|\.upsert\(/)
})

test('FASE H: glosa española solo aparece si ya está aprobada', () => {
  assert.match(reading, /word\.displayGlossEs \?\? 'Aún no hay una glosa española editorial aprobada\.'/)
  assert.match(reading, /Glosa de la fuente/)
  assert.match(reading, /\(EN\)/)
  assert.match(reading, /No registra dominio ni inventa traducciones españolas/)
})

test('FASE H: endpoint de catálogo exige sesión a través del servicio y no cachea datos privados', () => {
  assert.match(route, /listarCatalogoHebreoParaAprendizaje/)
  assert.match(route, /result\.status === 'sin-sesion'/)
  assert.match(route, /status: 401/)
  assert.match(route, /'Cache-Control': 'private, no-store'/)
})

test('FASE H: lectura no introduce audio ni persistencia local', () => {
  assert.doesNotMatch(reading, /speechSynthesis|new Audio|Audio\(|localStorage|sessionStorage/)
  assert.doesNotMatch(catalog, /insert\(|update\(|delete\(|upsert\(/)
})
