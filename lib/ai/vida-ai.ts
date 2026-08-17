import 'server-only'

import { createHash } from 'node:crypto'

export type VidaAiLevel = 1 | 2
export type VidaAiTask = 'organizar_notas'
export type VidaAiProviderName = 'gemini' | 'openai'

type VidaAiPolicy = {
  level: VidaAiLevel
  maxInputChars: number
  maxOutputTokens: number
  timeoutMs: number
  cacheTtlMs: number
}

type VidaAiRequest = {
  task: VidaAiTask
  ownerId: string
  input: string
  instructions: string
  bypassCache?: boolean
}

type ProviderResult = {
  text: string
  inputTokens?: number
  outputTokens?: number
}

export type VidaAiResult = ProviderResult & {
  provider: VidaAiProviderName
  model: string
  cached: boolean
}

type CachedResult = {
  expiresAt: number
  result: VidaAiResult
}

type BurstWindow = {
  startedAt: number
  count: number
}

export type VidaAiErrorCode = 'not_configured' | 'input_too_large' | 'provider_unavailable' | 'empty_response' | 'rate_limited'

export class VidaAiError extends Error {
  code: VidaAiErrorCode

  constructor(code: VidaAiErrorCode, message: string) {
    super(message)
    this.name = 'VidaAiError'
    this.code = code
  }
}

class ProviderError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ProviderError'
    this.status = status
  }
}

const POLICIES: Record<VidaAiTask, VidaAiPolicy> = {
  organizar_notas: {
    level: 1,
    maxInputChars: 16_000,
    maxOutputTokens: 1_200,
    timeoutMs: 25_000,
    cacheTtlMs: 10 * 60 * 1000,
  },
}

const privateCache = new Map<string, CachedResult>()
const burstWindows = new Map<string, BurstWindow>()
const providerCooldowns = new Map<string, number>()
const MAX_CACHE_ENTRIES = 100
const BURST_WINDOW_MS = 60_000
const BURST_MAX_REQUESTS = 8
const PROVIDER_COOLDOWN_MS = 2 * 60 * 1000

function configuredProviderOrder(level: VidaAiLevel): VidaAiProviderName[] {
  const raw = level === 1
    ? process.env.VIDA_AI_ECONOMY_ORDER || 'gemini,openai'
    : process.env.VIDA_AI_ADVANCED_ORDER || 'openai,gemini'

  const requested = raw
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter((item): item is VidaAiProviderName => item === 'gemini' || item === 'openai')

  return Array.from(new Set(requested))
}

function providerModel(provider: VidaAiProviderName, level: VidaAiLevel) {
  if (provider === 'gemini') {
    return level === 1
      ? process.env.VIDA_GEMINI_ECONOMY_MODEL || 'gemini-3.5-flash-lite'
      : process.env.VIDA_GEMINI_ADVANCED_MODEL || 'gemini-3.6-flash'
  }

  return level === 1
    ? process.env.VIDA_OPENAI_ECONOMY_MODEL || 'gpt-5-mini'
    : process.env.VIDA_OPENAI_ADVANCED_MODEL || 'gpt-5.6'
}

function providerKey(provider: VidaAiProviderName) {
  if (provider === 'gemini') return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ''
  return process.env.OPENAI_API_KEY || ''
}

function ownerTaskKey(ownerId: string, task: VidaAiTask) {
  return createHash('sha256').update(`${ownerId}\u0000${task}`).digest('hex')
}

function cacheKey(request: VidaAiRequest) {
  return createHash('sha256')
    .update(`${request.ownerId}\u0000${request.task}\u0000${request.instructions}\u0000${request.input}`)
    .digest('hex')
}

function readCache(key: string) {
  const entry = privateCache.get(key)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    privateCache.delete(key)
    return null
  }
  return { ...entry.result, cached: true }
}

function writeCache(key: string, result: VidaAiResult, ttlMs: number) {
  if (privateCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = privateCache.keys().next().value as string | undefined
    if (oldestKey) privateCache.delete(oldestKey)
  }
  privateCache.set(key, { expiresAt: Date.now() + ttlMs, result: { ...result, cached: false } })
}

function enforceBurstLimit(ownerId: string, task: VidaAiTask) {
  const key = ownerTaskKey(ownerId, task)
  const now = Date.now()
  const window = burstWindows.get(key)

  if (!window || now - window.startedAt >= BURST_WINDOW_MS) {
    burstWindows.set(key, { startedAt: now, count: 1 })
    return
  }

  if (window.count >= BURST_MAX_REQUESTS) {
    throw new VidaAiError('rate_limited', 'Se alcanzó el límite temporal de solicitudes para esta tarea.')
  }

  window.count += 1
}

function cooldownKey(provider: VidaAiProviderName, model: string) {
  return `${provider}:${model}`
}

function providerAvailable(provider: VidaAiProviderName, model: string) {
  const key = cooldownKey(provider, model)
  const until = providerCooldowns.get(key) ?? 0
  if (until <= Date.now()) {
    providerCooldowns.delete(key)
    return true
  }
  return false
}

function coolDownProvider(provider: VidaAiProviderName, model: string, error: unknown) {
  if (!(error instanceof ProviderError)) return
  if (error.status !== 429 && error.status !== 403 && !(typeof error.status === 'number' && error.status >= 500)) return
  providerCooldowns.set(cooldownKey(provider, model), Date.now() + PROVIDER_COOLDOWN_MS)
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' })
  } finally {
    clearTimeout(timeout)
  }
}

function extractOpenAiText(payload: unknown) {
  if (!payload || typeof payload !== 'object') return ''
  const output = (payload as { output?: unknown }).output
  if (!Array.isArray(output)) return ''

  return output.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const content = (item as { content?: unknown }).content
    if (!Array.isArray(content)) return []
    return content.flatMap((part) => {
      if (!part || typeof part !== 'object') return []
      const typed = part as { type?: unknown; text?: unknown }
      return typed.type === 'output_text' && typeof typed.text === 'string' ? [typed.text] : []
    })
  }).join('\n').trim()
}

async function callOpenAi(model: string, apiKey: string, request: VidaAiRequest, policy: VidaAiPolicy): Promise<ProviderResult> {
  const response = await fetchWithTimeout('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      instructions: request.instructions,
      input: request.input,
      max_output_tokens: policy.maxOutputTokens,
      store: false,
    }),
  }, policy.timeoutMs)

  if (!response.ok) throw new ProviderError(`OpenAI HTTP ${response.status}`, response.status)
  const payload = await response.json() as {
    output?: unknown
    usage?: { input_tokens?: number; output_tokens?: number }
  }
  const text = extractOpenAiText(payload)
  if (!text) throw new ProviderError('OpenAI returned no text')
  return { text, inputTokens: payload.usage?.input_tokens, outputTokens: payload.usage?.output_tokens }
}

async function callGemini(model: string, apiKey: string, request: VidaAiRequest, policy: VidaAiPolicy): Promise<ProviderResult> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
  const response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: request.instructions }] },
      contents: [{ role: 'user', parts: [{ text: request.input }] }],
      generationConfig: { maxOutputTokens: policy.maxOutputTokens },
    }),
  }, policy.timeoutMs)

  if (!response.ok) throw new ProviderError(`Gemini HTTP ${response.status}`, response.status)
  const payload = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }
  }
  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => typeof part.text === 'string' ? part.text : '')
    .join('')
    .trim() || ''

  if (!text) throw new ProviderError('Gemini returned no text')
  return {
    text,
    inputTokens: payload.usageMetadata?.promptTokenCount,
    outputTokens: payload.usageMetadata?.candidatesTokenCount,
  }
}

async function callProvider(provider: VidaAiProviderName, model: string, apiKey: string, request: VidaAiRequest, policy: VidaAiPolicy) {
  if (provider === 'gemini') return callGemini(model, apiKey, request, policy)
  return callOpenAi(model, apiKey, request, policy)
}

export function getVidaAiPolicy(task: VidaAiTask) {
  return { ...POLICIES[task] }
}

export async function vidaAI(request: VidaAiRequest): Promise<VidaAiResult> {
  const policy = POLICIES[request.task]
  const input = request.input.trim()
  if (!input) throw new VidaAiError('empty_response', 'No hay contenido para procesar.')
  if (input.length > policy.maxInputChars) {
    throw new VidaAiError('input_too_large', `La entrada supera el límite de ${policy.maxInputChars} caracteres para esta tarea.`)
  }

  const key = cacheKey({ ...request, input })
  if (!request.bypassCache) {
    const cached = readCache(key)
    if (cached) return cached
  }

  enforceBurstLimit(request.ownerId, request.task)

  const providers = configuredProviderOrder(policy.level)
    .map((provider) => ({ provider, apiKey: providerKey(provider), model: providerModel(provider, policy.level) }))
    .filter((entry) => Boolean(entry.apiKey))
    .filter((entry) => providerAvailable(entry.provider, entry.model))

  if (providers.length === 0) {
    const configured = configuredProviderOrder(policy.level).some((provider) => Boolean(providerKey(provider)))
    if (configured) throw new VidaAiError('provider_unavailable', 'Los proveedores configurados están temporalmente en espera.')
    throw new VidaAiError('not_configured', 'No hay un proveedor de IA configurado en el servidor.')
  }

  for (const entry of providers) {
    try {
      const generated = await callProvider(entry.provider, entry.model, entry.apiKey, { ...request, input }, policy)
      const result: VidaAiResult = {
        ...generated,
        provider: entry.provider,
        model: entry.model,
        cached: false,
      }
      writeCache(key, result, policy.cacheTtlMs)
      return result
    } catch (error) {
      coolDownProvider(entry.provider, entry.model, error)
      // Fallback deliberado: cuota, indisponibilidad o error de un proveedor
      // no expone ni obliga a la interfaz a conocer qué proveedor se está usando.
    }
  }

  throw new VidaAiError('provider_unavailable', 'Los proveedores de IA configurados no están disponibles en este momento.')
}
