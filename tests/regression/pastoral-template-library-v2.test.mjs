import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/(app)/pastoral/pastoral-template-library-v2.css', 'utf8')
const layout = fs.readFileSync('app/(app)/pastoral/layout.tsx', 'utf8')
const presets = fs.readFileSync('components/pastoral/pastoral-editor-presets.ts', 'utf8')
const profesionales = fs.readFileSync('components/pastoral/pastoral-professional-templates.ts', 'utf8')
const canvas = fs.readFileSync('components/pastoral/PastoralVisualCanvas.tsx', 'utf8')

test('V2 carga después de la biblioteca anterior y no toca el workspace', () => {
  assert.match(layout, /pastoral-template-library\.css'[\s\S]*pastoral-template-library-v2\.css'/)
  assert.doesNotMatch(css, /pastoral-editor-shell/)
  assert.doesNotMatch(css, /pastoral-tool-dock/)
})

test('Plantillas y Temas usan el mismo ancho de 132px', () => {
  assert.match(css, /pastoral-template-option,[\s\S]*pastoral-theme-option[\s\S]*flex: 0 0 132px !important/)
  assert.match(css, /width: 132px !important/)
})

test('todas las miniaturas se reducen a titular y cuerpo, sin iconos', () => {
  assert.match(css, /pastoral-template-preview::after,[\s\S]*pastoral-template-preview::before[\s\S]*display: none !important/)
  assert.match(css, /pastoral-template-preview > i:nth-child\(1\),[\s\S]*pastoral-template-preview > i:nth-child\(2\)/)
  assert.match(css, /pastoral-template-preview > i:nth-child\(1\)[\s\S]*height: 5px !important/)
  assert.match(css, /pastoral-template-preview > i:nth-child\(2\)[\s\S]*height: 3px !important/)
  assert.match(css, /pastoral-theme-swatches > i \{[\s\S]*display: none !important/)
  assert.match(css, /pastoral-theme-swatches > i:nth-child\(1\),[\s\S]*pastoral-theme-swatches > i:nth-child\(2\)/)
  assert.match(css, /pastoral-theme-option::after,[\s\S]*pastoral-theme-option::before[\s\S]*display: none !important/)
})

test('Temas conservan identidad visual y nombre fuera de la miniatura', () => {
  assert.match(css, /pastoral-theme-option > span:last-child[\s\S]*top: 63px !important/)
  for (let i = 1; i <= 20; i += 1) assert.match(css, new RegExp(`pastoral-theme-option:nth-child\\(${i}\\) \\.pastoral-theme-swatches`))
})

test('los controles del elemento seleccionado viven fuera de su caja de contenido', () => {
  assert.match(canvas, /function estiloControlesFlotantes/)
  assert.match(canvas, /left: 'calc\(100% \+ 8px\)'/)
  assert.match(canvas, /right: 'calc\(100% \+ 8px\)'/)
  assert.match(canvas, /bottom: 'calc\(100% \+ 8px\)'/)
  assert.match(canvas, /data-canvas-floating-controls="true"/)
  assert.match(canvas, /-bottom-3 -right-3/)
})

test('la biblioteca cubre familias visuales realmente distintas', () => {
  for (const id of ['tipografico-bold', 'vintage-sermon', 'scrapbook-sutil', 'acuarela-suave', 'oro-elegante', 'monocromo-editorial', 'neon-lineal', 'gradiente-blur', 'fotografia-ready', 'retro-creativo', 'minimal-dos-tonos', 'worship-luz']) {
    assert.match(profesionales, new RegExp(`id: '${id}'`))
  }
  for (const id of ['editorial-blanco', 'papel-biblia', 'negro-oro', 'juventud-neon', 'grafito', 'borgona-clasico']) {
    assert.match(presets, new RegExp(`id: '${id}'`))
  }
})
