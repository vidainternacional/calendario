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
  assert.equal((dataset.match(/certezaHistorica:\s*'/g) ?? []).length, 22)
  assert.equal((dataset.match(/ejemplo:\s*\{/g) ?? []).length, 22)
  assert.match(dataset, /valor:\s*1/)
  assert.match(dataset, /valor:\s*400/)
  assert.match(dataset, /unicodeFenicio:\s*'U\+10900'/)
  assert.match(dataset, /unicodeFenicio:\s*'U\+10915'/)
})

test('FASE H: Shin y Sin permanecen dentro de una sola letra del Alef-bet', () => {
  assert.match(dataset, /orden:\s*21,[\s\S]*?letra:\s*'ש'[\s\S]*?nombre:\s*'Shin \/ Sin'/)
  assert.match(dataset, /שׁ Shin: punto a la derecha/)
  assert.match(dataset, /שׂ Sin: punto a la izquierda/)
})

test('FASE H: el origen pictográfico se presenta con cautela editorial', () => {
  assert.match(dataset, /no\s+son significados léxicos, secretos ni teológicos/i)
  assert.match(dataset, /'bien atestiguado' \| 'probable' \| 'debatido'/)
  assert.match(explorer, /No significa que la letra tenga por sí sola ese significado/)
  assert.match(explorer, /referencia histórica comparativa/)
})

test('FASE H: el explorador ofrece Cuadrícula con detalle por fila y Carrusel RTL', () => {
  assert.match(explorer, /type ViewMode = 'grid' \| 'carousel'/)
  assert.match(explorer, /Cuadrícula/)
  assert.match(explorer, /Carrusel/)
  assert.match(explorer, /chunkLetters\(4\)/)
  assert.match(explorer, /chunkLetters\(6\)/)
  assert.match(explorer, /selectedInRow && <LetterDetail/)
  assert.match(explorer, /dir="rtl" className="-mx-4 flex snap-x snap-mandatory/)
  assert.match(explorer, /Alef-bet hebreo en carrusel/)
})

test('FASE H: la ficha usa acordeones y muestra datos esenciales', () => {
  assert.match(explorer, /<details open=\{open\}/)
  assert.match(explorer, /Pronunciación y lectura/)
  assert.match(explorer, /Escritura y variantes/)
  assert.match(explorer, /Historia del nombre y del signo/)
  assert.match(explorer, /Ejemplo bíblico/)
  assert.match(explorer, /valor \{letter\.valor\}/)
  assert.match(explorer, /letter\.unicodeFenicio/)
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
