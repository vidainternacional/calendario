import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const page = fs.readFileSync('app/(app)/pastoral/page.tsx', 'utf8')
const header = fs.readFileSync('components/pastoral/PastoralPageHeader.tsx', 'utf8')
const packages = fs.readFileSync('components/pastoral/PaquetesClient.tsx', 'utf8')
const styles = fs.readFileSync('app/(app)/pastoral/pastoral-workspace-v2.css', 'utf8')
const detailStyles = fs.readFileSync('app/(app)/pastoral/paquetes/[id]/workspace-mobile.css', 'utf8')

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

test('Proyecto nuevo usa iconos horizontales y un solo panel editable', () => {
  assert.match(packages, /type SeccionNueva = 'general' \| 'contenido' \| 'versiculos' \| 'recursos'/)
  assert.match(packages, /className="pastoral-builder-tools"/)
  assert.match(packages, /className="pastoral-builder-panel"/)
  assert.match(packages, /setSeccionNueva\(id\)/)
  for (const title of ['General', 'Contenido', 'Versículos', 'Recursos']) assert.match(packages, new RegExp(title))
  assert.match(styles, /\.pastoral-builder-tools/)
  assert.match(styles, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/)
  assert.match(styles, /\.pastoral-builder-panel/)
  assert.doesNotMatch(packages, /className="pastoral-accordion-number"/)
})

test('Cambiar de herramienta no pierde los datos del proyecto antes de crearlo', () => {
  for (const state of ['titulo', 'descripcion', 'instrucciones', 'bosquejoId', 'coleccionId', 'recursoIds']) {
    assert.match(packages, new RegExp(`useState\\([^)]*\\)|useState<[^>]+>\\([^)]*\\)`))
  }
  assert.match(packages, /type="hidden" name="titulo" value=\{titulo\}/)
  assert.match(packages, /type="hidden" name="descripcion_publica" value=\{descripcion\}/)
  assert.match(packages, /type="hidden" name="instrucciones" value=\{instrucciones\}/)
  assert.match(packages, /type="hidden" name="bosquejo_id" value=\{bosquejoId\}/)
  assert.match(packages, /type="hidden" name="coleccion_id" value=\{coleccionId\}/)
})

test('Proyecto abierto coloca herramientas arriba y elimina el dock flotante', () => {
  assert.match(detailStyles, /herramientas arriba, un solo panel activo/)
  assert.match(detailStyles, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/)
  assert.match(detailStyles, /position: sticky/)
  assert.doesNotMatch(detailStyles, /position: fixed/)
  assert.match(detailStyles, /background: transparent !important/)
  assert.match(detailStyles, /box-shadow: none !important/)
})

test('Proyectos existentes permanecen cerrados hasta solicitarlos', () => {
  assert.match(packages, /pastoral-projects-accordion/)
  assert.doesNotMatch(packages, /<details[^>]*\sopen(?:\s|=|>)/)
})

test('Áreas internas usan encabezado compacto sin descripción permanente', () => {
  assert.doesNotMatch(header, /pastoral-page-description/)
  assert.match(styles, /\.pastoral-page-description[\s\S]*display: none/)
  assert.match(styles, /\.pastoral-back-link[\s\S]*background: transparent/)
})
