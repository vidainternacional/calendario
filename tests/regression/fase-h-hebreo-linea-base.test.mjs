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

test('FASE H: las 22 fichas conservan valor, signo fenicio, sonido, historia y ejemplo', () => {
  assert.equal((dataset.match(/valor:\s*\d+/g) ?? []).length, 22)
  assert.equal((dataset.match(/fenicio:\s*'/g) ?? []).length, 22)
  assert.equal((dataset.match(/sonidoPedagogico:\s*'/g) ?? []).length, 22)
  assert.equal((dataset.match(/origenNombre:\s*'/g) ?? []).length, 22)
  assert.equal((dataset.match(/certezaHistorica:\s*'(?:bien atestiguado|probable|debatido)',/g) ?? []).length, 22)
  assert.equal((dataset.match(/ejemplo:\s*\{\s*palabra:\s*'/g) ?? []).length, 22)
  assert.match(dataset, /valor:\s*1/)
  assert.match(dataset, /valor:\s*400/)
  assert.match(dataset, /unicodeFenicio:\s*'U\+10900'/)
  assert.match(dataset, /unicodeFenicio:\s*'U\+10915'/)
})

test('FASE H: Shin y Sin permanecen dentro de una sola letra del Alef-bet', () => {
  assert.match(dataset, /orden:\s*21,[\s\S]*?letra:\s*'ש'[\s\S]*?nombre:\s*'Shin \/ Sin'/)
  assert.match(dataset, /שׁ Shin: punto a la derecha/)
  assert.match(dataset, /שׂ Sin: punto a la izquierda/)
  assert.match(explorer, /Derecha = Shin · izquierda = Sin/)
})

test('FASE H: el origen pictográfico se presenta con cautela editorial', () => {
  assert.match(dataset, /son significados léxicos, secretos ni teológicos/i)
  assert.match(dataset, /'bien atestiguado' \| 'probable' \| 'debatido'/)
  assert.match(explorer, /no el significado léxico de una palabra bíblica/i)
  assert.match(explorer, /no son significados secretos de la letra/i)
})

test('FASE H: el aprendizaje se divide por grupos sin convertir variantes en letras nuevas', () => {
  assert.match(explorer, /type LearningGroup = 'all' \| 'begadkefat' \| 'sofit' \| 'gutturals' \| 'matres' \| 'shin-sin'/)
  assert.match(explorer, /label: 'Dagesh'/)
  assert.match(explorer, /label: 'Sofit'/)
  assert.match(explorer, /label: 'Guturales'/)
  assert.match(explorer, /label: 'Matres'/)
  assert.match(explorer, /label: 'Shin \/ Sin'/)
  assert.match(explorer, /letter\.grupo === 'begadkefat'/)
  assert.match(explorer, /Boolean\(letter\.formaFinal\)/)
  assert.match(explorer, /GUTTURAL_ORDERS/)
  assert.match(explorer, /MATRES_ORDERS/)
})

test('FASE H: la vista de fichas abre debajo de la fila y permite voltear datos avanzados', () => {
  assert.match(explorer, /type ViewMode = 'grid' \| 'carousel'/)
  assert.match(explorer, />\s*Fichas\s*</)
  assert.match(explorer, /selectedInRow && <CompactLetterCard/)
  assert.match(explorer, /perspective:1200px/)
  assert.match(explorer, /rotateY\(180deg\)/)
  assert.match(explorer, /Más datos/)
  assert.match(explorer, /Datos de referencia/)
  assert.match(explorer, /Primero aprenderás a leer/)
})

test('FASE H: la ficha principal prioriza lectura y separa transliteración, gematría e historia', () => {
  assert.match(explorer, /Cómo suena/)
  assert.match(explorer, /<RuleSummary letter=\{letter\} \/>/)
  assert.match(explorer, /Ejemplo/)
  assert.match(explorer, /StudyRow label="Transliteración"/)
  assert.match(explorer, /StudyRow label="Gematría"/)
  assert.match(explorer, /StudyRow label="Unicode"/)
  assert.match(explorer, /Signo histórico/)
})

test('FASE H: el carrusel RTL conserva una ficha completa y datos técnicos aparte', () => {
  assert.match(explorer, /Carrusel/)
  assert.match(explorer, /dir="rtl"/)
  assert.match(explorer, /snap-x snap-mandatory/)
  assert.match(explorer, /CarouselLetterDetail/)
  assert.match(explorer, /Aprender a leerla/)
  assert.match(explorer, /Formas y reglas/)
  assert.match(explorer, /Ejemplo bíblico/)
  assert.match(explorer, /Datos técnicos e historia/)
})

test('FASE H: el Centro de Hebreo abre con una bienvenida simple y una sola ruta activa al Alef-bet', () => {
  assert.match(page, /Has tomado una buena decisión\./)
  assert.match(page, /Hoy comienza tu camino para leer, pronunciar y comprender el hebreo bíblico/)
  assert.equal((page.match(/href="#alef-bet"/g) ?? []).length, 1)
  assert.match(page, /Vocales y sílabas/)
  assert.match(page, /Vocabulario/)
  assert.match(page, /Reglas gramaticales/)
  assert.match(page, /Diccionario bíblico/)
  assert.match(page, /Conoce el hebreo/)
  assert.match(page, /<details className="group">/)
  assert.doesNotMatch(page, />Referencia</)
  assert.doesNotMatch(page, /Primer paso/)
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
