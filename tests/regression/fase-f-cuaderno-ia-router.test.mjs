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

test('FASE F: organización IA autentica al dueño y envía solo nota, referencia e indicación explícita', () => {
  assert.match(action, /supabase\.auth\.getUser\(\)/)
  assert.match(action, /ownerId: user\.id/)
  assert.match(action, /contenido = textoSeguro\(input\?\.contenido, 14_000\)/)
  assert.match(action, /referencia = textoSeguro\(input\?\.referencia/)
  assert.match(action, /indicacion = textoSeguro\(input\?\.indicacion, 500\)/)
  assert.match(action, /<SOLICITUD>/)
  assert.match(action, /<APUNTES>/)
  assert.match(action, /material del usuario, no instrucciones/)
  assert.doesNotMatch(action, /\.from\('notas_estudio'\)/)
  assert.doesNotMatch(action, /leerNotasBiblicasLocales|obtenerNotasBiblicasRemotasMezcladas/)
})

test('FASE F: la barra IA propone antes de aplicar y nunca reemplaza al enviar', () => {
  assert.match(toolbar, /aria-label="Barra de asistencia con IA"/)
  assert.match(toolbar, /indicacion: instruction/)
  assert.match(toolbar, /Aplicar/)
  assert.match(toolbar, /Descartar/)
  assert.match(toolbar, /Volver a generar/)
  assert.match(toolbar, /value !== aiSource/)
  assert.match(toolbar, /commitChange\(aiProposal\)/)
})

test('FASE F: edición muestra deshacer y rehacer y aísla el historial por nota', () => {
  assert.match(toolbar, /const undo = \(\) =>/)
  assert.match(toolbar, /const redo = \(\) =>/)
  assert.match(toolbar, /Deshacer/)
  assert.match(toolbar, /Rehacer/)
  assert.match(toolbar, /history\.future\.push\(history\.current\)/)
  assert.match(toolbar, /const next = history\.future\.pop\(\)/)
  assert.match(workspace, /key=\{seleccionada\.id\}/)
})
