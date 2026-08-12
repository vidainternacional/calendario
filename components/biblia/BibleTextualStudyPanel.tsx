'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cargarEvidenciaTextualBiblica } from '@/app/actions/evidencia-textual'
import {
  cargarTraduccionEspanolaEstudio,
  type TraduccionEspanolaEstudio,
} from '@/app/actions/traduccion-espanola-estudio'
import SpanishPassagePanel from '@/components/estudios/SpanishPassagePanel'
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
  const [traduccion, setTraduccion] = useState<TraduccionEspanolaEstudio | null>(null)
  const [cargando, setCargando] = useState(false)
  const tieneVersiculo = /:\d+\b/.test(pasaje)

  useEffect(() => {
    let activo = true
    setCargando(true)
    setResultado(null)
    setTraduccion(null)

    Promise.all([
      cargarTraduccionEspanolaEstudio(pasaje),
      tieneVersiculo ? cargarEvidenciaTextualBiblica(pasaje, translationId) : Promise.resolve(null),
    ])
      .then(([spanish, textual]) => {
        if (!activo) return
        setTraduccion(spanish)
        setResultado(textual)
      })
      .catch(() => {
        if (!activo) return
        setTraduccion(null)
        setResultado(null)
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

  if (cargando) {
    return (
      <section className={`rounded-3xl border p-5 ${palette}`} aria-label="Cargando estudio textual">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-500" aria-hidden="true" />
          <p className="text-sm font-semibold">Cargando texto aprobado…</p>
        </div>
      </section>
    )
  }

  if (!resultado && !traduccion) return null

  return (
    <div className="space-y-4">
      {traduccion && <SpanishPassagePanel translation={traduccion} modo={modo} />}
      {resultado && <TextualEvidencePanel evidence={resultado} modo={modo} />}
    </div>
  )
}
