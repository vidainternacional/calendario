import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const dataset = fs.readFileSync('lib/hebreo/alef-bet.ts', 'utf8')
const supportCourse = fs.readFileSync('lib/hebreo/material-apoyo.ts', 'utf8')
const explorer = fs.readFileSync('components/hebreo/AlefBetExplorer.tsx', 'utf8')
const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')
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

test('FASE H: las 22 fichas conservan valor, sonido y origen editorial', () => {
  assert.equal((dataset.match(/valor:\s*\d+/g) ?? []).length, 22)
  assert.equal((dataset.match(/sonidoPedagogico:\s*'/g) ?? []).length, 22)
  assert.equal((dataset.match(/origenNombre:\s*'/g) ?? []).length, 22)
  assert.equal((dataset.match(/certezaHistorica:\s*'(?:bien atestiguado|probable|debatido)',/g) ?? []).length, 22)
})

test('FASE H: Shin y Sin permanecen dentro de una sola letra del Alef-bet', () => {
  assert.match(dataset, /orden:\s*21,[\s\S]*?letra:\s*'ש'[\s\S]*?nombre:\s*'Shin \/ Sin'/)
  assert.match(dataset, /שׁ Shin: punto a la derecha/)
  assert.match(dataset, /שׂ Sin: punto a la izquierda/)
})

test('FASE H: el explorador mantiene grupos pedagógicos y explica términos técnicos', () => {
  assert.match(explorer, /type LearningGroup = 'all' \| 'part-1' \| 'part-2' \| 'begadkefat' \| 'sofit' \| 'gutturals' \| 'matres' \| 'shin-sin'/)
  assert.match(explorer, /label: 'Alef–Yod'/)
  assert.match(explorer, /label: 'Kaf–Tav'/)
  assert.match(explorer, /label: 'Dagesh'/)
  assert.match(explorer, /Un punto dentro de algunas letras/)
  assert.match(explorer, /label: 'Sofit'/)
  assert.match(explorer, /Cinco letras cambian de forma cuando aparecen al final/)
  assert.match(explorer, /label: 'Guturales'/)
  assert.match(explorer, /label: 'Matres'/)
  assert.match(explorer, /label: 'Shin \/ Sin'/)
  assert.match(explorer, /function GroupExplanation/)
})

test('FASE H: Alef-bet puede estudiarse por dos tramos sin bloquear la vista completa', () => {
  assert.match(explorer, /if \(group === 'part-1'\) return letter\.orden <= 10/)
  assert.match(explorer, /if \(group === 'part-2'\) return letter\.orden >= 11/)
  assert.match(explorer, /Primer tramo de aprendizaje: las letras 1 a 10/)
  assert.match(explorer, /Segundo tramo de aprendizaje: las letras 11 a 22/)
  assert.match(explorer, /id: 'all'/)
})

test('FASE H: cada letra muestra nombre español y hebreo sin transliteración técnica en la cara principal', () => {
  assert.match(explorer, /const HEBREW_NAMES/)
  assert.match(explorer, /1: 'אָלֶף'/)
  assert.match(explorer, /22: 'תָּו'/)
  assert.match(explorer, /hebrewDisplayName/)
  assert.doesNotMatch(explorer, />Transliteración/)
  assert.doesNotMatch(explorer, />Unicode/)
  assert.doesNotMatch(explorer, />Gematría/)
})

test('FASE H: la ficha grande usa solo tres representaciones hebreas y no repite la cuadrada', () => {
  assert.match(explorer, /function PrimaryLetterForms/)
  assert.match(explorer, /Libro/)
  assert.match(explorer, /Cuadrada/)
  assert.match(explorer, /Manuscrita/)
  assert.match(explorer, /Arial Hebrew Scholar/)
  assert.match(explorer, /Times New Roman/)
  assert.match(explorer, /Corsiva Hebrew/)
  assert.doesNotMatch(explorer, />Histórica/)
  assert.doesNotMatch(explorer, /letter\.fenicio/)
})

test('FASE H: las mini-fichas quedan reducidas a número, signo cuadrado y nombre', () => {
  const tileStart = explorer.indexOf('function LetterTile')
  const tileEnd = explorer.indexOf('function ExpandedLetterCard')
  const tile = explorer.slice(tileStart, tileEnd)

  assert.match(tile, /letter\.orden/)
  assert.match(tile, /text-\[4\.55rem\]/)
  assert.match(tile, /style=\{\{ fontFamily: SQUARE_FONT \}\}/)
  assert.match(tile, /\{name\}/)
  assert.doesNotMatch(tile, /PrimaryLetterForms/)
  assert.doesNotMatch(tile, /letter\.valor\}<\/span>/)
})

test('FASE H: la ficha ampliada prioriza signo, nombre, valor, sonido y significado', () => {
  assert.match(explorer, /text-\[9\.6rem\]/)
  assert.match(explorer, /text-\[2\.8rem\] font-black tabular-nums/)
  assert.match(explorer, />Sonido/)
  assert.match(explorer, />Significado/)
  assert.match(explorer, /Significado del nombre/)
  assert.match(explorer, /Pronunciación/)
  assert.match(explorer, />Ejemplo/)
})

test('FASE H: el reverso de la ficha puede desplazarse internamente y conserva contenido largo', () => {
  assert.match(explorer, /overflow-y-auto overscroll-contain/)
  assert.match(explorer, /\[-webkit-overflow-scrolling:touch\]/)
  assert.match(explorer, /touch-pan-y/)
  assert.match(explorer, /sticky top-0/)
})

test('FASE H: el ejemplo incluye una guía de pronunciación sin inventar audio', () => {
  assert.match(explorer, /Pronunciación aproximada:/)
  assert.match(explorer, /letter\.ejemplo\.transliteracion/)
  assert.doesNotMatch(explorer, /speechSynthesis|new Audio|Audio\(/)
})

test('FASE H: la ficha se voltea tocando cualquier parte y no repite 1 de 22', () => {
  assert.match(explorer, /aria-label=\{`Voltear ficha de \$\{name\}`\}/)
  assert.match(explorer, /onClick=\{\(\) => setFlipped\(value => !value\)\}/)
  assert.match(explorer, /Toca cualquier parte de la ficha para voltearla/)
  assert.match(explorer, /<RotateCcw/)
  assert.doesNotMatch(explorer, /padStart\(2/)
  assert.doesNotMatch(explorer, /\/ 22/)
})

test('FASE H: la ficha sobresale del fondo con borde y sombra, sin cajas internas para variantes', () => {
  assert.match(explorer, /shadow-\[0_20px_52px_rgba\(15,23,42,0\.14\)\]/)
  assert.match(explorer, /rounded-\[30px\] border border-slate-200 bg-white/)
  assert.match(explorer, /h-1 w-14 rounded-full bg-indigo-500\/85/)
  assert.doesNotMatch(explorer, /divide-x divide-slate-100 border-y/)
})

test('FASE H: la entrada elimina Continuar y usa seis accesos tipo papiro en 3x2', () => {
  assert.match(home, /grid grid-cols-3 gap-x-2 gap-y-3/)
  assert.match(home, /function LearningScrollButton/)
  assert.match(home, /absolute inset-x-2 inset-y-1 rounded-\[18px\] border/)
  assert.match(home, /absolute -left-1\.5 bottom-2 top-2 w-3 rounded-full border/)
  assert.match(home, /absolute -right-1\.5 bottom-2 top-2 w-3 rounded-full border/)
  assert.match(home, /text-\[1\.35rem\] font-black/)
  assert.equal((home.match(/id: '(?:alef-bet|vowels|reading|vocabulary|grammar|review)'/g) ?? []).length, 6)
  assert.doesNotMatch(home, /Continúa tu camino/)
  assert.doesNotMatch(home, /Reconoce las primeras letras/)
  assert.doesNotMatch(home, /ScrollToAlefBet/)
})

test('FASE H: el panel desplegado se integra al fondo y no encierra Alef-bet en otra tarjeta', () => {
  const panelStart = home.indexOf('function StagePanel')
  const panelEnd = home.indexOf('function LearningScrollButton')
  const panel = home.slice(panelStart, panelEnd)

  assert.match(panel, /className="mt-6"/)
  assert.doesNotMatch(panel, /rounded-\[28px\] border border-slate-200 bg-white/)
  assert.doesNotMatch(panel, /shadow-\[0_16px_42px/)
})

test('FASE H: cada acceso despliega un único panel debajo y solo Alef-bet está disponible', () => {
  assert.match(home, /const \[openSection, setOpenSection\]/)
  assert.match(home, /activeSection && <StagePanel/)
  assert.match(home, /setOpenSection\(current => \(current === section\.id \? null : section\.id\)\)/)
  assert.equal((home.match(/available: true/g) ?? []).length, 1)
  assert.equal((home.match(/available: false/g) ?? []).length, 5)
  assert.match(home, /Esta etapa se activará cuando corresponda en la ruta/)
})

test('FASE H: el encabezado mantiene hebreo y español con una sola idea principal', () => {
  assert.match(home, /עברית מקראית/)
  assert.match(home, /Hebreo Bíblico/)
  assert.match(home, /Aprende a leer paso a paso\./)
  assert.doesNotMatch(home, /Etapa 1 de 10/)
  assert.doesNotMatch(home, /Sesión breve/)
})

test('FASE H: todos los filtros se muestran en una pista horizontal y el activo se explica debajo', () => {
  assert.match(explorer, /LEARNING_GROUPS\.map\(item =>/)
  assert.match(explorer, /overflow-x-auto/)
  assert.match(explorer, /snap-start rounded-full px-4/)
  assert.match(explorer, /<GroupExplanation item=\{activeGroup\} \/>/)
  assert.doesNotMatch(explorer, /moreFiltersOpen/)
  assert.doesNotMatch(explorer, /Más filtros/)
})

test('FASE H: material de apoyo versiona exactamente 11 clases externas con enlaces proporcionados', () => {
  assert.equal((supportCourse.match(/orden:\s*\d+/g) ?? []).length, 11)
  assert.equal((supportCourse.match(/https:\/\/www\.youtube\.com\/watch\?v=/g) ?? []).length, 11)
  assert.equal((supportCourse.match(/videoId:\s*'/g) ?? []).length, 11)
  assert.equal((supportCourse.match(/https:\/\/i\.ytimg\.com\/vi\//g) ?? []).length, 11)
  assert.equal((supportCourse.match(/verificacion:\s*'pendiente'/g) ?? []).length, 11)
  assert.match(supportCourse, /fvBD-rFlTfg/)
  assert.match(supportCourse, /gxRYxrGZd7s/)
  assert.match(supportCourse, /UIdIzEtweOc/)
  assert.match(supportCourse, /Alef-bet · Parte 1/)
  assert.match(supportCourse, /Shemá Yisrael/)
  assert.match(supportCourse, /Reglas básicas · Parte 2/)
})

test('FASE H: el material de apoyo muestra miniaturas y conserva estado pendiente hasta corroboración', () => {
  assert.match(home, /function SupportMaterialSection/)
  assert.match(home, /Material de apoyo/)
  assert.match(home, /Miniatura del enlace de la clase/)
  assert.match(home, /item\.miniatura/)
  assert.match(home, /verificationLabel/)
  assert.match(home, /Pendiente/)
  assert.match(home, /target="_blank"/)
  assert.match(home, /rel="noopener noreferrer"/)
  assert.match(home, /Hasta corroborarlos visualmente/)
})

test('FASE H: la implementación sigue sin introducir audio ni persistencia', () => {
  assert.doesNotMatch(explorer, /speechSynthesis|Audio\(|supabase|localStorage|sessionStorage/)
  assert.doesNotMatch(home, /speechSynthesis|Audio\(|supabase|localStorage|sessionStorage/)
})

test('FASE H: la ruta dedicada vive dentro de Estudios y exige sesión', () => {
  assert.match(page, /createClient\(\)/)
  assert.match(page, /if \(!user\) redirect\('\/login'\)/)
  assert.match(page, /<HebrewLearningHome \/>/)
})

test('FASE H: Estudios enlaza Hebreo Bíblico como herramienta disponible', () => {
  assert.match(estudios, /href:\s*'\/estudios\/hebreo'/)
  assert.match(estudios, /title:\s*'Hebreo Bíblico'/)
  assert.match(estudios, /action:\s*'Empezar hebreo'/)
})
