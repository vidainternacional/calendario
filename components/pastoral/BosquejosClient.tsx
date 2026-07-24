'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { FileText, Loader2, Plus, Search, Trash2, X } from 'lucide-react'
import { crearBosquejoPastoral, eliminarBosquejoPastoral } from '@/app/actions/pastoral-bosquejos'
import { mostrarToast } from '@/lib/ui/toast'

type Bosquejo = {
  id: string
  titulo: string
  tema: string
  pasaje_base: string
  estado: 'borrador' | 'listo' | 'predicado'
  updated_at: string
}

const estadoClase = {
  borrador: 'bg-slate-100 text-slate-600',
  listo: 'bg-emerald-100 text-emerald-700',
  predicado: 'bg-violet-100 text-violet-700',
}

export default function BosquejosClient({ bosquejos }: { bosquejos: Bosquejo[] }) {
  const router = useRouter()
  const [modal, setModal] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [isPending, startTransition] = useTransition()

  const filtrados = bosquejos.filter((item) =>
    `${item.titulo} ${item.tema} ${item.pasaje_base}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  const crear = (formData: FormData) => {
    startTransition(async () => {
      const resultado = await crearBosquejoPastoral(formData)
      if (!resultado.success) {
        mostrarToast(resultado.error)
        return
      }
      mostrarToast('Bosquejo creado')
      setModal(false)
      router.push(`/pastoral/bosquejos/${resultado.id}`)
    })
  }

  const eliminar = (id: string, titulo: string) => {
    if (!confirm(`¿Eliminar el bosquejo “${titulo}”?`)) return
    startTransition(async () => {
      const resultado = await eliminarBosquejoPastoral(id)
      mostrarToast(resultado.success ? 'Bosquejo eliminado' : resultado.error)
    })
  }

  return (
    <>
      <div className="flex gap-2">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar bosquejos" className="min-h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" />
        </label>
        <button type="button" onClick={() => setModal(true)} className="flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white">
          <Plus className="h-4 w-4" /> Nuevo
        </button>
      </div>

      {filtrados.length === 0 ? (
        <div className="mt-6 rounded-[22px] border border-dashed border-slate-300 bg-white p-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><FileText className="h-6 w-6" /></span>
          <h2 className="mt-4 font-bold text-slate-900">{bosquejos.length ? 'No hay coincidencias' : 'Comienza tu primer bosquejo'}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">Organiza la idea central, el pasaje, los puntos y la conclusión de una prédica.</p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {filtrados.map((item) => (
            <article key={item.id} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <button type="button" onClick={() => router.push(`/pastoral/bosquejos/${item.id}`)} className="min-w-0 flex-1 text-left">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${estadoClase[item.estado]}`}>{item.estado}</span>
                  <h2 className="mt-2 truncate text-base font-bold text-slate-900">{item.titulo}</h2>
                  <p className="mt-1 text-xs text-slate-500">{[item.tema, item.pasaje_base].filter(Boolean).join(' · ') || 'Sin tema ni pasaje todavía'}</p>
                  <p className="mt-3 text-[11px] text-slate-400">Actualizado {new Date(item.updated_at).toLocaleDateString('es-SV')}</p>
                </button>
                <button type="button" onClick={() => eliminar(item.id, item.titulo)} disabled={isPending} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500" aria-label={`Eliminar ${item.titulo}`}><Trash2 className="h-4 w-4" /></button>
              </div>
            </article>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-overlay-safe bg-black/55" onClick={(event) => { if (event.target === event.currentTarget) setModal(false) }}>
          <section className="modal-panel-safe rounded-3xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="nuevo-bosquejo-title">
            <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div><h2 id="nuevo-bosquejo-title" className="font-bold text-slate-900">Nuevo bosquejo</h2><p className="mt-0.5 text-xs text-slate-500">Crea la base y continúa en el editor.</p></div>
              <button type="button" onClick={() => setModal(false)} className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600" aria-label="Cerrar"><X className="h-5 w-5" /></button>
            </header>
            <form action={crear} className="modal-body-safe space-y-4 p-5">
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Título</span><input name="titulo" required maxLength={120} placeholder="Ej. Una fe que permanece" className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Tema</span><input name="tema" maxLength={100} placeholder="Ej. Fe, esperanza, familia" className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-900" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Pasaje base</span><input name="pasaje_base" maxLength={120} placeholder="Ej. Hebreos 11:1-6" className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-900" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Propósito</span><textarea name="proposito" maxLength={600} rows={4} placeholder="¿Qué debe comprender o aplicar la congregación?" className="w-full rounded-xl border border-slate-200 p-3 text-base text-slate-900" /></label>
              <button type="submit" disabled={isPending} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white">{isPending && <Loader2 className="h-4 w-4 animate-spin" />} Crear y editar</button>
            </form>
          </section>
        </div>
      )}
    </>
  )
}
