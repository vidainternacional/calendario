'use client'

import { useState, useTransition } from 'react'
import { Check, Copy, EyeOff, Globe2, Loader2, Share2 } from 'lucide-react'
import { actualizarDistribucionPaquete } from '@/app/actions/pastoral-distribucion'
import { mostrarToast } from '@/lib/ui/toast'

type Audiencia = 'iglesia' | 'lideres' | 'servidores' | 'publico'

const OPCIONES: Array<{ value: Audiencia; label: string; detalle: string }> = [
  { value: 'iglesia', label: 'Toda la iglesia', detalle: 'Material general para la congregación.' },
  { value: 'lideres', label: 'Líderes', detalle: 'Preparado para equipos de liderazgo.' },
  { value: 'servidores', label: 'Servidores', detalle: 'Dirigido a quienes sirven en ministerios.' },
  { value: 'publico', label: 'Público', detalle: 'Puede compartirse fuera de la congregación.' },
]

export default function PackageDistributionControls({
  paqueteId,
  initialAudience,
  initialPublished,
  publicSlug,
}: {
  paqueteId: string
  initialAudience: Audiencia
  initialPublished: boolean
  publicSlug: string
}) {
  const [audiencia, setAudiencia] = useState<Audiencia>(initialAudience)
  const [publicado, setPublicado] = useState(initialPublished)
  const [isPending, startTransition] = useTransition()

  const enlace = typeof window === 'undefined' ? `/material/${publicSlug}` : `${window.location.origin}/material/${publicSlug}`

  const guardar = (nuevoPublicado = publicado) => {
    startTransition(async () => {
      const resultado = await actualizarDistribucionPaquete(paqueteId, audiencia, nuevoPublicado)
      if (!resultado.success) {
        mostrarToast(resultado.error)
        return
      }
      setPublicado(resultado.publicado)
      mostrarToast(resultado.publicado ? 'Paquete publicado' : 'Publicación desactivada')
    })
  }

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(enlace)
      mostrarToast('Enlace copiado')
    } catch {
      mostrarToast('No se pudo copiar el enlace')
    }
  }

  const compartir = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'Material pastoral', url: enlace })
      else await copiar()
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') mostrarToast('No se pudo compartir')
    }
  }

  return (
    <section className="print:hidden mb-5 rounded-[22px] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Globe2 className="h-5 w-5" /></span>
        <div>
          <h2 className="font-bold text-slate-900">Distribución a la iglesia</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">Publica una vista de lectura sin mostrar notas privadas ni controles del pastor.</p>
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
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe2 className="h-4 w-4" />} Publicar material
          </button>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Publicado</p>
              <p className="mt-1 break-all text-sm text-emerald-950">{enlace}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <button type="button" onClick={copiar} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700"><Copy className="h-4 w-4" /> Copiar</button>
              <button type="button" onClick={compartir} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700"><Share2 className="h-4 w-4" /> Compartir</button>
              <button type="button" disabled={isPending} onClick={() => guardar(false)} className="col-span-2 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 text-sm font-bold text-rose-700 disabled:opacity-60 sm:col-span-1"><EyeOff className="h-4 w-4" /> Desactivar</button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
