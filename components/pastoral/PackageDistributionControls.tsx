'use client'

import { useState, useTransition } from 'react'
import { Bell, Check, EyeOff, Globe2, Loader2, Sparkles } from 'lucide-react'
import { actualizarDistribucionPaquete } from '@/app/actions/pastoral-distribucion'
import { mostrarToast } from '@/lib/ui/toast'

type Audiencia = 'iglesia' | 'lideres' | 'servidores' | 'publico'
type AudienciaVisible = Exclude<Audiencia, 'publico'>

const OPCIONES: Array<{ value: AudienciaVisible; label: string; detalle: string }> = [
  { value: 'iglesia', label: 'Toda la congregación', detalle: 'Todas las personas con una cuenta activa podrán verlo.' },
  { value: 'lideres', label: 'Líderes', detalle: 'Visible para líderes, pastores y administradores.' },
  { value: 'servidores', label: 'Servidores', detalle: 'Visible para servidores, líderes, pastores y administradores.' },
]

export default function PackageDistributionControls({
  paqueteId,
  initialAudience,
  initialPublished,
  initialFeatured = false,
}: {
  paqueteId: string
  initialAudience: Audiencia
  initialPublished: boolean
  initialFeatured?: boolean
}) {
  const [audiencia, setAudiencia] = useState<AudienciaVisible>(initialAudience === 'publico' ? 'iglesia' : initialAudience)
  const [publicado, setPublicado] = useState(initialPublished)
  const [destacado, setDestacado] = useState(initialFeatured)
  const [isPending, startTransition] = useTransition()

  const guardar = (nuevoPublicado = publicado) => {
    startTransition(async () => {
      const resultado = await actualizarDistribucionPaquete(paqueteId, audiencia, nuevoPublicado, destacado)
      if (!resultado.success) {
        mostrarToast(resultado.error)
        return
      }

      const estadoPublicado = Boolean(resultado.publicado)
      setPublicado(estadoPublicado)

      if (estadoPublicado && !publicado) {
        const cantidad = Number(resultado.notificaciones ?? 0)
        mostrarToast(cantidad > 0 ? `Material publicado y ${cantidad} notificación${cantidad === 1 ? '' : 'es'} enviada${cantidad === 1 ? '' : 's'}` : 'Material publicado en Inicio')
      } else {
        mostrarToast(estadoPublicado ? 'Opciones de publicación actualizadas' : 'Publicación desactivada')
      }
    })
  }

  return (
    <section className="overflow-hidden rounded-[24px] border border-violet-200 bg-white shadow-sm">
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white sm:p-6">
        <div className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/25 to-transparent pastoral-publish-shine" />
        <div className="relative flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20"><Globe2 className="h-5 w-5" /></span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-indigo-100">Último paso</p>
            <h2 className="mt-1 text-lg font-bold">Publicar y enviar a la congregación</h2>
            <p className="mt-1 text-sm leading-6 text-indigo-100">El material aparecerá en Inicio y se enviará una notificación push a la audiencia seleccionada.</p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <label>
          <span className="mb-1.5 block text-xs font-bold text-slate-700">¿Quién debe recibirlo?</span>
          <select value={audiencia} onChange={(event) => setAudiencia(event.target.value as AudienciaVisible)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900">
            {OPCIONES.map((opcion) => <option key={opcion.value} value={opcion.value}>{opcion.label}</option>)}
          </select>
          <span className="mt-1.5 block text-xs leading-5 text-slate-500">{OPCIONES.find((opcion) => opcion.value === audiencia)?.detalle}</span>
        </label>

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
          <input type="checkbox" checked={destacado} onChange={(event) => setDestacado(event.target.checked)} className="mt-0.5 h-5 w-5 rounded border-violet-300" />
          <span>
            <span className="flex items-center gap-2 text-sm font-bold text-violet-950"><Sparkles className="h-4 w-4 text-violet-600" /> Marcar como importante</span>
            <span className="mt-1 block text-xs leading-5 text-violet-800/75">Añade un destello suave a la tarjeta para llamar la atención sin distraer.</span>
          </span>
        </label>

        {!publicado ? (
          <button type="button" disabled={isPending} onClick={() => guardar(true)} className="mt-5 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 px-4 text-sm font-bold text-white shadow-lg shadow-violet-200 disabled:opacity-60">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            {isPending ? 'Publicando…' : 'Publicar y enviar notificación'}
          </button>
        ) : (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700"><Check className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-emerald-950">Publicado para {OPCIONES.find((opcion) => opcion.value === audiencia)?.label.toLowerCase()}</p>
                <p className="mt-1 text-xs leading-5 text-emerald-900/75">Los cambios de audiencia o importancia se guardan sin volver a enviar la notificación.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button type="button" disabled={isPending} onClick={() => guardar(true)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 text-sm font-bold text-emerald-800 disabled:opacity-60"><Check className="h-4 w-4" /> Guardar opciones</button>
              <button type="button" disabled={isPending} onClick={() => guardar(false)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-sm font-bold text-rose-700 disabled:opacity-60"><EyeOff className="h-4 w-4" /> Desactivar</button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes pastoral-publish-shine { 0%, 68% { transform: translateX(-140%) rotate(12deg); opacity: 0; } 72% { opacity: 1; } 92%, 100% { transform: translateX(520%) rotate(12deg); opacity: 0; } }
        .pastoral-publish-shine { animation: pastoral-publish-shine 7s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .pastoral-publish-shine { animation: none; display: none; } }
      `}</style>
    </section>
  )
}
