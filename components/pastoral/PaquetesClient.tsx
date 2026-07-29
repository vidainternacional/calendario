'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, CheckCircle2, ChevronRight, FileText, Loader2, PackagePlus, Search, Trash2, X } from 'lucide-react'
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

  const termino = busqueda.trim().toLowerCase()
  const filtrados = useMemo(() => {
    if (!termino) return paquetes
    return paquetes.filter((paquete) => `${paquete.titulo} ${paquete.descripcion_publica ?? ''}`.toLowerCase().includes(termino))
  }, [termino, paquetes])

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

  const estadoLabel = { borrador: 'En preparación', listo: 'Listo', compartido: 'Publicado' }

  return (
    <div className="space-y-5">
      <details className="pastoral-help-card">
        <summary>
          <span className="flex items-center gap-2"><PackagePlus className="h-4 w-4" aria-hidden="true" /> Cómo funciona un paquete</span>
        </summary>
        <div className="pastoral-help-content">
          <p>Un paquete reúne todo lo necesario para un mensaje o estudio.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-3 ring-1 ring-indigo-100"><strong className="text-indigo-700">1. Prepara</strong><p className="mt-1">Elige bosquejo y versículos.</p></div>
            <div className="rounded-xl bg-white p-3 ring-1 ring-indigo-100"><strong className="text-indigo-700">2. Completa</strong><p className="mt-1">Agrega recursos y aplicación.</p></div>
            <div className="rounded-xl bg-white p-3 ring-1 ring-indigo-100"><strong className="text-indigo-700">3. Comparte</strong><p className="mt-1">Revisa, publica o imprime.</p></div>
          </div>
        </div>
      </details>

      <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar paquetes" aria-label="Buscar paquetes por nombre o tema" className="min-h-12 w-full rounded-xl border border-slate-200 pl-10 pr-11 text-base text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" />
            {busqueda && <button type="button" onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda" className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>}
          </label>
          <button type="button" onClick={() => setMostrarFormulario((actual) => !actual)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white">
            <PackagePlus className="h-4 w-4" /> {mostrarFormulario ? 'Cerrar' : 'Nuevo paquete'}
          </button>
        </div>
        {termino && <p className="mt-3 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700">“{busqueda.trim()}” · {filtrados.length} resultado{filtrados.length === 1 ? '' : 's'}</p>}
      </section>

      {mostrarFormulario && (
        <form action={crear} className="rounded-[24px] border border-indigo-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">Nuevo paquete</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Prepara el material</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Comienza con el título; lo demás puede completarse después.</p>
          </div>

          <section className="rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">1</span><h3 className="font-bold text-slate-900">Información básica</h3></div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Título</span><input name="titulo" required maxLength={140} placeholder="Ej. La fe que permanece" className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-900" /></label>
              <label className="md:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Resumen <span className="font-normal text-slate-400">(opcional)</span></span><textarea name="descripcion_publica" maxLength={2000} rows={3} placeholder="Explica brevemente de qué trata." className="w-full rounded-xl border border-slate-200 p-3 text-base leading-7 text-slate-900" /></label>
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">2</span><h3 className="font-bold text-slate-900">Contenido existente</h3></div>
            <p className="mt-2 text-xs leading-5 text-slate-500">Vincula lo que ya preparaste o déjalo para después.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label><span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700"><FileText className="h-4 w-4" /> Bosquejo</span><select name="bosquejo_id" className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900"><option value="">Ninguno por ahora</option>{bosquejos.map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}</select><span className="mt-1 block text-[11px] leading-4 text-slate-400">Estructura y puntos del mensaje.</span></label>
              <label><span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700"><BookOpen className="h-4 w-4" /> Versículos</span><select name="coleccion_id" className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900"><option value="">Ninguna por ahora</option>{colecciones.map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}</select><span className="mt-1 block text-[11px] leading-4 text-slate-400">Pasajes relacionados con el tema.</span></label>
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">3</span><h3 className="font-bold text-slate-900">Aplicación y recursos</h3></div>
            <label className="mt-4 block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Preguntas o pasos <span className="font-normal text-slate-400">(opcional)</span></span><textarea name="instrucciones" maxLength={3000} rows={4} placeholder="Preguntas, lectura semanal o pasos prácticos." className="w-full rounded-xl border border-slate-200 p-3 text-base leading-7 text-slate-900" /></label>

            {recursos.length > 0 ? (
              <fieldset className="mt-5">
                <legend className="text-xs font-bold text-slate-700">Archivos y enlaces</legend>
                <p className="mt-1 text-xs text-slate-500">Selecciona hasta 30 recursos relacionados.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {recursos.map((recurso) => (
                    <label key={recurso.id} className="flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50">
                      <input type="checkbox" name="recurso_ids" value={recurso.id} className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                      <span className="min-w-0"><span className="block truncate font-semibold">{recurso.titulo}</span><span className="text-[11px] text-slate-500">{recurso.tipo === 'archivo' ? 'Archivo' : 'Enlace'} · {recurso.categoria}</span></span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">No hay recursos todavía. Puedes agregarlos después.</p>}
          </section>

          <input type="hidden" name="estado" value="borrador" />
          <button type="submit" disabled={isPending} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white disabled:opacity-60">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {isPending ? 'Creando…' : 'Crear y continuar'}
          </button>
        </form>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div><h2 className="text-sm font-bold text-slate-900">Paquetes</h2><p className="mt-0.5 text-xs text-slate-500">{filtrados.length} resultado{filtrados.length === 1 ? '' : 's'}</p></div>
        </div>

        {filtrados.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-slate-300 bg-white p-8 text-center">
            <Search className="mx-auto h-8 w-8 text-slate-300" />
            <div className="pastoral-centered-copy">
              <p className="mt-3 font-bold text-slate-800">{termino ? 'No hay coincidencias' : 'No hay paquetes todavía'}</p>
              <p className="mt-1 text-sm text-slate-500">{termino ? `No encontramos “${busqueda.trim()}”.` : 'Crea el primero para comenzar.'}</p>
            </div>
            {termino && <button type="button" onClick={() => setBusqueda('')} className="mt-4 min-h-11 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white">Limpiar búsqueda</button>}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtrados.map((paquete) => (
              <article key={paquete.id} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">{estadoLabel[paquete.estado]}</span><h3 className="mt-3 line-clamp-2 text-lg font-bold text-slate-900">{paquete.titulo}</h3></div>
                  <button type="button" onClick={() => eliminar(paquete.id)} disabled={isPending} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500" aria-label={`Eliminar ${paquete.titulo}`}><Trash2 className="h-4 w-4" /></button>
                </div>
                {paquete.descripcion_publica && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{paquete.descripcion_publica}</p>}
                <Link href={`/pastoral/paquetes/${paquete.id}`} className="mt-4 flex min-h-11 items-center justify-between rounded-xl bg-slate-50 px-3 text-sm font-bold text-indigo-700">Abrir <ChevronRight className="h-4 w-4" /></Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
