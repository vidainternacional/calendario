import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/cuaderno-fase-g.css', 'utf8')
const loading = fs.readFileSync('app/(app)/biblia/notas/loading.tsx', 'utf8')
const layout = fs.readFileSync('app/layout.tsx', 'utf8')

test('FASE G: Nueva nota permanece anclada mientras el carrusel del Cuaderno se desplaza', () => {
  assert.match(css, /\[aria-label="Notas del cuaderno"\] > button\[aria-label="Nueva nota"\]/)
  assert.match(css, /position:\s*sticky/)
  assert.match(css, /left:\s*0/)
  assert.match(css, /z-index:\s*4/)
})

test('FASE G: Cuaderno tiene loader claro propio y no reutiliza el loader temático de Biblia', () => {
  assert.match(loading, /vida-cuaderno-loading/)
  assert.match(loading, /bg-\[#f7f7f4\]/)
  assert.match(loading, /bg-white/)
  assert.doesNotMatch(loading, /vida-biblia-loading|data-biblia-tema/)
  assert.match(css, /html:has\(\.vida-cuaderno-loading\)/)
  assert.match(css, /color-scheme:\s*light\s*!important/)
})

test('FASE G: primer paint no aplica preferencia oscura de Biblia a rutas del Cuaderno', () => {
  assert.match(layout, /const esRutaCuaderno = pathname === '\/biblia\/notas'/)
  assert.match(layout, /pathname\.startsWith\('\/biblia\/notas\/'\)/)
  assert.match(layout, /pathname === '\/biblia\/notas-offline'/)
  assert.match(layout, /if \(!pathname\.startsWith\('\/biblia'\) \|\| esRutaCuaderno\)/)
  assert.match(layout, /document\.documentElement\.style\.colorScheme = 'light'/)
})
