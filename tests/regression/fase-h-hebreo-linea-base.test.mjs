import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const dataset = fs.readFileSync('lib/hebreo/alef-bet.ts', 'utf8')
const supportCourse = fs.readFileSync('lib/hebreo/material-apoyo.ts', 'utf8')
const explorer = fs.readFileSync('components/hebreo/AlefBetExplorer.tsx', 'utf8')
const niqqud = fs.readFileSync('components/hebreo/NiqqudExplorer.tsx', 'utf8')
const words = fs.readFileSync('components/hebreo/ReadingWordsExplorer.tsx', 'utf8')
const reading = fs.readFileSync('components/hebreo/ReadingSentencesExplorer.tsx', 'utf8')
const catalog = fs.readFileSync('lib/hebreo/word-catalog.ts', 'utf8')
const readingCatalog = fs.readFileSync('lib/hebreo/reading-catalog.ts', 'utf8')
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

test('FASE H: Alef-bet usa Tarjetas Lista y Detalle', () => {
  assert.match(explorer, /type ViewMode = 'cards' \| 'list' \| 'detail'/)
  for (const label of ['Tarjetas', 'Lista', 'Detalle']) assert.match(explorer, new RegExp(label))
  const list = explorer.slice(explorer.indexOf('function ListView'), explorer.indexOf('function GroupExplanation'))
  for (const label of ['Signo', 'Nombre', 'Valor', 'Sonido', 'Significado']) assert.match(list, new RegExp(label))
})

test('FASE H: mini-fichas permiten nombres largos sin truncarlos y priorizan la letra', () => {
  const tile = explorer.slice(explorer.indexOf('function LetterTile'), explorer.indexOf('function ExpandedLetterCard'))
  assert.match(tile, /letter\.orden/)
  assert.match(tile, /text-\[4\.85rem\]/)
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

test('FASE H: aprender ordena Alef-Bet Vocales Palabras Lectura Reglas Repaso', () => {
  const order = ['alef-bet', 'vowels', 'vocabulary', 'reading', 'grammar', 'review'].map(id => home.indexOf(`id: '${id}'`))
  assert.ok(order.every(index => index >= 0))
  for (let index = 1; index < order.length; index += 1) assert.ok(order[index] > order[index - 1])
  assert.match(home, /id: 'vocabulary',[\s\S]*?available: true/)
  assert.match(home, /id: 'reading',[\s\S]*?available: true/)
})

test('FASE H: Vocales usa tres vistas y la lista didáctica solicitada', () => {
  assert.match(home, /import NiqqudExplorer/)
  assert.match(niqqud, /type NiqqudView = 'cards' \| 'list' \| 'detail'/)
  for (const label of ['Tarjetas', 'Lista', 'Detalle']) assert.match(niqqud, new RegExp(label))
  const list = niqqud.slice(niqqud.indexOf('function ListView'), niqqud.indexOf('function DetailView'))
  for (const label of ['Signo', 'Nombre', 'Valor', 'Sonido', 'Función']) assert.match(list, new RegExp(label))
  assert.match(niqqud, /Las vocales no tienen valor gemátrico propio/)
})

test('FASE H: niqqud conserva doce signos trazables y cautelas', () => {
  assert.equal((niqqud.match(/order:\s*\d+/g) ?? []).length, 12)
  for (const name of ['Pataj', 'Qamats', 'Segol', 'Tsere', 'Hiriq', 'Holam', 'Qubuts', 'Shuruq', 'Sheva', 'Hataf Pataj', 'Hataf Segol', 'Hataf Qamats']) assert.match(niqqud, new RegExp(`name: '${name}'`))
  assert.match(niqqud, /qamats qatan y suena o/)
  assert.match(niqqud, /sheva vocal y sheva silencioso/)
})

test('FASE H: Palabras usa catálogo real con dos modos tres vistas y paginación visible', () => {
  assert.match(home, /activeSection\.id === 'vocabulary' \? <ReadingWordsExplorer \/>/)
  assert.match(words, />Palabras</)
  assert.match(words, /type ReadingMode = 'nikud' \| 'plain'/)
  assert.match(words, /type WordView = 'cards' \| 'list' \| 'detail'/)
  assert.match(words, /function PageControl/)
  assert.match(words, /Cada página muestra 24 palabras/)
  assert.match(catalog, /from\('biblical_lexical_entries'\)/)
})

test('FASE H: ficha de palabra es puntual y no expone datos técnicos', () => {
  const detail = words.slice(words.indexOf('function LearningDetail'), words.indexOf('function CardsView'))
  assert.match(detail, /Cómo se pronuncia/)
  assert.match(detail, /Cómo se forma/)
  assert.match(detail, /Qué significa/)
  assert.doesNotMatch(detail, /Fuente|Glosa de la fuente|Strong|sourceLocator|providerVersion|contentHash|Sustantivo|Verbo|Adjetivo/)
})

test('FASE H: Lectura es frases y oraciones y no duplica el diccionario', () => {
  assert.match(home, /activeSection\.id === 'reading' \? <ReadingSentencesExplorer \/>/)
  assert.match(reading, /Lectura de frases y oraciones/)
  for (const label of ['Iniciales', 'Cortas', 'Medias', 'Largas', 'Todas']) assert.match(reading, new RegExp(label))
  assert.match(reading, /Buscar frase en español o hebreo/)
  assert.match(readingCatalog, /from\('biblical_verse_texts'\)/)
  assert.match(readingCatalog, /RV1909_SOURCE_ID/)
  assert.match(readingCatalog, /STARTER_REFERENCES/)
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

test('FASE H: no introduce audio ni persistencia falsa; el catálogo solo persiste resoluciones derivadas autorizadas', () => {
  assert.doesNotMatch(home, /supabase|localStorage|sessionStorage/)
  for (const content of [home, explorer, niqqud, words, reading]) assert.doesNotMatch(content, /speechSynthesis|new Audio|Audio\(/)
  assert.match(catalog, /from\('biblical_hebrew_search_resolutions'\)/)
  assert.match(catalog, /\.upsert\(payload/)
  assert.doesNotMatch(catalog, /from\('biblical_lexical_entries'\)[\s\S]{0,500}\.(?:insert|update|delete|upsert)\(/)
  assert.doesNotMatch(readingCatalog, /\.insert\(|\.update\(|\.delete\(|\.upsert\(/)
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
