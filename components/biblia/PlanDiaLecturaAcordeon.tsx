'use client'

import { useEffect, useState } from 'react'
import { BookOpen, ChevronDown, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Verso = { numero: number; texto: string }
type Props = {
  referencia: string
  versos: Verso[]
  bookCode: string
  chapter: number
  verseStart: number | null
  verseEnd: number | null
}

// Mantiene primero el texto recibido desde servidor y reintenta con la sesión del navegador.
export default function PlanDiaLecturaAcordeon({ referencia, versos: versosIniciales, bookCode, chapter, verseStart, verseEnd }: Props) {
  const [versos, setVersos] = useState(versosIniciales)
  const [cargando, setCargando] = useState(false)
  const [fallo, setFallo] = useState(false)
  const [reintento, setReintento] = useState(0)

  useEffect(() => {
    if (versos.length > 0) return

    let activo = true
    const supabase = createClient()
    setCargando(true)
    setFallo(false)
    void (async () => {
      const { data, error } = await (supabase as any)
        .from('biblical_verse_texts')
        .select('verse, original_text')
        .eq('source_id', 'b6fef01a-f304-4fd0-98aa-5fe070279946')
        .eq('language', 'spanish')
        .eq('enabled', true)
        .eq('review_status', 'approved')
        .eq('book_code', bookCode)
        .eq('chapter', chapter)
        .order('verse', { ascending: true })

      if (error) throw error
      const seleccionados: Verso[] = (data ?? [])
        .filter((item: any) =>
          (verseStart == null || Number(item.verse) >= verseStart) &&
          (verseEnd == null || Number(item.verse) <= verseEnd))
        .map((item: any) => ({ numero: Number(item.verse), texto: String(item.original_text ?? '') }))
        .filter((item: Verso) => item.texto.trim().length > 0)
      if (!seleccionados.length) throw new Error('Sin versículos disponibles')
      if (activo) setVersos(seleccionados)
    })().catch((error: unknown) => {
      console.warn('[PlanDiaLectura] No fue posible cargar el pasaje', error instanceof Error ? error.message : 'Error desconocido')
      if (activo) setFallo(true)
    }).finally(() => {
      if (activo) setCargando(false)
    })
    return () => { activo = false }
  }, [versos.length, bookCode, chapter, verseStart, verseEnd, reintento])

  const inicio = verseStart ?? versos[0]?.numero
  const final = verseEnd ?? versos[versos.length - 1]?.numero
  const citaCompleta = Number.isInteger(inicio) && Number.isInteger(final) && Number(final) >= Number(inicio)
    ? referencia.replace(/:\d+(?:\s*[-–]\s*\d+)?$/, '') + ':' + inicio + (inicio === final ? '' : '–' + final)
    : referencia

  return (
    <details className="group">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-start gap-2.5">
          <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-[#C0392B]" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-slate-900">Lectura bíblica</span>
            <span className="mt-1 block text-xl font-bold leading-7 text-slate-950">{citaCompleta}</span>
            {versos[0]?.texto ? (
              <span aria-hidden="true" className="relative mt-2 block max-h-12 overflow-hidden group-open:hidden">
                <span className="block line-clamp-2 text-[13px] font-normal leading-6 text-slate-600">
                  {versos[0].texto} {versos[1]?.texto ?? ''}
                </span>
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-9 bg-gradient-to-b from-transparent to-white" />
              </span>
            ) : null}
          </span>
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="pb-2 pt-4">
        <p className="mb-3 text-xs font-semibold text-slate-500">Reina-Valera 1909</p>
        {versos.length > 0 ? (
          <div className="space-y-3 text-base leading-7 text-slate-800">
            {versos.map((verso) => (
              <p key={verso.numero}>
                <sup className="mr-1.5 align-baseline text-xs font-bold text-[#C0392B]">{verso.numero}</sup>
                {verso.texto}
              </p>
            ))}
          </div>
        ) : fallo ? (
          <div className="text-sm leading-6 text-slate-600">
            No pudimos cargar el texto bíblico. Podés abrirlo en Biblia.
            <button type="button" onClick={() => { setFallo(false); setReintento((valor) => valor + 1) }} className="ml-2 min-h-11 font-bold text-[#C0392B]">Reintentar</button>
          </div>
        ) : cargando || abierto ? (
          <div className="flex min-h-14 items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando lectura…
          </div>
        ) : null}
      </div>
    </details>
  )
}
