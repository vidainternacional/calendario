import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { vidaAI, VidaAiError, type VidaAiProviderName } from '@/lib/ai/vida-ai'

export const dynamic = 'force-dynamic'

const PROVIDERS = [
  { name: 'gemini', configured: () => Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) },
  { name: 'openai', configured: () => Boolean(process.env.OPENAI_API_KEY) },
  { name: 'claude', configured: () => Boolean(process.env.ANTHROPIC_API_KEY) },
  { name: 'grok', configured: () => Boolean(process.env.XAI_API_KEY) },
  { name: 'kimi', configured: () => Boolean(process.env.MOONSHOT_API_KEY || process.env.MOONSHOOT_API_KEY) },
  { name: 'perplexity', configured: () => Boolean(process.env.PERPLEXITY_API_KEY) },
] as const

const TEST_INPUT = 'Prueba técnica mínima del router VIDA.'
const TEST_INSTRUCTIONS = 'Responde únicamente con VIDA_OK. No agregues ninguna otra palabra.'

async function requireAdministrator() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  if ((profile as { rol?: string } | null)?.rol !== 'administrador') return { error: NextResponse.json({ ok: false, error: 'Solo administradores' }, { status: 403 }) }
  return { user }
}

function providerDefinition(name: VidaAiProviderName) { return PROVIDERS.find((provider) => provider.name === name) }
function safeProviderMessage(value: unknown) {
  if (typeof value !== 'string') return null
  const clean = value.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim()
  if (!clean || clean.length > 220) return null
  if (/api[_ -]?key|authorization|bearer|sk-[a-z0-9_-]+/i.test(clean)) return null
  return clean
}
function diagnosticFailure(provider: VidaAiProviderName, model: string, status: number, startedAt: number, type?: unknown, message?: unknown) {
  const safeType = safeProviderMessage(type)
  const safeMessage = safeProviderMessage(message)
  return NextResponse.json({
    ok: false,
    requestedProvider: provider,
    provider,
    error: [safeType, safeMessage].filter(Boolean).join(': ') || `${provider} HTTP ${status}`,
    attempts: [{ provider, model, status }],
    latencyMs: Date.now() - startedAt,
  }, { status: 503 })
}

async function diagnoseClaude(startedAt: number) {
  const model = process.env.VIDA_CLAUDE_ECONOMY_MODEL || 'claude-haiku-4-5'
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY || '', 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, system: TEST_INSTRUCTIONS, messages: [{ role: 'user', content: TEST_INPUT }], max_tokens: 240 }), cache: 'no-store', signal: AbortSignal.timeout(12_000),
  })
  const payload = await response.json().catch(() => ({})) as { content?: Array<{ type?: string; text?: string }>; usage?: { input_tokens?: number; output_tokens?: number }; error?: { type?: unknown; message?: unknown } }
  if (!response.ok) return diagnosticFailure('claude', model, response.status, startedAt, payload.error?.type, payload.error?.message)
  const text = payload.content?.filter((part) => part.type === 'text').map((part) => part.text || '').join('\n').trim() || ''
  return NextResponse.json({ ok: true, requestedProvider: 'claude', provider: 'claude', model, inputTokens: payload.usage?.input_tokens ?? null, outputTokens: payload.usage?.output_tokens ?? null, latencyMs: Date.now() - startedAt, responseValid: text === 'VIDA_OK' })
}

async function diagnoseOpenAi(startedAt: number) {
  const model = process.env.VIDA_OPENAI_ECONOMY_MODEL || 'gpt-5-mini'
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY || ''}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, instructions: TEST_INSTRUCTIONS, input: TEST_INPUT, max_output_tokens: 240, store: false }), cache: 'no-store', signal: AbortSignal.timeout(12_000),
  })
  const payload = await response.json().catch(() => ({})) as { output_text?: string; usage?: { input_tokens?: number; output_tokens?: number }; error?: { type?: unknown; code?: unknown; message?: unknown } }
  if (!response.ok) return diagnosticFailure('openai', model, response.status, startedAt, payload.error?.code || payload.error?.type, payload.error?.message)
  return NextResponse.json({ ok: true, requestedProvider: 'openai', provider: 'openai', model, inputTokens: payload.usage?.input_tokens ?? null, outputTokens: payload.usage?.output_tokens ?? null, latencyMs: Date.now() - startedAt, responseValid: typeof payload.output_text === 'string' ? payload.output_text.trim() === 'VIDA_OK' : true })
}

async function diagnoseCompatible(provider: 'grok' | 'kimi', startedAt: number) {
  const isGrok = provider === 'grok'
  const model = isGrok ? process.env.VIDA_GROK_ECONOMY_MODEL || 'grok-4.5' : process.env.VIDA_KIMI_ECONOMY_MODEL || 'kimi-k2.6'
  const apiKey = isGrok ? process.env.XAI_API_KEY || '' : process.env.MOONSHOT_API_KEY || process.env.MOONSHOOT_API_KEY || ''
  const endpoint = isGrok ? 'https://api.x.ai/v1/chat/completions' : 'https://api.moonshot.ai/v1/chat/completions'
  const body: Record<string, unknown> = { model, messages: [{ role: 'system', content: TEST_INSTRUCTIONS }, { role: 'user', content: TEST_INPUT }], max_tokens: 240, stream: false }
  if (!isGrok) body.thinking = { type: 'disabled' }
  const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store', signal: AbortSignal.timeout(12_000) })
  const payload = await response.json().catch(() => ({})) as { choices?: Array<{ message?: { content?: string | null } }>; usage?: { prompt_tokens?: number; completion_tokens?: number }; error?: { type?: unknown; code?: unknown; message?: unknown } | string; message?: unknown; detail?: unknown }
  if (!response.ok) {
    const errorObject = payload.error && typeof payload.error === 'object' ? payload.error : undefined
    const type = errorObject?.code || errorObject?.type
    const message = errorObject?.message || (typeof payload.error === 'string' ? payload.error : null) || payload.message || payload.detail
    return diagnosticFailure(provider, model, response.status, startedAt, type, message)
  }
  const text = payload.choices?.[0]?.message?.content?.trim() || ''
  return NextResponse.json({ ok: true, requestedProvider: provider, provider, model, inputTokens: payload.usage?.prompt_tokens ?? null, outputTokens: payload.usage?.completion_tokens ?? null, latencyMs: Date.now() - startedAt, responseValid: text === 'VIDA_OK' })
}

export async function GET() {
  const auth = await requireAdministrator()
  if ('error' in auth) return auth.error
  return NextResponse.json({ ok: true, providers: PROVIDERS.map((provider) => ({ provider: provider.name, configured: provider.configured() })) })
}

export async function POST(request: Request) {
  const auth = await requireAdministrator()
  if ('error' in auth) return auth.error
  const body = await request.json().catch(() => ({})) as { provider?: unknown }
  if (body.provider !== undefined && (typeof body.provider !== 'string' || !PROVIDERS.some((provider) => provider.name === body.provider))) return NextResponse.json({ ok: false, error: 'provider_invalid' }, { status: 400 })
  const requestedProvider = typeof body.provider === 'string' ? body.provider as VidaAiProviderName : undefined
  const requestedDefinition = requestedProvider ? providerDefinition(requestedProvider) : undefined
  if (requestedDefinition && !requestedDefinition.configured()) return NextResponse.json({ ok: false, error: 'provider_not_configured', provider: requestedProvider }, { status: 409 })

  const startedAt = Date.now()
  try {
    if (requestedProvider === 'claude') return await diagnoseClaude(startedAt)
    if (requestedProvider === 'openai') return await diagnoseOpenAi(startedAt)
    if (requestedProvider === 'grok' || requestedProvider === 'kimi') return await diagnoseCompatible(requestedProvider, startedAt)

    const result = await vidaAI({ task: 'interpretar_busqueda_biblica', ownerId: auth.user.id, input: TEST_INPUT, instructions: TEST_INSTRUCTIONS, bypassCache: true, provider: requestedProvider })
    return NextResponse.json({ ok: true, requestedProvider: requestedProvider ?? 'auto', provider: result.provider, model: result.model, inputTokens: result.inputTokens ?? null, outputTokens: result.outputTokens ?? null, latencyMs: Date.now() - startedAt, responseValid: result.text.trim() === 'VIDA_OK' })
  } catch (error) {
    const code = error instanceof VidaAiError ? error.code : 'unexpected_error'
    return NextResponse.json({ ok: false, requestedProvider: requestedProvider ?? 'auto', provider: requestedProvider ?? null, error: code, attempts: error instanceof VidaAiError ? error.attempts ?? [] : [], latencyMs: Date.now() - startedAt }, { status: 503 })
  }
}
