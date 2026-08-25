import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-template-library-v2.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const presets = fs.readFileSync('components/pastoral/pastoral-editor-presets.ts', 'utf8')
const profesionales = fs.readFileSync('components/pastoral/pastoral-professional-templates.ts', 'utf8')

test('V2 carga después de la biblioteca anterior y no toca el workspace', () => {
  assert.match(layout, /pastoral-template-library\.css'[\s\S]*pastoral-template-library-v2\.css'/)
  assert.doesNotMatch(css, /pastoral-editor-shell/)
  assert.doesNotMatch(css, /pastoral-tool-dock/)
})

test('Plantillas y Temas usan el mismo ancho de 132px', () => {
  assert.match(css, /pastoral-template-option,[\s\S]*pastoral-theme-option[\s\S]*flex: 0 0 132px !important/)
  assert.match(css, /width: 132px !important/)
})

test('las miniaturas destacadas usan un solo lenguaje de icono y líneas', () => {
  assert.match(css, /pastoral-template-option:nth-child\(-n\+36\)/)
  assert.match(css, /pastoral-template-preview::after,[\s\S]*pastoral-theme-option::after/)
  assert.match(css, /border: 1\.2px solid currentColor !important/)
  assert.match(css, /i:nth-child\(3\)[\s\S]*height: 2px !important[\s\S]*border-radius: 999px !important/)
})

test('Temas se representan como mini diapositivas y no como tres swatches genéricos', () => {
  assert.match(css, /pastoral-theme-swatches > i:nth-child\(1\)[\s\S]*height: 5px !important/)
  assert.match(css, /pastoral-theme-swatches > i:nth-child\(2\)[\s\S]*height: 3px !important/)
  assert.match(css, /pastoral-theme-swatches > i:nth-child\(3\)[\s\S]*height: 2px !important/)
  for (let i = 1; i <= 20; i += 1) assert.match(css, new RegExp(`pastoral-theme-option:nth-child\\(${i}\\)`))
})

test('la biblioteca cubre familias visuales realmente distintas', () => {
  for (const id of ['tipografico-bold', 'vintage-sermon', 'scrapbook-sutil', 'acuarela-suave', 'oro-elegante', 'monocromo-editorial', 'neon-lineal', 'gradiente-blur', 'fotografia-ready', 'retro-creativo', 'minimal-dos-tonos', 'worship-luz']) {
    assert.match(profesionales, new RegExp(`id: '${id}'`))
  }
  for (const id of ['editorial-blanco', 'papel-biblia', 'negro-oro', 'juventud-neon', 'grafito', 'borgona-clasico']) {
    assert.match(presets, new RegExp(`id: '${id}'`))
  }
})
