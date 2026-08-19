import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const reading = fs.readFileSync('components/hebreo/ReadingWordsExplorer.tsx', 'utf8')
const catalog = fs.readFileSync('lib/hebreo/word-catalog.ts', 'utf8')
const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')

test('FASE H lectura: Aprender integra Lectura como tercer módulo real', () => {
  assert.match(home, /import ReadingWordsExplorer/)
  assert.match(home, /id: 'reading',[\s\S]*?available: true/)
  assert.match(home, /activeSection\.id === 'reading'[\s\S]*?<ReadingWordsExplorer \/>/)
})

test('FASE H lectura: el catálogo sustituye la lista fija de diez palabras', () => {
  assert.doesNotMatch(reading, /const WORDS:/)
  assert.match(reading, /\/api\/estudios\/hebreo\/palabras/)
  assert.match(reading, /result\.total\.toLocaleString/)
  assert.match(catalog, /from\('biblical_lexical_entries'\)/)
  assert.match(catalog, /\.eq\('language', 'hebrew'\)/)
  assert.match(catalog, /\.eq\('review_status', 'approved'\)/)
})

test('FASE H lectura: distingue con niqqud y sin niqqud sin repetir ayuda intermedia', () => {
  assert.match(reading, /type ReadingMode = 'nikud' \| 'plain'/)
  assert.match(reading, /label: 'Con niqqud'/)
  assert.match(reading, /label: 'Sin niqqud'/)
  assert.doesNotMatch(reading, /label: 'Con ayuda'/)
  assert.match(reading, /function withoutNiqqud/)
  assert.match(reading, /mode === 'nikud' \? word\.lemma : withoutNiqqud\(word\.lemma\)/)
})

test('FASE H lectura: palabras tienen tarjetas lista y detalle sin cargar todo a la vez', () => {
  assert.match(reading, /type WordView = 'cards' \| 'list' \| 'detail'/)
  for (const label of ['Tarjetas', 'Lista', 'Detalle']) assert.match(reading, new RegExp(label))
  assert.match(reading, /pageSize: '24'/)
  assert.match(reading, /Página \{result\.page\} de \{result\.totalPages\}/)
  assert.match(catalog, /\.range\(offset, offset \+ pageSize - 1\)/)
})

test('FASE H lectura: detalle no inventa traducciones españolas', () => {
  assert.match(reading, /Aún no hay una glosa española editorial aprobada/)
  assert.match(reading, /Glosa de la fuente/)
  assert.match(reading, /\(EN\)/)
  assert.match(reading, /No registra dominio ni inventa traducciones españolas/)
})

test('FASE H lectura: no introduce audio ni persistencia nueva', () => {
  assert.doesNotMatch(reading, /speechSynthesis|new Audio|Audio\(|localStorage|sessionStorage/)
  assert.doesNotMatch(catalog, /\.insert\(|\.update\(|\.delete\(|\.upsert\(/)
})
