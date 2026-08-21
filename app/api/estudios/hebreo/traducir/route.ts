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
const FINAL_SPANISH_STATUSES = ['verified_derived', 'manual_approved'] as const

function translatorInstructions(source: 'es' | 'he', target: 'es' | 'he') {
  const direction = source === 'he' ? 'hebreo a español' : 'español a hebreo'
  return [
    `Actúa exclusivamente como un traductor de ${direction} para una herramienta de aprendizaje.`,
    `El idioma de salida debe ser ${target === 'he' ? 'hebreo' : 'español'}.`,
    'Devuelve únicamente la traducción final, sin explicaciones, sin transliteración, sin análisis gramatical, sin Markdown y sin comillas envolventes.',
    'Si la entrada es una sola palabra, devuelve el equivalente principal más natural y breve.',
    'Si la entrada es una frase, tradúcela de forma natural y fiel al sentido completo.',
    target === 'he'
      ? 'Escribe la salida hebrea con niqqud completo y coherente para aprendizaje; no omitas los signos vocálicos.'
      : 'No añadas texto hebreo ni transliteración a la salida española.',
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

async function lookupHebrewWord(
  supabase: Awaited<ReturnType<typeof createClient>>,
  text: string,
) {
  const { data: lexicalRows, error: lexicalError } = await (supabase as any)
    .from('biblical_lexical_entries')
    .select('id, lemma, display_gloss_es')
    .eq('language', 'hebrew')
    .eq('review_status', 'approved')
    .eq('enabled', true)
    .eq('lemma', text)
    .limit(8)

  if (lexicalError || !lexicalRows?.length) return null

  const direct = lexicalRows.find((row: any) => typeof row.display_gloss_es === 'string' && row.display_gloss_es.trim())
  if (direct) return direct.display_gloss_es.trim()

  const ids = lexicalRows.map((row: any) => row.id)
  const { data: glossRows, error: glossError } = await (supabase as any)
    .from('biblical_hebrew_spanish_glosses')
    .select('lexical_entry_id, display_gloss_es, confidence')
    .in('lexical_entry_id', ids)
    .in('status', FINAL_SPANISH_STATUSES)
    .order('confidence', { ascending: false })
    .limit(8)

  if (glossError || !glossRows?.length) return null
  const gloss = glossRows.find((row: any) => typeof row.display_gloss_es === 'string' && row.display_gloss_es.trim())
  return gloss?.display_gloss_es?.trim() || null
}

async function lookupSpanishWord(
  supabase: Awaited<ReturnType<typeof createClient>>,
  text: string,
) {
  const { data: directRows, error: directError } = await (supabase as any)
    .from('biblical_lexical_entries')
    .select('id, lemma, display_gloss_es')
    .eq('language', 'hebrew')
    .eq('review_status', 'approved')
    .eq('enabled', true)
    .ilike('display_gloss_es', text)
    .limit(8)

  if (!directError) {
    const direct = directRows?.find((row: any) => typeof row.lemma === 'string' && row.lemma.trim())
    if (direct) return direct.lemma.trim()
  }

  const { data: glossRows, error: glossError } = await (supabase as any)
    .from('biblical_hebrew_spanish_glosses')
    .select('lexical_entry_id, display_gloss_es, confidence')
    .in('status', FINAL_SPANISH_STATUSES)
    .ilike('display_gloss_es', text)
    .order('confidence', { ascending: false })
    .limit(12)

  if (glossError || !glossRows?.length) return null

  const ids = glossRows.map((row: any) => row.lexical_entry_id)
  const { data: lexicalRows, error: lexicalError } = await (supabase as any)
    .from('biblical_lexical_entries')
    .select('id, lemma')
    .in('id', ids)
    .eq('language', 'hebrew')
    .eq('review_status', 'approved')
    .eq('enabled', true)
    .limit(12)

  if (lexicalError || !lexicalRows?.length) return null
  const byId = new Map(lexicalRows.map((row: any) => [row.id, row.lemma]))
  for (const gloss of glossRows) {
    const lemma = byId.get(gloss.lexical_entry_id)
    if (typeof lemma === 'string' && lemma.trim()) return lemma.trim()
  }
  return null
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
  const kind = isSingleWord(text) ? 'word' : 'phrase'

  if (kind === 'word') {
    const dictionaryTranslation = direction.source === 'he'
      ? await lookupHebrewWord(supabase, text)
      : await lookupSpanishWord(supabase, text)

    if (dictionaryTranslation) {
      return NextResponse.json({
        input: text,
        translatedText: dictionaryTranslation,
        sourceLanguage: direction.source,
        targetLanguage: direction.target,
        kind,
        source: 'dictionary',
      })
    }
  }

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
      kind,
      source: 'translator',
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
