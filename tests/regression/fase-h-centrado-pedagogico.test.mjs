import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const page = fs.readFileSync('app/(app)/estudios/hebreo/page.tsx', 'utf8')
const styles = fs.readFileSync('app/(app)/estudios/hebreo/hebreo.module.css', 'utf8')
const contract = fs.readFileSync('docs/FASE_H_CONTRATO_VISUAL_APP_HEBREO_2026-08-19.md', 'utf8')

test('FASE H centrado: toda la experiencia queda bajo una regla visual transversal', () => {
  assert.match(page, /import styles from '\.\/hebreo\.module\.css'/)
  assert.match(page, /<div className=\{styles\.centered\}>/)
  assert.match(page, /<HebrewLearningHome \/>/)
})

test('FASE H centrado: corrige alineaciones izquierda y derecha sin tocar la escritura', () => {
  assert.match(styles, /:global\(\.text-left\)/)
  assert.match(styles, /:global\(\.text-right\)/)
  assert.match(styles, /text-align:\s*center !important/)
  assert.match(styles, /input\[dir='rtl'\]/)
  assert.match(styles, /textarea\[dir='rtl'\]/)
  assert.match(styles, /text-align:\s*right/)
})

test('FASE H centrado: disclosures y tablas conservan contenido centrado', () => {
  assert.match(styles, /\.border-y\) > button\[aria-expanded\]/)
  assert.match(styles, /justify-content:\s*center !important/)
  assert.match(styles, /:global\(table\)/)
  assert.match(styles, /:global\(th\)/)
  assert.match(styles, /:global\(td\)/)
})

test('FASE H centrado: el contrato obliga a las superficies nuevas', () => {
  assert.match(contract, /Alineación pedagógica transversal/)
  assert.match(contract, /títulos, subtítulos, explicaciones, instrucciones/)
  assert.match(contract, /toda nueva superficie creada dentro de FASE H debe heredarlo/)
})
