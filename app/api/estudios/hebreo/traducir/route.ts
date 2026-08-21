import { NextResponse } from 'next/server'
import { VidaAiError, vidaAI } from '@/lib/ai/vida-ai'
import { createClient } from '@/lib/supabase/server'
import {
  detectHebrewTranslationDirection,
  isSingleWord,
  normalizeTranslatorInput,
} from '@/lib/hebreo/translator'

export const runtime = 'nodejs'

const MAX_INPUT_LENGTH = 1000

function translatorInstructions(source: 'es' | 'he', target: 'es' | 'he') {
  const direction = source === 'he' ? 'hebreo a español' : 'español a hebreo'
  return [
    `Actúa exclusivamente como un traductor de ${direction} para una herramienta de aprendizaje.`,
    `El idioma de salida debe ser ${target === 'he' ? 'hebreo' : 'español'}.`,
    'Devuelve únicamente la traducción final, sin explicaciones, sin transliteración, sin análisis gramatical, sin Markdown y sin comillas envolventes.',
    'Si la entrada es una sola palabra, devuelve el equivalente principal más natural y breve.',
    'Si la entrada es una frase, tradúcela de forma natural y fiel al sentido completo.',
    'Para español a hebreo cotidiano usa hebreo israelí natural; si el texto es claramente bíblico o religioso, conserva la formulación hebrea estándar cuando corresponda.',
    'No inventes contexto que no esté en la entrada.',
  ].join(' ')
}

function cleanModelTranslation(value: string) {
  return value
    .trim()
    .replace(/^```(?:text)?\s*/iu, '')
    .replace(/\s*```$/u, '')
    .replace(/^["“”]([\s\S]*)["“”]$/u, '$1')
    .trim()
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 })
  }

  const text = normalizeTranslatorInput(
    typeof payload === 'object' && payload !== null && 'text' in payload
      ? (payload as { text?: unknown }).text
      : '',
    MAX_INPUT_LENGTH,
  )

  if (!text) {
    return NextResponse.json({ error: 'Escribe una palabra o frase.' }, { status: 400 })
  }

  const direction = detectHebrewTranslationDirection(text)

  try {
    const generated = await vidaAI({
      task: 'interpretar_busqueda_biblica',
      ownerId: user.id,
      input: text,
      instructions: translatorInstructions(direction.source, direction.target),
    })
    const translatedText = cleanModelTranslation(generated.text)

    if (!translatedText) {
      return NextResponse.json(
        { error: 'El traductor no devolvió una respuesta.' },
        { status: 502 },
      )
    }

    return NextResponse.json({
      input: text,
      translatedText,
      sourceLanguage: direction.source,
      targetLanguage: direction.target,
      kind: isSingleWord(text) ? 'word' : 'phrase',
    })
  } catch (error) {
    if (error instanceof VidaAiError) {
      if (error.code === 'rate_limited') {
        return NextResponse.json({ error: 'Espera un momento antes de volver a traducir.' }, { status: 429 })
      }
      if (error.code === 'not_configured') {
        return NextResponse.json({ error: 'El traductor todavía no está disponible en el servidor.' }, { status: 503 })
      }
    }

    console.error('Hebrew translator request failed', error)
    return NextResponse.json(
      { error: 'No se pudo traducir en este momento.' },
      { status: 502 },
    )
  }
}
