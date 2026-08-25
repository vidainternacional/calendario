import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const css = fs.readFileSync('app/(app)/pastoral/pastoral-editor-stable.css', 'utf8')
const presets = fs.readFileSync('components/pastoral/pastoral-editor-presets.ts', 'utf8')

test('biblioteca visual se presenta mediante la autoridad stable', () => {
  assert.match(layout, /pastoral-editor-stable\.css/)
  assert.doesNotMatch(layout, /pastoral-template-library\.css|pastoral-template-library-v2\.css/)
})

test('colección curada conserva variedad suficiente', () => {
  const plantillas = (presets.match(/categoria: '(?:Cristianas|Minimalistas|Generales)'/g) ?? []).length
  assert.ok(plantillas >= 18)
  assert.match(presets, /linear-gradient|repeating-linear-gradient/)
})

test('miniaturas de Plantillas y Temas comparten dimensiones', () => {
  assert.match(css, /pastoral-template-option,[\s\S]*pastoral-theme-option[\s\S]*132px/)
  assert.match(css, /pastoral-template-preview,[\s\S]*pastoral-theme-swatches[\s\S]*height: 60px !important/)
})
