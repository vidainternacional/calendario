import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const dataset = fs.readFileSync('lib/hebreo/alef-bet.ts', 'utf8')
const explorer = fs.readFileSync('components/hebreo/AlefBetExplorer.tsx', 'utf8')
const page = fs.readFileSync('app/(app)/estudios/hebreo/page.tsx', 'utf8')
const estudios = fs.readFileSync('app/(app)/estudios/page.tsx', 'utf8')

test('FASE H: Alef-bet versiona 22 letras y exactamente cinco formas finales', () => {
  const ordenes = dataset.match(/orden:\s*\d+/g) ?? []
  const finales = dataset.match(/formaFinal:/g) ?? []

  assert.equal(ordenes.length, 22)
  assert.equal(finales.length, 5)
  assert.match(dataset, /letra:\s*'א'/)
  assert.match(dataset, /letra:\s*'ת'/)
  assert.match(dataset, /formaFinal:\s*'ך'/)
  assert.match(dataset, /formaFinal:\s*'ם'/)
  assert.match(dataset, /formaFinal:\s*'ן'/)
  assert.match(dataset, /formaFinal:\s*'ף'/)
  assert.match(dataset, /formaFinal:\s*'ץ'/)
})

test('FASE H: las 22 fichas conservan valor, signo histórico, sonido y origen', () => {
  assert.equal((dataset.match(/valor:\s*\d+/g) ?? []).length, 22)
  assert.equal((dataset.match(/fenicio:\s*'/g) ?? []).length, 22)
  assert.equal((dataset.match(/sonidoPedagogico:\s*'/g) ?? []).length, 22)
  assert.equal((dataset.match(/origenNombre:\s*'/g) ?? []).length, 22)
  assert.equal((dataset.match(/certezaHistorica:\s*'(?:bien atestiguado|probable|debatido)',/g) ?? []).length, 22)
})

test('FASE H: Shin y Sin permanecen dentro de una sola letra del Alef-bet', () => {
  assert.match(dataset, /orden:\s*21,[\s\S]*?letra:\s*'ש'[\s\S]*?nombre:\s*'Shin \/ Sin'/)
  assert.match(dataset, /שׁ Shin: punto a la derecha/)
  assert.match(dataset, /שׂ Sin: punto a la izquierda/)
})

test('FASE H: el aprendizaje se divide por grupos sin convertir variantes en letras nuevas', () => {
  assert.match(explorer, /type LearningGroup = 'all' \| 'begadkefat' \| 'sofit' \| 'gutturals' \| 'matres' \| 'shin-sin'/)
  assert.match(explorer, /label: 'Dagesh'/)
  assert.match(explorer, /label: 'Sofit'/)
  assert.match(explorer, /label: 'Guturales'/)
  assert.match(explorer, /label: 'Matres'/)
  assert.match(explorer, /label: 'Shin \/ Sin'/)
  assert.match(explorer, /Boolean\(letter\.formaFinal\)/)
})

test('FASE H: las fichas priorizan cinco datos y un giro minimalista', () => {
  assert.match(explorer, /Valor \{letter\.valor\}/)
  assert.match(explorer, />Sonido</)
  assert.match(explorer, /Significado histórico/)
  assert.match(explorer, /text-\[8\.8rem\]/)
  assert.match(explorer, /aria-label=\{`Voltear ficha de/)
  assert.match(explorer, /<RotateCcw className="h-5 w-5"/)
  assert.doesNotMatch(explorer, />Más datos</)
  assert.doesNotMatch(explorer, />Volver</)
})

test('FASE H: cada ficha muestra cuadrada, manuscrita e histórica sin meter fuentes al repositorio', () => {
  assert.match(explorer, />Cuadrada</)
  assert.match(explorer, />Manuscrita</)
  assert.match(explorer, />Histórica</)
  assert.match(explorer, /Arial Hebrew Scholar/)
  assert.match(explorer, /Corsiva Hebrew/)
  assert.match(explorer, /letter\.fenicio/)
})

test('FASE H: transliteración, Unicode y gematría técnica salen de la ficha de aprendizaje', () => {
  assert.doesNotMatch(explorer, /Transliteración/)
  assert.doesNotMatch(explorer, /Unicode/)
  assert.doesNotMatch(explorer, /Gematría/)
  assert.match(explorer, /no es el significado automático de una palabra/)
})

test('FASE H: el carrusel RTL usa el mismo contenido básico con más amplitud', () => {
  assert.match(explorer, /Carrusel/)
  assert.match(explorer, /dir="rtl"/)
  assert.match(explorer, /snap-x snap-mandatory/)
  assert.match(explorer, /CarouselLetterDetail/)
  assert.match(explorer, /text-\[8rem\]/)
  assert.match(explorer, /<LetterForms letter=\{letter\} \/>/)
})

test('FASE H: la entrada es bilingüe, breve y mantiene una sola ruta activa', () => {
  assert.match(page, /בחרת נכון\./)
  assert.match(page, /Has tomado una buena decisión\./)
  assert.match(page, /היום מתחילים/)
  assert.match(page, /Hoy empieza tu camino\./)
  assert.equal((page.match(/href="#alef-bet"/g) ?? []).length, 1)
  assert.match(page, /תנועות/)
  assert.match(page, /מילים/)
  assert.match(page, /דקדוק/)
  assert.match(page, /מילון/)
  assert.match(page, /על העברית/)
  assert.doesNotMatch(page, /Hoy comienza tu camino para leer, pronunciar y comprender/)
})

test('FASE H: el explorador sigue sin introducir audio ni persistencia', () => {
  assert.doesNotMatch(explorer, /speechSynthesis|Audio\(|supabase|localStorage|sessionStorage/)
})

test('FASE H: la ruta dedicada vive dentro de Estudios y exige sesión', () => {
  assert.match(page, /createClient\(\)/)
  assert.match(page, /if \(!user\) redirect\('\/login'\)/)
  assert.match(page, /Hebreo Bíblico/)
  assert.match(page, /<AlefBetExplorer \/>/)
  assert.match(page, /STEP Bible \/ STEPBible-Data, CC BY 4\.0/)
  assert.doesNotMatch(page, /insert\(|update\(|delete\(|upsert\(/)
})

test('FASE H: Estudios enlaza Hebreo Bíblico como herramienta disponible', () => {
  assert.match(estudios, /href:\s*'\/estudios\/hebreo'/)
  assert.match(estudios, /title:\s*'Hebreo Bíblico'/)
  assert.match(estudios, /action:\s*'Empezar hebreo'/)
})
