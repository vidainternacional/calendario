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
      <section className="rounded-[24px] border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white"><PackagePlus className="h-5 w-5" /></span>
          <div>
            <h2 className="font-bold text-slate-900">¿Qué es un paquete pastoral?</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Es una carpeta de trabajo que reúne en un solo lugar el bosquejo, los versículos y los archivos que usará para una prédica o estudio.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-3 ring-1 ring-indigo-100"><span className="text-xs font-black text-indigo-600">1. PREPARE</span><p className="mt-1 text-xs leading-5 text-slate-600">Elija el bosquejo y los versículos.</p></div>
          <div className="rounded-xl bg-white p-3 ring-1 ring-indigo-100"><span className="text-xs font-black text-indigo-600">2. COMPLETE</span><p className="mt-1 text-xs leading-5 text-slate-600">Agregue archivos, preguntas o indicaciones.</p></div>
          <div className="rounded-xl bg-white p-3 ring-1 ring-indigo-100"><span className="text-xs font-black text-indigo-600">3. COMPARTA</span><p className="mt-1 text-xs leading-5 text-slate-600">Revise, publique, imprima o envíe.</p></div>
        </div>
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Escriba el nombre o tema del paquete" aria-label="Buscar paquetes por nombre o tema" className="min-h-12 w-full rounded-xl border border-slate-200 pl-10 pr-11 text-base text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" />
            {busqueda && <button type="button" onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda" className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>}
          </label>
          <button type="button" onClick={() => setMostrarFormulario((actual) => !actual)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white">
            <PackagePlus className="h-4 w-4" /> {mostrarFormulario ? 'Ocultar formulario' : 'Crear paquete'}
          </button>
        </div>
        {termino && <p className="mt-3 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700">Búsqueda activa: “{busqueda.trim()}” · {filtrados.length} coincidencia{filtrados.length === 1 ? '' : 's'}</p>}
      </section>

      {mostrarFormulario && (
        <form action={crear} className="rounded-[24px] border border-indigo-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Nuevo paquete</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Prepare una prédica o estudio</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Solo el título es obligatorio. Puede completar o cambiar lo demás después.</p>
          </div>

          <section className="rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">1</span><h3 className="font-bold text-slate-900">Identifique el material</h3></div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Nombre de la prédica o estudio</span><input name="titulo" required maxLength={140} placeholder="Ej. La fe que permanece" className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-900" /></label>
              <label className="md:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Resumen para la iglesia <span className="font-normal text-slate-400">(opcional)</span></span><textarea name="descripcion_publica" maxLength={2000} rows={3} placeholder="Explique brevemente de qué trata y para quién será útil." className="w-full rounded-xl border border-slate-200 p-3 text-base leading-7 text-slate-900" /></label>
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">2</span><h3 className="font-bold text-slate-900">Reúna lo que ya preparó</h3></div>
            <p className="mt-2 text-xs leading-5 text-slate-500">Puede vincular contenido existente. Elegir “Ninguno” no elimina nada y podrá agregarlo después.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label><span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700"><FileText className="h-4 w-4" /> Bosquejo</span><select name="bosquejo_id" className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900"><option value="">Ninguno por ahora</option>{bosquejos.map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}</select><span className="mt-1 block text-[11px] leading-4 text-slate-400">La estructura y puntos principales del mensaje.</span></label>
              <label><span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700"><BookOpen className="h-4 w-4" /> Colección de versículos</span><select name="coleccion_id" className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900"><option value="">Ninguna por ahora</option>{colecciones.map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}</select><span className="mt-1 block text-[11px] leading-4 text-slate-400">Los pasajes bíblicos que acompañan el tema.</span></label>
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">3</span><h3 className="font-bold text-slate-900">Añada aplicación y recursos</h3></div>
            <label className="mt-4 block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Preguntas, pasos o indicaciones <span className="font-normal text-slate-400">(opcional)</span></span><textarea name="instrucciones" maxLength={3000} rows={4} placeholder="Ej. Preguntas para grupos, lectura semanal o pasos prácticos." className="w-full rounded-xl border border-slate-200 p-3 text-base leading-7 text-slate-900" /></label>

            {recursos.length > 0 ? (
              <fieldset className="mt-5">
                <legend className="text-xs font-bold text-slate-700">Archivos y enlaces de apoyo</legend>
                <p className="mt-1 text-xs text-slate-500">Marque solo los recursos que pertenecen a este tema. Puede elegir hasta 30.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {recursos.map((recurso) => (
                    <label key={recurso.id} className="flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50">
                      <input type="checkbox" name="recurso_ids" value={recurso.id} className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                      <span className="min-w-0"><span className="block truncate font-semibold">{recurso.titulo}</span><span className="text-[11px] text-slate-500">{recurso.tipo === 'archivo' ? 'Archivo' : 'Enlace'} · {recurso.categoria}</span></span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">Todavía no hay archivos o enlaces en la Biblioteca. Puede crear el paquete ahora y agregarlos después.</p>}
          </section>

          <input type="hidden" name="estado" value="borrador" />
          <button type="submit" disabled={isPending} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white disabled:opacity-60">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {isPending ? 'Creando…' : 'Crear paquete y continuar'}
          </button>
        </form>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div><h2 className="text-sm font-bold text-slate-900">Sus paquetes</h2><p className="mt-0.5 text-xs text-slate-500">{filtrados.length} resultado{filtrados.length === 1 ? '' : 's'}</p></div>
        </div>

        {filtrados.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-slate-300 bg-white p-8 text-center">
            <Search className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 font-bold text-slate-800">{termino ? 'No encontramos coincidencias' : 'No hay paquetes todavía'}</p>
            <p className="mt-1 text-sm text-slate-500">{termino ? `No hay paquetes que contengan “${busqueda.trim()}”.` : 'Cree el primero para reunir una prédica o estudio.'}</p>
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
                <Link href={`/pastoral/paquetes/${paquete.id}`} className="mt-4 flex min-h-11 items-center justify-between rounded-xl bg-slate-50 px-3 text-sm font-bold text-indigo-700">Abrir y continuar <ChevronRight className="h-4 w-4" /></Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
