import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const foundations = fs.readFileSync('components/hebreo/AlefBetFoundations.tsx', 'utf8')
const wordsHub = fs.readFileSync('components/hebreo/HebrewWordsStudy.tsx', 'utf8')
const phrases = fs.readFileSync('components/hebreo/HebrewUsefulPhrases.tsx', 'utf8')
const phraseCatalog = fs.readFileSync('lib/hebreo/useful-phrases.ts', 'utf8')
const materials = fs.readFileSync('components/hebreo/HebrewSupportMaterials.tsx', 'utf8')
const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')
const css = fs.readFileSync('app/(app)/estudios/hebreo/hebreo.module.css', 'utf8')

test('FASE H checklist 4: fundamentos prioriza Alef-Bet y abre Sofit Dagesh o Matres bajo demanda', () => {
  assert.match(foundations, /type FoundationPanel = 'alphabet' \| 'sofit' \| 'dagesh' \| 'matres'/)
  assert.match(foundations, /useState<FoundationPanel>\('alphabet'\)/)
  for (const label of ['Alef-Bet', 'Sofit', 'Dagesh', 'Matres']) assert.match(foundations, new RegExp(`label: '${label}'`))
  assert.match(foundations, /rounded-full border px-4/)
  assert.match(foundations, /El Alef-Bet completo continúa justo debajo/)
})

test('FASE H checklist 4: palabras elimina el encabezado redundante y conserva dos modos claros', () => {
  assert.doesNotMatch(wordsHub, /hebrew-words-study-title/)
  assert.match(wordsHub, /Palabras bíblicas/)
  assert.match(wordsHub, /Frases útiles/)
  assert.match(wordsHub, /rounded-full border px-4/)
})

test('FASE H checklist 4: frases crece con catálogo estructurado y usa superficie completa en móvil', () => {
  assert.equal((phraseCatalog.match(/id: '/g) ?? []).length, 12)
  assert.match(phraseCatalog, /HebrewUsefulPhraseGroup = 'greetings' \| 'courtesy' \| 'conversation'/)
  assert.match(phraseCatalog, /spanish: '¿cómo estás\? · a un hombre'/)
  assert.match(phraseCatalog, /spanish: 'perdón · disculpe'/)
  assert.match(phrases, /label: 'Conversación'/)
  assert.match(phrases, /-mx-4 mt-4 border-y border-slate-200 bg-white/)
})

test('FASE H checklist 4: materiales usa selector de píldoras en vez de filas cuadradas', () => {
  assert.match(materials, /const \[activeIndex, setActiveIndex\] = useState\(0\)/)
  assert.match(materials, /rounded-full border px-4/)
  assert.doesNotMatch(materials, /<summary/)
})

test('FASE H checklist 4: CTA principal queda centrado y progreso/teclado usan filas nativas equivalentes', () => {
  assert.match(home, /items-center justify-center overflow-hidden rounded-\[26px\]/)
  assert.match(home, />Empecemos</)
  assert.match(home, /hebrew-glimmer/)
  assert.doesNotMatch(home, /GraduationCap|Sparkles/)
  assert.equal((home.match(/min-h-\[72px\]/g) ?? []).length >= 2, true)
  assert.match(home, /aria-label="Práctica" className="mt-5 border-t border-slate-200"/)
  assert.match(home, /aria-label="Teclado hebreo" className="border-t border-slate-200"/)
})

test('FASE H checklist 4: títulos internos comparten una sola escala tipográfica', () => {
  for (const id of ['alef-bet-title', 'niqqud-title', 'reading-words-title', 'hebrew-useful-phrases-title', 'hebrew-bible-reader-title', 'grammar-title', 'review-title']) assert.match(css, new RegExp(`#${id}`))
  assert.match(css, /font-size: 1\.35rem !important/)
  assert.match(css, /line-height: 1\.2 !important/)
})
