import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const reading = fs.readFileSync('components/hebreo/ReadingWordsExplorer.tsx', 'utf8')
const catalog = fs.readFileSync('lib/hebreo/word-catalog.ts', 'utf8')
const learning = fs.readFileSync('lib/hebreo/word-learning.ts', 'utf8')
const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')

test('FASE H lectura: Aprender integra Lectura como tercer módulo real', () => {
  assert.match(home, /import ReadingWordsExplorer/)
  assert.match(home, /id: 'reading',[\s\S]*?available: true/)
  assert.match(home, /activeSection\.id === 'reading'[\s\S]*?<ReadingWordsExplorer \/>/)
})

test('FASE H lectura: catálogo completo permanece disponible pero inicia con vocabulario esencial', () => {
  assert.doesNotMatch(reading, /const WORDS:/)
  assert.match(reading, /useState<HebrewLearningGroupId>\('essentials'\)/)
  assert.match(learning, /id: 'all'/)
  assert.match(learning, /Acceso al catálogo hebreo aprobado completo/)
  assert.match(catalog, /from\('biblical_lexical_entries'\)/)
})

test('FASE H lectura: distingue con niqqud y sin niqqud sin ayuda redundante', () => {
  assert.match(reading, /type ReadingMode = 'nikud' \| 'plain'/)
  assert.match(reading, /label: 'Con niqqud'/)
  assert.match(reading, /label: 'Sin niqqud'/)
  assert.doesNotMatch(reading, /label: 'Con ayuda'/)
  assert.match(reading, /function withoutNiqqud/)
})

test('FASE H lectura: tarjetas lista y detalle tienen responsabilidades distintas', () => {
  assert.match(reading, /type WordView = 'cards' \| 'list' \| 'detail'/)
  assert.match(reading, /function CardsView/)
  assert.match(reading, /function ListView/)
  assert.match(reading, /function DetailView/)
  assert.match(reading, /function toggleCard/)
  assert.match(reading, /function changeView/)
  assert.match(reading, /pageSize: '24'/)
})

test('FASE H lectura: ficha didáctica elimina información técnica y explica formación', () => {
  const detail = reading.slice(reading.indexOf('function LearningDetail'), reading.indexOf('function CardsView'))
  assert.match(detail, /Cómo se pronuncia/)
  assert.match(detail, /Cómo se forma/)
  assert.match(detail, /Qué significa/)
  assert.doesNotMatch(detail, /Fuente|Glosa de la fuente|Strong|sourceLocator|providerVersion|contentHash/)
})

test('FASE H lectura: aprendizaje se agrupa por temas y español preparado', () => {
  for (const label of ['Esenciales', 'Familia', 'Vida diaria', 'Naturaleza', 'Cuerpo y vida', 'Fe y conceptos', 'Acciones']) assert.match(learning, new RegExp(label))
  assert.match(learning, /spanish: 'padre'/)
  assert.match(learning, /spanish: 'agua'/)
  assert.match(learning, /spanish: 'Dios'/)
  assert.match(learning, /spanish: 'decir'/)
})

test('FASE H lectura: búsqueda global se restaura al borrar sin perder el grupo', () => {
  assert.match(reading, /placeholder="Buscar en español o hebreo"/)
  assert.match(reading, /if \(value === '' && search\) clearSearch\(\)/)
  assert.match(reading, /setPage\(pageBeforeSearch\.current\)/)
  assert.match(catalog, /if \(!search\) \{/)
  assert.match(catalog, /Una búsqueda es global/)
})

test('FASE H lectura: no introduce audio ni persistencia ni cambios de base', () => {
  assert.doesNotMatch(reading, /speechSynthesis|new Audio|Audio\(|localStorage|sessionStorage/)
  assert.doesNotMatch(catalog, /\.insert\(|\.update\(|\.delete\(|\.upsert\(/)
})
