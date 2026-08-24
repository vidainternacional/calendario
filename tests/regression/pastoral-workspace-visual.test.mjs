import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const page = fs.readFileSync('app/(app)/pastoral/page.tsx', 'utf8')
const header = fs.readFileSync('components/pastoral/PastoralPageHeader.tsx', 'utf8')
const packages = fs.readFileSync('components/pastoral/PaquetesClient.tsx', 'utf8')
const styles = fs.readFileSync('app/(app)/pastoral/pastoral-workspace-v2.css', 'utf8')

test('Centro Pastoral conserva Proyecto visible y herramientas en rejilla horizontal', () => {
  assert.match(page, /<h2 id="proyecto-pastoral">Proyecto<\/h2>/)
  assert.match(page, /className="pastoral-primary-action"/)
  assert.match(page, /className="pastoral-tool-grid"/)
  assert.match(styles, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/)
  assert.match(styles, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/)
  assert.doesNotMatch(page, /<details/)
})

test('Centro Pastoral conserva las rutas funcionales existentes', () => {
  for (const route of [
    '/pastoral/bosquejos',
    '/pastoral/colecciones',
    '/pastoral/biblioteca',
    '/pastoral/materiales',
    '/biblia?from=pastoral',
    '/estudios/profundo?from=pastoral',
    '/pastoral/paquetes',
  ]) assert.match(page, new RegExp(route.replace(/[?]/g, '\\?')))
})

test('Centro Pastoral evita composición de lista y tarjetas anidadas', () => {
  assert.match(page, /pastoral-workspace/)
  assert.match(styles, /accesos como iconos directos sobre el background/)
  assert.match(styles, /\.pastoral-tool-link/)
  assert.doesNotMatch(page, /pastoral-work-section/)
  assert.doesNotMatch(page, /bg-gradient-to-br from-indigo-600 to-violet-700/)
})

test('Centro Pastoral mantiene iconos directos y feedback móvil', () => {
  assert.match(styles, /\.pastoral-tool-link:active/)
  assert.match(styles, /transform: scale\(\.96\)/)
  assert.match(styles, /-webkit-tap-highlight-color: transparent/)
})

test('Proyecto nuevo usa acordeones minimalistas y no tarjetas encajadas', () => {
  assert.match(packages, /className="pastoral-project-builder"/)
  assert.equal((packages.match(/className="pastoral-accordion"/g) ?? []).length, 3)
  for (const title of ['Información básica', 'Contenido', 'Aplicación y recursos']) assert.match(packages, new RegExp(title))
  assert.match(styles, /@keyframes pastoralReveal/)
  assert.match(styles, /\.pastoral-accordion\[open\]/)
  assert.doesNotMatch(packages, /rounded-\[24px\] border border-indigo-100 bg-white/)
  assert.doesNotMatch(packages, /rounded-2xl border border-slate-200 p-4/)
})

test('Proyectos existentes y ayuda quedan ocultos tras acordeones', () => {
  assert.match(packages, /pastoral-projects-accordion/)
  assert.match(packages, /pastoral-how-it-works/)
  assert.doesNotMatch(packages, /<details[^>]*\sopen(?:\s|=|>)/)
})

test('Áreas internas usan encabezado compacto sin descripción permanente', () => {
  assert.doesNotMatch(header, /pastoral-page-description/)
  assert.match(styles, /\.pastoral-page-description[\s\S]*display: none/)
  assert.match(styles, /\.pastoral-back-link[\s\S]*background: transparent/)
})
