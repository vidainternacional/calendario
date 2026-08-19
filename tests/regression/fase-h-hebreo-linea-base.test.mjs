import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const dataset = fs.readFileSync('lib/hebreo/alef-bet.ts', 'utf8')
const explorer = fs.readFileSync('components/hebreo/AlefBetExplorer.tsx', 'utf8')
const home = fs.readFileSync('components/hebreo/HebrewLearningHome.tsx', 'utf8')
const page = fs.readFileSync('app/(app)/estudios/hebreo/page.tsx', 'utf8')
const estudios = fs.readFileSync('app/(app)/estudios/page.tsx', 'utf8')
const uxContract = fs.readFileSync('docs/FASE_H_ARQUITECTURA_UX_APRENDIZAJE_2026-08-18.md', 'utf8')

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

test('FASE H: las 22 fichas conservan valor, signo histórico, sonido y origen', () => {
  assert.equal((dataset.match(/valor:\s*\d+/g) ?? []).length, 22)
  assert.equal((dataset.match(/fenicio:\s*'/g) ?? []).length, 22)
  assert.equal((dataset.match(/sonidoPedagogico:\s*'/g) ?? []).length, 22)
  assert.equal((dataset.match(/origenNombre:\s*'/g) ?? []).length, 22)
  assert.equal((dataset.match(/certezaHistorica:\s*'(?:bien atestiguado|probable|debatido)',/g) ?? []).length, 22)
})

test('FASE H: Shin y Sin permanecen dentro de una sola letra del Alef-bet', () => {
  assert.match(dataset, /orden:\s*21,[\s\S]*?letra:\s*'ש'[\s\S]*?nombre:\s*'Shin \/ Sin'/)
  assert.match(dataset, /שׁ Shin: punto a la derecha/)
  assert.match(dataset, /שׂ Sin: punto a la izquierda/)
})

test('FASE H: grupos especializados se explican en lenguaje sencillo y no saturan la primera vista', () => {
  assert.match(explorer, /type LearningGroup = 'all' \| 'begadkefat' \| 'sofit' \| 'gutturals' \| 'matres' \| 'shin-sin'/)
  assert.match(explorer, /label: 'Dagesh'/)
  assert.match(explorer, /label: 'Sofit'/)
  assert.match(explorer, /label: 'Guturales'/)
  assert.match(explorer, /label: 'Matres'/)
  assert.match(explorer, /label: 'Shin \/ Sin'/)
  assert.match(explorer, /Más filtros/)
  assert.match(explorer, /Un punto que puede cambiar el sonido/)
  assert.match(explorer, /Cinco letras con una forma especial/)
  assert.match(explorer, /Boolean\(letter\.formaFinal\)/)
})

test('FASE H: la ficha principal prioriza lectura grande, sonido y un ejemplo breve', () => {
  assert.match(explorer, /Valor \{letter\.valor\}/)
  assert.match(explorer, />Sonido</)
  assert.match(explorer, />Ejemplo</)
  assert.match(explorer, /text-\[9\.5rem\]/)
  assert.match(explorer, /letter\.ejemplo\.palabra/)
  assert.match(explorer, /letter\.ejemplo\.significado/)
  assert.match(explorer, /Generalmente no tiene un sonido propio fuerte/)
})

test('FASE H: controles de giro usan icono y verbo visible para accesibilidad', () => {
  assert.match(explorer, /<RotateCcw className="h-4 w-4"/)
  assert.match(explorer, /text=\"Ver formas\"/)
  assert.match(explorer, /text=\"Volver\"/)
  assert.match(explorer, /min-h-11/)
  assert.match(explorer, /motion-reduce:transition-none/)
})

test('FASE H: cada ficha muestra cuadrada, manuscrita e histórica sin meter fuentes al repositorio', () => {
  assert.match(explorer, />Cuadrada</)
  assert.match(explorer, />Manuscrita</)
  assert.match(explorer, />Histórica</)
  assert.match(explorer, /Arial Hebrew Scholar/)
  assert.match(explorer, /Corsiva Hebrew/)
  assert.match(explorer, /letter\.fenicio/)
})

test('FASE H: transliteración, Unicode y gematría técnica no dominan la ficha de aprendizaje', () => {
  assert.doesNotMatch(explorer, /Transliteración/)
  assert.doesNotMatch(explorer, /Unicode/)
  assert.doesNotMatch(explorer, /Gematría/)
  assert.match(explorer, /No es el significado automático de una palabra bíblica/)
})

test('FASE H: carrusel sigue disponible fuera de modo sencillo y conserva ficha amplia', () => {
  assert.match(explorer, /Carrusel/)
  assert.match(explorer, /simpleMode \|\| viewMode === 'grid'/)
  assert.match(explorer, /dir="rtl"/)
  assert.match(explorer, /snap-x snap-mandatory/)
  assert.match(explorer, /CarouselLetterDetail/)
  assert.match(explorer, /text-\[9rem\]/)
})

test('FASE H: inicio tiene una sola acción principal y oculta la ruta pesada por defecto', () => {
  assert.match(home, /Hebreo Bíblico/)
  assert.match(home, /Aprende a leer paso a paso/)
  assert.match(home, /Continúa tu camino/)
  assert.match(home, /Reconoce las primeras letras/)
  assert.match(home, />\s*Continuar\s*</)
  assert.match(home, /const \[simpleMode, setSimpleMode\] = useState\(true\)/)
  assert.match(home, /!simpleMode && \(/)
  assert.doesNotMatch(home, /Progreso:\s*8%/)
  assert.doesNotMatch(home, /5 minutos/)
})

test('FASE H: ruta curricular contiene diez etapas y áreas usan un solo acordeón controlado', () => {
  assert.equal((home.match(/status: '(?:current|locked)' },/g) ?? []).length, 10)
  assert.match(home, /es: 'Alef-bet'/)
  assert.match(home, /es: 'Vocales y sílabas'/)
  assert.match(home, /es: 'Lectura de palabras'/)
  assert.match(home, /es: 'Lectura guiada'/)
  assert.match(home, /const \[openSection, setOpenSection\] = useState<SectionId \| null>\(null\)/)
  assert.match(home, /current === section\.id \? null : section\.id/)
  assert.match(home, /<AlefBetExplorer simpleMode=\{simpleMode\} \/>/)
})

test('FASE H: la arquitectura bilingüe mantiene hebreo y español sin convertirlo en decoración', () => {
  assert.match(home, /עברית מקראית/)
  assert.match(home, /אָלֶף־בֵּית/)
  assert.match(home, /תְּנוּעוֹת/)
  assert.match(home, /דִּקְדּוּק/)
  assert.match(home, /על העברית/)
  assert.match(home, /lang="he"/)
  assert.match(home, /dir="rtl"/)
})

test('FASE H: no se simula audio, progreso persistente ni duración editorial inexistente', () => {
  assert.doesNotMatch(explorer, /speechSynthesis|Audio\(|supabase|localStorage|sessionStorage/)
  assert.doesNotMatch(home, /speechSynthesis|Audio\(|supabase|localStorage|sessionStorage/)
  assert.match(home, /El audio y el progreso persistente no se mostrarán hasta contar con su contrato y fuente aprobados/)
})

test('FASE H: contrato UX versiona fichas futuras, accesibilidad, estados y repaso sin implementarlos falsamente', () => {
  assert.match(uxContract, /Ficha de vocal/)
  assert.match(uxContract, /Ficha de sílaba/)
  assert.match(uxContract, /Ficha de vocabulario/)
  assert.match(uxContract, /Ficha gramatical/)
  assert.match(uxContract, /Repaso y repetición espaciada|Progresión y repetición espaciada/)
  assert.match(uxContract, /Sin conexión/)
  assert.match(uxContract, /Error de audio/)
  assert.match(uxContract, /Modo sencillo/)
  assert.match(uxContract, /44×44 px/)
})

test('FASE H: la ruta dedicada vive dentro de Estudios y exige sesión', () => {
  assert.match(page, /createClient\(\)/)
  assert.match(page, /if \(!user\) redirect\('\/login'\)/)
  assert.match(page, /<HebrewLearningHome \/>/)
  assert.doesNotMatch(page, /insert\(|update\(|delete\(|upsert\(/)
})

test('FASE H: Estudios enlaza Hebreo Bíblico como herramienta disponible', () => {
  assert.match(estudios, /href:\s*'\/estudios\/hebreo'/)
  assert.match(estudios, /title:\s*'Hebreo Bíblico'/)
  assert.match(estudios, /action:\s*'Empezar hebreo'/)
})
