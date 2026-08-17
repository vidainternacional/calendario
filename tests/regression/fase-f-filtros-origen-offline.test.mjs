import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const shell = fs.readFileSync('public/offline/notas.html', 'utf8')
const sw = fs.readFileSync('public/sw.js', 'utf8')

test('FASE F: los filtros de origen funcionan también en apertura offline', () => {
  assert.match(shell, /data-origin="todos"/)
  assert.match(shell, /data-origin="estudio_profundo"/)
  assert.match(shell, /data-origin="biblia_notas"/)
  assert.match(shell, /activeOrigin === 'todos' \|\| note\.origen === activeOrigin/)
  assert.match(shell, /originFilters\.forEach/)
})

test('FASE F: Estudio Profundo conserva identidad visible sin conexión', () => {
  assert.match(shell, /id="origin-banner"/)
  assert.match(shell, /Origen: Estudio Profundo/)
  assert.match(shell, /note\.origen === 'estudio_profundo'/)
  assert.match(shell, /Estudio · \$\{base\}/)
})

test('FASE F: el nuevo shell sigue sin cachear API, Next ni Supabase', () => {
  assert.match(sw, /vida-shell-v2\.1-notas-origen/)
  assert.match(sw, /url\.pathname\.startsWith\('\/api\/'\)/)
  assert.match(sw, /url\.pathname\.startsWith\('\/_next\/'\)/)
  assert.match(sw, /url\.hostname\.includes\('supabase\.co'\)/)
})
