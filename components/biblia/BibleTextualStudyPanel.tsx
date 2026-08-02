'use client'

import { useEffect, useState } from 'react'
import { Languages, Loader2 } from 'lucide-react'
import { cargarEvidenciaTextualBiblica } from '@/app/actions/evidencia-textual'
import TextualEvidencePanel from '@/components/estudios/TextualEvidencePanel'

type Modo = 'claro' | 'oscuro' | 'sepia'
type Resultado = Awaited<ReturnType<typeof cargarEvidenciaTextualBiblica>>

export default function BibleTextualStudyPanel({
  pasaje,
  translationId,
  modo,
}: {
  pasaje: string
  translationId: string
  modo: Modo
}) {
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [cargando, setCargando] = useState(false)
  const tieneVersiculo = /:\d+\b/.test(pasaje)

  useEffect(() => {
    let activo = true

    if (!tieneVersiculo) {
      setResultado(null)
      setCargando(false)
      return () => { activo = false }
    }

    setCargando(true)
    setResultado(null)

    cargarEvidenciaTextualBiblica(pasaje, translationId)
      .then(data => {
        if (activo) setResultado(data)
      })
      .catch(() => {
        if (activo) setResultado(null)
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => { activo = false }
  }, [pasaje, translationId, tieneVersiculo])

  const palette = {
    claro: 'border-indigo-200 bg-indigo-50/70 text-slate-800',
    oscuro: 'border-indigo-800/60 bg-indigo-950/20 text-slate-100',
    sepia: 'border-[#c9ad78] bg-[#f3e3c2] text-[#493c2d]',
  }[modo]

  if (!tieneVersiculo) {
    return (
      <section className={`rounded-3xl border p-5 ${palette}`}>
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500/15 text-indigo-500">
            <Languages className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-indigo-500">Análisis textual</p>
            <h2 className="mt-1 text-base font-bold">Seleccione un versículo</h2>
            <p className="mt-1 text-xs leading-5 opacity-70">
              Elija un versículo en el selector superior para ver texto original, transliteración, morfología, Strong y variantes.
            </p>
          </div>
        </div>
      </section>
    )
  }

  if (cargando) {
    return (
      <section className={`rounded-3xl border p-5 ${palette}`} aria-label="Cargando análisis textual">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-500" aria-hidden="true" />
          <p className="text-sm font-semibold">Cargando texto original aprobado…</p>
        </div>
      </section>
    )
  }

  if (!resultado) {
    return (
      <section className={`rounded-3xl border p-5 ${palette}`}>
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500/15 text-indigo-500">
            <Languages className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-indigo-500">Análisis textual</p>
            <h2 className="mt-1 text-base font-bold">Capa lingüística no disponible todavía</h2>
            <p className="mt-1 text-xs leading-5 opacity-70">
              El contexto del pasaje sigue disponible. La capa palabra por palabra se mostrará cuando la fuente original de este testamento quede importada y aprobada.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return <TextualEvidencePanel evidence={resultado} modo={modo} />
}
