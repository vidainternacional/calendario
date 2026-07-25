'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { BookHeart, Check, Loader2, Trash2, X } from 'lucide-react'
import {
  agregarVersiculoAlProyecto,
  eliminarVersiculoDelProyecto,
  obtenerVersiculosDelProyecto,
} from '@/app/actions/pastoral-proyecto-versiculos'
import { mostrarToast } from '@/lib/ui/toast'

type VersiculoSeleccionado = {
  libro: string
  capitulo: number
  verso: number
  texto: string
  traduccion: string
}

type VersiculoProyecto = {
  id: string
  referencia: string
  texto: string
  traduccion: string
  nota: string
}

function paqueteDesdeReferrer() {
  try {
    const pathname = new URL(document.referrer).pathname
    return pathname.match(/^\/pastoral\/paquetes\/([0-9a-f-]{36})/i)?.[1] ?? ''
  } catch {
    return ''
  }
}

function limpiarTexto(parrafo: HTMLParagraphElement, verso: number) {
  const clon = parrafo.cloneNode(true) as HTMLParagraphElement
  clon.querySelectorAll('sup, svg').forEach((elemento) => elemento.remove())
  return clon.textContent?.trim().replace(new RegExp(`^${verso}\\s*`), '') ?? ''
}

function leerSeleccion(parrafo: HTMLParagraphElement): VersiculoSeleccionado | null {
  const numero = Number(parrafo.querySelector('sup')?.textContent?.trim())
  if (!Number.isInteger(numero) || numero < 1) return null

  const selects = Array.from(document.querySelectorAll('main select')) as HTMLSelectElement[]
  if (selects.length < 3) return null

  const libro = selects[1]?.selectedOptions[0]?.textContent?.trim() ?? ''
  const capitulo = Number((selects[2]?.selectedOptions[0]?.textContent ?? '').match(/\d+/)?.[0])
  const traduccion = selects[0]?.selectedOptions[0]?.textContent?.trim() ?? 'Biblia'
  const texto = limpiarTexto(parrafo, numero)

  if (!libro || !Number.isInteger(capitulo) || capitulo < 1 || !texto) return null
  return { libro, capitulo, verso: numero, texto, traduccion }
}

export default function BibliaProyectoEnhancer({ paqueteId: paqueteRecibido }: { paqueteId?: string }) {
  const [paqueteId, setPaqueteId] = useState(paqueteRecibido ?? '')
  const [seleccion, setSeleccion] = useState<VersiculoSeleccionado | null>(null)
  const [versiculos, setVersiculos] = useState<VersiculoProyecto[]>([])
  const [cargando, setCargando] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!paqueteId) setPaqueteId(paqueteDesdeReferrer())
  }, [paqueteId])

  const cargarVersiculos = async (id = paqueteId) => {
    if (!id) return
    setCargando(true)
    const resultado: { success: boolean; error?: string; versiculos?: VersiculoProyecto[] } = await obtenerVersiculosDelProyecto(id)
    if (resultado.success) setVersiculos(resultado.versiculos ?? [])
    else mostrarToast(resultado.error ?? 'No se pudieron cargar los versículos')
    setCargando(false)
  }

  useEffect(() => {
    if (paqueteId) void cargarVersiculos(paqueteId)
  }, [paqueteId])

  useEffect(() => {
    const manejarClick = (event: MouseEvent) => {
      const objetivo = event.target as HTMLElement | null
      const parrafo = objetivo?.closest('article p') as HTMLParagraphElement | null
      if (!parrafo || !parrafo.querySelector('sup')) return

      const siguiente = leerSeleccion(parrafo)
      if (!siguiente) return

      document.querySelectorAll('.vida-versiculo-seleccionado').forEach((elemento) => elemento.classList.remove('vida-versiculo-seleccionado'))
      setSeleccion((actual) => {
        const misma = actual && actual.libro === siguiente.libro && actual.capitulo === siguiente.capitulo && actual.verso === siguiente.verso
        if (!misma) parrafo.classList.add('vida-versiculo-seleccionado')
        return misma ? null : siguiente
      })
    }

    document.addEventListener('click', manejarClick)
    return () => document.removeEventListener('click', manejarClick)
  }, [])

  const referencia = useMemo(
    () => seleccion ? `${seleccion.libro} ${seleccion.capitulo}:${seleccion.verso}` : '',
    [seleccion],
  )

  const limpiarSeleccion = () => {
    setSeleccion(null)
    document.querySelectorAll('.vida-versiculo-seleccionado').forEach((elemento) => elemento.classList.remove('vida-versiculo-seleccionado'))
  }

  const agregar = () => {
    if (!seleccion || !paqueteId) return
    const formData = new FormData()
    formData.set('libro_nombre', seleccion.libro)
    formData.set('capitulo', String(seleccion.capitulo))
    formData.set('verso', String(seleccion.verso))
    formData.set('texto', seleccion.texto)
    formData.set('traduccion', seleccion.traduccion)

    startTransition(async () => {
      const resultado: { success: boolean; error?: string } = await agregarVersiculoAlProyecto(paqueteId, formData)
      if (!resultado.success) {
        mostrarToast(resultado.error ?? 'No se pudo agregar el versículo')
        return
      }
      mostrarToast('Versículo agregado al proyecto')
      limpiarSeleccion()
      await cargarVersiculos(paqueteId)
      window.parent.postMessage({ type: 'vida:pastoral-versiculo-agregado' }, window.location.origin)
    })
  }

  const eliminar = (versiculoId: string) => {
    if (!paqueteId) return
    startTransition(async () => {
      const resultado: { success: boolean; error?: string } = await eliminarVersiculoDelProyecto(paqueteId, versiculoId)
      if (!resultado.success) {
        mostrarToast(resultado.error ?? 'No se pudo eliminar el versículo')
        return
      }
      setVersiculos((actuales) => actuales.filter((versiculo) => versiculo.id !== versiculoId))
      mostrarToast('Versículo eliminado del proyecto')
      window.parent.postMessage({ type: 'vida:pastoral-versiculo-eliminado' }, window.location.origin)
    })
  }

  if (!paqueteId) return null

  return (
    <>
      <section className="sticky top-0 z-[80] border-b border-violet-200 bg-white/98 px-3 py-3 shadow-[0_8px_24px_rgba(76,29,149,0.14)] backdrop-blur-xl sm:px-5">
        <div className="mx-auto max-w-5xl">
          {seleccion ? (
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white"><BookHeart className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-violet-950">{referencia}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{seleccion.texto}</p>
                </div>
                <button type="button" onClick={limpiarSeleccion} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-500" aria-label="Cancelar selección"><X className="h-4 w-4" /></button>
              </div>
              <button type="button" onClick={agregar} disabled={isPending} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white disabled:opacity-60">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {isPending ? 'Agregando…' : 'Agregar al proyecto'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl bg-violet-50 px-4 py-3 text-violet-950">
              <BookHeart className="h-5 w-5 shrink-0 text-violet-600" />
              <div>
                <p className="text-sm font-bold">Busque y toque un versículo</p>
                <p className="mt-0.5 text-xs leading-5 text-violet-800/75">Después aparecerá aquí el botón para agregarlo directamente al proyecto.</p>
              </div>
            </div>
          )}

          <details className="mt-2 rounded-2xl border border-slate-200 bg-white">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-bold text-slate-700">
              <span>Versículos agregados ({versiculos.length})</span>
              {cargando && <Loader2 className="h-4 w-4 animate-spin text-violet-600" />}
            </summary>
            <div className="border-t border-slate-100 p-3">
              {!cargando && versiculos.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-center text-xs leading-5 text-slate-500">Todavía no ha agregado versículos a este proyecto.</p>
              ) : (
                <div className="space-y-2">
                  {versiculos.map((versiculo) => (
                    <article key={versiculo.id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-violet-700">{versiculo.referencia}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{versiculo.texto}</p>
                      </div>
                      <button type="button" onClick={() => eliminar(versiculo.id)} disabled={isPending} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 disabled:opacity-50" aria-label={`Eliminar ${versiculo.referencia}`}><Trash2 className="h-4 w-4" /></button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </details>
        </div>
      </section>

      <style jsx global>{`
        article p.vida-versiculo-seleccionado {
          border-radius: 14px !important;
          background: rgba(237, 233, 254, .96) !important;
          box-shadow: 0 0 0 2px rgba(124, 58, 237, .38) !important;
          color: rgb(46, 16, 101) !important;
        }
      `}</style>
    </>
  )
}
