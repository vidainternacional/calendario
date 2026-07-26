'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BookOpen, FileText, Mic2, NotebookPen, Plus, Search, Trash2 } from 'lucide-react'

type TipoNota = 'versiculo' | 'estudio' | 'predicacion' | 'personal'
type ModoBiblia = 'claro' | 'sepia' | 'oscuro'

type NotaBiblica = {
  id: string
  titulo: string
  contenido: string
  tipo: TipoNota
  referencia: string
  paquete: string
  creadaEn: string
  actualizadaEn: string
}

const STORAGE_KEY = 'vida-biblia-notas-v2'
const PREF_KEY = 'vida-biblia-preferencias'

const tipos: Array<{ id: TipoNota; nombre: string; icono: typeof BookOpen }> = [
  { id: 'versiculo', nombre: 'Versículo', icono: BookOpen },
  { id: 'estudio', nombre: 'Estudio', icono: FileText },
  { id: 'predicacion', nombre: 'Predicación', icono: Mic2 },
  { id: 'personal', nombre: 'Personal', icono: NotebookPen },
]

function cargarNotas(): NotaBiblica[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as NotaBiblica[] : []
  } catch {
    return []
  }
}

function cargarTema(): ModoBiblia {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    const modo = raw ? JSON.parse(raw)?.modo : 'claro'
    return ['claro', 'sepia', 'oscuro'].includes(modo) ? modo : 'claro'
  } catch {
    return 'claro'
  }
}

export default function NotasBibliaPage() {
  const [notas, setNotas] = useState<NotaBiblica[]>([])
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<TipoNota | 'todas'>('todas')
  const [modo, setModo] = useState<ModoBiblia>('claro')
  const seleccionada = notas.find((nota) => nota.id === seleccionadaId) ?? null

  useEffect(() => {
    const guardadas = cargarNotas()
    setNotas(guardadas)
    setSeleccionadaId(guardadas[0]?.id ?? null)
    setModo(cargarTema())

    const actualizarTema = (event: Event) => {
      const custom = event as CustomEvent<{ modo?: ModoBiblia }>
      setModo(custom.detail?.modo ?? cargarTema())
    }
    const actualizarDesdeStorage = () => setModo(cargarTema())
    window.addEventListener('vida-biblia-theme', actualizarTema)
    window.addEventListener('storage', actualizarDesdeStorage)
    return () => {
      window.removeEventListener('vida-biblia-theme', actualizarTema)
      window.removeEventListener('storage', actualizarDesdeStorage)
    }
  }, [])

  useEffect(() => {
    if (!notas.length && !seleccionadaId) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notas))
  }, [notas, seleccionadaId])

  const tema = {
    claro: {
      page: 'bg-[#f7f7f4] text-slate-900', panel: 'border-slate-200 bg-white', soft: 'bg-slate-100 text-slate-700', item: 'bg-slate-50', selected: 'bg-violet-50 ring-violet-200', control: 'border-slate-200 bg-white text-slate-900', muted: 'text-slate-500', divider: 'border-slate-200', editor: 'text-slate-900',
    },
    sepia: {
      page: 'bg-[#efe5d0] text-[#382d21]', panel: 'border-[#dac8a5] bg-[#fffaf0]', soft: 'bg-[#ead9b5] text-[#493c2d]', item: 'bg-[#f7ecd5]', selected: 'bg-[#ead9b5] ring-[#c9ad78]', control: 'border-[#cdb991] bg-[#fff8e8] text-[#382d21]', muted: 'text-[#7d6b54]', divider: 'border-[#dac8a5]', editor: 'text-[#382d21]',
    },
    oscuro: {
      page: 'bg-slate-950 text-white', panel: 'border-slate-800 bg-slate-900', soft: 'bg-slate-800 text-slate-100', item: 'bg-slate-800/70', selected: 'bg-violet-950/70 ring-violet-700', control: 'border-slate-700 bg-slate-900 text-white', muted: 'text-slate-400', divider: 'border-slate-800', editor: 'text-slate-100',
    },
  }[modo]

  const notasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    return notas
      .filter((nota) => filtro === 'todas' || nota.tipo === filtro)
      .filter((nota) => !termino || `${nota.titulo} ${nota.contenido} ${nota.referencia} ${nota.paquete}`.toLowerCase().includes(termino))
      .sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn))
  }, [notas, busqueda, filtro])

  const nuevaNota = () => {
    const ahora = new Date().toISOString()
    const nota: NotaBiblica = {
      id: crypto.randomUUID(), titulo: 'Nueva nota', contenido: '', tipo: 'personal', referencia: '', paquete: '', creadaEn: ahora, actualizadaEn: ahora,
    }
    setNotas((actuales) => [nota, ...actuales])
    setSeleccionadaId(nota.id)
  }

  const actualizar = (cambios: Partial<NotaBiblica>) => {
    if (!seleccionadaId) return
    setNotas((actuales) => actuales.map((nota) => nota.id === seleccionadaId
      ? { ...nota, ...cambios, actualizadaEn: new Date().toISOString() }
      : nota))
  }

  const eliminar = () => {
    if (!seleccionadaId) return
    const restantes = notas.filter((nota) => nota.id !== seleccionadaId)
    setNotas(restantes)
    setSeleccionadaId(restantes[0]?.id ?? null)
  }

  return (
    <main className={`min-h-screen px-4 pb-28 pt-[calc(1rem+env(safe-area-inset-top))] transition-colors sm:px-6 ${tema.page}`}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/biblia" aria-label="Volver a la Biblia" className={`grid h-11 w-11 place-items-center rounded-full border ${tema.control}`}><ArrowLeft className="h-5 w-5" /></Link>
            <div><h1 className="text-xl font-bold">Notas bíblicas</h1><p className={`text-xs ${tema.muted}`}>Versículos, estudios y predicaciones</p></div>
          </div>
          <button type="button" onClick={nuevaNota} className="grid h-11 w-11 place-items-center rounded-full bg-violet-600 text-white" aria-label="Nueva nota"><Plus className="h-5 w-5" /></button>
        </header>

        <section className={`overflow-hidden rounded-[26px] border shadow-sm md:grid md:min-h-[680px] md:grid-cols-[320px_1fr] ${tema.panel}`}>
          <aside className={`border-b p-3 md:border-b-0 md:border-r ${tema.divider}`}>
            <label className={`flex min-h-11 items-center gap-2 rounded-2xl px-3 ${tema.soft}`}>
              <Search className={`h-4 w-4 ${tema.muted}`} />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar notas" className="w-full bg-transparent text-sm outline-none placeholder:opacity-60" />
            </label>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              <button type="button" onClick={() => setFiltro('todas')} className={`rounded-full px-3 py-2 text-xs font-bold ${filtro === 'todas' ? 'bg-violet-600 text-white' : tema.soft}`}>Todas</button>
              {tipos.map(({ id, nombre }) => <button key={id} type="button" onClick={() => setFiltro(id)} className={`rounded-full px-3 py-2 text-xs font-bold ${filtro === id ? 'bg-violet-600 text-white' : tema.soft}`}>{nombre}</button>)}
            </div>

            <div className="mt-3 max-h-[300px] space-y-2 overflow-y-auto pr-1 md:max-h-[570px]">
              {notasFiltradas.map((nota) => (
                <button key={nota.id} type="button" onClick={() => setSeleccionadaId(nota.id)} className={`block w-full rounded-2xl p-3 text-left ring-1 ring-transparent ${seleccionadaId === nota.id ? tema.selected : tema.item}`}>
                  <p className="truncate text-sm font-bold">{nota.titulo || 'Sin título'}</p>
                  <p className={`mt-1 truncate text-xs ${tema.muted}`}>{nota.referencia || nota.paquete || tipos.find((tipo) => tipo.id === nota.tipo)?.nombre}</p>
                </button>
              ))}
              {!notasFiltradas.length && <button type="button" onClick={nuevaNota} className={`w-full rounded-2xl border border-dashed p-6 text-sm font-semibold ${tema.divider} ${tema.muted}`}>Crear la primera nota</button>}
            </div>
          </aside>

          <section className="p-4 sm:p-6">
            {seleccionada ? (
              <div className="mx-auto max-w-2xl">
                <div className="flex items-start justify-between gap-3">
                  <input value={seleccionada.titulo} onChange={(e) => actualizar({ titulo: e.target.value })} aria-label="Título de la nota" className={`min-w-0 flex-1 bg-transparent text-2xl font-bold outline-none ${tema.editor}`} placeholder="Título" />
                  <button type="button" onClick={eliminar} aria-label="Eliminar nota" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-500/10 text-rose-500"><Trash2 className="h-4 w-4" /></button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <label><span className={`mb-1 block text-[11px] font-bold uppercase ${tema.muted}`}>Tipo</span><select value={seleccionada.tipo} onChange={(e) => actualizar({ tipo: e.target.value as TipoNota })} className={`min-h-11 w-full rounded-xl border px-3 text-sm ${tema.control}`}>{tipos.map((tipo) => <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>)}</select></label>
                  <label><span className={`mb-1 block text-[11px] font-bold uppercase ${tema.muted}`}>Referencia</span><input value={seleccionada.referencia} onChange={(e) => actualizar({ referencia: e.target.value })} placeholder="Ej. Juan 3:16" className={`min-h-11 w-full rounded-xl border px-3 text-sm ${tema.control}`} /></label>
                  <label><span className={`mb-1 block text-[11px] font-bold uppercase ${tema.muted}`}>Estudio o paquete</span><input value={seleccionada.paquete} onChange={(e) => actualizar({ paquete: e.target.value })} placeholder="Nombre opcional" className={`min-h-11 w-full rounded-xl border px-3 text-sm ${tema.control}`} /></label>
                </div>

                <textarea value={seleccionada.contenido} onChange={(e) => actualizar({ contenido: e.target.value })} placeholder="Empiece a escribir…" className={`mt-5 min-h-[390px] w-full resize-none bg-transparent text-[17px] leading-8 outline-none placeholder:opacity-50 ${tema.editor}`} />
                <p className={`mt-3 text-right text-[11px] ${tema.muted}`}>Guardado automáticamente en este dispositivo</p>
              </div>
            ) : (
              <div className="grid min-h-[420px] place-items-center text-center"><div><NotebookPen className="mx-auto h-10 w-10 text-violet-500" /><h2 className="mt-3 font-bold">Su cuaderno está listo</h2><button type="button" onClick={nuevaNota} className="mt-4 rounded-full bg-violet-600 px-5 py-3 text-sm font-bold text-white">Crear nota</button></div></div>
            )}
          </section>
        </section>
      </div>
    </main>
  )
}
