import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const router = fs.readFileSync('lib/ai/vida-ai.ts', 'utf8')
const action = fs.readFileSync('app/actions/cuaderno-ai.ts', 'utf8')
const toolbar = fs.readFileSync('components/biblia/NotesEditingToolbar.tsx', 'utf8')

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

test('FASE F: organización IA autentica al dueño y envía solo la nota actual con su referencia', () => {
  assert.match(action, /supabase\.auth\.getUser\(\)/)
  assert.match(action, /ownerId: user\.id/)
  assert.match(action, /contenido = textoSeguro\(input\?\.contenido/)
  assert.match(action, /referencia = textoSeguro\(input\?\.referencia/)
  assert.match(action, /<APUNTES>/)
  assert.match(action, /material del usuario, no instrucciones/)
  assert.doesNotMatch(action, /\.from\('notas_estudio'\)/)
  assert.doesNotMatch(action, /leerNotasBiblicasLocales|obtenerNotasBiblicasRemotasMezcladas/)
})

test('FASE F: la IA propone antes de aplicar y conserva descarte, regeneración y deshacer', () => {
  assert.match(toolbar, /organizarApuntesConIA/)
  assert.match(toolbar, /Organizar mis apuntes/)
  assert.match(toolbar, /Aplicar propuesta/)
  assert.match(toolbar, /Descartar/)
  assert.match(toolbar, /Volver a generar/)
  assert.match(toolbar, /value !== aiSource/)
  assert.match(toolbar, /commitChange\(aiProposal\)/)
  assert.match(toolbar, /Deshacer/)
  assert.match(toolbar, /Después puedes usar Deshacer/)
})
