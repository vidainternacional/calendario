import { NextResponse } from 'next/server'
import { listarCatalogoHebreoParaAprendizaje } from '@/lib/hebreo/word-catalog'

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

  const result = await listarCatalogoHebreoParaAprendizaje({ page, pageSize, search, group })

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
