import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const pagina = fs.readFileSync('app/(app)/hoy/planes/[planId]/[dia]/page.tsx', 'utf8')
const acordeon = fs.readFileSync('components/biblia/PlanDiaLecturaAcordeon.tsx', 'utf8')

test('lectura usa la biblioteca bíblica RV1909 aprobada y los rangos editoriales guardados', () => {
  assert.match(pagina, /from\('biblical_verse_texts'\)/)
  assert.match(pagina, /b6fef01a-f304-4fd0-98aa-5fe070279946/)
  assert.match(pagina, /\.eq\('book_code', reading\.book_code\)/)
  assert.match(pagina, /\.eq\('chapter', reading\.chapter\)/)
  assert.match(pagina, /reading\.verse_start == null \|\|/)
  assert.match(pagina, /reading\.verse_end == null \|\|/)
  assert.match(pagina, /versos=\{versosDelDia\}/)
  assert.match(acordeon, /createClient\(\)/)
  assert.match(acordeon, /from\('biblical_verse_texts'\)/)
  assert.match(acordeon, /const citaCompleta =/)
  assert.match(acordeon, /verseStart \?\? versos\[0\]\?\.numero/)
  assert.match(acordeon, /verseEnd \?\? versos\[versos\.length - 1\]\?\.numero/)
  assert.match(acordeon, /if \(versos\.length > 0\) return/)
  assert.match(acordeon, /max-h-52 overflow-y-auto overscroll-contain/)
  assert.match(acordeon, /text-base leading-7 text-slate-800/)
  assert.match(acordeon, /aria-expanded=\{lecturaCompleta\}/)
  assert.match(acordeon, /Ver lectura completa/)
  assert.match(acordeon, /Reducir lectura/)
  assert.doesNotMatch(acordeon, /bg-gradient-to-b|line-clamp-2|text-\[13px\]/)
  assert.match(acordeon, /setVersos\(seleccionados\)/)
  assert.match(acordeon, /versos\.map/)
  assert.match(acordeon, /<section aria-label=/)
})

test('devocional siempre toma el contenido guardado y tiene vista previa dentro del acordeón', () => {
  assert.match(pagina, /String\(reading\.devocional \?\? ''\)/)
  assert.match(pagina, /paragraphs\[0\]/)
  assert.match(pagina, /line-clamp-1/)
  assert.match(pagina, /paragraphs\.map/)
  assert.match(pagina, /<details className="group" open>/)
  assert.equal((pagina.match(/<details className="group"/g) ?? []).length, 2)
})

test('se conservan pregunta, Biblia, IA, marcar completado y navegación', () => {
  assert.match(pagina, /preguntas\.map/)
  assert.match(pagina, /href=\{bibleHref\}/)
  assert.match(pagina, /href=\{studyHref\}/)
  assert.match(pagina, /PlanDiaCompletarButton/)
  assert.match(pagina, /const previousDay =/)
  assert.match(pagina, /const nextDay =/)
})
