'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
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

  if (!tieneVersiculo) return null

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

  if (!resultado) return null

  return <TextualEvidencePanel evidence={resultado} modo={modo} />
}
