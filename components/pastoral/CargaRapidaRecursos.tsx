'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FileUp, Link2, Loader2, Plus, X } from 'lucide-react'
import {
  crearEnlaceBibliotecaPastoral,
  subirArchivoBibliotecaPastoral,
} from '@/app/actions/pastoral-biblioteca'
import { mostrarToast } from '@/lib/ui/toast'

type Modo = 'cerrado' | 'archivo' | 'enlace'

const categorias = [
  ['predica', 'Prédica'],
  ['estudio', 'Estudio'],
  ['liderazgo', 'Liderazgo'],
  ['consejeria', 'Consejería'],
  ['multimedia', 'Multimedia'],
  ['administrativo', 'Administrativo'],
  ['otro', 'Otro'],
]

export default function CargaRapidaRecursos() {
  const router = useRouter()
  const formularioRef = useRef<HTMLFormElement>(null)
  const [modo, setModo] = useState<Modo>('cerrado')
  const [isPending, startTransition] = useTransition()

  const enviar = (formData: FormData) => {
    startTransition(async () => {
      const resultado = modo === 'archivo'
        ? await subirArchivoBibliotecaPastoral(formData)
        : await crearEnlaceBibliotecaPastoral(formData)

      if (!resultado.success) {
        mostrarToast(resultado.error)
        return
      }

      mostrarToast(modo === 'archivo' ? 'Recurso subido' : 'Enlace agregado')
      formularioRef.current?.reset()
      setModo('cerrado')
      router.refresh()
    })
  }

  return (
    <section className="print:hidden mb-5 rounded-[22px] border border-indigo-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Recursos del paquete</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">Agregar material sin salir de Preparar</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">Suba una imagen, PDF u otro archivo, o agregue un enlace. También quedará guardado en la Biblioteca Pastoral.</p>
        </div>
        {modo === 'cerrado' && (
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button type="button" onClick={() => setModo('archivo')} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white">
              <FileUp className="h-4 w-4" /> Subir archivo
            </button>
            <button type="button" onClick={() => setModo('enlace')} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700">
              <Link2 className="h-4 w-4" /> Agregar enlace
            </button>
          </div>
        )}
      </div>

      {modo !== 'cerrado' && (
        <form ref={formularioRef} action={enviar} className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-900">
              {modo === 'archivo' ? <FileUp className="h-5 w-5 text-indigo-600" /> : <Link2 className="h-5 w-5 text-indigo-600" />}
              <h3 className="font-bold">{modo === 'archivo' ? 'Subir archivo nuevo' : 'Agregar enlace nuevo'}</h3>
            </div>
            <button type="button" onClick={() => setModo('cerrado')} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm" aria-label="Cerrar">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">Título del recurso</span>
              <input name="titulo" required maxLength={140} placeholder="Ejemplo: Imagen de portada" className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400" />
            </label>

            {modo === 'archivo' ? (
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">Archivo</span>
                <input name="archivo" type="file" required accept="image/*,application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.mp3,.mp4" className="block min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:font-semibold file:text-indigo-700" />
                <span className="mt-1.5 block text-xs text-slate-500">Máximo 25 MB. Imágenes, PDF, documentos, presentaciones, audio o video.</span>
              </label>
            ) : (
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">Dirección del enlace</span>
                <input name="url" type="url" required placeholder="https://..." className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400" />
              </label>
            )}

            <label>
              <span className="mb-1.5 block text-xs font-bold text-slate-700">Categoría</span>
              <select name="categoria" defaultValue={modo === 'archivo' ? 'multimedia' : 'estudio'} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900">
                {categorias.map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
              </select>
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-bold text-slate-700">Etiquetas</span>
              <input name="etiquetas" maxLength={500} placeholder="familia, oración, portada" className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400" />
            </label>

            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">Descripción opcional</span>
              <textarea name="descripcion" maxLength={1200} rows={3} placeholder="Explique brevemente para qué sirve este recurso." className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base leading-6 text-slate-900 placeholder:text-slate-400" />
            </label>
          </div>

          <button type="submit" disabled={isPending} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white disabled:opacity-60 sm:w-auto sm:min-w-48">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {isPending ? 'Guardando…' : modo === 'archivo' ? 'Subir recurso' : 'Guardar enlace'}
          </button>
        </form>
      )}
    </section>
  )
}
