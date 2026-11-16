import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const pagina = fs.readFileSync('app/(app)/hoy/planes/[planId]/[dia]/page.tsx', 'utf8')
const acordeon = fs.readFileSync('components/biblia/PlanDiaLecturaAcordeon.tsx', 'utf8')

test('el pasaje diario respeta libro, capítulo y límites guardados', () => {
  for (const prop of ['bookCode', 'chapter', 'verseStart', 'verseEnd', 'referencia']) {
    assert.match(pagina, new RegExp(prop + '=\\{'))
  }
  assert.match(acordeon, /\/api\/biblia\/fuente\/spaRV1909\//)
  assert.match(acordeon, /item\.numero >= verseStart/)
  assert.match(acordeon, /item\.numero <= verseEnd/)
  assert.match(acordeon, /verseStart == null/)
  assert.match(acordeon, /verseEnd == null/)
  assert.match(acordeon, /onToggle=/)
  assert.match(acordeon, /setAbierto\(false\)/)
})

test('devocional y preguntas quedan en acordeones cerrados y admiten varias preguntas', () => {
  assert.equal((pagina.match(/<details className="group">/g) ?? []).length, 2)
  assert.match(pagina, /preguntas\.map/)
  assert.match(pagina, /preguntas\.length > 1/)
  assert.match(pagina, /\.split\(\/\\n\+\/\)/)
})

test('se conservan Biblia, estudio con IA, guardado y navegación entre días', () => {
  assert.match(pagina, /href=\{bibleHref\}/)
  assert.match(pagina, /href=\{studyHref\}/)
  assert.match(pagina, /Estudiar con IA/)
  assert.match(pagina, /PlanDiaCompletarButton/)
  assert.match(pagina, /const nextDay =/)
  assert.match(pagina, /const previousDay =/)
})
