import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const reading = fs.readFileSync('components/hebreo/ReadingWordsExplorer.tsx', 'utf8')
const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')

test('FASE H lectura: Aprender integra Lectura como tercer módulo real', () => {
  assert.match(home, /import ReadingWordsExplorer/)
  assert.match(home, /id: 'reading',[\s\S]*?available: true/)
  assert.match(home, /activeSection\.id === 'reading'[\s\S]*?<ReadingWordsExplorer \/>/)
})

test('FASE H lectura: primera práctica contiene diez palabras pedagógicas', () => {
  assert.equal((reading.match(/order:\s*\d+/g) ?? []).length, 10)
  for (const id of ['av', 'em', 'yom', 'mayim', 'bayit', 'melekh', 'shalom', 'erets', 'shem', 'lev']) {
    assert.match(reading, new RegExp(`id: '${id}'`))
  }
  assert.match(reading, /Lectura de palabras/)
  assert.match(reading, /¿Cómo empezamos a leer\?/)
})

test('FASE H lectura: ayudas se reducen de niqqud a lectura directa', () => {
  assert.match(reading, /type ReadingLevel = 'nikud' \| 'guided' \| 'plain'/)
  assert.match(reading, /Con niqqud/)
  assert.match(reading, /Con ayuda/)
  assert.match(reading, /Sin ayuda/)
  assert.match(reading, /level === 'plain' \? word\.plain : word\.hebrew/)
  assert.match(reading, /level !== 'plain'/)
  assert.match(reading, /La transliteración aparece únicamente como apoyo temporal/)
})

test('FASE H lectura: palabras se agrupan sin saturar la pantalla', () => {
  for (const label of ['Cortas', 'Frecuentes', 'Distinguir', 'Todas']) assert.match(reading, new RegExp(label))
  assert.match(reading, /grid grid-cols-2 gap-3 sm:grid-cols-3/)
  assert.match(reading, /setSelectedId\(current => current === word\.id \? null : word\.id\)/)
})

test('FASE H lectura: no introduce audio ni persistencia', () => {
  assert.doesNotMatch(reading, /speechSynthesis|new Audio|Audio\(|supabase|localStorage|sessionStorage/)
  assert.match(reading, /No registra dominio ni califica resultados todavía/)
})
