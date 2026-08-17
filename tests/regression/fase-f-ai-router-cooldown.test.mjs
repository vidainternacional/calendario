import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const router = fs.readFileSync('lib/ai/vida-ai.ts', 'utf8')

test('router clasifica el body técnico antes de decidir cooldown', () => {
  assert.match(router, /readProviderFailureFingerprint/)
  assert.match(router, /classifyVidaAiProviderFailure/)
  assert.match(router, /providerFailureCooldownMs/)
  assert.match(router, /providerHttpError/)
})

test('todos los proveedores HTTP usan clasificación compartida sin exponer payload', () => {
  assert.match(router, /throw await providerHttpError\('OpenAI', response\)/)
  assert.match(router, /throw await providerHttpError\('Gemini', response\)/)
  assert.match(router, /throw await providerHttpError\('Claude', response\)/)
  assert.match(router, /throw await providerHttpError\(provider, response\)/)
  assert.doesNotMatch(router, /console\.(log|error|warn).*fingerprint/)
})

test('intentos conservan categoría técnica y fallback sigue recorriendo proveedores disponibles', () => {
  assert.match(router, /category: error instanceof ProviderError \? error\.category : 'error_proveedor'/)
  assert.match(router, /for \(const entry of providers\)/)
  assert.match(router, /providerAvailable\(entry\.provider, entry\.model\)/)
})
