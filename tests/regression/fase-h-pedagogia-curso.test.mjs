import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const alefBet = fs.readFileSync('lib/hebreo/alef-bet.ts', 'utf8')
const niqqud = fs.readFileSync('components/hebreo/NiqqudExplorer.tsx', 'utf8')
const reading = fs.readFileSync('components/hebreo/ReadingSentencesExplorer.tsx', 'utf8')
const readingCatalog = fs.readFileSync('lib/hebreo/reading-catalog.ts', 'utf8')
const grammar = fs.readFileSync('components/hebreo/GrammarExplorer.tsx', 'utf8')
const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')
const course = fs.readFileSync('components/hebreo/HebrewCourseCenter.tsx', 'utf8')
const learnPage = fs.readFileSync('app/(app)/estudios/hebreo/aprender/page.tsx', 'utf8')

test('FASE H curso: Bet Vet y Vav usan la pronunciación pedagógica acordada', () => {
  assert.match(alefBet, /nombre: 'Bet \/ Vet'/)
  assert.match(alefBet, /B fuerte como en “burro”/)
  assert.match(alefBet, /V suave y labiodental como en “vaca”/)
  assert.match(alefBet, /letra: 'ו', nombre: 'Vav', transliteracion: 'v'/)
  assert.match(alefBet, /En la metodología del curso no se usa W para representar la Vav/)
  assert.doesNotMatch(alefBet, /nombre: 'Vav \/ Waw'|transliteracion: 'w \/ v'/)
})

test('FASE H curso: niqqud progresa A-E-I luego O-U y después Sheva', () => {
  const labels = ['A · E · I', 'O · U', 'Sheva', 'Reducidas', 'Todas']
  const positions = labels.map(label => niqqud.indexOf(`label: '${label}'`))
  assert.ok(positions.every(position => position >= 0))
  for (let index = 1; index < positions.length; index += 1) assert.ok(positions[index] > positions[index - 1])
  assert.match(niqqud, /useState<'all' \| NiqqudGroup>\('aei'\)/)
  assert.match(niqqud, /Sheva Na \(vocal\) y Sheva Naj \(silenciosa\)/)
  assert.match(niqqud, /A\/E\/I → O\/U → Sheva → lectura aplicada/)
})

test('FASE H curso: lectura inicial incorpora el Shemá completo 6:4-5 como hito', () => {
  assert.match(reading, /function CourseReadingMilestone/)
  assert.match(reading, /שְׁמַע יִשְׂרָאֵל/)
  assert.match(reading, /Shemá Yisrael · Deuteronomio 6:4–5/)
  assert.match(reading, /consonante → signo vocálico → sílaba → palabra → frase/)
  assert.match(readingCatalog, /\['DEU', 6, 4\]/)
  assert.match(readingCatalog, /\['DEU', 6, 5\]/)
})

test('FASE H curso: las piezas inseparables ya están presentes sin inventar raíces', () => {
  for (const marker of ['בְּ · לְ · כְּ · מִן', 'וְ', 'הַ']) assert.match(grammar, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.match(grammar, /Raíces permanecen ocultas hasta contar con una fuente explícita/)
})

test('FASE H curso: Aprender conserva la arquitectura progresiva en página propia', () => {
  const order = ['alef-bet', 'vowels', 'vocabulary', 'reading', 'grammar', 'review'].map(id => course.indexOf(`id: '${id}'`))
  assert.ok(order.every(position => position >= 0))
  for (let index = 1; index < order.length; index += 1) assert.ok(order[index] > order[index - 1])
  assert.match(course, /useState<SectionId \| null>\(null\)/)
  assert.match(course, /grid w-full max-w-md grid-cols-3/)
  assert.match(course, /aria-expanded=\{open\}/)
  assert.match(course, /5–10 min al día · de arriba hacia abajo/)
  assert.match(course, /const activeSection = SECTIONS\.find/)
  assert.match(learnPage, /<HebrewCourseCenter \/>/)
})

test('FASE H curso: la portada prioriza el curso y reserva utilidades para despliegue local', () => {
  assert.match(home, /href="\/estudios\/hebreo\/aprender"/)
  assert.match(home, />Empecemos</)
  assert.match(home, /cta-neon-orbit/)
  assert.doesNotMatch(home, /hebrew-glimmer/)
  assert.match(home, /type QuickPanelId\s*=\s*'translator'\s*\|\s*'bible'\s*\|\s*'materials'/)
  assert.match(home, /<HebrewTranslator embedded\s*\/>/)
  assert.match(home, /<HebrewSupportMaterials embedded\s*\/>/)
  assert.doesNotMatch(home, /<AlefBetExplorer|<NiqqudExplorer|<HebrewWordsStudy|<GrammarExplorer|<ReviewExplorer/)
})
