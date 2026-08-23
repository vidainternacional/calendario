import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const page = fs.readFileSync('app/(app)/estudios/hebreo/page.tsx', 'utf8')
const learnPage = fs.readFileSync('app/(app)/estudios/hebreo/aprender/page.tsx', 'utf8')
const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')
const course = fs.readFileSync('components/hebreo/HebrewCourseCenter.tsx', 'utf8')
const foundations = fs.readFileSync('components/hebreo/AlefBetFoundations.tsx', 'utf8')
const alef = fs.readFileSync('components/hebreo/AlefBetExplorer.tsx', 'utf8')
const vowels = fs.readFileSync('components/hebreo/NiqqudExplorer.tsx', 'utf8')
const words = fs.readFileSync('components/hebreo/HebrewWordsStudy.tsx', 'utf8')
const reading = fs.readFileSync('components/hebreo/HebrewBibleReader.tsx', 'utf8')
const grammar = fs.readFileSync('components/hebreo/GrammarExplorer.tsx', 'utf8')
const review = fs.readFileSync('components/hebreo/ReviewExplorer.tsx', 'utf8')
const coach = fs.readFileSync('components/hebreo/HebrewProgressCoach.tsx', 'utf8')
const materials = fs.readFileSync('components/hebreo/HebrewSupportMaterials.tsx', 'utf8')
const translator = fs.readFileSync('components/hebreo/HebrewTranslator.tsx', 'utf8')
const progress = fs.readFileSync('lib/hebreo/progress.ts', 'utf8')
const supportCourse = fs.readFileSync('lib/hebreo/support-course.ts', 'utf8')
const middleware = fs.readFileSync('middleware.ts', 'utf8')

// Contrato de línea base de FASE H. Este archivo protege arquitectura y capacidades,
// no textos explicativos efímeros de una iteración visual concreta.

test('FASE H: ruta principal exige sesión y conserva destino después del login', () => {
  assert.match(page, /requireCurrentUser\(\)/)
  assert.match(page, /HebrewLearningHome/)
  assert.match(middleware, /callbackUrl/)
})

test('FASE H: Aprender vive en página propia y mantiene curso progresivo', () => {
  assert.match(learnPage, /HebrewCourseCenter/)
  assert.match(course, /AlefBetExplorer/)
  assert.match(course, /NiqqudExplorer/)
  assert.match(course, /HebrewWordsStudy/)
  assert.match(course, /HebrewBibleReader/)
  assert.match(course, /GrammarNavigator/)
  assert.match(course, /ReviewExplorer/)
})

test('FASE H: Alef-Bet conserva fundamentos y fichas', () => {
  assert.match(alef, /ALEF_BET/)
  assert.match(foundations, /Sofit/)
  assert.match(foundations, /Dagesh/)
  assert.match(foundations, /Matres/)
})

test('FASE H: Vocales conserva explorador didáctico', () => {
  assert.match(vowels, /NIQQUD/)
  assert.match(vowels, /Sheva/)
})

test('FASE H: Palabras mantiene catálogo real de aprendizaje', () => {
  assert.match(words, /Hebrew/)
  assert.doesNotMatch(words, /TEST_QUESTIONS/)
})

test('FASE H: Lectura abre contenido bíblico real', () => {
  assert.match(reading, /Biblia|biblia|Bible|verse|versículo/i)
})

test('FASE H: Reglas conserva exploración y cautelas', () => {
  assert.match(grammar, /GrammarView|TeachingTables/)
})

test('FASE H: Repaso es módulo separado de evaluación', () => {
  assert.match(review, /Repaso|repaso/)
  assert.match(course, /id: 'review'/)
})

test('FASE H: Prueba tu progreso usa banco real y validación objetiva del Bloque 4', () => {
  assert.match(home, /<HebrewProgressCoach \/>/)
  assert.match(home, /setProgressOpen/)
  assert.doesNotMatch(home, /<details\b/)
  assert.ok((progress.match(/correctIndex:\s*\d+/g) ?? []).length >= 40)
  assert.match(progress, /HEBREW_PRACTICE_QUESTIONS/)
  assert.match(coach, /optionIndex === current\.correctIndex/)
  assert.doesNotMatch(home, /TEST_QUESTIONS/)
})

test('FASE H: resultado e historial de práctica reflejan persistencia real autorizada', () => {
  assert.match(coach, /Práctica terminada/)
  assert.match(coach, /finalFeedback/)
  assert.match(coach, /Cuadro de notas/)
  assert.match(coach, /metrics\.recommendation/)
  assert.match(coach, /loadHebrewProgress/)
  assert.doesNotMatch(home + coach, /La persistencia de progreso todavía no está activa\./)
})

test('FASE H: materiales conserva exactamente once enlaces y admite despliegue embebido', () => {
  assert.equal((supportCourse.match(/orden:\s*\d+/g) ?? []).length, 11)
  assert.equal((supportCourse.match(/https:\/\/www\.youtube\.com\/watch\?v=/g) ?? []).length, 11)
  assert.equal((supportCourse.match(/verificacion:\s*'pendiente'/g) ?? []).length, 11)
  assert.match(materials, /function MaterialGroups/)
  assert.match(materials, /embedded = false/)
})

test('FASE H: Traductor Biblia y Materiales se despliegan en Inicio sin navegación obligatoria', () => {
  assert.match(home, /HebrewTranslator/)
  assert.match(home, /HebrewBibleReader/)
  assert.match(home, /HebrewSupportMaterials/)
  assert.match(translator, /embedded/)
})
