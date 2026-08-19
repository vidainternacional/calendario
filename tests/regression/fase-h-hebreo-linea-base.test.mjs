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

test('FASE H: mini-fichas y ficha ampliada conservan contrato aprobado', () => {
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

test('FASE H: portada conserva cuatro accesos bilingües, centrados y compactos', () => {
  for (const id of ['learn', 'materials', 'test', 'bible']) assert.match(home, new RegExp(`${id}: \\{ he:`))
  for (const es of ['Aprender', 'Materiales y curso', 'Prueba tu progreso', 'Biblia en hebreo']) assert.match(home, new RegExp(`es: '${es}'`))
  assert.match(home, /grid grid-cols-2 gap-2\.5/)
  assert.match(home, /min-h-\[74px\]/)
  assert.match(home, /flex-col items-center justify-center/)
  assert.match(home, /text-center/)
  assert.match(home, /useState<TopMenuId \| null>\(null\)/)
})

test('FASE H: encabezado no muestra Lectura y conserva título hebreo protagonista', () => {
  assert.match(home, /עברית מקראית/)
  assert.match(home, /text-\[2\.6rem\] font-black/)
  assert.match(home, /text-\[1\.75rem\] font-black/)
  assert.match(home, />Hebreo Bíblico</)
  assert.doesNotMatch(home, /Accessibility/)
  assert.doesNotMatch(home, /> Lectura<\/button>/)
})

test('FASE H: aprender agrupa seis áreas y despliega contenido por capas', () => {
  assert.equal((home.match(/id: '(?:alef-bet|vowels|reading|vocabulary|grammar|review)'/g) ?? []).length, 6)
  assert.match(home, /function LearningAreaButton/)
  assert.match(home, /grid grid-cols-2 gap-2/)
  assert.match(home, /min-h-\[66px\]/)
  assert.match(home, /Aprender paso a paso/)
  assert.match(home, /Qué aprenderás/)
  assert.match(home, /En qué enfocarte/)
  assert.match(home, /Cómo practicar/)
  assert.match(home, /<AlefBetExplorer simpleMode=\{false\} \/>/)
})

test('FASE H: Prueba tu progreso contiene quince preguntas secuenciales', () => {
  assert.equal((home.match(/type: '(?:Reconocer|Distinguir|Sofit|Dagesh|Lectura|Comprensión|Integración)'/g) ?? []).length, 15)
  assert.match(home, /Pregunta \{step \+ 1\} de \{TEST_QUESTIONS\.length\}/)
  assert.match(home, /15 preguntas variadas/)
  assert.match(home, /setStep/)
  assert.match(home, /setFinished\(true\)/)
})

test('FASE H: resultado conserva ficha de maestro e historial futuro', () => {
  assert.match(home, /Ficha de resultado · ejemplo/)
  assert.match(home, /Tu maestro recomienda reforzar antes de avanzar/)
  assert.match(home, /Lo que ya reconoces/)
  assert.match(home, /Conviene reforzar/)
  assert.match(home, /Consejo de estudio/)
  assert.match(home, /Historial de progreso/)
  assert.match(home, /No existe persistencia durante Bloque 1/)
  assert.doesNotMatch(home, /supabase|localStorage|sessionStorage/)
})

test('FASE H: materiales agrupa 11 clases en un recorrido por etapas', () => {
  assert.equal((supportCourse.match(/orden:\s*\d+/g) ?? []).length, 11)
  assert.equal((supportCourse.match(/https:\/\/www\.youtube\.com\/watch\?v=/g) ?? []).length, 11)
  assert.equal((supportCourse.match(/verificacion:\s*'pendiente'/g) ?? []).length, 11)
  assert.match(home, /Fundamentos/)
  assert.match(home, /Vocales y lectura/)
  assert.match(home, /Lectura bíblica y reglas/)
  assert.match(home, /HEBREW_SUPPORT_COURSE\.filter/)
  assert.match(home, /item\.miniatura/)
})

test('FASE H: Biblia en hebreo expone el modelo del lector guiado sin duplicar motor', () => {
  assert.match(home, /function BibleHebrewPreview/)
  assert.match(home, /Modelo del lector guiado/)
  assert.match(home, /Génesis 1:1/)
  assert.match(home, /בְּרֵאשִׁית בָּרָא אֱלֹהִים/)
  assert.match(home, /Ayudas de lectura/)
  assert.match(home, /Palabra por palabra/)
  assert.match(home, /Comparar en español/)
  assert.match(home, /RV1909/)
  assert.match(home, /no crea otro motor bíblico ni nuevas tablas/)
})

test('FASE H: no introduce persistencia, audio ni desbloqueos falsos', () => {
  assert.doesNotMatch(home, /supabase|localStorage|sessionStorage/)
  assert.doesNotMatch(home, /speechSynthesis|new Audio|Audio\(/)
  assert.doesNotMatch(explorer, /speechSynthesis|new Audio|Audio\(/)
  assert.match(home, /Sin audio, progreso persistente ni desbloqueos automáticos/)
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
