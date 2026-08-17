import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const route = fs.readFileSync('app/api/admin/ai-diagnostics/route.ts', 'utf8')

test('diagnóstico IA exige usuario administrador', () => {
  assert.match(route, /auth\.getUser\(\)/)
  assert.match(route, /rol[^\n]*administrador/)
  assert.match(route, /status: 401/)
  assert.match(route, /status: 403/)
})

test('diagnóstico no expone secretos y solo reporta configuración', () => {
  assert.match(route, /configured: provider\.configured\(\)/)
  assert.doesNotMatch(route, /apiKey:/)
  assert.doesNotMatch(route, /process\.env\[[^\]]+\]/)
})

test('prueba real usa prompt mínimo, evita caché y devuelve telemetría técnica', () => {
  assert.match(route, /VIDA_OK/)
  assert.match(route, /bypassCache: true/)
  assert.match(route, /inputTokens/)
  assert.match(route, /outputTokens/)
  assert.match(route, /latencyMs/)
  assert.match(route, /result\.provider/)
  assert.match(route, /result\.model/)
})

test('Perplexity puede permanecer sin configurar sin bloquear los demás proveedores', () => {
  assert.match(route, /PERPLEXITY_API_KEY/)
  assert.match(route, /Boolean\(process\.env\.PERPLEXITY_API_KEY\)/)
})
