import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const route = fs.readFileSync('app/api/admin/ai-diagnostics/route.ts', 'utf8')
const card = fs.readFileSync('components/admin/AiDiagnosticsCard.tsx', 'utf8')
const analytics = fs.readFileSync('app/(app)/admin/analisis/page.tsx', 'utf8')
const router = fs.readFileSync('lib/ai/vida-ai.ts', 'utf8')

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

test('Centro de Análisis muestra el diagnóstico únicamente al administrador', () => {
  assert.match(analytics, /AiDiagnosticsCard/)
  assert.match(analytics, /currentProfile\?\.rol === 'administrador'/)
  assert.match(card, /\/api\/admin\/ai-diagnostics/)
  assert.match(card, /Probar router/)
  assert.match(card, /Tokens entrada/)
  assert.match(card, /Tokens salida/)
  assert.match(card, /Latencia/)
})

test('diagnóstico permite probar un proveedor específico sin alterar el orden global', () => {
  assert.match(route, /provider: requestedProvider/)
  assert.match(route, /provider_not_configured/)
  assert.match(router, /provider\?: VidaAiProviderName/)
  assert.match(router, /request\.provider \? \[request\.provider\] : configuredProviderOrder/)
  assert.match(card, /Probar \$\{LABELS\[provider\.provider\]/)
})

test('fallos de proveedor exponen solo estado técnico sanitizado al administrador', () => {
  assert.match(router, /VidaAiProviderAttempt/)
  assert.match(router, /status: error instanceof ProviderError/)
  assert.match(route, /error\.attempts \?\? \[\]/)
  assert.match(card, /HTTP \$\{failedAttempt\.status\}/)
  assert.doesNotMatch(card, /API_KEY|Authorization|Bearer/)
})
