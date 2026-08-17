import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const route = fs.readFileSync('app/api/admin/ai-diagnostics/route.ts', 'utf8')
const classifier = fs.readFileSync('lib/ai/provider-failure.ts', 'utf8')

test('diagnóstico no devuelve mensajes crudos de proveedores', () => {
  assert.match(route, /error: category/)
  assert.doesNotMatch(route, /safeProviderMessage/)
  assert.doesNotMatch(route, /error: \[safeType, safeMessage\]/)
})

test('clasificación compartida contempla señales reales de saldo y cuota sin hardcodear proveedores', () => {
  assert.match(classifier, /VidaAiProviderFailureCategory/)
  assert.match(classifier, /credit\|balance\|billing\|quota\|insufficient\|recharge\|license/)
  assert.match(classifier, /status === 401/)
  assert.match(classifier, /status === 403/)
  assert.match(classifier, /status === 429/)
})

test('cooldown distingue bloqueos persistentes de fallos transitorios', () => {
  assert.match(classifier, /sin_creditos.*autenticacion.*sin_permisos/)
  assert.match(classifier, /6 \* 60 \* 60 \* 1000/)
  assert.match(classifier, /category === 'rate_limit'/)
  assert.match(classifier, /2 \* 60 \* 1000/)
  assert.match(classifier, /status >= 500/)
})

test('lector de fallos solo extrae huella técnica y no conserva payload completo', () => {
  assert.match(classifier, /readProviderFailureFingerprint/)
  assert.match(classifier, /response\.clone\(\)\.json\(\)/)
  assert.match(classifier, /return \{ type: error\.code \?\? error\.type, message: error\.message \}/)
})
