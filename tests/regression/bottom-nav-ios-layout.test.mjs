import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const bottomNav = fs.readFileSync('components/layout/BottomNav.tsx', 'utf8')

test('navegación inferior: usa un viewport de layout estable y no el viewport visual de iOS', () => {
  assert.match(bottomNav, /data-bottom-nav-shell="layout-viewport"/)
  assert.match(bottomNav, /h-\[100lvh\]/)
  assert.match(bottomNav, /style=\{\{ height: '100lvh' \}\}/)
  assert.match(bottomNav, /app-bottom-nav pointer-events-auto absolute inset-x-0 bottom-0/)
  assert.match(bottomNav, /data-keyboard-policy="layout-bottom-covered"/)
  assert.doesNotMatch(bottomNav, /app-bottom-nav fixed inset-x-0 bottom-0/)
  assert.doesNotMatch(bottomNav, /visualViewport|baselineViewportRef/)
})
