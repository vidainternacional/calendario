import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const dataset = fs.readFileSync('lib/hebreo/alef-bet.ts', 'utf8')
const supportCourse = fs.readFileSync('lib/hebreo/material-apoyo.ts', 'utf8')
const explorer = fs.readFileSync('components/hebreo/AlefBetExplorer.tsx', 'utf8')
const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')
const page = fs.readFileSync('app/(app)/estudios/hebreo/page.tsx', 'utf8')
const estudios = fs.readFileSync('app/(app)/estudios/page.tsx', 'utf8')

test('FASE H: Alef-bet conserva 22 letras y cinco formas finales', () => {
  assert.equal((dataset.match(/orden:\s*\d+/g) ?? []).length, 22)
  assert.equal((dataset.match(/formaFinal:/g) ?? []).length, 5)
  for (const forma of ['ך', 'ם', 'ן', 'ף', 'ץ']) assert.match(dataset, new RegExp(`formaFinal:\\s*'${forma}'`))
})

test('FASE H: las fichas conservan valor, sonido, origen y certeza editorial', () => {
  assert.equal((dataset.match(/valor:\s*\d+/g) ?? []).length, 22)
  assert.equal((dataset.match(/sonidoPedagogico:\s*'/g) ?? []).length, 22)
  assert.equal((dataset.match(/origenNombre:\s*'/g) ?? []).length, 22)
  assert.equal((dataset.match(/certezaHistorica:\s*'(?:bien atestiguado|probable|debatido)',/g) ?? []).length, 22)
})

test('FASE H: Shin y Sin permanecen en una sola letra base', () => {
  assert.match(dataset, /orden:\s*21,[\s\S]*?letra:\s*'ש'[\s\S]*?nombre:\s*'Shin \/ Sin'/)
  assert.match(dataset, /שׁ Shin: punto a la derecha/)
  assert.match(dataset, /שׂ Sin: punto a la izquierda/)
})

test('FASE H: Alef-bet conserva filtros pedagógicos explicados', () => {
  for (const label of ['Alef–Yod', 'Kaf–Tav', 'Dagesh', 'Sofit', 'Guturales', 'Matres', 'Shin / Sin']) assert.match(explorer, new RegExp(label.replace('/', '\\/')))
  assert.match(explorer, /Un punto dentro de algunas letras/)
  assert.match(explorer, /Cinco letras cambian de forma cuando aparecen al final/)
  assert.match(explorer, /<GroupExplanation item=\{activeGroup\} \/>/)
})

test('FASE H: mini-fichas y ficha ampliada conservan el contrato visual aprobado', () => {
  const tile = explorer.slice(explorer.indexOf('function LetterTile'), explorer.indexOf('function ExpandedLetterCard'))
  assert.match(tile, /letter\.orden/)
  assert.match(tile, /text-\[4\.55rem\]/)
  assert.doesNotMatch(tile, /PrimaryLetterForms/)
  assert.match(explorer, /function PrimaryLetterForms/)
  assert.match(explorer, /Libro/)
  assert.match(explorer, /Cuadrada/)
  assert.match(explorer, /Manuscrita/)
  assert.match(explorer, /text-\[9\.6rem\]/)
  assert.match(explorer, />Sonido/)
  assert.match(explorer, />Significado/)
})

test('FASE H: reverso conserva scroll interno, pronunciación y giro completo', () => {
  assert.match(explorer, /overflow-y-auto overscroll-contain/)
  assert.match(explorer, /\[-webkit-overflow-scrolling:touch\]/)
  assert.match(explorer, /sticky top-0/)
  assert.match(explorer, /Pronunciación aproximada:/)
  assert.match(explorer, /onClick=\{\(\) => setFlipped\(value => !value\)\}/)
  assert.doesNotMatch(explorer, /\/ 22/)
})

test('FASE H: inicio agrupa seis áreas y despliega solo una a la vez', () => {
  assert.equal((home.match(/id: '(?:alef-bet|vowels|reading|vocabulary|grammar|review)'/g) ?? []).length, 6)
  assert.match(home, /grid grid-cols-3 gap-x-2 gap-y-3/)
  assert.match(home, /Elige un área/)
  assert.match(home, /const \[openSection, setOpenSection\]/)
  assert.match(home, /activeSection && <section/)
  assert.match(home, /setOpenSection\(current => current === section\.id \? null : section\.id\)/)
  assert.equal((home.match(/available: true/g) ?? []).length, 1)
  assert.equal((home.match(/available: false/g) ?? []).length, 5)
})

test('FASE H: portada elimina paneles largos de progreso y evaluación', () => {
  assert.doesNotMatch(home, /function ProgressArchitecturePreview/)
  assert.doesNotMatch(home, /function AssessmentArchitecturePreview/)
  assert.doesNotMatch(home, /De reconocer a comprender/)
  assert.doesNotMatch(home, /Practicar también mide/)
})

test('FASE H: Prueba tu proceso es una acción principal y secuencial', () => {
  assert.match(home, /¡Prueba tu proceso!/)
  assert.match(home, /Comenzar prueba/)
  assert.match(home, /function ProcessTestPreview/)
  assert.match(home, /Paso \{step \+ 1\} de \{questions\.length\}/)
  assert.match(home, /¿Cuál de estas letras es Bet\?/)
  assert.match(home, /Selecciona la letra diferente/)
  assert.match(home, /¿Qué palabra estás viendo\?/)
  assert.match(home, /setStep/)
  assert.match(home, /setFinished\(true\)/)
})

test('FASE H: resultado de prueba funciona como ficha con orientación de maestro', () => {
  assert.match(home, /Ficha de resultado · ejemplo/)
  assert.match(home, /Lo que ya reconoces/)
  assert.match(home, /Conviene reforzar/)
  assert.match(home, /Consejo de estudio/)
  assert.match(home, /Vas bien\. Antes de añadir más contenido/)
})

test('FASE H: historial queda diseñado sin fingir persistencia', () => {
  assert.match(home, /Historial de progreso/)
  assert.match(home, /evaluaciones anteriores/)
  assert.match(home, /esta ficha se guardará en tu historial/)
  assert.match(home, /No existe persistencia durante Bloque 1/)
  assert.doesNotMatch(home, /supabase|localStorage|sessionStorage/)
})

test('FASE H: no introduce métricas, audio ni desbloqueos falsos', () => {
  assert.doesNotMatch(home, /\b80\s*%|racha|streak/i)
  assert.doesNotMatch(home, /speechSynthesis|new Audio|Audio\(/)
  assert.doesNotMatch(explorer, /speechSynthesis|new Audio|Audio\(/)
  assert.match(home, /Sin audio, progreso persistente ni desbloqueos automáticos/)
})

test('FASE H: material de apoyo conserva exactamente los 11 enlaces pendientes', () => {
  assert.equal((supportCourse.match(/orden:\s*\d+/g) ?? []).length, 11)
  assert.equal((supportCourse.match(/https:\/\/www\.youtube\.com\/watch\?v=/g) ?? []).length, 11)
  assert.equal((supportCourse.match(/verificacion:\s*'pendiente'/g) ?? []).length, 11)
  assert.match(supportCourse, /fvBD-rFlTfg/)
  assert.match(supportCourse, /gxRYxrGZd7s/)
  assert.match(supportCourse, /UIdIzEtweOc/)
  assert.match(home, /Material de apoyo/)
  assert.match(home, /item\.miniatura/)
  assert.match(home, /target="_blank"/)
})

test('FASE H: ruta exige sesión y conserva destino después del login', () => {
  assert.match(page, /createClient\(\)/)
  assert.match(page, /if \(!user\) redirect\('\/login\?next=\/estudios\/hebreo'\)/)
  assert.match(page, /<HebrewLearningHome \/>/)
})

test('FASE H: Estudios conserva entrada a Hebreo Bíblico', () => {
  assert.match(estudios, /href:\s*'\/estudios\/hebreo'/)
  assert.match(estudios, /title:\s*'Hebreo Bíblico'/)
})
