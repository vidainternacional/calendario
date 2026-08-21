import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  buildAzureTranslatorUrl,
  detectHebrewTranslationDirection,
  isSingleWord,
  normalizeTranslatorInput,
} from '@/lib/hebreo/translator'

export const runtime = 'nodejs'

const DEFAULT_ENDPOINT = 'https://api.cognitive.microsofttranslator.com'
const MAX_INPUT_LENGTH = 1000
const REQUEST_TIMEOUT_MS = 8000

type AzureTranslationResponse = Array<{
  translations?: Array<{
    text?: string
    to?: string
  }>
}>

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

  const key = process.env.AZURE_TRANSLATOR_KEY?.trim()
  if (!key) {
    return NextResponse.json(
      {
        error: 'El traductor todavía no está conectado.',
        code: 'translator_not_configured',
      },
      { status: 503 },
    )
  }

  const direction = detectHebrewTranslationDirection(text)
  const endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT?.trim() || DEFAULT_ENDPOINT
  const region = process.env.AZURE_TRANSLATOR_REGION?.trim()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=UTF-8',
    'Ocp-Apim-Subscription-Key': key,
  }
  if (region) headers['Ocp-Apim-Subscription-Region'] = region

  try {
    const response = await fetch(buildAzureTranslatorUrl(endpoint, direction), {
      method: 'POST',
      headers,
      body: JSON.stringify([{ Text: text }]),
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      console.error('Azure Translator error', response.status)
      return NextResponse.json(
        { error: 'No se pudo traducir en este momento.' },
        { status: 502 },
      )
    }

    const data = await response.json() as AzureTranslationResponse
    const translatedText = data[0]?.translations?.[0]?.text?.trim()

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
    console.error('Hebrew translator request failed', error)
    return NextResponse.json(
      { error: 'No se pudo conectar con el traductor.' },
      { status: 504 },
    )
  }
}
