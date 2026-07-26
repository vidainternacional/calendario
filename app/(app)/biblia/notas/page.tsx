'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BookOpen, FileText, Mic2, NotebookPen, Plus, Search, Trash2 } from 'lucide-react'

type TipoNota = 'versiculo' | 'estudio' | 'predicacion' | 'personal'

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

export default function NotasBibliaPage() {
  const [notas, setNotas] = useState<NotaBiblica[]>([])
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<TipoNota | 'todas'>('todas')
  const seleccionada = notas.find((nota) => nota.id === seleccionadaId) ?? null

  useEffect(() => {
    const guardadas = cargarNotas()
    setNotas(guardadas)
    setSeleccionadaId(guardadas[0]?.id ?? null)
  }, [])

  useEffect(() => {
    if (!notas.length && !seleccionadaId) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notas))
  }, [notas, seleccionadaId])

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
      id: crypto.randomUUID(),
      titulo: 'Nueva nota',
      contenido: '',
      tipo: 'personal',
      referencia: '',
      paquete: '',
      creadaEn: ahora,
      actualizadaEn: ahora,
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
    <main className="min-h-screen bg-[#f7f7f4] px-4 pb-28 pt-[calc(1rem+env(safe-area-inset-top))] text-slate-900 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/biblia" aria-label="Volver a la Biblia" className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white"><ArrowLeft className="h-5 w-5" /></Link>
            <div><h1 className="text-xl font-bold">Notas bíblicas</h1><p className="text-xs text-slate-500">Versículos, estudios y predicaciones</p></div>
          </div>
          <button type="button" onClick={nuevaNota} className="grid h-11 w-11 place-items-center rounded-full bg-violet-600 text-white" aria-label="Nueva nota"><Plus className="h-5 w-5" /></button>
        </header>

        <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm md:grid md:min-h-[680px] md:grid-cols-[320px_1fr]">
          <aside className="border-b border-slate-200 p-3 md:border-b-0 md:border-r">
            <label className="flex min-h-11 items-center gap-2 rounded-2xl bg-slate-100 px-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar notas" className="w-full bg-transparent text-sm outline-none" />
            </label>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              <button type="button" onClick={() => setFiltro('todas')} className={`rounded-full px-3 py-2 text-xs font-bold ${filtro === 'todas' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Todas</button>
              {tipos.map(({ id, nombre }) => <button key={id} type="button" onClick={() => setFiltro(id)} className={`rounded-full px-3 py-2 text-xs font-bold ${filtro === id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{nombre}</button>)}
            </div>

            <div className="mt-3 max-h-[300px] space-y-2 overflow-y-auto pr-1 md:max-h-[570px]">
              {notasFiltradas.map((nota) => (
                <button key={nota.id} type="button" onClick={() => setSeleccionadaId(nota.id)} className={`block w-full rounded-2xl p-3 text-left ${seleccionadaId === nota.id ? 'bg-violet-50 ring-1 ring-violet-200' : 'bg-slate-50'}`}>
                  <p className="truncate text-sm font-bold">{nota.titulo || 'Sin título'}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{nota.referencia || nota.paquete || tipos.find((tipo) => tipo.id === nota.tipo)?.nombre}</p>
                </button>
              ))}
              {!notasFiltradas.length && <button type="button" onClick={nuevaNota} className="w-full rounded-2xl border border-dashed border-slate-300 p-6 text-sm font-semibold text-slate-500">Crear la primera nota</button>}
            </div>
          </aside>

          <section className="p-4 sm:p-6">
            {seleccionada ? (
              <div className="mx-auto max-w-2xl">
                <div className="flex items-start justify-between gap-3">
                  <input value={seleccionada.titulo} onChange={(e) => actualizar({ titulo: e.target.value })} aria-label="Título de la nota" className="min-w-0 flex-1 bg-transparent text-2xl font-bold outline-none" placeholder="Título" />
                  <button type="button" onClick={eliminar} aria-label="Eliminar nota" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600"><Trash2 className="h-4 w-4" /></button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <label><span className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Tipo</span><select value={seleccionada.tipo} onChange={(e) => actualizar({ tipo: e.target.value as TipoNota })} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">{tipos.map((tipo) => <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>)}</select></label>
                  <label><span className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Referencia</span><input value={seleccionada.referencia} onChange={(e) => actualizar({ referencia: e.target.value })} placeholder="Ej. Juan 3:16" className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label>
                  <label><span className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Estudio o paquete</span><input value={seleccionada.paquete} onChange={(e) => actualizar({ paquete: e.target.value })} placeholder="Nombre opcional" className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label>
                </div>

                <textarea value={seleccionada.contenido} onChange={(e) => actualizar({ contenido: e.target.value })} placeholder="Empiece a escribir…" className="mt-5 min-h-[390px] w-full resize-none bg-transparent text-[17px] leading-8 outline-none" />
                <p className="mt-3 text-right text-[11px] text-slate-400">Guardado automáticamente en este dispositivo</p>
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
