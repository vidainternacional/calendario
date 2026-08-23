import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const dataset = fs.readFileSync('lib/hebreo/alef-bet.ts', 'utf8')
const supportCourse = fs.readFileSync('lib/hebreo/material-apoyo.ts', 'utf8')
const explorer = fs.readFileSync('components/hebreo/AlefBetExplorer.tsx', 'utf8')
const niqqud = fs.readFileSync('components/hebreo/NiqqudExplorer.tsx', 'utf8')
const words = fs.readFileSync('components/hebreo/ReadingWordsExplorer.tsx', 'utf8')
const reading = fs.readFileSync('components/hebreo/HebrewBibleReader.tsx', 'utf8')
const catalog = fs.readFileSync('lib/hebreo/word-catalog.ts', 'utf8')
const readingRoute = fs.readFileSync('app/api/estudios/hebreo/biblia/route.ts', 'utf8')
const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')
const course = fs.readFileSync('components/hebreo/HebrewCourseCenter.tsx', 'utf8')
const materials = fs.readFileSync('components/hebreo/HebrewSupportMaterials.tsx', 'utf8')
const progress = fs.readFileSync('lib/hebreo/progress.ts', 'utf8')
const coach = fs.readFileSync('components/hebreo/HebrewProgressCoach.tsx', 'utf8')
const page = fs.readFileSync('app/(app)/estudios/hebreo/page.tsx', 'utf8')
const learnPage = fs.readFileSync('app/(app)/estudios/hebreo/aprender/page.tsx', 'utf8')
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

test('FASE H: portada es un hub compacto y Empecemos es la entrada principal', () => {
  assert.match(home, /href="\/estudios\/hebreo\/aprender"/)
  assert.match(home, />Empecemos</)
  assert.match(home, /hebrew-glimmer/)
  assert.match(home, /type QuickPanelId = 'translator' \| 'bible' \| 'materials'/)
  assert.match(home, /useState<QuickPanelId \| null>\(null\)/)
  assert.match(home, /<QuickButton id="translator"/)
  assert.match(home, /<QuickButton id="bible"/)
  assert.match(home, /<QuickButton id="materials"/)
  assert.match(home, /<HebrewTranslator embedded \/>/)
  assert.match(home, /<HebrewBibleReader \/>/)
  assert.match(home, /<HebrewSupportMaterials embedded \/>/)
  assert.doesNotMatch(home, /<AlefBetExplorer|<NiqqudExplorer|<HebrewWordsStudy|<GrammarExplorer|<ReviewExplorer/)
})

test('FASE H: encabezado conserva título hebreo protagonista', () => {
  assert.match(home, /עברית מקראית/)
  assert.match(home, />Hebreo Bíblico</)
  assert.doesNotMatch(home, /Accessibility/)
})

test('FASE H: Aprender vive en página propia y presenta seis botones en cuadrícula 3 por 2', () => {
  const order = ['alef-bet', 'vowels', 'vocabulary', 'reading', 'grammar', 'review'].map(id => course.indexOf(`id: '${id}'`))
  assert.ok(order.every(index => index >= 0))
  for (let index = 1; index < order.length; index += 1) assert.ok(order[index] > order[index - 1])
  assert.match(course, /title: 'Palabras y frases'/)
  assert.match(course, /title: 'Lectura bíblica'/)
  assert.match(course, /useState<SectionId \| null>\(null\)/)
  assert.match(course, /grid w-full max-w-md grid-cols-3/)
  assert.match(course, /aria-expanded=\{open\}/)
  assert.match(course, /const activeSection = SECTIONS\.find/)
  assert.match(course, /<SectionContent id=\{activeSection\.id\} \/>/)
  assert.match(learnPage, /<HebrewCourseCenter \/>/)
})

test('FASE H: Vocales usa tres vistas y la lista didáctica solicitada', () => {
  assert.match(course, /import NiqqudExplorer/)
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
  assert.match(niqqud, /Sheva Na \(vocal\) y Sheva Naj \(silenciosa\)/)
})

test('FASE H: Palabras usa catálogo real con Lista Tarjetas detalle expandible y paginación discreta', () => {
  assert.match(course, /if \(id === 'vocabulary'\) return <HebrewWordsStudy \/>/)
  assert.match(words, /type ReadingMode = 'nikud' \| 'plain'/)
  assert.match(words, /type WordView = 'list' \| 'cards'/)
  assert.match(words, /function PrimaryList/)
  assert.match(words, /function CardsView/)
  assert.match(words, /function LearningDetail/)
  assert.match(words, /const PAGE_SIZE = 60/)
  assert.match(words, /Anterior/)
  assert.match(words, /Siguiente/)
  assert.doesNotMatch(words, /snap-x snap-mandatory|function DetailView/)
  assert.match(catalog, /from\('biblical_lexical_entries'\)/)
})

test('FASE H: ficha de palabra es puntual y no expone datos técnicos', () => {
  const detail = words.slice(words.indexOf('function LearningDetail'), words.indexOf('function PrimaryList'))
  assert.match(detail, /Cómo se pronuncia/)
  assert.match(detail, /Cómo se forma/)
  assert.match(detail, /Qué significa/)
  assert.doesNotMatch(detail, /Fuente|Glosa de la fuente|Strong|sourceLocator|providerVersion|contentHash|Sustantivo|Verbo|Adjetivo/)
})

test('FASE H: Lectura abre la Biblia real y no duplica el diccionario', () => {
  assert.match(course, /if \(id === 'reading'\) return <HebrewBibleReader \/>/)
  assert.match(reading, /Lectura bíblica/)
  assert.match(reading, /Practica versículos conocidos o abre la Biblia en orden por libro y capítulo\./)
  assert.match(reading, /Génesis 1:1/)
  assert.match(reading, /Shemá · Dt 6:4/)
  assert.match(reading, /showSpanish/)
  assert.match(readingRoute, /from\('biblical_verse_texts'\)/)
  assert.match(readingRoute, /RV1909_SOURCE_ID/)
  assert.match(readingRoute, /\.order\('verse', \{ ascending: true \}\)/)
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
  assert.match(coach, /Tu historial/)
  assert.match(coach, /Qué estudiar después/)
  assert.match(coach, /loadHebrewProgress/)
  assert.doesNotMatch(home + coach, /La persistencia de progreso todavía no está activa\./)
})

test('FASE H: materiales conserva exactamente once enlaces y admite despliegue embebido', () => {
  assert.equal((supportCourse.match(/orden:\s*\d+/g) ?? []).length, 11)
  assert.equal((supportCourse.match(/https:\/\/www\.youtube\.com\/watch\?v=/g) ?? []).length, 11)
  assert.equal((supportCourse.match(/verificacion:\s*'pendiente'/g) ?? []).length, 11)
  assert.match(materials, /function MaterialGroups/)
  assert.match(materials, /embedded = false/)
  assert.match(materials, /if \(embedded\) return <MaterialGroups \/>/)
  assert.match(materials, /HEBREW_SUPPORT_COURSE\.filter/)
  assert.match(materials, /Fundamentos/)
  assert.match(materials, /Vocales y lectura/)
  assert.match(materials, /Lectura bíblica y reglas/)
})

test('FASE H: Traductor Biblia y Materiales se despliegan en Inicio sin navegación obligatoria', () => {
  assert.match(home, /function toggleQuick\(id: QuickPanelId\)/)
  assert.match(home, /current === id \? null : id/)
  assert.match(home, /aria-label=\{`\$\{QUICK_PANELS\[openQuick\]\.title\} desplegado`\}/)
  assert.match(home, /openQuick === 'translator'/)
  assert.match(home, /openQuick === 'bible'/)
  assert.match(home, /openQuick === 'materials'/)
  assert.match(reading, /HEBREW_BIBLE_BOOKS/)
  assert.match(reading, /Capítulo/)
  assert.match(reading, /Con niqqud/)
  assert.match(reading, /Sin niqqud/)
})

test('FASE H: persistencia personal queda aislada del catálogo y sin almacenamiento local', () => {
  assert.doesNotMatch(home, /supabase|localStorage|sessionStorage/)
  for (const content of [home, course, explorer, niqqud, words, reading, coach]) assert.doesNotMatch(content, /localStorage|sessionStorage/)
  assert.match(catalog, /from\('biblical_hebrew_search_resolutions'\)/)
  assert.match(catalog, /\.upsert\(payload/)
  assert.doesNotMatch(catalog, /from\('biblical_lexical_entries'\)[\s\S]{0,500}\.(?:insert|update|delete|upsert)\(/)
  assert.doesNotMatch(readingRoute, /\.insert\(|\.update\(|\.delete\(|\.upsert\(/)
})

test('FASE H: ruta principal exige sesión y conserva destino después del login', () => {
  assert.match(page, /createClient\(\)/)
  assert.match(page, /if \(!user\) redirect\('\/login\?next=\/estudios\/hebreo'\)/)
  assert.match(page, /<HebrewLearningHome \/>/)
})

test('FASE H: Estudios conserva entrada a Hebreo Bíblico', () => {
  assert.match(estudios, /href:\s*'\/estudios\/hebreo'/)
  assert.match(estudios, /title:\s*'Hebreo Bíblico'/)
})
