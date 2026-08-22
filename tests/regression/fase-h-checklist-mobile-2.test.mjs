import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const foundations = fs.readFileSync('components/hebreo/AlefBetFoundations.tsx', 'utf8')
const niqqudRules = fs.readFileSync('components/hebreo/NiqqudReadingRules.tsx', 'utf8')
const learning = fs.readFileSync('lib/hebreo/word-learning.ts', 'utf8')
const phrases = fs.readFileSync('components/hebreo/HebrewUsefulPhrases.tsx', 'utf8')
const phraseCatalog = fs.readFileSync('lib/hebreo/useful-phrases.ts', 'utf8')
const wordsHub = fs.readFileSync('components/hebreo/HebrewWordsStudy.tsx', 'utf8')
const bible = fs.readFileSync('components/hebreo/HebrewBibleReader.tsx', 'utf8')
const bibleRoute = fs.readFileSync('app/api/estudios/hebreo/biblia/route.ts', 'utf8')
const translator = fs.readFileSync('components/hebreo/HebrewTranslator.tsx', 'utf8')
const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')
const course = fs.readFileSync('components/hebreo/HebrewCourseCenter.tsx', 'utf8')
const translatorPage = fs.readFileSync('app/(app)/estudios/hebreo/traductor/page.tsx', 'utf8')
const readingPage = fs.readFileSync('app/(app)/estudios/hebreo/lectura/page.tsx', 'utf8')
const materialsPage = fs.readFileSync('app/(app)/estudios/hebreo/materiales/page.tsx', 'utf8')
const css = fs.readFileSync('app/(app)/estudios/hebreo/hebreo.module.css', 'utf8')

test('FASE H checklist 2: tablas no convierten texto mixto en titular hebreo', () => {
  for (const source of [foundations, niqqudRules]) {
    assert.match(source, /function isHebrewOnly/)
    assert.match(source, /\^\[\\s·\\u0590-\\u05FF\]\+\$/)
  }
  assert.match(foundations, /\['ו', 'Vav', 'v'/)
  assert.doesNotMatch(foundations, /históricamente w/)
})

test('FASE H checklist 2: significado de ficha usa tipografía adaptable', () => {
  assert.match(css, /button\[aria-label\^='Voltear ficha de'/)
  assert.match(css, /font-size: clamp\(1\.08rem, 4\.6vw, 1\.35rem\)/)
})

test('FASE H checklist 2: conectores preposiciones y pronombres son catálogos curados', () => {
  assert.match(learning, /lexicalId: 'H9002'.*spanish: 'y'/)
  assert.match(learning, /lexicalId: 'H9003'.*spanish: 'en · con · por'/)
  assert.match(learning, /lexicalId: 'H0595'.*spanish: 'yo'/)
  assert.doesNotMatch(learning, /group === 'connectors'.*return null/)
  assert.doesNotMatch(learning, /group === 'prepositions'.*return null/)
  assert.doesNotMatch(learning, /group === 'pronouns'.*return null/)
})

test('FASE H checklist 2: Palabras separa catálogo bíblico de frases cotidianas', () => {
  assert.match(wordsHub, /Palabras bíblicas/)
  assert.match(wordsHub, /Frases útiles/)
  assert.match(phrases, /HEBREW_USEFUL_PHRASES/)
  assert.match(phrases, /Hebreo moderno · uso cotidiano/)
  assert.match(phraseCatalog, /spanish: 'buenos días'/)
  assert.match(phraseCatalog, /spanish: 'buenas noches'/)
  assert.match(phraseCatalog, /Se mantienen deliberadamente separadas del léxico bíblico autoritativo/)
})

test('FASE H checklist 2: Lectura abre Biblia real por orden canónico y español es opcional', () => {
  assert.match(bible, /Lectura bíblica/)
  assert.match(bible, /Biblia en orden por libro y capítulo/)
  assert.match(bible, /Shemá · Dt 6:4/)
  assert.match(bible, /showSpanish/)
  assert.match(bibleRoute, /HEBREW_BIBLE_BOOKS/)
  assert.match(bibleRoute, /\.order\('verse', \{ ascending: true \}\)/)
})

test('FASE H checklist 2: traductor añade pronunciación escrita y ralentiza audio', () => {
  assert.match(translator, /Pronunciación orientativa/)
  assert.match(translator, /utterance\.rate = 0\.68/)
  assert.doesNotMatch(translator, /Strong|morfolog|ocurrencias/i)
})

test('FASE H checklist 2: Inicio es hub y los sectores grandes navegan a páginas propias', () => {
  assert.match(home, /Empieza aquí/)
  assert.match(home, /href="\/estudios\/hebreo\/aprender"/)
  assert.match(home, /href="\/estudios\/hebreo\/traductor"/)
  assert.match(home, /href="\/estudios\/hebreo\/lectura"/)
  assert.match(home, /href="\/estudios\/hebreo\/materiales"/)
  assert.match(home, /Prueba tu progreso/)
  assert.match(home, /<details>/)
  assert.match(course, /useState<SectionId \| null>\(null\)/)
  assert.match(course, /aria-expanded=\{open\}/)
  assert.match(translatorPage, /<HebrewTranslator \/>/)
  assert.match(readingPage, /<HebrewBibleReader \/>/)
  assert.match(materialsPage, /<HebrewSupportMaterials \/>/)
})
