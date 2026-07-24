'use client'

import { useMemo, useState, useTransition } from 'react'
import { ExternalLink, FileText, FolderOpen, Link2, Loader2, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react'
import {
  crearEnlaceBibliotecaPastoral,
  editarRecursoBibliotecaPastoral,
  eliminarRecursoBibliotecaPastoral,
  subirArchivoBibliotecaPastoral,
} from '@/app/actions/pastoral-biblioteca'
import { mostrarToast } from '@/lib/ui/toast'

type Recurso = {
  id: string
  titulo: string
  descripcion: string
  categoria: string
  etiquetas: string[]
  tipo: 'enlace' | 'archivo'
  url: string | null
  signed_url: string | null
  nombre_archivo: string | null
  mime_type: string | null
  tamano_bytes: number | null
  updated_at: string
}

const categorias = [
  ['todos', 'Todos'], ['predica', 'Prédicas'], ['estudio', 'Estudios'], ['liderazgo', 'Liderazgo'],
  ['consejeria', 'Consejería'], ['multimedia', 'Multimedia'], ['administrativo', 'Administrativo'], ['otro', 'Otros'],
]

const categoriaLabel = (valor: string) => categorias.find(([id]) => id === valor)?.[1] ?? 'Otros'
const formatoTamano = (bytes: number | null) => {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function BibliotecaPastoralClient({ recursos }: { recursos: Recurso[] }) {
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('todos')
  const [modal, setModal] = useState<'enlace' | 'archivo' | null>(null)
  const [editando, setEditando] = useState<Recurso | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return recursos.filter((recurso) => {
      const coincideCategoria = categoria === 'todos' || recurso.categoria === categoria
      const contenido = [recurso.titulo, recurso.descripcion, recurso.categoria, ...(recurso.etiquetas ?? [])].join(' ').toLowerCase()
      return coincideCategoria && (!texto || contenido.includes(texto))
    })
  }, [recursos, busqueda, categoria])

  const ejecutar = (accion: (formData: FormData) => Promise<{ success: boolean; error?: string }>, formData: FormData, mensaje: string) => {
    startTransition(async () => {
      const resultado = await accion(formData)
      mostrarToast(resultado.success ? mensaje : resultado.error)
      if (resultado.success) {
        setModal(null)
        setEditando(null)
        window.location.reload()
      }
    })
  }

  const eliminar = (recurso: Recurso) => {
    if (!window.confirm(`¿Eliminar “${recurso.titulo}”?`)) return
    startTransition(async () => {
      const resultado = await eliminarRecursoBibliotecaPastoral(recurso.id)
      mostrarToast(resultado.success ? 'Recurso eliminado' : resultado.error)
      if (resultado.success) window.location.reload()
    })
  }

  return (
    <>
      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por título, descripción o etiqueta" className="min-h-12 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-base outline-none focus:ring-2 focus:ring-indigo-500" />
          </label>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button onClick={() => setModal('enlace')} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-bold text-indigo-700"><Link2 className="h-4 w-4" /> Enlace</button>
            <button onClick={() => setModal('archivo')} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white"><Upload className="h-4 w-4" /> Archivo</button>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {categorias.map(([id, label]) => (
            <button key={id} onClick={() => setCategoria(id)} className={`min-h-10 shrink-0 rounded-full px-4 text-xs font-bold ${categoria === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{label}</button>
          ))}
        </div>
      </section>

      {filtrados.length === 0 ? (
        <section className="mt-5 rounded-[24px] border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12">
          <FolderOpen className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-4 text-lg font-bold text-slate-900">No hay recursos para mostrar</h2>
          <p className="mt-2 text-sm text-slate-500">Agrega un archivo o enlace, o cambia los filtros de búsqueda.</p>
        </section>
      ) : (
        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((recurso) => {
            const destino = recurso.tipo === 'enlace' ? recurso.url : recurso.signed_url
            return (
              <article key={recurso.id} className="flex min-h-[250px] flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${recurso.tipo === 'archivo' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'}`}>
                    {recurso.tipo === 'archivo' ? <FileText className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">{categoriaLabel(recurso.categoria)}</span>
                </div>
                <h2 className="mt-4 text-lg font-bold leading-snug text-slate-950">{recurso.titulo}</h2>
                {recurso.descripcion && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{recurso.descripcion}</p>}
                {recurso.etiquetas?.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{recurso.etiquetas.map((etiqueta) => <span key={etiqueta} className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">#{etiqueta}</span>)}</div>}
                <div className="mt-auto pt-5">
                  {recurso.tipo === 'archivo' && <p className="mb-3 truncate text-xs text-slate-400">{recurso.nombre_archivo} {formatoTamano(recurso.tamano_bytes) && `· ${formatoTamano(recurso.tamano_bytes)}`}</p>}
                  <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                    <a href={destino ?? '#'} target="_blank" rel="noreferrer" className={`flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white ${!destino ? 'pointer-events-none opacity-40' : ''}`}><ExternalLink className="h-4 w-4" /> Abrir</a>
                    <button onClick={() => setEditando(recurso)} aria-label={`Editar ${recurso.titulo}`} className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => eliminar(recurso)} aria-label={`Eliminar ${recurso.titulo}`} className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      )}

      {(modal || editando) && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-[28px] sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Biblioteca pastoral</p><h2 className="mt-2 text-xl font-bold text-slate-950">{editando ? 'Editar recurso' : modal === 'archivo' ? 'Subir archivo' : 'Guardar enlace'}</h2></div>
              <button onClick={() => { setModal(null); setEditando(null) }} className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form action={(formData) => {
              if (editando) ejecutar((datos) => editarRecursoBibliotecaPastoral(editando.id, datos), formData, 'Recurso actualizado')
              else if (modal === 'archivo') ejecutar(subirArchivoBibliotecaPastoral, formData, 'Archivo guardado')
              else ejecutar(crearEnlaceBibliotecaPastoral, formData, 'Enlace guardado')
            }} className="mt-6 space-y-4">
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Título</span><input name="titulo" defaultValue={editando?.titulo ?? ''} required maxLength={140} className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base" /></label>
              {(modal === 'enlace' || editando?.tipo === 'enlace') && <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Enlace</span><input name="url" type="url" defaultValue={editando?.url ?? ''} required placeholder="https://" className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base" /></label>}
              {modal === 'archivo' && !editando && <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Archivo · máximo 25 MB</span><input name="archivo" type="file" required className="block min-h-12 w-full rounded-xl border border-dashed border-slate-300 p-3 text-sm" /></label>}
              <div className="grid gap-4 sm:grid-cols-2">
                <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Categoría</span><select name="categoria" defaultValue={editando?.categoria ?? 'otro'} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base">{categorias.filter(([id]) => id !== 'todos').map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
                <label><span className="mb-1.5 block text-xs font-bold text-slate-700">Etiquetas</span><input name="etiquetas" defaultValue={editando?.etiquetas?.join(', ') ?? ''} placeholder="fe, liderazgo, jóvenes" className="min-h-12 w-full rounded-xl border border-slate-200 px-3 text-base" /></label>
              </div>
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Descripción</span><textarea name="descripcion" defaultValue={editando?.descripcion ?? ''} maxLength={1200} rows={5} className="w-full rounded-xl border border-slate-200 p-3 text-base leading-6" /></label>
              <button type="submit" disabled={isPending} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white disabled:opacity-60">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{isPending ? 'Guardando…' : editando ? 'Guardar cambios' : 'Agregar a la biblioteca'}</button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}