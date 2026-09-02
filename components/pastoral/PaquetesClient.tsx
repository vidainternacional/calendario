'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, ChevronRight, Image as ImageIcon, LayoutGrid, List, Loader2, Search, Trash2, X } from 'lucide-react'
import { crearPaquetePastoral, eliminarPaquetePastoral } from '@/app/actions/pastoral-paquetes'
import { mostrarToast } from '@/lib/ui/toast'

type DiapositivaResumen = {
  titulo?: string
  fondo?: string
}

type Paquete = {
  id: string
  titulo: string
  descripcion_publica: string
  estado: 'borrador' | 'listo' | 'compartido'
  publicado: boolean
  public_slug?: string | null
  presentacion_diapositivas?: DiapositivaResumen[]
  updated_at: string
}

type Filtro = 'todos' | 'borradores' | 'listos' | 'no-publicados' | 'publicados'
type Vista = 'tarjetas' | 'lista' | 'miniaturas'

const FILTROS: Array<{ id: Filtro; label: string }> = [
  { id: 'todos', label: 'Todos' },
  { id: 'borradores', label: 'Borradores' },
  { id: 'listos', label: 'Listos' },
  { id: 'no-publicados', label: 'No publicados' },
  { id: 'publicados', label: 'Publicados' },
]

function coincideFiltro(paquete: Paquete, filtro: Filtro) {
  if (filtro === 'borradores') return paquete.estado === 'borrador' && !paquete.publicado
  if (filtro === 'listos') return paquete.estado === 'listo' && !paquete.publicado
  if (filtro === 'no-publicados') return !paquete.publicado
  if (filtro === 'publicados') return paquete.publicado
  return true
}

function etiquetaEstado(paquete: Paquete) {
  if (paquete.publicado) return 'Publicado'
  if (paquete.estado === 'listo') return 'Listo'
  if (paquete.estado === 'compartido') return 'Compartido'
  return 'Borrador'
}

function fondoMiniatura(paquete: Paquete) {
  const fondo = String(paquete.presentacion_diapositivas?.[0]?.fondo ?? '').trim()
  if (/^(#[0-9a-f]{3,8}|rgba?\(|hsla?\(|(?:linear|radial|conic|repeating-linear)-gradient\()/i.test(fondo)) return fondo
  return '#e2e8f0'
}

export default function PaquetesClient({ paquetes, abrirNuevo = false, filtroInicial = 'todos' }: { paquetes: Paquete[]; abrirNuevo?: boolean; filtroInicial?: Filtro }) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<Filtro>(filtroInicial)
  const [vista, setVista] = useState<Vista>('tarjetas')
  const [mostrarFormulario, setMostrarFormulario] = useState(abrirNuevo)
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [isPending, startTransition] = useTransition()

  const termino = busqueda.trim().toLowerCase()
  const filtrados = useMemo(() => paquetes.filter((paquete) => {
    if (!coincideFiltro(paquete, filtro)) return false
    if (!termino) return true
    return `${paquete.titulo} ${paquete.descripcion_publica ?? ''}`.toLowerCase().includes(termino)
  }), [filtro, paquetes, termino])

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

  const cerrarNuevo = () => {
    setMostrarFormulario(false)
    router.replace('/pastoral/paquetes')
  }

  if (mostrarFormulario) {
    return (
      <form action={crear} className="py-4">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-violet-600">Nuevo proyecto</p>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-950">Información del proyecto</h2>
            <p className="mt-1 text-sm text-slate-500">Crea la base. El contenido, versículos, diseño y presentación se preparan dentro del proyecto.</p>
          </div>
          <button type="button" onClick={cerrarNuevo} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500" aria-label="Cerrar"><X className="h-5 w-5" /></button>
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
    )
  }

  return (
    <div className="pastoral-project-workspace pb-4">
      <div className="flex min-h-12 items-center gap-2 border-b border-slate-200">
        <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        <input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar proyecto" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" />
        {busqueda && <button type="button" onClick={() => setBusqueda('')} className="flex h-10 w-10 items-center justify-center" aria-label="Limpiar búsqueda"><X className="h-4 w-4 text-slate-400" /></button>}
      </div>

      <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Filtros de proyectos">
        {FILTROS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFiltro(item.id)}
            className={`min-h-10 shrink-0 rounded-full px-4 text-xs font-bold transition ${filtro === item.id ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
            aria-pressed={filtro === item.id}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-500">{filtrados.length} proyecto{filtrados.length === 1 ? '' : 's'}</p>
        <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1" aria-label="Vista de proyectos">
          <button type="button" onClick={() => setVista('tarjetas')} className={`grid h-9 w-9 place-items-center rounded-lg ${vista === 'tarjetas' ? 'bg-violet-50 text-violet-700' : 'text-slate-400'}`} aria-label="Vista de tarjetas" aria-pressed={vista === 'tarjetas'}><LayoutGrid className="h-4 w-4" /></button>
          <button type="button" onClick={() => setVista('lista')} className={`grid h-9 w-9 place-items-center rounded-lg ${vista === 'lista' ? 'bg-violet-50 text-violet-700' : 'text-slate-400'}`} aria-label="Vista de lista" aria-pressed={vista === 'lista'}><List className="h-4 w-4" /></button>
          <button type="button" onClick={() => setVista('miniaturas')} className={`grid h-9 w-9 place-items-center rounded-lg ${vista === 'miniaturas' ? 'bg-violet-50 text-violet-700' : 'text-slate-400'}`} aria-label="Vista de miniaturas" aria-pressed={vista === 'miniaturas'}><ImageIcon className="h-4 w-4" /></button>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">No hay proyectos para mostrar con este filtro.</p>
      ) : vista === 'lista' ? (
        <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
          {filtrados.map((paquete) => (
            <div key={paquete.id} className="flex min-h-[66px] items-center gap-2 py-2">
              <Link href={`/pastoral/paquetes/${paquete.id}`} className="min-w-0 flex-1 py-2">
                <strong className="block truncate text-sm text-slate-900">{paquete.titulo}</strong>
                <small className="mt-1 block text-xs text-slate-500">{etiquetaEstado(paquete)}</small>
              </Link>
              <button type="button" onClick={() => eliminar(paquete.id)} disabled={isPending} className="flex h-10 w-10 items-center justify-center rounded-full text-rose-500" aria-label={`Eliminar ${paquete.titulo}`}><Trash2 className="h-4 w-4" /></button>
              <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
            </div>
          ))}
        </div>
      ) : vista === 'miniaturas' ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtrados.map((paquete) => (
            <article key={paquete.id} className="min-w-0">
              <Link href={`/pastoral/paquetes/${paquete.id}`} className="block overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <span className="relative block aspect-video overflow-hidden" style={{ background: fondoMiniatura(paquete) }}>
                  <span className="absolute inset-x-2 bottom-2 rounded-lg bg-black/45 px-2 py-1.5 text-[10px] font-bold leading-tight text-white backdrop-blur-sm">
                    {paquete.presentacion_diapositivas?.[0]?.titulo?.trim() || paquete.titulo}
                  </span>
                </span>
                <span className="block px-3 py-2.5">
                  <strong className="block truncate text-xs text-slate-900">{paquete.titulo}</strong>
                  <small className="mt-1 block text-[10px] font-semibold text-slate-500">{etiquetaEstado(paquete)}</small>
                </span>
              </Link>
              <button type="button" onClick={() => eliminar(paquete.id)} disabled={isPending} className="mt-1 flex min-h-9 w-full items-center justify-center gap-1 text-[10px] font-bold text-rose-500" aria-label={`Eliminar ${paquete.titulo}`}><Trash2 className="h-3.5 w-3.5" /> Eliminar</button>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((paquete) => (
            <article key={paquete.id} className="flex min-h-[170px] flex-col rounded-2xl border border-slate-200 bg-white p-4">
              <Link href={`/pastoral/paquetes/${paquete.id}`} className="min-w-0 flex-1">
                <span className="text-[10px] font-extrabold uppercase tracking-[.14em] text-violet-600">{etiquetaEstado(paquete)}</span>
                <strong className="mt-2 block line-clamp-2 text-base text-slate-950">{paquete.titulo}</strong>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">{paquete.descripcion_publica || 'Sin descripción.'}</p>
              </Link>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                <Link href={`/pastoral/paquetes/${paquete.id}`} className="flex min-h-10 items-center gap-1 text-xs font-bold text-violet-700">Abrir <ChevronRight className="h-3.5 w-3.5" /></Link>
                <button type="button" onClick={() => eliminar(paquete.id)} disabled={isPending} className="flex h-10 w-10 items-center justify-center rounded-full text-rose-500" aria-label={`Eliminar ${paquete.titulo}`}><Trash2 className="h-4 w-4" /></button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
