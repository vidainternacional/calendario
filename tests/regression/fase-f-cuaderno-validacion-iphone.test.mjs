import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const verseActions = fs.readFileSync('components/biblia/BibleVerseActionsPersistent.tsx', 'utf8')
const fixes = fs.readFileSync('app/notebook-fixes.css', 'utf8')
const sw = fs.readFileSync('public/sw.js', 'utf8')

test('FASE F: crear nota desde Biblia escribe primero en el cuaderno canónico con versículo y contexto', () => {
  assert.match(verseActions, /agregarNotaBiblicaDelUsuario/)
  assert.match(verseActions, /contenido,/)
  assert.match(verseActions, /tipo: 'versiculo'/)
  assert.match(verseActions, /referencia,/)
  assert.match(verseActions, /pasajeNormalizado: normalizarReferencia\(referencia\)/)
  assert.match(verseActions, /contexto: \{ superficieOrigen: 'biblia' \}/)
  assert.match(verseActions, /await guardarNotaBiblica/)
  assert.doesNotMatch(verseActions, /const NOTAS_KEY = 'vida-biblia-notas-v2'/)
  assert.doesNotMatch(verseActions, /localStorage\.setItem\(NOTAS_KEY/)
})

test('FASE F: el editor no queda atrapado en un viewport fijo y reserva espacio real al final', () => {
  assert.match(fixes, /La nota usa el flujo natural del documento/)
  assert.match(fixes, /max-height: none/)
  assert.match(fixes, /padding-bottom: calc\(8rem \+ env\(safe-area-inset-bottom, 0px\)\) !important/)
  assert.match(fixes, /padding-bottom: calc\(6rem \+ env\(safe-area-inset-bottom, 0px\)\) !important/)
  assert.doesNotMatch(fixes, /overflow: hidden !important/)
})

test('FASE F: cold-start offline aplica paridad visual y crecimiento automático sin cachear datos privados', () => {
  assert.match(sw, /OFFLINE_NOTES_PARITY_STYLE/)
  assert.match(sw, /border-radius:999px!important/)
  assert.match(sw, /width:80px!important/)
  assert.match(sw, /OFFLINE_NOTES_PARITY_SCRIPT/)
  assert.match(sw, /Biblia \/ Cuaderno/)
  assert.match(sw, /autoGrow/)
  assert.match(sw, /Origen: Biblia/)
  assert.match(sw, /url\.pathname\.startsWith\('\/api\/'\)/)
  assert.match(sw, /url\.hostname\.includes\('supabase\.co'\)/)
})
