import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const router = fs.readFileSync('lib/ai/vida-ai.ts', 'utf8')
const action = fs.readFileSync('app/actions/cuaderno-ai.ts', 'utf8')
const toolbar = fs.readFileSync('components/biblia/NotesEditingToolbar.tsx', 'utf8')
const workspace = fs.readFileSync('components/biblia/BibleNotesWorkspace.tsx', 'utf8')

test('FASE F: vidaAI centraliza presupuestos y fallback entre proveedores sin exponer claves al cliente', () => {
  assert.match(router, /import 'server-only'/)
  assert.match(router, /export type VidaAiLevel = 1 \| 2/)
  assert.match(router, /GEMINI_API_KEY/)
  assert.match(router, /OPENAI_API_KEY/)
  assert.match(router, /VIDA_AI_ECONOMY_ORDER/)
  assert.match(router, /VIDA_AI_ADVANCED_ORDER/)
  assert.match(router, /for \(const entry of providers\)/)
  assert.match(router, /maxInputChars: 16_000/)
  assert.match(router, /maxOutputTokens: 1_200/)
  assert.match(router, /cacheTtlMs: 10 \* 60 \* 1000/)
  assert.doesNotMatch(toolbar, /OPENAI_API_KEY|GEMINI_API_KEY|api\.openai\.com|generativelanguage\.googleapis\.com/)
})

test('FASE F: los adaptadores minimizan persistencia y limitan salida', () => {
  assert.match(router, /https:\/\/api\.openai\.com\/v1\/responses/)
  assert.match(router, /store: false/)
  assert.match(router, /max_output_tokens: policy\.maxOutputTokens/)
  assert.match(router, /x-goog-api-key/)
  assert.match(router, /generationConfig: \{ maxOutputTokens: policy\.maxOutputTokens \}/)
  assert.match(router, /cache: 'no-store'/)
})

test('FASE F: el router protege consumo y salta temporalmente proveedores con cuota o servicio agotado', () => {
  assert.match(router, /BURST_WINDOW_MS = 60_000/)
  assert.match(router, /BURST_MAX_REQUESTS = 8/)
  assert.match(router, /enforceBurstLimit\(request\.ownerId, request\.task\)/)
  assert.match(router, /error\.status !== 429/)
  assert.match(router, /PROVIDER_COOLDOWN_MS = 2 \* 60 \* 1000/)
  assert.match(router, /providerAvailable\(entry\.provider, entry\.model\)/)
  assert.match(action, /error\.code === 'rate_limited'/)
})

test('FASE F: organización IA autentica al dueño y envía solo la nota actual con su referencia', () => {
  assert.match(action, /supabase\.auth\.getUser\(\)/)
  assert.match(action, /ownerId: user\.id/)
  assert.match(action, /contenido = textoSeguro\(input\?\.contenido, 14_000\)/)
  assert.match(action, /referencia = textoSeguro\(input\?\.referencia/)
  assert.match(action, /indicacion/)
  assert.match(action, /<APUNTES>/)
  assert.match(action, /material del usuario, no instrucciones/)
  assert.doesNotMatch(action, /\.from\('notas_estudio'\)/)
  assert.doesNotMatch(action, /leerNotasBiblicasLocales|obtenerNotasBiblicasRemotasMezcladas/)
})

test('FASE F: IA queda sobre submenús y propone antes de aplicar', () => {
  assert.match(toolbar, /¿Qué quieres hacer con esta nota\?/)
  assert.match(toolbar, /Instrucción para la IA/)
  assert.match(toolbar, /Aplicar propuesta/)
  assert.match(toolbar, /Descartar/)
  assert.match(toolbar, /Volver a generar/)
  assert.match(toolbar, /value !== aiSource/)
  assert.match(toolbar, /onChange\(aiProposal, \{ checkpoint: true \}\)/)
})

test('FASE F: deshacer y rehacer son herramientas globales fuera de Edición', () => {
  assert.match(workspace, /Historial global del cuaderno/)
  assert.match(workspace, /Deshacer última acción/)
  assert.match(workspace, /Rehacer última acción/)
  assert.match(workspace, /noteHistoryRef/)
  assert.match(workspace, /deshacerNota/)
  assert.match(workspace, /rehacerNota/)
  assert.doesNotMatch(toolbar, /Deshacer última acción|Rehacer última acción/)
})
