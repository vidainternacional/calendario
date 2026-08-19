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
  for (const label of ['Alef–Yod', 'Kaf–Tav', 'Dagesh', 'Sofit', 'Guturales', 'Matres', 'Shin / Sin']) {
    assert.match(explorer, new RegExp(label.replace('/', '\\/')))
  }
  assert.match(explorer, /Un punto dentro de algunas letras/)
  assert.match(explorer, /Cinco letras cambian de forma cuando aparecen al final/)
  assert.match(explorer, /<GroupExplanation item=\{activeGroup\} \/>/)
})

test('FASE H: mini-fichas permiten nombres largos sin truncarlos', () => {
  const tile = explorer.slice(explorer.indexOf('function LetterTile'), explorer.indexOf('function ExpandedLetterCard'))
  assert.match(tile, /letter\.orden/)
  assert.match(tile, /text-\[4\.35rem\]/)
  assert.match(tile, /break-words/)
  assert.match(tile, /min-h-\[34px\]/)
  assert.doesNotMatch(tile, /\btruncate\b/)
  assert.doesNotMatch(tile, /PrimaryLetterForms/)
})

test('FASE H: ficha ampliada conserva tres representaciones con layout móvil seguro', () => {
  assert.match(explorer, /function PrimaryLetterForms/)
  assert.match(explorer, /Libro/)
  assert.match(explorer, /Cuadrada/)
  assert.match(explorer, /Manuscrita/)
  assert.match(explorer, /grid-cols-\[minmax\(0,1fr\)_minmax\(0,1\.4fr\)_minmax\(0,1fr\)\]/)
  assert.match(explorer, /break-words text-\[1\.55rem\]/)
  assert.match(explorer, />Sonido</)
  assert.match(explorer, />Significado</)
})

test('FASE H: reverso desplaza encabezado y contenido como una sola pieza', () => {
  assert.match(explorer, /overflow-y-auto overscroll-contain/)
  assert.match(explorer, /\[-webkit-overflow-scrolling:touch\]/)
  assert.doesNotMatch(explorer, /sticky top-0/)
  assert.doesNotMatch(explorer, /backdrop-blur-sm/)
  assert.match(explorer, /Pronunciación aproximada:/)
  assert.match(explorer, /onClick=\{\(\) => setFlipped\(value => !value\)\}/)
})

test('FASE H: fichas abren y se retraen al tocar la misma letra con zoom suave', () => {
  assert.match(explorer, /useState<number \| null>\(null\)/)
  assert.match(explorer, /function toggleLetter\(order: number\)/)
  assert.match(explorer, /setClosingOrder\(order\)/)
  assert.match(explorer, /scale\(\.94\)/)
  assert.match(explorer, /duration: closing \? 180 : 240/)
  assert.match(explorer, /prefers-reduced-motion: reduce/)
  assert.match(explorer, /space-y-4/)
  assert.match(explorer, /grid grid-cols-3 gap-4/)
})

test('FASE H: explicación del Alef-Bet replica el patrón integrado con scroll de Favoritos', () => {
  assert.match(explorer, /function AlefBetIntroduction/)
  assert.match(explorer, /¿Qué es el Alef-Bet\?/)
  assert.match(explorer, /max-h-72/)
  assert.match(explorer, /overflow-y-auto/)
  assert.match(explorer, /border-t border-slate-200 p-4/)
  assert.match(explorer, /se lee de derecha a izquierda/)
  assert.match(explorer, /reconocer → distinguir → combinar → leer → comprender/)
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

test('FASE H: el primer sector se llama Alef-Bet y no Letras', () => {
  assert.match(home, /id: 'alef-bet',[\s\S]*?short: 'Alef-Bet'/)
  assert.doesNotMatch(home, /id: 'alef-bet',[^\n]*short: 'Letras'/)
  assert.match(explorer, /id="alef-bet-title"[\s\S]*?>Alef-Bet</)
})

test('FASE H: explicaciones de aprendizaje usan desplegables integrados con scroll limitado', () => {
  assert.match(home, /function ScrollableDisclosure/)
  assert.match(home, /max-h-72 overflow-y-auto overscroll-contain/)
  assert.match(home, /Qué aprenderás/)
  assert.match(home, /En qué enfocarte/)
  assert.match(home, /Cómo practicar/)
  assert.match(home, /<ScrollableDisclosure he="מַה נִלְמַד" es="Qué aprenderás">/)
})

test('FASE H: aprender agrupa seis áreas y abre una sola', () => {
  assert.equal((home.match(/id: '(?:alef-bet|vowels|reading|vocabulary|grammar|review)'/g) ?? []).length, 6)
  assert.match(home, /function LearningAreaButton/)
  assert.match(home, /grid grid-cols-2 gap-2/)
  assert.match(home, /min-h-\[66px\]/)
  assert.match(home, /Aprender paso a paso/)
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

test('FASE H: materiales agrupa 11 clases en un recorrido por etapas con scroll', () => {
  assert.equal((supportCourse.match(/orden:\s*\d+/g) ?? []).length, 11)
  assert.equal((supportCourse.match(/https:\/\/www\.youtube\.com\/watch\?v=/g) ?? []).length, 11)
  assert.equal((supportCourse.match(/verificacion:\s*'pendiente'/g) ?? []).length, 11)
  assert.match(home, /Fundamentos/)
  assert.match(home, /Vocales y lectura/)
  assert.match(home, /Lectura bíblica y reglas/)
  assert.match(home, /HEBREW_SUPPORT_COURSE\.filter/)
  assert.match(home, /max-h-72 space-y-3 overflow-y-auto/)
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
