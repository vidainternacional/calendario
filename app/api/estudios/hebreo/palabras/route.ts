import { NextResponse } from 'next/server'
import { listarCatalogoHebreoParaAprendizaje } from '@/lib/hebreo/word-catalog'
import { enriquecerCatalogoConGlosasEspanolas } from '@/lib/hebreo/spanish-glosses'
import { priorizarAmbiguedadHebrea } from '@/lib/hebreo/hebrew-ambiguity'

export const dynamic = 'force-dynamic'

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const page = positiveInteger(url.searchParams.get('page'), 1)
  const pageSize = positiveInteger(url.searchParams.get('pageSize'), 24)
  const search = url.searchParams.get('q') ?? ''
  const group = url.searchParams.get('group') ?? 'essentials'

  const baseResult = await listarCatalogoHebreoParaAprendizaje({ page, pageSize, search, group })
  const glossedResult = baseResult.status === 'ok'
    ? await enriquecerCatalogoConGlosasEspanolas(baseResult)
    : baseResult
  const result = glossedResult.status === 'ok'
    ? await priorizarAmbiguedadHebrea(glossedResult)
    : glossedResult

  if (result.status === 'sin-sesion') {
    return NextResponse.json(result, { status: 401 })
  }

  if (result.status === 'no-disponible') {
    return NextResponse.json(result, { status: 503 })
  }

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
