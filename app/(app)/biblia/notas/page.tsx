'use client'

import Link from 'next/link'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, BookOpen, CheckSquare, FileText, List, Mic2, NotebookPen, Plus, Search, Trash2, Clock3 } from 'lucide-react'
import { listarPaquetesPastoralesParaNotas } from '@/app/actions/pastoral-paquetes'

type TipoNota = 'versiculo' | 'estudio' | 'predicacion' | 'personal'
type ModoLectura = 'claro' | 'oscuro' | 'sepia'

type NotaBiblica = {
  id: string
  titulo: string
  contenido: string
  tipo: TipoNota
  referencia: string
  paqueteId: string
  paquete: string
  creadaEn: string
  actualizadaEn: string
}

type Paquete = { id: string; titulo: string }

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
    if (!raw) return []
    return (JSON.parse(raw) as Array<Partial<NotaBiblica>>).map((nota) => ({
      id: nota.id ?? crypto.randomUUID(),
      titulo: nota.titulo ?? 'Sin título',
      contenido: nota.contenido ?? '',
      tipo: nota.tipo ?? 'personal',
      referencia: nota.referencia ?? '',
      paqueteId: nota.paqueteId ?? '',
      paquete: nota.paquete ?? '',
      creadaEn: nota.creadaEn ?? new Date().toISOString(),
      actualizadaEn: nota.actualizadaEn ?? new Date().toISOString(),
    }))
  } catch { return [] }
}

function esModoLectura(value: string | undefined): value is ModoLectura {
  return value === 'claro' || value === 'oscuro' || value === 'sepia'
}

function cargarTema(): ModoLectura {
  const temaActivo = document.documentElement.dataset.bibliaTema
  if (esModoLectura(temaActivo)) return temaActivo

  try {
    const raw = localStorage.getItem(PREF_KEY)
    const modo = raw ? JSON.parse(raw)?.modo as string | undefined : undefined
    return esModoLectura(modo) ? modo : 'claro'
  } catch { return 'claro' }
}

export default function NotasBibliaPage() {
  const [notas, setNotas] = useState<NotaBiblica[]>([])
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<TipoNota | 'todas'>('todas')
  const [modo, setModo] = useState<ModoLectura | null>(null)
  const [paquetes, setPaquetes] = useState<Paquete[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const seleccionada = notas.find((nota) => nota.id === seleccionadaId) ?? null

  useLayoutEffect(() => {
    const temaInicial = cargarTema()
    document.documentElement.dataset.bibliaTema = temaInicial
    document.body.dataset.bibliaTema = temaInicial

    const guardadas = cargarNotas()
    const solicitada = new URLSearchParams(window.location.search).get('nota')
    setNotas(guardadas)
    setSeleccionadaId(solicitada && guardadas.some((nota) => nota.id === solicitada) ? solicitada : guardadas[0]?.id ?? null)
    setModo(temaInicial)
  }, [])

  useEffect(() => {
    listarPaquetesPastoralesParaNotas().then((r) => { if (r.success) setPaquetes(r.paquetes) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!notas.length && !seleccionadaId) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notas))
  }, [notas, seleccionadaId])

  const tema = modo ? {
    claro: { page: 'bg-[#f7f7f4] text-slate-900', panel: 'border-slate-200 bg-white', soft: 'bg-slate-100 text-slate-700', editor: 'bg-[#fafaf8]', field: 'border-slate-200 bg-white text-slate-900', muted: 'text-slate-500', selected: 'bg-violet-100 ring-violet-300' },
    sepia: { page: 'bg-[#efe5d0] text-[#34291f]', panel: 'border-[#d4c09b] bg-[#fff8e8]', soft: 'bg-[#ead9b5] text-[#493c2d]', editor: 'bg-[#f7ecd6]', field: 'border-[#cdb991] bg-[#fff8e8] text-[#382d21]', muted: 'text-[#7d6b54]', selected: 'bg-[#e4cea3] ring-[#c6a76b]' },
    oscuro: { page: 'bg-slate-950 text-white', panel: 'border-slate-800 bg-slate-900', soft: 'bg-slate-800 text-slate-200', editor: 'bg-slate-950/45', field: 'border-slate-700 bg-slate-900 text-white', muted: 'text-slate-400', selected: 'bg-violet-950 ring-violet-700' },
  }[modo] : null

  const notasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    return notas.filter((nota) => filtro === 'todas' || nota.tipo === filtro)
      .filter((nota) => !termino || `${nota.titulo} ${nota.contenido} ${nota.referencia} ${nota.paquete}`.toLowerCase().includes(termino))
      .sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn))
  }, [notas, busqueda, filtro])

  const nuevaNota = () => {
    const ahora = new Date().toISOString()
    const nota: NotaBiblica = { id: crypto.randomUUID(), titulo: 'Nueva nota', contenido: '', tipo: 'personal', referencia: '', paqueteId: '', paquete: '', creadaEn: ahora, actualizadaEn: ahora }
    setNotas((actuales) => [nota, ...actuales])
    setSeleccionadaId(nota.id)
  }

  const actualizar = (cambios: Partial<NotaBiblica>) => {
    if (!seleccionadaId) return
    setNotas((actuales) => actuales.map((nota) => nota.id === seleccionadaId ? { ...nota, ...cambios, actualizadaEn: new Date().toISOString() } : nota))
  }

  const eliminar = () => {
    if (!seleccionadaId) return
    const restantes = notas.filter((nota) => nota.id !== seleccionadaId)
    setNotas(restantes)
    setSeleccionadaId(restantes[0]?.id ?? null)
  }

  const insertar = (texto: string) => {
    if (!seleccionada || !textareaRef.current) return
    const area = textareaRef.current
    const inicio = area.selectionStart
    const fin = area.selectionEnd
    const contenido = `${seleccionada.contenido.slice(0, inicio)}${texto}${seleccionada.contenido.slice(fin)}`
    actualizar({ contenido })
    requestAnimationFrame(() => { area.focus(); area.setSelectionRange(inicio + texto.length, inicio + texto.length) })
  }

  if (!modo || !tema) {
    return <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]" aria-hidden="true" />
  }

  return (
    <main className={`min-h-screen px-4 pb-24 pt-[calc(1rem+env(safe-area-inset-top))] transition-colors sm:px-6 ${tema.page}`}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3"><Link href="/biblia" aria-label="Volver" className={`grid h-11 w-11 place-items-center rounded-full border ${tema.field}`}><ArrowLeft className="h-5 w-5" /></Link><div><h1 className="text-xl font-bold">Notas bíblicas</h1><p className={`text-xs ${tema.muted}`}>Cuaderno de versículos, estudios y predicaciones</p></div></div>
          <button type="button" onClick={nuevaNota} className="grid h-11 w-11 place-items-center rounded-full bg-violet-600 text-white" aria-label="Nueva nota"><Plus className="h-5 w-5" /></button>
        </header>

        <section className={`overflow-hidden rounded-[26px] border shadow-sm ${tema.panel}`}>
          <div className={`border-b p-3 ${modo === 'oscuro' ? 'border-slate-800' : modo === 'sepia' ? 'border-[#d4c09b]' : 'border-slate-200'}`}>
            <label className={`flex min-h-11 items-center gap-2 rounded-2xl px-3 ${tema.soft}`}><Search className="h-4 w-4 opacity-60" /><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar notas" className="w-full bg-transparent text-sm outline-none placeholder:opacity-60" /></label>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{(['todas', ...tipos.map(t => t.id)] as const).map((id) => <button key={id} type="button" onClick={() => setFiltro(id)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${filtro === id ? 'bg-violet-600 text-white' : tema.soft}`}>{id === 'todas' ? 'Todas' : tipos.find(t => t.id === id)?.nombre}</button>)}</div>

            <div className="mt-4 flex min-h-[104px] gap-3 overflow-x-auto overscroll-x-contain pb-2">
              <button type="button" onClick={nuevaNota} className={`grid h-20 w-20 shrink-0 place-items-center rounded-full border border-dashed ${tema.field}`}><Plus className="h-5 w-5" /></button>
              {notasFiltradas.map((nota) => <button key={nota.id} type="button" onClick={() => setSeleccionadaId(nota.id)} className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full px-2 text-center transition ring-1 ${seleccionadaId === nota.id ? tema.selected : `${tema.soft} ring-transparent`}`}><span className="line-clamp-2 text-[11px] font-bold leading-4">{nota.titulo || 'Sin título'}</span><span className="mt-1 max-w-full truncate text-[9px] opacity-65">{nota.referencia || tipos.find(t => t.id === nota.tipo)?.nombre}</span></button>)}
            </div>
          </div>

          {seleccionada ? <section className={`min-h-[calc(100vh-330px)] p-4 sm:p-6 ${tema.editor}`}>
            <div className="mx-auto flex min-h-[calc(100vh-380px)] max-w-3xl flex-col">
              <div className="flex items-start justify-between gap-3"><input value={seleccionada.titulo} onChange={(e) => actualizar({ titulo: e.target.value })} className="min-w-0 flex-1 bg-transparent text-2xl font-bold outline-none" placeholder="Título" /><button type="button" onClick={eliminar} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-500/10 text-rose-500"><Trash2 className="h-4 w-4" /></button></div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label><span className={`mb-1 block text-[11px] font-bold uppercase ${tema.muted}`}>Tipo</span><select value={seleccionada.tipo} onChange={(e) => actualizar({ tipo: e.target.value as TipoNota })} className={`min-h-11 w-full rounded-xl border px-3 text-sm ${tema.field}`}>{tipos.map((tipo) => <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>)}</select></label>
                <label><span className={`mb-1 block text-[11px] font-bold uppercase ${tema.muted}`}>Referencia</span><input value={seleccionada.referencia} onChange={(e) => actualizar({ referencia: e.target.value })} placeholder="Ej. Juan 3:16" className={`min-h-11 w-full rounded-xl border px-3 text-sm ${tema.field}`} /></label>
                <label><span className={`mb-1 block text-[11px] font-bold uppercase ${tema.muted}`}>Paquete pastoral</span><select value={seleccionada.paqueteId} onChange={(e) => { const p = paquetes.find(x => x.id === e.target.value); actualizar({ paqueteId: e.target.value, paquete: p?.titulo ?? '' }) }} className={`min-h-11 w-full rounded-xl border px-3 text-sm ${tema.field}`}><option value="">Sin paquete</option>{paquetes.map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)}</select></label>
              </div>

              <div className={`mt-4 flex items-center gap-2 overflow-x-auto rounded-2xl border p-2 ${tema.field}`}>
                <button type="button" onClick={() => insertar('\n• ')} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${tema.soft}`} aria-label="Lista"><List className="h-4 w-4" /></button>
                <button type="button" onClick={() => insertar('\n☐ ')} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${tema.soft}`} aria-label="Lista de tareas"><CheckSquare className="h-4 w-4" /></button>
                <button type="button" onClick={() => insertar(`\n${new Date().toLocaleString('es-SV')} — `)} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${tema.soft}`} aria-label="Insertar fecha"><Clock3 className="h-4 w-4" /></button>
                <span className={`ml-auto shrink-0 pr-2 text-[11px] ${tema.muted}`}>Guardado automático</span>
              </div>

              <textarea ref={textareaRef} value={seleccionada.contenido} onChange={(e) => actualizar({ contenido: e.target.value })} placeholder="Empiece a escribir…" className="mt-4 min-h-[55vh] flex-1 resize-none bg-transparent text-[17px] leading-8 outline-none placeholder:opacity-45" />
            </div>
          </section> : <div className="grid min-h-[55vh] place-items-center text-center"><div><NotebookPen className="mx-auto h-10 w-10 text-violet-500" /><h2 className="mt-3 font-bold">Su cuaderno está listo</h2><button type="button" onClick={nuevaNota} className="mt-4 rounded-full bg-violet-600 px-5 py-3 text-sm font-bold text-white">Crear nota</button></div></div>}
        </section>
      </div>
    </main>
  )
}
