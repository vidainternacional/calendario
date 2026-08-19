import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const dataset = fs.readFileSync('lib/hebreo/alef-bet.ts', 'utf8')
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
  assert.match(explorer, /type LearningGroup = 'all' \| 'begadkefat' \| 'sofit' \| 'gutturals' \| 'matres' \| 'shin-sin'/)
  assert.match(explorer, /label: 'Dagesh'/)
  assert.match(explorer, /Un punto que modifica el sonido/)
  assert.match(explorer, /label: 'Sofit'/)
  assert.match(explorer, /Cinco letras cambian de forma al final/)
  assert.match(explorer, /label: 'Guturales'/)
  assert.match(explorer, /label: 'Matres'/)
  assert.match(explorer, /label: 'Shin \/ Sin'/)
})

test('FASE H: cada letra muestra nombre español y hebreo sin transliteración en la ficha', () => {
  assert.match(explorer, /const HEBREW_NAMES/)
  assert.match(explorer, /1: 'אָלֶף'/)
  assert.match(explorer, /22: 'תָּו'/)
  assert.match(explorer, /hebrewDisplayName/)
  assert.doesNotMatch(explorer, />Transliteración/)
  assert.doesNotMatch(explorer, />Unicode/)
  assert.doesNotMatch(explorer, />Gematría/)
})

test('FASE H: las formas visibles son hebreas cuadrada, libro y manuscrita, sin signo histórico', () => {
  assert.match(explorer, />Cuadrada/)
  assert.match(explorer, />Libro/)
  assert.match(explorer, />Manuscrita/)
  assert.match(explorer, /Arial Hebrew Scholar/)
  assert.match(explorer, /Times New Roman/)
  assert.match(explorer, /Corsiva Hebrew/)
  assert.doesNotMatch(explorer, />Histórica/)
  assert.doesNotMatch(explorer, /letter\.fenicio/)
})

test('FASE H: la ficha ampliada prioriza signo, nombre, valor, sonido y significado', () => {
  assert.match(explorer, /text-\[9\.8rem\]/)
  assert.match(explorer, /text-3xl font-black tabular-nums/)
  assert.match(explorer, />Sonido/)
  assert.match(explorer, />Significado/)
  assert.match(explorer, /Significado del nombre/)
  assert.match(explorer, /Pronunciación/)
  assert.match(explorer, />Ejemplo/)
})

test('FASE H: la ficha se voltea tocando cualquier parte y no repite 1 de 22', () => {
  assert.match(explorer, /aria-label=\{`Voltear ficha de \$\{name\}`\}/)
  assert.match(explorer, /onClick=\{\(\) => setFlipped\(value => !value\)\}/)
  assert.match(explorer, /Toca cualquier parte de la ficha para voltearla/)
  assert.match(explorer, /<RotateCcw/)
  assert.doesNotMatch(explorer, /padStart\(2/)
  assert.doesNotMatch(explorer, /\/ 22/)
})

test('FASE H: la ficha sobresale del fondo con borde y sombra, sin cajas anidadas innecesarias', () => {
  assert.match(explorer, /shadow-\[0_18px_48px_rgba\(15,23,42,0\.13\)\]/)
  assert.match(explorer, /rounded-\[30px\] border border-slate-200 bg-white/)
  assert.match(explorer, /h-1 w-12 rounded-full bg-indigo-500\/80/)
})

test('FASE H: la entrada elimina la tarjeta Continuar y usa seis accesos circulares 3x2', () => {
  assert.match(home, /grid grid-cols-3 gap-3/)
  assert.match(home, /rounded-full border px-2 py-3 text-center/)
  assert.equal((home.match(/id: '(?:alef-bet|vowels|reading|vocabulary|grammar|review)'/g) ?? []).length, 6)
  assert.doesNotMatch(home, /Continúa tu camino/)
  assert.doesNotMatch(home, /Reconoce las primeras letras/)
  assert.doesNotMatch(home, /ScrollToAlefBet/)
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

test('FASE H: filtros especializados siguen detrás de Más filtros en modo sencillo', () => {
  assert.match(explorer, /moreFiltersOpen/)
  assert.match(explorer, /Más filtros/)
  assert.match(explorer, /simpleMode/)
  assert.match(explorer, /min-h-11 shrink-0 rounded-full px-4/)
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
