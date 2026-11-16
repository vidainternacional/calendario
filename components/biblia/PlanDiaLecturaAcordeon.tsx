'use client'

import { useEffect, useState } from 'react'
import { BookOpen, ChevronDown, Loader2 } from 'lucide-react'

type VersoApi = { type: string; number?: number; content?: unknown[] }
type Verso = { numero: number; texto: string }
type Props = {
  referencia: string
  bookCode: string
  chapter: number
  verseStart: number | null
  verseEnd: number | null
}

// Mismo formato de versículos y misma ruta de fuente aprobada que utiliza Biblia.
function textoDeContenido(content: unknown[] | undefined): string {
  if (!Array.isArray(content)) return ''
  return content.map((parte) => {
    if (typeof parte === 'string') return parte
    if (parte && typeof parte === 'object' && 'text' in parte) {
      return String((parte as { text: unknown }).text ?? '')
    }
    return ''
  }).join(' ').replace(/\s+/g, ' ').trim()
}

export default function PlanDiaLecturaAcordeon({ referencia, bookCode, chapter, verseStart, verseEnd }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [versos, setVersos] = useState<Verso[] | null>(null)
  const [error, setError] = useState(false)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    if (!abierto || versos !== null) return

    const controller = new AbortController()
    let activo = true
    const ruta = '/api/biblia/fuente/spaRV1909/' + encodeURIComponent(bookCode) + '/' + chapter + '.json'

    void fetch(ruta, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('No se pudo cargar la lectura')
        return response.json() as Promise<{ chapter?: { content?: VersoApi[] } }>
      })
      .then((data) => {
        if (!Array.isArray(data.chapter?.content)) throw new Error('Lectura no disponible')
        const seleccionados = data.chapter.content
          .filter((item) => item.type === 'verse' && Number.isInteger(item.number))
          .map((item) => ({ numero: Number(item.number), texto: textoDeContenido(item.content) }))
          .filter((item) => item.texto &&
            (verseStart == null || item.numero >= verseStart) &&
            (verseEnd == null || item.numero <= verseEnd))
          .sort((a, b) => a.numero - b.numero)

        if (!seleccionados.length) throw new Error('El pasaje no está disponible')
        if (activo) { setVersos(seleccionados); setError(false) }
      })
      .catch(() => { if (activo) setError(true) })

    return () => { activo = false; controller.abort() }
  }, [abierto, versos, bookCode, chapter, verseStart, verseEnd, intento])

  return (
    <details className="group" onToggle={(event) => setAbierto(event.currentTarget.open)}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-start gap-2.5">
          <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-[#C0392B]" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-slate-900">Lectura bíblica</span>
            <span className="mt-1 block text-xl font-bold leading-7 text-slate-950">{referencia}</span>
          </span>
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>

      {abierto ? (
        <div className="pb-2 pt-4">
          <p className="mb-3 text-xs font-semibold text-slate-500">Reina-Valera 1909</p>
          {versos ? (
            <div className="space-y-3 text-base leading-7 text-slate-800">
              {versos.map((verso) => (
                <p key={verso.numero}>
                  <sup className="mr-1.5 align-baseline text-xs font-bold text-[#C0392B]">{verso.numero}</sup>
                  {verso.texto}
                </p>
              ))}
            </div>
          ) : error ? (
            <div className="text-sm leading-6 text-slate-600">
              No se pudo mostrar el pasaje en este momento. Podés abrirlo en Biblia.
              <button type="button" onClick={() => { setError(false); setIntento((valor) => valor + 1) }} className="ml-2 min-h-11 font-bold text-[#C0392B]">Reintentar</button>
            </div>
          ) : (
            <div className="flex min-h-14 items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando lectura…
            </div>
          )}
        </div>
      ) : null}
    </details>
  )
}
