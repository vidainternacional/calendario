'use client'

import { useState, useTransition } from 'react'
import { Check, EyeOff, Globe2, Loader2 } from 'lucide-react'
import { actualizarDistribucionPaquete } from '@/app/actions/pastoral-distribucion'
import { mostrarToast } from '@/lib/ui/toast'

type Audiencia = 'iglesia' | 'lideres' | 'servidores' | 'publico'

const OPCIONES: Array<{ value: Audiencia; label: string; detalle: string }> = [
  { value: 'iglesia', label: 'Toda la iglesia', detalle: 'Material general para miembros activos de la congregación.' },
  { value: 'lideres', label: 'Líderes', detalle: 'Visible para líderes, pastores y administradores.' },
  { value: 'servidores', label: 'Servidores', detalle: 'Visible para servidores, líderes, pastores y administradores.' },
  { value: 'publico', label: 'Público', detalle: 'Disponible para toda la congregación dentro de la aplicación.' },
]

export default function PackageDistributionControls({
  paqueteId,
  initialAudience,
  initialPublished,
}: {
  paqueteId: string
  initialAudience: Audiencia
  initialPublished: boolean
}) {
  const [audiencia, setAudiencia] = useState<Audiencia>(initialAudience)
  const [publicado, setPublicado] = useState(initialPublished)
  const [isPending, startTransition] = useTransition()

  const guardar = (nuevoPublicado = publicado) => {
    startTransition(async () => {
      const resultado = await actualizarDistribucionPaquete(paqueteId, audiencia, nuevoPublicado)
      if (!resultado.success) {
        mostrarToast(resultado.error)
        return
      }
      const estadoPublicado = Boolean(resultado.publicado)
      setPublicado(estadoPublicado)
      mostrarToast(estadoPublicado ? 'Material publicado en Inicio' : 'Publicación desactivada')
    })
  }

  return (
    <section className="print:hidden mb-5 rounded-[22px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Globe2 className="h-5 w-5" /></span>
        <div>
          <h2 className="font-bold text-slate-900">Distribución a la iglesia</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">Publica el material directamente en el Inicio de la aplicación sin mostrar notas privadas.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label>
          <span className="mb-1.5 block text-xs font-bold text-slate-700">Audiencia</span>
          <select value={audiencia} onChange={(event) => setAudiencia(event.target.value as Audiencia)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900">
            {OPCIONES.map((opcion) => <option key={opcion.value} value={opcion.value}>{opcion.label}</option>)}
          </select>
          <span className="mt-1.5 block text-xs text-slate-500">{OPCIONES.find((opcion) => opcion.value === audiencia)?.detalle}</span>
        </label>
        <button type="button" disabled={isPending} onClick={() => guardar(publicado)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 disabled:opacity-60">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Guardar audiencia
        </button>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-5">
        {!publicado ? (
          <button type="button" disabled={isPending} onClick={() => guardar(true)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm disabled:opacity-60">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe2 className="h-4 w-4" />} Publicar en Inicio
          </button>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Publicado</p>
                <p className="mt-1 text-sm leading-6 text-emerald-950">Este material ya aparece en el Inicio para la audiencia seleccionada.</p>
              </div>
              <button type="button" disabled={isPending} onClick={() => guardar(false)} className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-sm font-bold text-rose-700 disabled:opacity-60"><EyeOff className="h-4 w-4" /> Desactivar</button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
