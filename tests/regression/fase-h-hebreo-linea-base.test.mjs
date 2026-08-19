import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const dataset = fs.readFileSync('lib/hebreo/alef-bet.ts', 'utf8')
const supportCourse = fs.readFileSync('lib/hebreo/material-apoyo.ts', 'utf8')
const explorer = fs.readFileSync('components/hebreo/AlefBetExplorer.tsx', 'utf8')
const niqqud = fs.readFileSync('components/hebreo/NiqqudExplorer.tsx', 'utf8')
const reading = fs.readFileSync('components/hebreo/ReadingWordsExplorer.tsx', 'utf8')
const catalog = fs.readFileSync('lib/hebreo/word-catalog.ts', 'utf8')
const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')
const page = fs.readFileSync('app/(app)/estudios/hebreo/page.tsx', 'utf8')
const estudios = fs.readFileSync('app/(app)/estudios/page.tsx', 'utf8')

test('FASE H: Alef-bet conserva 22 letras y cinco formas finales', () => {
  assert.equal((dataset.match(/orden:\s*\d+/g) ?? []).length, 22)
  assert.equal((dataset.match(/formaFinal:/g) ?? []).length, 5)
  for (const forma of ['ך', 'ם', 'ן', 'ף', 'ץ']) assert.match(dataset, new RegExp(`formaFinal:\\s*'${forma}'`))
})

test('FASE H: las fichas conservan valor sonido origen y certeza editorial', () => {
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
})

test('FASE H: mini-fichas permiten nombres largos sin truncarlos', () => {
  const tile = explorer.slice(explorer.indexOf('function LetterTile'), explorer.indexOf('function ExpandedLetterCard'))
  assert.match(tile, /letter\.orden/)
  assert.match(tile, /text-\[4\.35rem\]/)
  assert.match(tile, /break-words/)
  assert.doesNotMatch(tile, /\btruncate\b/)
})

test('FASE H: ficha ampliada conserva tres representaciones con layout móvil seguro', () => {
  assert.match(explorer, /function PrimaryLetterForms/)
  assert.match(explorer, /Libro/)
  assert.match(explorer, /Cuadrada/)
  assert.match(explorer, /Manuscrita/)
  assert.match(explorer, /grid-cols-\[minmax\(0,1fr\)_minmax\(0,1\.4fr\)_minmax\(0,1fr\)\]/)
})

test('FASE H: reverso desplaza encabezado y contenido como una sola pieza', () => {
  assert.match(explorer, /overflow-y-auto overscroll-contain/)
  assert.match(explorer, /\[-webkit-overflow-scrolling:touch\]/)
  assert.doesNotMatch(explorer, /sticky top-0/)
  assert.match(explorer, /Pronunciación aproximada:/)
})

test('FASE H: fichas Alef-bet abren y se retraen al tocar la misma letra', () => {
  assert.match(explorer, /function toggleLetter\(order: number\)/)
  assert.match(explorer, /setClosingOrder\(order\)/)
  assert.match(explorer, /space-y-4/)
  assert.match(explorer, /grid grid-cols-3 gap-4/)
})

test('FASE H: explicación del Alef-Bet conserva lectura derecha a izquierda', () => {
  assert.match(explorer, /function AlefBetIntroduction/)
  assert.match(explorer, /¿Qué es el Alef-Bet\?/)
  assert.match(explorer, /se lee de derecha a izquierda/)
  assert.match(explorer, /reconocer → distinguir → combinar → leer → comprender/)
})

test('FASE H: portada conserva cuatro accesos bilingües', () => {
  for (const id of ['learn', 'materials', 'test', 'bible']) assert.match(home, new RegExp(`${id}: \\{ he:`))
  for (const es of ['Aprender', 'Materiales y curso', 'Prueba tu progreso', 'Biblia en hebreo']) assert.match(home, new RegExp(`es: '${es}'`))
  assert.match(home, /useState<TopMenuId \| null>\(null\)/)
})

test('FASE H: encabezado conserva título hebreo protagonista', () => {
  assert.match(home, /עברית מקראית/)
  assert.match(home, />Hebreo Bíblico</)
  assert.doesNotMatch(home, /Accessibility/)
})

test('FASE H: el primer sector se llama Alef-Bet', () => {
  assert.match(home, /id: 'alef-bet',[\s\S]*?short: 'Alef-Bet'/)
  assert.match(explorer, /id="alef-bet-title"[\s\S]*?>Alef-Bet</)
})

test('FASE H: aprender agrupa seis áreas y abre una sola', () => {
  assert.equal((home.match(/id: '(?:alef-bet|vowels|reading|vocabulary|grammar|review)'/g) ?? []).length, 6)
  assert.match(home, /function LearningAreaButton/)
  assert.match(home, /<AlefBetExplorer simpleMode=\{false\} \/>/)
})

test('FASE H: Vocales abre el explorador real de niqqud', () => {
  assert.match(home, /import NiqqudExplorer/)
  assert.match(home, /id: 'vowels',[\s\S]*?available: true/)
  assert.match(home, /activeSection\.id === 'vowels'[\s\S]*?<NiqqudExplorer \/>/)
  assert.match(niqqud, /Vocales y sílabas/)
  assert.match(niqqud, /¿Qué es el niqqud\?/)
})

test('FASE H: niqqud conserva doce signos trazables y cautelas', () => {
  assert.equal((niqqud.match(/order:\s*\d+/g) ?? []).length, 12)
  for (const name of ['Pataj', 'Qamats', 'Segol', 'Tsere', 'Hiriq', 'Holam', 'Qubuts', 'Shuruq', 'Sheva', 'Hataf Pataj', 'Hataf Segol', 'Hataf Qamats']) assert.match(niqqud, new RegExp(`name: '${name}'`))
  assert.match(niqqud, /qamats qatan y suena o/)
  assert.match(niqqud, /sheva vocal y sheva silencioso/)
})

test('FASE H: Lectura usa catálogo real con dos modos y tres vistas', () => {
  assert.match(home, /import ReadingWordsExplorer/)
  assert.match(home, /id: 'reading',[\s\S]*?available: true/)
  assert.match(home, /activeSection\.id === 'reading'[\s\S]*?<ReadingWordsExplorer \/>/)
  assert.match(reading, /Lectura y palabras/)
  assert.match(reading, /type ReadingMode = 'nikud' \| 'plain'/)
  assert.match(reading, /Con niqqud/)
  assert.match(reading, /Sin niqqud/)
  assert.match(reading, /type WordView = 'cards' \| 'list' \| 'detail'/)
  assert.match(catalog, /from\('biblical_lexical_entries'\)/)
})

test('FASE H: ficha de palabra es didáctica y no expone datos técnicos', () => {
  const detail = reading.slice(reading.indexOf('function LearningDetail'), reading.indexOf('function CardsView'))
  assert.match(detail, /Cómo se pronuncia/)
  assert.match(detail, /Cómo se forma/)
  assert.match(detail, /Qué significa/)
  assert.doesNotMatch(detail, /Fuente|Glosa de la fuente|Strong|sourceLocator|providerVersion|contentHash/)
})

test('FASE H: Prueba tu progreso conserva quince preguntas secuenciales', () => {
  assert.equal((home.match(/type: '(?:Reconocer|Distinguir|Sofit|Dagesh|Lectura|Comprensión|Integración)'/g) ?? []).length, 15)
  assert.match(home, /Pregunta \{step \+ 1\} de \{TEST_QUESTIONS\.length\}/)
  assert.match(home, /15 preguntas variadas/)
})

test('FASE H: resultado conserva ficha de maestro e historial futuro', () => {
  assert.match(home, /Ficha de resultado · ejemplo/)
  assert.match(home, /Tu maestro recomienda reforzar antes de avanzar/)
  assert.match(home, /Historial de progreso/)
  assert.match(home, /Aún no existe persistencia de progreso en FASE H/)
})

test('FASE H: materiales conserva exactamente once enlaces agrupados', () => {
  assert.equal((supportCourse.match(/orden:\s*\d+/g) ?? []).length, 11)
  assert.equal((supportCourse.match(/https:\/\/www\.youtube\.com\/watch\?v=/g) ?? []).length, 11)
  assert.equal((supportCourse.match(/verificacion:\s*'pendiente'/g) ?? []).length, 11)
  assert.match(home, /HEBREW_SUPPORT_COURSE\.filter/)
})

test('FASE H: Biblia en hebreo conserva lector guiado sin duplicar motor', () => {
  assert.match(home, /function BibleHebrewPreview/)
  assert.match(home, /Modelo del lector guiado/)
  assert.match(home, /Génesis 1:1/)
  assert.match(home, /בְּרֵאשִׁית בָּרָא אֱלֹהִים/)
  assert.match(home, /RV1909/)
  assert.match(home, /no crea otro motor bíblico ni nuevas tablas/)
})

test('FASE H: no introduce audio ni persistencia falsa', () => {
  assert.doesNotMatch(home, /supabase|localStorage|sessionStorage/)
  assert.doesNotMatch(home, /speechSynthesis|new Audio|Audio\(/)
  assert.doesNotMatch(explorer, /speechSynthesis|new Audio|Audio\(/)
  assert.doesNotMatch(niqqud, /speechSynthesis|new Audio|Audio\(/)
  assert.doesNotMatch(reading, /speechSynthesis|new Audio|Audio\(|localStorage|sessionStorage/)
  assert.doesNotMatch(catalog, /\.insert\(|\.update\(|\.delete\(|\.upsert\(/)
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
