import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const page = fs.readFileSync('app/(app)/pastoral/page.tsx', 'utf8')
const styles = fs.readFileSync('app/(app)/pastoral/pastoral-visual-system.css', 'utf8')

test('Centro Pastoral conserva Proyecto visible y áreas secundarias cerradas por defecto', () => {
  assert.match(page, /<h2 id="proyecto-pastoral">Proyecto<\/h2>/)
  assert.match(page, /className="pastoral-primary-action"/)
  assert.match(page, /<details key=\{id\} className="pastoral-work-section">/)
  assert.match(page, /<details className="pastoral-work-section">/)
  assert.doesNotMatch(page, /<details[^>]*\sopen(?:\s|=|>)/)
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

test('Centro Pastoral evita la composición principal de tarjetas anidadas', () => {
  assert.match(page, /pastoral-workspace/)
  assert.match(styles, /superficie de trabajo integrada, sin tarjetas anidadas/)
  assert.match(styles, /\.pastoral-work-section/)
  assert.match(styles, /border-bottom: 1px solid #e2e8f0/)
  assert.doesNotMatch(page, /bg-gradient-to-br from-indigo-600 to-violet-700/)
  assert.doesNotMatch(page, /overflow-hidden rounded-\[28px\] border border-slate-200 bg-white shadow-sm/)
})

test('Centro Pastoral mantiene áreas táctiles y feedback móvil', () => {
  assert.match(styles, /min-height: 3\.85rem/)
  assert.match(styles, /min-height: 3rem/)
  assert.match(styles, /-webkit-tap-highlight-color: transparent/)
  assert.match(styles, /transform: rotate\(90deg\)/)
})
