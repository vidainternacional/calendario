import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const route = fs.readFileSync('app/api/admin/ai-diagnostics/route.ts', 'utf8')

test('diagnóstico clasifica fallos sin devolver mensajes crudos de proveedores', () => {
  assert.match(route, /type ProviderFailureCategory = 'sin_creditos' \| 'rate_limit' \| 'autenticacion' \| 'sin_permisos' \| 'error_proveedor'/)
  assert.match(route, /classifyProviderFailure/)
  assert.match(route, /return 'sin_creditos'/)
  assert.match(route, /return 'autenticacion'/)
  assert.match(route, /return 'sin_permisos'/)
  assert.match(route, /return 'rate_limit'/)
  assert.match(route, /error: category/)
  assert.doesNotMatch(route, /safeProviderMessage/)
  assert.doesNotMatch(route, /error: \[safeType, safeMessage\]/)
})

test('clasificación contempla señales reales de saldo y cuota sin hardcodear proveedores', () => {
  assert.match(route, /credit\|balance\|billing\|quota\|insufficient\|recharge\|license/)
  assert.match(route, /status === 401/)
  assert.match(route, /status === 403/)
  assert.match(route, /status === 429/)
})
