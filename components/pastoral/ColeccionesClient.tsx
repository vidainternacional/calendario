'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { BookHeart, ChevronRight, FolderPlus, Loader2, Plus, Trash2, X } from 'lucide-react'
import { crearColeccionPastoral, eliminarColeccionPastoral } from '@/app/actions/pastoral'
import { EmptyState } from '@/components/ui/EmptyState'
import { mostrarToast } from '@/lib/ui/toast'

type Coleccion = {
  id: string
  nombre: string
  descripcion: string
  color: string
  totalVersiculos: number
}

const estilos: Record<string, { badge: string; icon: string; border: string }> = {
  indigo: { badge: 'bg-indigo-50 text-indigo-700', icon: 'bg-indigo-600 text-white', border: 'border-indigo-100' },
  violet: { badge: 'bg-violet-50 text-violet-700', icon: 'bg-violet-600 text-white', border: 'border-violet-100' },
  amber: { badge: 'bg-amber-50 text-amber-700', icon: 'bg-amber-500 text-white', border: 'border-amber-100' },
  emerald: { badge: 'bg-emerald-50 text-emerald-700', icon: 'bg-emerald-600 text-white', border: 'border-emerald-100' },
  rose: { badge: 'bg-rose-50 text-rose-700', icon: 'bg-rose-600 text-white', border: 'border-rose-100' },
  sky: { badge: 'bg-sky-50 text-sky-700', icon: 'bg-sky-600 text-white', border: 'border-sky-100' },
}

export default function ColeccionesClient({ colecciones }: { colecciones: Coleccion[] }) {
  const [abierto, setAbierto] = useState(false)
  const [isPending, startTransition] = useTransition()

  const crear = (formData: FormData) => {
    startTransition(async () => {
      const result = await crearColeccionPastoral(formData)
      if (!result.success) {
        mostrarToast(result.error)
        return
      }
      mostrarToast('Colección creada')
      setAbierto(false)
    })
  }

  const eliminar = (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la colección “${nombre}”? Los versículos guardados dentro también se eliminarán.`)) return
    startTransition(async () => {
      const result = await eliminarColeccionPastoral(id)
      mostrarToast(result.success ? 'Colección eliminada' : result.error)
    })
  }

  return (
    <>
      <button type="button" onClick={() => setAbierto(true)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
        <Plus className="h-4 w-4" aria-hidden="true" /> Nueva colección
      </button>

      <section className="mt-5" aria-labelledby="mis-colecciones-title">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="mis-colecciones-title" className="text-sm font-bold text-slate-900">Mis colecciones</h2>
          {colecciones.length > 0 && <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">{colecciones.length}</span>}
        </div>

        {colecciones.length === 0 ? (
          <EmptyState icon={BookHeart} title="Aún no tienes colecciones" description="Crea una colección para organizar versículos por tema, serie, prédica o propósito ministerial." compact />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {colecciones.map((coleccion) => {
              const estilo = estilos[coleccion.color] ?? estilos.indigo
              return (
                <article key={coleccion.id} className={`relative overflow-hidden rounded-[20px] border bg-white shadow-sm transition-shadow hover:shadow-md ${estilo.border}`}>
                  <Link href={`/pastoral/colecciones/${coleccion.id}`} className="block p-4 pr-16" aria-label={`Abrir colección ${coleccion.nombre}`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${estilo.icon}`}><FolderPlus className="h-5 w-5" /></div>
                    <h3 className="mt-3 break-words font-bold text-slate-900">{coleccion.nombre}</h3>
                    {coleccion.descripcion && <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-500">{coleccion.descripcion}</p>}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-[10px] font-bold uppercase tracking-wide ${estilo.badge}`}>{coleccion.totalVersiculos} versículo{coleccion.totalVersiculos === 1 ? '' : 's'}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600">Abrir <ChevronRight className="h-4 w-4" /></span>
                    </div>
                  </Link>
                  <button type="button" onClick={() => eliminar(coleccion.id, coleccion.nombre)} disabled={isPending} className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100" aria-label={`Eliminar ${coleccion.nombre}`}><Trash2 className="h-4 w-4" /></button>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {abierto && (
        <div className="modal-overlay-safe bg-black/55" onClick={(event) => { if (event.target === event.currentTarget) setAbierto(false) }}>
          <section className="modal-panel-safe rounded-3xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="nueva-coleccion-title">
            <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div><h2 id="nueva-coleccion-title" className="font-bold text-slate-900">Nueva colección</h2><p className="mt-0.5 text-xs text-slate-500">Organiza versículos para tu trabajo pastoral.</p></div>
              <button type="button" onClick={() => setAbierto(false)} className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600" aria-label="Cerrar"><X className="h-5 w-5" /></button>
            </header>
            <form action={crear} className="modal-body-safe space-y-4 p-5">
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Nombre</span><input name="nombre" required maxLength={80} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej. Fe en tiempos difíciles" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Descripción opcional</span><textarea name="descripcion" maxLength={500} rows={3} className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Para qué usarás esta colección" /></label>
              <fieldset><legend className="mb-2 text-xs font-bold text-slate-700">Color</legend><div className="grid grid-cols-3 gap-2">{Object.keys(estilos).map((color, index) => <label key={color} className="cursor-pointer"><input type="radio" name="color" value={color} defaultChecked={index === 0} className="peer sr-only" /><span className={`flex min-h-11 items-center justify-center rounded-xl border border-transparent text-xs font-semibold capitalize peer-checked:ring-2 peer-checked:ring-indigo-500 ${estilos[color].badge}`}>{color}</span></label>)}</div></fieldset>
              <button type="submit" disabled={isPending} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{isPending ? 'Creando…' : 'Crear colección'}</button>
            </form>
          </section>
        </div>
      )}
    </>
  )
}
