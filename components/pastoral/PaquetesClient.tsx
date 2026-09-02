'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, ChevronRight, Loader2, PackagePlus, Search, Trash2, X } from 'lucide-react'
import { crearPaquetePastoral, eliminarPaquetePastoral } from '@/app/actions/pastoral-paquetes'
import { mostrarToast } from '@/lib/ui/toast'

type Paquete = {
  id: string
  titulo: string
  descripcion_publica: string
  estado: 'borrador' | 'listo' | 'compartido'
  updated_at: string
}

type Opcion = { id: string; titulo: string }
type Recurso = Opcion & { categoria: string; tipo: 'archivo' | 'enlace' }

export default function PaquetesClient({ paquetes }: { paquetes: Paquete[]; bosquejos: Opcion[]; colecciones: Opcion[]; recursos: Recurso[] }) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [isPending, startTransition] = useTransition()

  const termino = busqueda.trim().toLowerCase()
  const filtrados = useMemo(() => !termino ? paquetes : paquetes.filter((paquete) => `${paquete.titulo} ${paquete.descripcion_publica ?? ''}`.toLowerCase().includes(termino)), [termino, paquetes])

  const crear = (formData: FormData) => {
    startTransition(async () => {
      const resultado = await crearPaquetePastoral(formData)
      if (!resultado.success || !resultado.id) return mostrarToast(resultado.error)
      mostrarToast('Proyecto creado')
      router.push(`/pastoral/paquetes/${resultado.id}`)
    })
  }

  const eliminar = (id: string) => {
    if (!window.confirm('¿Eliminar este proyecto pastoral?')) return
    startTransition(async () => {
      const resultado = await eliminarPaquetePastoral(id)
      mostrarToast(resultado.success ? 'Proyecto eliminado' : resultado.error)
      if (resultado.success) router.refresh()
    })
  }

  const estadoLabel = { borrador: 'En preparación', listo: 'Listo', compartido: 'Publicado' }

  return (
    <div className="pastoral-project-workspace">
      {!mostrarFormulario ? (
        <button type="button" onClick={() => setMostrarFormulario(true)} className="pastoral-project-create">
          <PackagePlus aria-hidden="true" />
          <span>Nuevo proyecto</span>
        </button>
      ) : (
        <form action={crear} className="py-4">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-violet-600">Nuevo proyecto</p>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-950">Información del proyecto</h2>
              <p className="mt-1 text-sm text-slate-500">Crea la base. El contenido, versículos, diseño y presentación se preparan dentro del proyecto.</p>
            </div>
            <button type="button" onClick={() => setMostrarFormulario(false)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500" aria-label="Cerrar"><X className="h-5 w-5" /></button>
          </div>

          <label className="block border-b border-slate-200 py-4">
            <span className="text-xs font-bold text-slate-500">Título</span>
            <input name="titulo" value={titulo} onChange={(event) => setTitulo(event.target.value)} required maxLength={140} placeholder="Ej. La fe" className="mt-2 w-full bg-transparent text-2xl font-bold outline-none placeholder:text-slate-300" />
          </label>
          <label className="block border-b border-slate-200 py-4">
            <span className="text-xs font-bold text-slate-500">Descripción <em className="font-normal">opcional</em></span>
            <textarea name="descripcion_publica" value={descripcion} onChange={(event) => setDescripcion(event.target.value)} maxLength={2000} rows={3} placeholder="Una idea breve sobre el propósito del proyecto." className="mt-2 w-full resize-none bg-transparent text-base leading-7 outline-none placeholder:text-slate-300" />
          </label>
          <input type="hidden" name="estado" value="borrador" />
          <button type="submit" disabled={isPending || !titulo.trim()} className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 text-base font-bold text-white disabled:opacity-40">
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
            {isPending ? 'Creando…' : 'Crear proyecto'}
          </button>
        </form>
      )}

      <details className="pastoral-accordion pastoral-projects-accordion mt-4">
        <summary>
          <span className="pastoral-accordion-copy"><strong>Mis proyectos</strong><small>{paquetes.length} proyecto{paquetes.length === 1 ? '' : 's'}</small></span>
          <ChevronRight aria-hidden="true" />
        </summary>
        <div className="pt-3">
          {paquetes.length > 3 && (
            <label className="mb-3 flex min-h-11 items-center gap-2 border-b border-slate-200 px-1">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar proyecto" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" />
              {busqueda && <button type="button" onClick={() => setBusqueda('')} aria-label="Limpiar"><X className="h-4 w-4 text-slate-400" /></button>}
            </label>
          )}
          <div className="divide-y divide-slate-200">
            {filtrados.map((paquete) => (
              <div key={paquete.id} className="flex items-center gap-2 py-3">
                <Link href={`/pastoral/paquetes/${paquete.id}`} className="min-w-0 flex-1 py-1">
                  <strong className="block truncate text-sm text-slate-900">{paquete.titulo}</strong>
                  <small className="mt-1 block text-xs text-slate-500">{estadoLabel[paquete.estado]}</small>
                </Link>
                <button type="button" onClick={() => eliminar(paquete.id)} disabled={isPending} className="flex h-10 w-10 items-center justify-center rounded-full text-rose-500" aria-label={`Eliminar ${paquete.titulo}`}><Trash2 className="h-4 w-4" /></button>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </div>
            ))}
            {!filtrados.length && <p className="py-8 text-center text-sm text-slate-500">No hay proyectos para mostrar.</p>}
          </div>
        </div>
      </details>
    </div>
  )
}
