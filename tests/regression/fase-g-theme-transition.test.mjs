import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function source(path) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

test('Biblia no borra el tema al desmontarse durante una transición interna', () => {
  const bridge = source('components/biblia/BibliaThemeStateBridge.tsx')
  const cleanup = bridge.slice(bridge.indexOf('return () => {'), bridge.indexOf('  }, [])'))

  assert.match(cleanup, /observer\.disconnect\(\)/)
  assert.doesNotMatch(cleanup, /delete document\.documentElement\.dataset\.bibliaTema/)
  assert.doesNotMatch(cleanup, /delete document\.body\.dataset\.bibliaTema/)
})

test('el sincronizador de ruta es la autoridad que retira tema y color-scheme', () => {
  const routeSync = source('components/biblia/BibleThemeRouteSync.tsx')

  assert.match(routeSync, /function retirarTema\(\)/)
  assert.match(routeSync, /delete document\.documentElement\.dataset\.bibliaTema/)
  assert.match(routeSync, /delete document\.body\.dataset\.bibliaTema/)
  assert.match(routeSync, /removeProperty\('color-scheme'\)/)
  assert.match(routeSync, /document\.documentElement\.style\.colorScheme = modo === 'oscuro'/)
})
