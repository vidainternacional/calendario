'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Loader2, PackagePlus, Search, Trash2 } from 'lucide-react'
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

export default function PaquetesClient({
  paquetes,
  bosquejos,
  colecciones,
  recursos,
}: {
  paquetes: Paquete[]
  bosquejos: Opcion[]
  colecciones: Opcion[]
  recursos: Recurso[]
}) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(paquetes.length === 0)
  const [isPending, startTransition] = useTransition()

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return paquetes
    return paquetes.filter((paquete) => `${paquete.titulo} ${paquete.descripcion_publica}`.toLowerCase().includes(termino))
  }, [busqueda, paquetes])

  const crear = (formData: FormData) => {
    startTransition(async () => {
      const resultado = await crearPaquetePastoral(formData)
      if (!resultado.success || !resultado.id) {
        mostrarToast(resultado.error)
        return
      }
      mostrarToast('Paquete pastoral creado')
      router.push(`/pastoral/paquetes/${resultado.id}`)
    })
  }

  const eliminar = (id: string) => {
    if (!window.confirm('¿Eliminar este paquete pastoral?')) return
    startTransition(async () => {
      const resultado = await eliminarPaquetePastoral(id)
      mostrarToast(resultado.success ? 'Paquete eliminado' : resultado.error)
      if (resultado.success) router.refresh()
    })
  }

  const estadoLabel = { borrador: 'Borrador', listo: 'Listo', compartido: 'Compartido' }

  return (
    <div className="space-y-5">
      <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar paquetes" className="min-h-12 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" />
          </label>
          <button type="button" onClick={() => setMostrarFormulario((actual) => !actual)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white">
            <PackagePlus className="h-4 w-4" /> Nuevo paquete
          </button>
        </div>
      </section>

      {mostrarFormulario && (
        <form action={crear} className="rounded-[24px] border border-indigo-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Preparación integral</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Crear paquete pastoral</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Relaciona el contenido que formará una sola guía para preparar y compartir.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Título del paquete</span><input name="titulo" required maxLength={140} placeholder="Ej. La fe que permanece" className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-900" /></label>
            <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Bosquejo principal</span><select name="bosquejo_id" className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900"><option value="">Sin bosquejo</option>{bosquejos.map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}</select></label>
            <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Colección de versículos</span><select name="coleccion_id" className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900"><option value="">Sin colección</option>{colecciones.map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}</select></label>
            <label className="md:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Descripción para la iglesia</span><textarea name="descripcion_publica" maxLength={2000} rows={4} placeholder="Presenta el tema, objetivo o invitación para la congregación." className="w-full rounded-xl border border-slate-200 p-3 text-base leading-7 text-slate-900" /></label>
            <label className="md:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Instrucciones o aplicación</span><textarea name="instrucciones" maxLength={3000} rows={4} placeholder="Preguntas, pasos de aplicación, lectura semanal o indicaciones." className="w-full rounded-xl border border-slate-200 p-3 text-base leading-7 text-slate-900" /></label>
          </div>

          {recursos.length > 0 && (
            <fieldset className="mt-5">
              <legend className="text-xs font-bold text-slate-700">Recursos de apoyo</legend>
              <p className="mt-1 text-xs text-slate-500">Selecciona archivos o enlaces relacionados. Puedes elegir hasta 30.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {recursos.map((recurso) => (
                  <label key={recurso.id} className="flex min-h-14 items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <input type="checkbox" name="recurso_ids" value={recurso.id} className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                    <span className="min-w-0"><span className="block truncate font-semibold">{recurso.titulo}</span><span className="text-[11px] text-slate-500">{recurso.tipo === 'archivo' ? 'Archivo' : 'Enlace'} · {recurso.categoria}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <input type="hidden" name="estado" value="borrador" />
          <button type="submit" disabled={isPending} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white disabled:opacity-60">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
            {isPending ? 'Creando…' : 'Crear y continuar'}
          </button>
        </form>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div><h2 className="text-sm font-bold text-slate-900">Paquetes preparados</h2><p className="mt-0.5 text-xs text-slate-500">{filtrados.length} resultado{filtrados.length === 1 ? '' : 's'}</p></div>
        </div>

        {filtrados.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-slate-300 bg-white p-8 text-center"><PackagePlus className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-bold text-slate-800">No hay paquetes todavía</p><p className="mt-1 text-sm text-slate-500">Crea el primero para reunir una prédica completa.</p></div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtrados.map((paquete) => (
              <article key={paquete.id} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">{estadoLabel[paquete.estado]}</span><h3 className="mt-3 line-clamp-2 text-lg font-bold text-slate-900">{paquete.titulo}</h3></div>
                  <button type="button" onClick={() => eliminar(paquete.id)} disabled={isPending} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500" aria-label={`Eliminar ${paquete.titulo}`}><Trash2 className="h-4 w-4" /></button>
                </div>
                {paquete.descripcion_publica && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{paquete.descripcion_publica}</p>}
                <Link href={`/pastoral/paquetes/${paquete.id}`} className="mt-4 flex min-h-11 items-center justify-between rounded-xl bg-slate-50 px-3 text-sm font-bold text-indigo-700">Abrir paquete <ChevronRight className="h-4 w-4" /></Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
