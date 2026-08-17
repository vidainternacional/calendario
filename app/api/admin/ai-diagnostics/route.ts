import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { vidaAI, VidaAiError } from '@/lib/ai/vida-ai'

export const dynamic = 'force-dynamic'

const PROVIDERS = [
  { name: 'gemini', configured: () => Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) },
  { name: 'openai', configured: () => Boolean(process.env.OPENAI_API_KEY) },
  { name: 'claude', configured: () => Boolean(process.env.ANTHROPIC_API_KEY) },
  { name: 'grok', configured: () => Boolean(process.env.XAI_API_KEY) },
  { name: 'kimi', configured: () => Boolean(process.env.MOONSHOT_API_KEY) },
  { name: 'perplexity', configured: () => Boolean(process.env.PERPLEXITY_API_KEY) },
] as const

async function requireAdministrator() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 }) }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if ((profile as { rol?: string } | null)?.rol !== 'administrador') {
    return { error: NextResponse.json({ ok: false, error: 'Solo administradores' }, { status: 403 }) }
  }

  return { user }
}

export async function GET() {
  const auth = await requireAdministrator()
  if ('error' in auth) return auth.error

  return NextResponse.json({
    ok: true,
    providers: PROVIDERS.map((provider) => ({
      provider: provider.name,
      configured: provider.configured(),
    })),
  })
}

export async function POST() {
  const auth = await requireAdministrator()
  if ('error' in auth) return auth.error

  const startedAt = Date.now()
  try {
    const result = await vidaAI({
      task: 'interpretar_busqueda_biblica',
      ownerId: auth.user.id,
      input: 'Prueba técnica mínima del router VIDA.',
      instructions: 'Responde únicamente con VIDA_OK. No agregues ninguna otra palabra.',
      bypassCache: true,
    })

    return NextResponse.json({
      ok: true,
      provider: result.provider,
      model: result.model,
      inputTokens: result.inputTokens ?? null,
      outputTokens: result.outputTokens ?? null,
      latencyMs: Date.now() - startedAt,
      responseValid: result.text.trim() === 'VIDA_OK',
    })
  } catch (error) {
    const code = error instanceof VidaAiError ? error.code : 'unexpected_error'
    return NextResponse.json({
      ok: false,
      error: code,
      latencyMs: Date.now() - startedAt,
    }, { status: 503 })
  }
}
