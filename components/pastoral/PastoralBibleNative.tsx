'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { BookOpen, Loader2, Trash2 } from 'lucide-react'
import BibliaClient from '@/components/biblia/BibliaClient'
import {
  eliminarVersiculoDelProyecto,
  obtenerVersiculosDelProyecto,
} from '@/app/actions/pastoral-proyecto-versiculos'
import { mostrarToast } from '@/lib/ui/toast'

type VersiculoProyecto = {
  id: string
  referencia: string
  texto: string
  traduccion: string
  nota: string
}

export default function PastoralBibleNative({ paqueteId }: { paqueteId: string }) {
  const [versiculos, setVersiculos] = useState<VersiculoProyecto[]>([])
  const [cargando, setCargando] = useState(true)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const cargar = useCallback(async () => {
    setCargando(true)
    const resultado = await obtenerVersiculosDelProyecto(paqueteId)
    if (!resultado.success) mostrarToast(resultado.error)
    setVersiculos(resultado.versiculos ?? [])
    setCargando(false)
  }, [paqueteId])

  useEffect(() => { void cargar() }, [cargar])

  const eliminar = (id: string) => {
    if (!window.confirm('¿Quitar este versículo del proyecto?')) return
    const anteriores = versiculos
    setEliminandoId(id)
    setVersiculos((actuales) => actuales.filter((item) => item.id !== id))
    startTransition(async () => {
      const resultado = await eliminarVersiculoDelProyecto(paqueteId, id)
      setEliminandoId(null)
      if (!resultado.success) {
        setVersiculos(anteriores)
        mostrarToast(resultado.error)
        return
      }
      mostrarToast('Versículo eliminado del proyecto')
    })
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[24px] border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-600 text-white">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-600">2. Biblia del proyecto</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">Buscar, estudiar y agregar sin salir del mensaje</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Esta Biblia forma parte del espacio pastoral. Toque cualquier versículo para agregarlo directamente.</p>
          </div>
        </div>
      </section>

      {cargando ? (
        <div className="grid min-h-28 place-items-center rounded-[22px] border border-slate-200 bg-white">
          <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
        </div>
      ) : versiculos.length > 0 ? (
        <section className="rounded-[22px] border border-violet-100 bg-violet-50/70 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-violet-950">Versículos agregados al mensaje</h3>
              <p className="mt-1 text-xs text-violet-700">Puede eliminarlos aquí cuando ya no formen parte del proyecto.</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-violet-700">{versiculos.length}</span>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {versiculos.map((versiculo) => (
              <article key={versiculo.id} className="rounded-2xl border border-violet-100 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-violet-700">{versiculo.referencia}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{versiculo.texto}</p>
                    {versiculo.traduccion && <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">{versiculo.traduccion}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminar(versiculo.id)}
                    disabled={eliminandoId === versiculo.id || isPending}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600 disabled:opacity-50"
                    aria-label={`Eliminar ${versiculo.referencia}`}
                  >
                    {eliminandoId === versiculo.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <BibliaClient
        modo="pastoral"
        paqueteId={paqueteId}
        onProyectoActualizado={cargar}
      />
    </div>
  )
}
