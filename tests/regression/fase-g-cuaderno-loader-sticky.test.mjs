import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync('app/cuaderno-fase-g.css', 'utf8')
const workspace = fs.readFileSync('components/biblia/BibleNotesWorkspace.tsx', 'utf8')
const loading = fs.readFileSync('app/(app)/biblia/notas/loading.tsx', 'utf8')
const bibleLoading = fs.readFileSync('app/(app)/biblia/loading.tsx', 'utf8')
const layout = fs.readFileSync('app/layout.tsx', 'utf8')
const themeSync = fs.readFileSync('components/biblia/BibleThemeRouteSync.tsx', 'utf8')

test('FASE G: Nueva nota queda fuera de la pista elástica y solo las fichas hacen scroll', () => {
  assert.match(workspace, /<nav aria-label="Notas del cuaderno" className="vida-cuaderno-notas-rail[^>]*>/)
  assert.match(workspace, /aria-label="Nueva nota" className="vida-cuaderno-nueva-nota/)
  assert.match(workspace, /<div className="vida-cuaderno-notas-scroll[^>]*overflow-x-auto/)
  assert.doesNotMatch(workspace, /<nav aria-label="Notas del cuaderno"[^>]*overflow-x-auto/)
  assert.match(css, /\.vida-cuaderno-nueva-nota\s*\{[\s\S]*?position:\s*absolute\s*!important/)
  assert.match(css, /\.vida-cuaderno-notas-scroll\s*\{[\s\S]*?touch-action:\s*pan-x/)
  assert.match(css, /\.vida-cuaderno-notas-scroll\s*\{[\s\S]*?overflow-y:\s*hidden\s*!important/)
  assert.doesNotMatch(css, /overscroll-behavior-x:\s*contain/)
})

test('FASE G: la primera nota queda limpia en reposo y el fade suave aparece solo al entrar a la cobertura', () => {
  assert.match(workspace, /vida-cuaderno-notas-cover/)
  assert.match(css, /\.vida-cuaderno-notas-cover\s*\{[\s\S]*?width:\s*5\.15rem/)
  assert.match(css, /\.vida-cuaderno-notas-cover\s*\{[\s\S]*?background:\s*#f7f7f4/)
  assert.match(css, /1px\s+0\s+0\s+rgba\(255,\s*255,\s*255,\s*0\.78\)/)
  assert.match(css, /\.vida-cuaderno-notas-cover::after\s*\{[\s\S]*?width:\s*1\.55rem/)
  assert.match(css, /rgba\(247,\s*247,\s*244,\s*0\.995\)\s*10%/)
  assert.match(css, /rgba\(247,\s*247,\s*244,\s*0\.10\)\s*92%/)
  assert.match(css, /\.vida-cuaderno-notas-scroll\s*\{[\s\S]*?margin-left:\s*6\.9rem/)
  assert.doesNotMatch(css, /backdrop-filter/)
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
