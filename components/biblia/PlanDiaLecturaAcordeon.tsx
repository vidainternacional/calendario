'use client'

import { useEffect, useId, useState } from 'react'
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
  const [lecturaCompleta, setLecturaCompleta] = useState(false)
  const lecturaId = useId()

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
    <section aria-label={`Lectura bíblica: ${citaCompleta}`}>
      <div className="flex min-h-14 items-start gap-2.5">
        <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-[#C0392B]" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">Lectura bíblica</p>
          <h2 className="mt-1 text-xl font-bold leading-7 text-slate-950">{citaCompleta}</h2>
        </div>
      </div>

      <div className="mt-3">
        <p className="mb-3 text-xs font-semibold text-slate-500">Reina-Valera 1909</p>
        {versos.length > 0 ? (
          <>
            <div
              id={lecturaId}
              role="region"
              aria-label={`Texto de ${citaCompleta}`}
              tabIndex={0}
              className={`space-y-3 text-base leading-7 text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C0392B] ${lecturaCompleta ? '' : 'max-h-52 overflow-y-auto overscroll-contain'}`}
            >
              {versos.map((verso) => (
                <p key={verso.numero}>
                  <sup className="mr-1.5 align-baseline text-xs font-bold text-[#C0392B]">{verso.numero}</sup>
                  {verso.texto}
                </p>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 pt-1">
              <span className="text-xs text-slate-500">{lecturaCompleta ? '' : 'Deslizá para seguir leyendo'}</span>
              <button
                type="button"
                aria-controls={lecturaId}
                aria-expanded={lecturaCompleta}
                onClick={() => setLecturaCompleta((previo) => !previo)}
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-bold text-[#C0392B]"
              >
                {lecturaCompleta ? 'Reducir lectura' : 'Ver lectura completa'}
                <ChevronDown className={`h-4 w-4 transition-transform ${lecturaCompleta ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
            </div>
          </>
        ) : fallo ? (
          <div className="text-sm leading-6 text-slate-600">
            No pudimos cargar el texto bíblico. Podés abrirlo en Biblia.
            <button type="button" onClick={() => { setFallo(false); setReintento((valor) => valor + 1) }} className="ml-2 min-h-11 font-bold text-[#C0392B]">Reintentar</button>
          </div>
        ) : (
          <div className="flex min-h-14 items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando lectura…
          </div>
        )}
      </div>
    </section>
  )
}
