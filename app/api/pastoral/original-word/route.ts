import { NextResponse } from 'next/server'
import { VidaAiError, vidaAI } from '@/lib/ai/vida-ai'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

function limpiarJson(value: string) {
  return value.trim().replace(/^```(?:json)?\s*/iu, '').replace(/\s*```$/u, '').trim()
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  let payload: { palabra?: unknown; idioma?: unknown; referencia?: unknown } = {}
  try { payload = await request.json() } catch { return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 }) }

  const palabra = String(payload.palabra ?? '').trim().slice(0, 120)
  const idioma = payload.idioma === 'greek' ? 'griego koiné' : payload.idioma === 'hebrew' ? 'hebreo bíblico' : ''
  const referencia = String(payload.referencia ?? '').trim().slice(0, 120)
  if (!palabra || !idioma) return NextResponse.json({ error: 'Palabra o idioma inválido.' }, { status: 400 })

  try {
    const generated = await vidaAI({
      task: 'interpretar_busqueda_biblica',
      ownerId: user.id,
      input: palabra,
      instructions: [
        `Actúa como asistente léxico de ${idioma}.`,
        referencia ? `La palabra aparece en ${referencia}; usa esa referencia únicamente para escoger el sentido léxico más probable.` : '',
        'Da una glosa breve y clara en español y una transliteración legible para hispanohablantes.',
        'No hagas sermones, aplicaciones doctrinales ni afirmaciones etimológicas especulativas.',
        'Devuelve JSON estricto con exactamente estas claves: significado_es y transliteracion.',
        'significado_es debe ser una frase corta, útil para entender la palabra en su contexto bíblico.',
      ].filter(Boolean).join(' '),
    })

    let parsed: { significado_es?: unknown; transliteracion?: unknown } = {}
    try { parsed = JSON.parse(limpiarJson(generated.text)) } catch { parsed = { significado_es: generated.text.trim(), transliteracion: '' } }
    const significado = String(parsed.significado_es ?? '').trim()
    const transliteracion = String(parsed.transliteracion ?? '').trim()
    if (!significado) return NextResponse.json({ error: 'La IA no devolvió una explicación.' }, { status: 502 })
    return NextResponse.json({ significado, transliteracion, fuente: 'ai' })
  } catch (error) {
    if (error instanceof VidaAiError) {
      if (error.code === 'rate_limited') return NextResponse.json({ error: 'Espera un momento antes de volver a consultar.' }, { status: 429 })
      if (error.code === 'not_configured') return NextResponse.json({ error: 'La IA todavía no está disponible en el servidor.' }, { status: 503 })
    }
    console.error('Pastoral original word AI fallback failed', error)
    return NextResponse.json({ error: 'No se pudo obtener la explicación en este momento.' }, { status: 502 })
  }
}
