'use client'

import { useMemo, useState, useTransition } from 'react'
import { Copy, Edit3, Loader2, Mail, Plus, Printer, Share2, Trash2, X } from 'lucide-react'
import {
  agregarVersiculoPastoral,
  editarColeccionPastoral,
  eliminarVersiculoPastoral,
} from '@/app/actions/pastoral'
import { mostrarToast } from '@/lib/ui/toast'

export type ColeccionDetalle = {
  id: string
  nombre: string
  descripcion: string
  color: string
  versiculos: Array<{
    id: string
    traduccion: string
    libro_nombre: string
    capitulo: number
    verso: number
    texto: string
    nota: string
  }>
}

const colores = ['indigo', 'violet', 'amber', 'emerald', 'rose', 'sky']

export default function ColeccionDetalleClient({ coleccion }: { coleccion: ColeccionDetalle }) {
  const [editarAbierto, setEditarAbierto] = useState(false)
  const [versiculoAbierto, setVersiculoAbierto] = useState(false)
  const [isPending, startTransition] = useTransition()

  const contenidoTexto = useMemo(() => {
    const encabezado = [coleccion.nombre, coleccion.descripcion].filter(Boolean).join('\n\n')
    const cuerpo = coleccion.versiculos.map((item, index) => {
      const referencia = `${item.libro_nombre} ${item.capitulo}:${item.verso}`
      return `${index + 1}. ${referencia}\n“${item.texto}”${item.nota ? `\nNota pastoral: ${item.nota}` : ''}`
    }).join('\n\n')
    return `${encabezado}${cuerpo ? `\n\n${cuerpo}` : ''}\n\nVida Internacional`
  }, [coleccion])

  const editar = (formData: FormData) => {
    startTransition(async () => {
      const result = await editarColeccionPastoral(coleccion.id, formData)
      mostrarToast(result.success ? 'Colección actualizada' : result.error)
      if (result.success) setEditarAbierto(false)
    })
  }

  const agregar = (formData: FormData) => {
    startTransition(async () => {
      const result = await agregarVersiculoPastoral(coleccion.id, formData)
      mostrarToast(result.success ? 'Versículo agregado' : result.error)
      if (result.success) setVersiculoAbierto(false)
    })
  }

  const eliminar = (id: string, referencia: string) => {
    if (!confirm(`¿Quitar ${referencia} de esta colección?`)) return
    startTransition(async () => {
      const result = await eliminarVersiculoPastoral(id, coleccion.id)
      mostrarToast(result.success ? 'Versículo eliminado' : result.error)
    })
  }

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(contenidoTexto)
      mostrarToast('Paquete copiado')
    } catch {
      mostrarToast('No se pudo copiar el contenido')
    }
  }

  const compartir = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: coleccion.nombre, text: contenidoTexto })
      } else {
        await copiar()
      }
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') mostrarToast('No se pudo compartir')
    }
  }

  const correo = () => {
    const asunto = encodeURIComponent(`Material de apoyo: ${coleccion.nombre}`)
    const cuerpo = encodeURIComponent(contenidoTexto)
    window.location.href = `mailto:?subject=${asunto}&body=${cuerpo}`
  }

  return (
    <>
      <section className="print:hidden grid grid-cols-2 gap-2 sm:grid-cols-5">
        <button type="button" onClick={() => setEditarAbierto(true)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700">
          <Edit3 className="h-4 w-4" /> Editar
        </button>
        <button type="button" onClick={() => setVersiculoAbierto(true)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 text-xs font-semibold text-white sm:col-span-1">
          <Plus className="h-4 w-4" /> Versículo
        </button>
        <button type="button" onClick={() => window.print()} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700">
          <Printer className="h-4 w-4" /> Imprimir
        </button>
        <button type="button" onClick={copiar} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700">
          <Copy className="h-4 w-4" /> Copiar
        </button>
        <button type="button" onClick={compartir} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700">
          <Share2 className="h-4 w-4" /> Compartir
        </button>
      </section>

      <button type="button" onClick={correo} className="print:hidden mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white">
        <Mail className="h-4 w-4" /> Preparar correo con esta guía
      </button>

      <article className="pastoral-print mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <header className="border-b border-slate-200 pb-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Vida Internacional</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{coleccion.nombre}</h1>
          {coleccion.descripcion && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{coleccion.descripcion}</p>}
        </header>

        {coleccion.versiculos.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-semibold text-slate-800">Esta guía todavía no tiene versículos</p>
            <p className="mt-1 text-sm text-slate-500">Agrega el primer pasaje para comenzar a preparar el paquete.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {coleccion.versiculos.map((item, index) => {
              const referencia = `${item.libro_nombre} ${item.capitulo}:${item.verso}`
              return (
                <section key={item.id} className="break-inside-avoid rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Pasaje {index + 1}</p>
                      <h2 className="mt-1 font-bold text-indigo-700">{referencia}</h2>
                      <p className="mt-0.5 text-[11px] text-slate-400">{item.traduccion}</p>
                    </div>
                    <button type="button" onClick={() => eliminar(item.id, referencia)} disabled={isPending} className="print:hidden flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-500" aria-label={`Eliminar ${referencia}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <blockquote className="mt-4 text-base leading-7 text-slate-800">“{item.texto}”</blockquote>
                  {item.nota && (
                    <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Nota pastoral</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-amber-900">{item.nota}</p>
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </article>

      {editarAbierto && (
        <div className="modal-overlay-safe bg-black/55" onClick={(event) => { if (event.target === event.currentTarget) setEditarAbierto(false) }}>
          <section className="modal-panel-safe rounded-3xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="editar-coleccion-title">
            <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 id="editar-coleccion-title" className="font-bold text-slate-900">Editar colección</h2>
              <button type="button" onClick={() => setEditarAbierto(false)} className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600" aria-label="Cerrar"><X className="h-5 w-5" /></button>
            </header>
            <form action={editar} className="modal-body-safe space-y-4 p-5">
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Nombre</span><input name="nombre" defaultValue={coleccion.nombre} required maxLength={80} className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Introducción o propósito</span><textarea name="descripcion" defaultValue={coleccion.descripcion} maxLength={500} rows={5} className="w-full rounded-xl border border-slate-200 p-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" /></label>
              <fieldset><legend className="mb-2 text-xs font-bold text-slate-700">Color</legend><div className="grid grid-cols-3 gap-2">{colores.map((color) => <label key={color}><input type="radio" name="color" value={color} defaultChecked={coleccion.color === color} className="peer sr-only" /><span className="flex min-h-11 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold capitalize peer-checked:bg-indigo-600 peer-checked:text-white">{color}</span></label>)}</div></fieldset>
              <button type="submit" disabled={isPending} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white">{isPending && <Loader2 className="h-4 w-4 animate-spin" />} Guardar cambios</button>
            </form>
          </section>
        </div>
      )}

      {versiculoAbierto && (
        <div className="modal-overlay-safe bg-black/55" onClick={(event) => { if (event.target === event.currentTarget) setVersiculoAbierto(false) }}>
          <section className="modal-panel-safe rounded-3xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="agregar-versiculo-title">
            <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 id="agregar-versiculo-title" className="font-bold text-slate-900">Agregar versículo</h2><p className="mt-0.5 text-xs text-slate-500">Después se integrará directamente con el lector bíblico.</p></div><button type="button" onClick={() => setVersiculoAbierto(false)} className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600" aria-label="Cerrar"><X className="h-5 w-5" /></button></header>
            <form action={agregar} className="modal-body-safe space-y-4 p-5">
              <div className="grid grid-cols-2 gap-3"><label className="col-span-2 block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Libro</span><input name="libro_nombre" required placeholder="Ej. Juan" className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-900" /></label><label><span className="mb-1.5 block text-xs font-bold text-slate-700">Capítulo</span><input name="capitulo" type="number" min="1" required className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-900" /></label><label><span className="mb-1.5 block text-xs font-bold text-slate-700">Versículo</span><input name="verso" type="number" min="1" required className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-900" /></label></div>
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Traducción</span><input name="traduccion" placeholder="Ej. RVR1960" className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-900" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Texto</span><textarea name="texto" required maxLength={2000} rows={5} className="w-full rounded-xl border border-slate-200 p-3 text-base text-slate-900" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Nota pastoral opcional</span><textarea name="nota" maxLength={1000} rows={4} placeholder="Aplicación, explicación o pregunta para estudiar" className="w-full rounded-xl border border-slate-200 p-3 text-base text-slate-900" /></label>
              <button type="submit" disabled={isPending} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {isPending ? 'Agregando…' : 'Agregar a la guía'}</button>
            </form>
          </section>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body { background: white !important; color: #111827 !important; }
          .app-bottom-nav { display: none !important; }
          main { padding: 0 !important; max-width: none !important; background: white !important; }
          .pastoral-print { border: 0 !important; box-shadow: none !important; margin: 0 !important; padding: 0 !important; }
          @page { margin: 16mm; }
        }
      `}</style>
    </>
  )
}
