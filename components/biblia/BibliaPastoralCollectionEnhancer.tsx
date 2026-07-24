'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { BookHeart, FolderPlus, Loader2, X } from 'lucide-react'
import { agregarVersiculoPastoral } from '@/app/actions/pastoral'
import { mostrarToast } from '@/lib/ui/toast'

type Coleccion = {
  id: string
  nombre: string
  color: string
}

type VersiculoSeleccionado = {
  libro: string
  capitulo: number
  verso: number
  texto: string
  traduccion: string
}

function limpiarTexto(parrafo: HTMLParagraphElement, verso: number) {
  const clon = parrafo.cloneNode(true) as HTMLParagraphElement
  clon.querySelectorAll('sup, svg').forEach((elemento) => elemento.remove())
  return clon.textContent?.replace(/^\s+|\s+$/g, '').replace(new RegExp(`^${verso}\\s*`), '') ?? ''
}

function leerSeleccion(parrafo: HTMLParagraphElement): VersiculoSeleccionado | null {
  const numero = Number(parrafo.querySelector('sup')?.textContent?.trim())
  if (!Number.isInteger(numero) || numero < 1) return null

  const selects = Array.from(document.querySelectorAll('main select')) as HTMLSelectElement[]
  if (selects.length < 3) return null

  const libro = selects[1]?.selectedOptions[0]?.textContent?.trim() ?? ''
  const capituloTexto = selects[2]?.selectedOptions[0]?.textContent ?? ''
  const capitulo = Number(capituloTexto.match(/\d+/)?.[0])
  const traduccion = selects[0]?.selectedOptions[0]?.textContent?.trim() ?? 'Biblia'
  const texto = limpiarTexto(parrafo, numero)

  if (!libro || !Number.isInteger(capitulo) || capitulo < 1 || !texto) return null
  return { libro, capitulo, verso: numero, texto, traduccion }
}

export default function BibliaPastoralCollectionEnhancer({ colecciones }: { colecciones: Coleccion[] }) {
  const [seleccion, setSeleccion] = useState<VersiculoSeleccionado | null>(null)
  const [abierto, setAbierto] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const manejarClick = (event: MouseEvent) => {
      const objetivo = event.target as HTMLElement | null
      const parrafo = objetivo?.closest('article p') as HTMLParagraphElement | null
      if (!parrafo || !parrafo.querySelector('sup')) return

      const siguiente = leerSeleccion(parrafo)
      if (!siguiente) return

      setSeleccion((actual) => {
        const misma = actual && actual.libro === siguiente.libro && actual.capitulo === siguiente.capitulo && actual.verso === siguiente.verso
        return misma ? null : siguiente
      })
    }

    document.addEventListener('click', manejarClick)
    return () => document.removeEventListener('click', manejarClick)
  }, [])

  const agregar = (formData: FormData) => {
    if (!seleccion) return
    const coleccionId = String(formData.get('coleccion_id') ?? '')
    if (!coleccionId) {
      mostrarToast('Selecciona una colección')
      return
    }

    formData.set('libro_nombre', seleccion.libro)
    formData.set('capitulo', String(seleccion.capitulo))
    formData.set('verso', String(seleccion.verso))
    formData.set('texto', seleccion.texto)
    formData.set('traduccion', seleccion.traduccion)

    startTransition(async () => {
      const resultado = await agregarVersiculoPastoral(coleccionId, formData)
      mostrarToast(resultado.success ? 'Versículo agregado a la colección' : resultado.error)
      if (resultado.success) {
        setAbierto(false)
        setSeleccion(null)
      }
    })
  }

  if (!seleccion) return null

  const referencia = `${seleccion.libro} ${seleccion.capitulo}:${seleccion.verso}`

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-[92] flex min-h-12 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-violet-600 px-5 text-sm font-bold text-white shadow-[0_10px_30px_rgba(109,40,217,0.35)] active:scale-[0.98]"
      >
        <BookHeart className="h-4 w-4" />
        Agregar a colección
      </button>

      {abierto && (
        <div className="modal-overlay-safe bg-black/55" onClick={(event) => { if (event.target === event.currentTarget) setAbierto(false) }}>
          <section className="modal-panel-safe rounded-3xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="coleccion-biblia-title">
            <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <h2 id="coleccion-biblia-title" className="font-bold text-slate-900">Agregar a una colección</h2>
                <p className="mt-1 text-xs font-semibold text-violet-700">{referencia}</p>
              </div>
              <button type="button" onClick={() => setAbierto(false)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600" aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="modal-body-safe p-5">
              <blockquote className="rounded-2xl border border-violet-100 bg-violet-50 p-4 text-sm leading-6 text-slate-700">
                “{seleccion.texto}”
              </blockquote>

              {colecciones.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                  <FolderPlus className="mx-auto h-7 w-7 text-violet-500" />
                  <p className="mt-2 font-bold text-slate-800">Primero crea una colección</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Después podrás regresar y guardar este versículo dentro de tu guía pastoral.</p>
                  <Link href="/pastoral/colecciones" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-600 px-4 text-xs font-bold text-white">
                    Crear colección
                  </Link>
                </div>
              ) : (
                <form action={agregar} className="mt-4 space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-700">Colección</span>
                    <select name="coleccion_id" required defaultValue="" className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-violet-500">
                      <option value="" disabled>Selecciona una colección</option>
                      {colecciones.map((coleccion) => <option key={coleccion.id} value={coleccion.id}>{coleccion.nombre}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-700">Nota pastoral opcional</span>
                    <textarea name="nota" maxLength={1000} rows={4} placeholder="Aplicación, explicación o pregunta para estudiar" className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-violet-500" />
                  </label>
                  <button type="submit" disabled={isPending} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white disabled:opacity-60">
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookHeart className="h-4 w-4" />}
                    {isPending ? 'Agregando…' : 'Agregar a la guía'}
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  )
}
