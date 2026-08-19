import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/cuaderno-fase-g.css', 'utf8')
const loading = fs.readFileSync('app/(app)/biblia/notas/loading.tsx', 'utf8')
const bibleLoading = fs.readFileSync('app/(app)/biblia/loading.tsx', 'utf8')
const layout = fs.readFileSync('app/layout.tsx', 'utf8')
const themeSync = fs.readFileSync('components/biblia/BibleThemeRouteSync.tsx', 'utf8')

test('FASE G: Nueva nota permanece anclada y las fichas se desvanecen antes de alcanzarla', () => {
  assert.match(css, /\[aria-label="Notas del cuaderno"\] > button\[aria-label="Nueva nota"\]/)
  assert.match(css, /position:\s*sticky/)
  assert.match(css, /left:\s*0/)
  assert.match(css, /z-index:\s*4/)
  assert.match(css, /button\[aria-label="Nueva nota"\]::after/)
  assert.match(css, /linear-gradient/)
  assert.match(css, /backdrop-filter:\s*blur\(1\.5px\)/)
})

test('FASE G: Cuaderno tiene loader claro propio y no reutiliza el loader temático de Biblia', () => {
  assert.match(loading, /vida-cuaderno-loading/)
  assert.match(loading, /bg-\[#f7f7f4\]/)
  assert.match(loading, /bg-white/)
  assert.doesNotMatch(loading, /vida-biblia-loading|data-biblia-tema/)
  assert.match(css, /html:has\(\.vida-cuaderno-loading\)/)
  assert.match(css, /color-scheme:\s*light\s*!important/)
})

test('FASE G: el loading padre de Biblia también se vuelve claro antes del primer frame del Cuaderno', () => {
  assert.match(css, /html\[data-vida-cuaderno-target='true'\]/)
  assert.match(bibleLoading, /data-vida-cuaderno-target='true'/)
  assert.match(bibleLoading, /background:\s*#f7f7f4\s*!important/)
  assert.match(bibleLoading, /vida-biblia-loading__icon/)
})

test('FASE G: navegación hacia Cuaderno marca el destino antes de que Next muestre su loading boundary', () => {
  assert.match(themeSync, /document\.documentElement\.dataset\.vidaCuadernoTarget = 'true'/)
  assert.match(themeSync, /document\.addEventListener\('click', prepararNavegacion, true\)/)
  assert.match(themeSync, /target\.closest\('a\[href\]'\)/)
  assert.match(themeSync, /retirarTema\(\)/)
})

test('FASE G: primer paint directo no aplica preferencia oscura de Biblia a rutas del Cuaderno', () => {
  assert.match(layout, /const esRutaCuaderno = pathname === '\/biblia\/notas'/)
  assert.match(layout, /pathname\.startsWith\('\/biblia\/notas\/'\)/)
  assert.match(layout, /pathname === '\/biblia\/notas-offline'/)
  assert.match(layout, /document\.documentElement\.dataset\.vidaCuadernoTarget = 'true'/)
  assert.match(layout, /document\.documentElement\.style\.colorScheme = 'light'/)
})
