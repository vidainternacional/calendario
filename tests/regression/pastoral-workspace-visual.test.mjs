import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const page = fs.readFileSync('app/(app)/pastoral/page.tsx', 'utf8')
const header = fs.readFileSync('components/pastoral/PastoralPageHeader.tsx', 'utf8')
const styles = fs.readFileSync('app/(app)/pastoral/pastoral-visual-system.css', 'utf8')

test('Centro Pastoral conserva Proyecto visible y herramientas en rejilla horizontal', () => {
  assert.match(page, /<h2 id="proyecto-pastoral">Proyecto<\/h2>/)
  assert.match(page, /className="pastoral-primary-action"/)
  assert.match(page, /grid grid-cols-3/)
  assert.match(page, /sm:grid-cols-4/)
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
  assert.match(styles, /superficie de trabajo integrada, sin tarjetas anidadas/)
  assert.match(page, /flex min-h-\[78px\] flex-col items-center justify-center/)
  assert.doesNotMatch(page, /pastoral-work-section/)
  assert.doesNotMatch(page, /bg-gradient-to-br from-indigo-600 to-violet-700/)
})

test('Centro Pastoral mantiene iconos directos y feedback móvil', () => {
  assert.match(page, /h-7 w-7 stroke-\[1\.8\]/)
  assert.match(page, /active:scale-95/)
  assert.match(page, /text-\[11px\] font-bold/)
})

test('Áreas internas usan encabezado compacto sin descripción permanente', () => {
  assert.match(header, /mb-5 border-b border-slate-200 pb-4/)
  assert.match(header, /min-h-11/)
  assert.match(header, /text-\[1\.65rem\]/)
  assert.doesNotMatch(header, /pastoral-page-description/)
})
