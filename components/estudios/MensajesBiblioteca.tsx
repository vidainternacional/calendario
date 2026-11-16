'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Grid2X2, List, Play, Search, Video, Users } from 'lucide-react'
import type { MensajeVisible } from '@/lib/estudios/mensajes-semanales'

type Vista = 'cuadricula' | 'lista'
type Categoria = 'todos' | 'mensajes'

function imagenVideo(url: string) {
  const id = /[?&]v=([A-Za-z0-9_-]{11})(?:[&#]|$)/.exec(url)?.[1]
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null
}

function fechaCorta(fecha: string | null) {
  if (!fecha) return ''
  const time = new Date(fecha)
  return Number.isNaN(time.getTime()) ? '' : new Intl.DateTimeFormat('es-SV', { day: 'numeric', month: 'short', timeZone: 'America/El_Salvador' }).format(time)
}

export default function MensajesBiblioteca({ mensajes, pagina, desdePastoral = false }: { mensajes: MensajeVisible[]; pagina: number; desdePastoral?: boolean }) {
  const [vista, setVista] = useState<Vista>('cuadricula')
  const [categoria, setCategoria] = useState<Categoria>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [autor, setAutor] = useState('todos')
  const [orden, setOrden] = useState<'recientes' | 'antiguos'>('recientes')
  const autores = useMemo(() => [...new Set(mensajes.map(m => m.autor).filter(Boolean))].sort((a,b) => a.localeCompare(b,'es')), [mensajes])
  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase('es')
    return mensajes.filter(m => {
      if (autor !== 'todos' && m.autor !== autor) return false
      if (termino && ![m.titulo, m.descripcion, m.autor].some(texto => texto.toLocaleLowerCase('es').includes(termino))) return false
      // Todos los registros actuales pertenecen al único tipo almacenado: mensajes semanales.
      // Devocionales y series requieren su propia clasificación persistente antes de habilitar el filtro.
      return categoria === 'todos' || categoria === 'mensajes'
    }).sort((a, b) => {
      const n = (b.fecha || '').localeCompare(a.fecha || '')
      return orden === 'recientes' ? n : -n
    })
  }, [mensajes, autor, busqueda, categoria, orden])

  return <section className="mt-7" aria-label="Biblioteca de videos">
    <div className="border-b border-slate-200 pb-4">
      <h2 className="text-sm font-bold text-slate-900">Explorar por categoría</h2>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Categorías de la biblioteca">
        <button type="button" aria-pressed={categoria === 'todos'} onClick={() => setCategoria('todos')}
          className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-semibold ${categoria === 'todos' ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>Todos</button>
        <button type="button" aria-pressed={categoria === 'mensajes'} onClick={() => setCategoria('mensajes')}
          className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-semibold ${categoria === 'mensajes' ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>Mensajes</button>
        <span title="Pendiente de habilitar la clasificación al publicar" className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-slate-200 bg-slate-100 px-4 text-xs font-medium text-slate-400">Devocionales · Próximamente</span>
        <span title="Pendiente de habilitar las series" className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-slate-200 bg-slate-100 px-4 text-xs font-medium text-slate-400">Series · Próximamente</span>
      </div>
    </div>

    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900">Publicaciones</p>
        <p className="mt-0.5 text-xs text-slate-500">Ordenadas para que encontrés el video que buscás.</p>
      </div>
      <div className="inline-flex shrink-0 gap-1 rounded-xl border border-slate-200 bg-white p-1" role="group" aria-label="Vista de videos">
        <button type="button" aria-label="Vista de cuadrícula" aria-pressed={vista === 'cuadricula'} onClick={() => setVista('cuadricula')}
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${vista === 'cuadricula' ? 'bg-violet-700 text-white' : 'text-slate-600'}`}><Grid2X2 className="h-5 w-5" /></button>
        <button type="button" aria-label="Vista de lista" aria-pressed={vista === 'lista'} onClick={() => setVista('lista')}
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${vista === 'lista' ? 'bg-violet-700 text-white' : 'text-slate-600'}`}><List className="h-5 w-5" /></button>
      </div>
    </div>

    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      <label className="relative block flex-1">
        <span className="sr-only">Buscar en los videos de esta página</span>
        <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
        <input type="search" value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar en esta página" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-violet-500" />
      </label>
      {autores.length > 1 && <label className="relative">
        <span className="sr-only">Filtrar por autor</span>
        <Users className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
        <select value={autor} onChange={e => setAutor(e.target.value)} aria-label="Filtrar por autor"
          className="min-h-11 max-w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-8 text-sm text-slate-800">
          <option value="todos">Todos los pastores</option>
          {autores.map(nombre => <option key={nombre} value={nombre}>{nombre}</option>)}
        </select>
      </label>}
      <select value={orden} onChange={e => setOrden(e.target.value === 'antiguos' ? 'antiguos' : 'recientes')} aria-label="Ordenar publicaciones"
        className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800">
        <option value="recientes">Más recientes</option>
        <option value="antiguos">Más antiguos</option>
      </select>
    </div>

    {filtrados.length === 0
      ? <div className="py-12 text-center">
          <Video className="mx-auto h-9 w-9 text-slate-400" aria-hidden="true" />
          <h3 className="mt-4 font-bold text-slate-800">{mensajes.length === 0 ? (pagina === 1 ? 'Todavía no hay videos publicados' : 'No hay más publicaciones en esta página') : 'No encontramos videos con esos filtros'}</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{mensajes.length === 0 ? 'Cuando se publiquen devocionales o mensajes, los encontrarás aquí para verlos en lista o cuadrícula.' : 'Probá otra búsqueda o seleccioná Todos.'}</p>
        </div>
      : <div className={vista === 'cuadricula' ? 'mt-5 grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5' : 'mt-5 divide-y divide-slate-200'}>
          {filtrados.map(m => {
            const miniatura = imagenVideo(m.videoUrl)
            return <article key={m.id} className={vista === 'lista' ? 'py-4' : ''}>
              <Link href={`/estudios/mensajes/${m.id}${desdePastoral ? "?origen=pastoral" : ""}`} className={vista === 'lista' ? 'group flex min-h-28 gap-3 sm:gap-4' : 'group block'}>
                <div className={`relative shrink-0 overflow-hidden rounded-xl bg-slate-800 ${vista === 'lista' ? 'w-[42%] max-w-48 self-start' : 'w-full'} aspect-video`}>
                  {miniatura && <img src={miniatura} alt="" loading="lazy" className="h-full w-full object-cover" />}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/10"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/65 text-white"><Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true" /></span></span>
                </div>
                <div className={vista === 'lista' ? 'min-w-0 flex-1 py-0.5' : 'pt-2.5'}>
                  <h3 className={`break-words font-bold leading-snug text-slate-900 group-hover:text-violet-700 ${vista === 'lista' ? 'text-base' : 'text-sm'}`}>{m.titulo}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{m.autor}{m.fecha ? ` · ${fechaCorta(m.fecha)}` : ''}</p>
                  {vista === 'lista' && m.descripcion && <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600">{m.descripcion}</p>}
                  {vista === 'lista' && <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-violet-700">Ver video <ChevronRight className="h-4 w-4" aria-hidden="true" /></span>}
                </div>
              </Link>
            </article>
          })}
        </div>}
    {mensajes.length > 0 && <p className="mt-4 text-xs text-slate-500">La búsqueda y los filtros se aplican a los videos de esta página.</p>}
  </section>
}
