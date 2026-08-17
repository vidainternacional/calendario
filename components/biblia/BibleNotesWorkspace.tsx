'use client'

import Link from 'next/link'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, BookOpen, ChevronDown, Download, FileText, Mic2, NotebookPen, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react'
import { listarPaquetesPastoralesParaNotas } from '@/app/actions/pastoral-paquetes'
import {
  crearNotaBiblicaLocal,
  guardarNotasBiblicasLocales,
  leerNotasBiblicasLocales,
  reemplazarNotasBiblicasLocalesDesdeServidor,
  type NotaBiblicaLocal,
  type TipoNotaBiblica,
} from '@/lib/biblia/notes-local'
import { VIDA_BIBLE_NOTES_SYNC_EVENT } from '@/lib/biblia/notes-queue'
import { obtenerNotasBiblicasRemotasMezcladas } from '@/lib/biblia/notes-remote'
import {
  resolverUsuarioActualNotas,
  sincronizarNotasBiblicasPendientes,
} from '@/lib/biblia/notes-sync'
import NotesEditingToolbar from '@/components/biblia/NotesEditingToolbar'

export type ModoLecturaBiblia = 'claro' | 'oscuro' | 'sepia'
type TipoNota = TipoNotaBiblica
type NotaBiblica = NotaBiblicaLocal
type Paquete = { id: string; titulo: string }
type FiltroOrigen = 'todos' | 'estudio_profundo' | 'biblia_notas'
type MenuCuaderno = 'detalles' | 'predicacion' | 'herramientas' | null

type Props = {
  modo?: ModoLecturaBiblia
  embedded?: boolean
  userId?: string
}

const PREF_KEY = 'vida-biblia-preferencias'
const FONT_SIZE_KEY = 'vida-cuaderno-font-size-v1'

const tipos: Array<{ id: TipoNota; nombre: string; icono: typeof BookOpen }> = [
  { id: 'versiculo', nombre: 'Versículo', icono: BookOpen },
  { id: 'estudio', nombre: 'Estudio', icono: FileText },
  { id: 'predicacion', nombre: 'Predicación', icono: Mic2 },
  { id: 'personal', nombre: 'Personal', icono: NotebookPen },
]

const origenes: Array<{ id: FiltroOrigen; nombre: string }> = [
  { id: 'todos', nombre: 'Todos los orígenes' },
  { id: 'estudio_profundo', nombre: 'Estudio Profundo' },
  { id: 'biblia_notas', nombre: 'Cuaderno' },
]

function esModoLectura(value: string | undefined): value is ModoLecturaBiblia {
  return value === 'claro' || value === 'oscuro' || value === 'sepia'
}

function cargarTema(): ModoLecturaBiblia {
  const temaActivo = document.documentElement.dataset.bibliaTema
  if (esModoLectura(temaActivo)) return temaActivo

  try {
    const raw = localStorage.getItem(PREF_KEY)
    const modo = raw ? JSON.parse(raw)?.modo as string | undefined : undefined
    return esModoLectura(modo) ? modo : 'claro'
  } catch {
    return 'claro'
  }
}

export default function BibleNotesWorkspace({ modo: modoExterno, embedded = false, userId }: Props) {
  const [notas, setNotas] = useState<NotaBiblica[]>([])
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<TipoNota | 'todas'>('todas')
  const [filtroOrigen, setFiltroOrigen] = useState<FiltroOrigen>('todos')
  const [modoInterno, setModoInterno] = useState<ModoLecturaBiblia | null>(modoExterno ?? null)
  const [paquetes, setPaquetes] = useState<Paquete[]>([])
  const [notasCargadas, setNotasCargadas] = useState(false)
  const [usuarioId, setUsuarioId] = useState<string | null>(userId ?? null)
  const [editorFontSize, setEditorFontSize] = useState(18)
  const [menuAbierto, setMenuAbierto] = useState<MenuCuaderno>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modo = modoExterno ?? modoInterno
  const seleccionada = notas.find((nota) => nota.id === seleccionadaId) ?? null

  useLayoutEffect(() => {
    if (modoExterno) return
    const temaInicial = cargarTema()
    document.documentElement.dataset.bibliaTema = temaInicial
    document.body.dataset.bibliaTema = temaInicial
    setModoInterno(temaInicial)
  }, [modoExterno])

  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem(FONT_SIZE_KEY))
      if (Number.isFinite(stored) && stored >= 16 && stored <= 22) setEditorFontSize(stored)
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem(FONT_SIZE_KEY, String(editorFontSize)) } catch {}
  }, [editorFontSize])

  useEffect(() => {
    if (userId) {
      setUsuarioId(userId)
      return
    }

    let activo = true
    resolverUsuarioActualNotas().then((id) => {
      if (activo) setUsuarioId(id)
    }).catch(() => {})
    return () => { activo = false }
  }, [userId])

  useLayoutEffect(() => {
    if (!usuarioId) return
    setNotasCargadas(false)
    const guardadas = leerNotasBiblicasLocales(usuarioId)
    const solicitada = embedded ? null : new URLSearchParams(window.location.search).get('nota')
    setNotas(guardadas)
    setSeleccionadaId(solicitada && guardadas.some((nota) => nota.id === solicitada) ? solicitada : guardadas[0]?.id ?? null)
    setNotasCargadas(true)
  }, [embedded, usuarioId])

  useEffect(() => {
    listarPaquetesPastoralesParaNotas().then((resultado) => {
      if (resultado.success) setPaquetes(resultado.paquetes)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!notasCargadas || !usuarioId) return
    guardarNotasBiblicasLocales(notas, usuarioId)
  }, [notas, notasCargadas, usuarioId])

  useEffect(() => {
    if (!notasCargadas || !usuarioId) return

    let activo = true
    let reconciliando = false

    const reconciliar = async () => {
      if (reconciliando) return
      reconciliando = true
      try {
        await sincronizarNotasBiblicasPendientes()
        if (!activo) return

        const locales = leerNotasBiblicasLocales(usuarioId)
        const resultado = await obtenerNotasBiblicasRemotasMezcladas(usuarioId, locales)
        if (!activo || !resultado.actualizadas) return

        reemplazarNotasBiblicasLocalesDesdeServidor(resultado.notas, usuarioId)
        setNotas(resultado.notas)
        setSeleccionadaId((actual) => actual && resultado.notas.some((nota) => nota.id === actual)
          ? actual
          : resultado.notas[0]?.id ?? null)
      } finally {
        reconciliando = false
      }
    }

    const recuperar = () => { void reconciliar() }
    const alVolverVisible = () => {
      if (document.visibilityState === 'visible') void reconciliar()
    }

    void reconciliar()
    window.addEventListener(VIDA_BIBLE_NOTES_SYNC_EVENT, recuperar)
    window.addEventListener('online', recuperar)
    window.addEventListener('focus', recuperar)
    document.addEventListener('visibilitychange', alVolverVisible)

    return () => {
      activo = false
      window.removeEventListener(VIDA_BIBLE_NOTES_SYNC_EVENT, recuperar)
      window.removeEventListener('online', recuperar)
      window.removeEventListener('focus', recuperar)
      document.removeEventListener('visibilitychange', alVolverVisible)
    }
  }, [notasCargadas, usuarioId])

  const tema = modo ? {
    claro: {
      page: 'bg-[#f7f7f4] text-slate-900',
      soft: 'bg-slate-100/75 text-slate-700',
      field: 'border-white/80 bg-white/55 text-slate-900 backdrop-blur-xl',
      muted: 'text-slate-500',
      selected: 'bg-violet-100/85 ring-violet-300/80 backdrop-blur-xl',
      glass: 'border border-white/75 bg-white/38 shadow-[0_10px_35px_rgba(15,23,42,0.055)] backdrop-blur-2xl',
      glassStrong: 'border border-white/80 bg-white/60 shadow-[0_4px_18px_rgba(15,23,42,0.055)] backdrop-blur-2xl',
    },
    sepia: {
      page: 'bg-[#efe5d0] text-[#34291f]',
      soft: 'bg-[#ead9b5]/70 text-[#493c2d]',
      field: 'border-[#fff5df]/75 bg-[#fff8e8]/55 text-[#382d21] backdrop-blur-xl',
      muted: 'text-[#7d6b54]',
      selected: 'bg-[#e4cea3]/85 ring-[#c6a76b]/80 backdrop-blur-xl',
      glass: 'border border-[#fff4dc]/70 bg-[#fff8e8]/40 shadow-[0_10px_35px_rgba(88,66,37,0.07)] backdrop-blur-2xl',
      glassStrong: 'border border-[#fff4dc]/75 bg-[#fff8e8]/62 shadow-[0_4px_18px_rgba(88,66,37,0.06)] backdrop-blur-2xl',
    },
    oscuro: {
      page: 'bg-slate-950 text-white',
      soft: 'bg-slate-800/70 text-slate-200',
      field: 'border-white/10 bg-slate-900/48 text-white backdrop-blur-xl',
      muted: 'text-slate-400',
      selected: 'bg-violet-950/80 ring-violet-700/80 backdrop-blur-xl',
      glass: 'border border-white/10 bg-slate-900/38 shadow-[0_10px_35px_rgba(0,0,0,0.22)] backdrop-blur-2xl',
      glassStrong: 'border border-white/10 bg-slate-800/58 shadow-[0_4px_18px_rgba(0,0,0,0.18)] backdrop-blur-2xl',
    },
  }[modo] : null

  const notasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    return notas
      .filter((nota) => filtro === 'todas' || nota.tipo === filtro)
      .filter((nota) => filtroOrigen === 'todos' || nota.origen === filtroOrigen)
      .filter((nota) => !termino || `${nota.titulo} ${nota.contenido} ${nota.referencia} ${nota.paquete} ${nota.origen} ${nota.numeroPredicacion ?? ''} ${nota.fechaPredicacion} ${nota.serie} ${nota.lugar} ${nota.predicador} ${nota.estadoPredicacion}`.toLowerCase().includes(termino))
      .sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn))
  }, [notas, busqueda, filtro, filtroOrigen])

  const nuevaNota = () => {
    const nota = crearNotaBiblicaLocal()
    setNotas((actuales) => [nota, ...actuales])
    setSeleccionadaId(nota.id)
    setMenuAbierto(null)
  }

  const actualizar = (cambios: Partial<NotaBiblica>) => {
    if (!seleccionadaId) return
    setNotas((actuales) => actuales.map((nota) => nota.id === seleccionadaId
      ? { ...nota, ...cambios, actualizadaEn: new Date().toISOString() }
      : nota))
  }

  const cambiarTipo = (tipo: TipoNota) => {
    if (tipo === 'predicacion') {
      actualizar({ tipo })
      return
    }

    if (menuAbierto === 'predicacion') setMenuAbierto(null)
    actualizar({
      tipo,
      numeroPredicacion: null,
      fechaPredicacion: '',
      serie: '',
      lugar: '',
      predicador: '',
      estadoPredicacion: '',
    })
  }

  const eliminar = () => {
    if (!seleccionadaId) return
    const restantes = notas.filter((nota) => nota.id !== seleccionadaId)
    setNotas(restantes)
    setSeleccionadaId(restantes[0]?.id ?? null)
    setMenuAbierto(null)
  }

  const exportarPredicacion = () => {
    if (!seleccionada || seleccionada.tipo !== 'predicacion') return
    window.print()
  }

  const alternarMenu = (menu: Exclude<MenuCuaderno, null>) => {
    setMenuAbierto((actual) => actual === menu ? null : menu)
  }

  if (!modo || !tema || !notasCargadas) {
    return <div className="min-h-[55vh] bg-[var(--background)] text-[var(--foreground)]" aria-hidden="true" />
  }

  const contenido = (
    <div className={embedded ? 'p-3 sm:p-5' : 'mx-auto max-w-4xl'}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {!embedded && <Link href="/estudios" aria-label="Volver a Estudios" className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${tema.glassStrong}`}><ArrowLeft className="h-5 w-5" /></Link>}
          <div className="min-w-0">
            <h1 className="truncate text-[22px] font-bold tracking-tight">Cuaderno</h1>
            <p className={`mt-0.5 truncate text-xs ${tema.muted}`}>{notas.length} {notas.length === 1 ? 'nota' : 'notas'}</p>
          </div>
        </div>
        <button type="button" onClick={nuevaNota} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet-600 text-white shadow-sm transition active:scale-95" aria-label="Nueva nota"><Plus className="h-5 w-5" /></button>
      </header>

      <label className={`flex min-h-12 items-center gap-2 rounded-[20px] px-4 ${tema.glass}`}>
        <Search className="h-5 w-5 opacity-55" />
        <input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar en todo el cuaderno" className="w-full bg-transparent text-base outline-none placeholder:opacity-60" />
      </label>

      <details className={`group mt-2 overflow-hidden rounded-[20px] ${tema.glass}`}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-xs font-bold">
          <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" />Filtrar notas</span>
          <ChevronDown className={`h-4 w-4 transition-transform group-open:rotate-180 ${tema.muted}`} />
        </summary>
        <div className="px-3 pb-3">
          <p className={`mb-1 px-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ${tema.muted}`}>Tipo</p>
          <div className="flex gap-2 overflow-x-auto pb-2">{(['todas', ...tipos.map((tipo) => tipo.id)] as const).map((id) => <button key={id} type="button" onClick={() => setFiltro(id)} className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-bold ${filtro === id ? 'bg-violet-600 text-white' : tema.glassStrong}`}>{id === 'todas' ? 'Todas' : tipos.find((tipo) => tipo.id === id)?.nombre}</button>)}</div>
          <p className={`mb-1 mt-1 px-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ${tema.muted}`}>Origen</p>
          <div className="flex gap-2 overflow-x-auto pb-1">{origenes.map((origen) => <button key={origen.id} type="button" onClick={() => setFiltroOrigen(origen.id)} className={`min-h-9 shrink-0 rounded-full px-3 text-[11px] font-bold ${filtroOrigen === origen.id ? 'bg-violet-600 text-white' : tema.glassStrong}`}>{origen.nombre}</button>)}</div>
        </div>
      </details>

      <nav aria-label="Notas del cuaderno" className="mt-3 flex min-h-[84px] gap-3 overflow-x-auto overscroll-x-contain pb-1">
        {notasFiltradas.map((nota) => <button key={nota.id} type="button" onClick={() => { setSeleccionadaId(nota.id); setMenuAbierto(null) }} aria-label={`Abrir ${nota.titulo || 'nota sin título'}`} className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full px-2 text-center ring-1 transition active:scale-[0.97] ${seleccionadaId === nota.id ? tema.selected : `${tema.soft} ring-transparent`}`}><span className="line-clamp-3 w-full text-[10px] font-bold leading-[13px]">{nota.titulo || 'Sin título'}</span></button>)}
      </nav>

      {seleccionada ? <section className="mt-3 min-h-[calc(100vh-300px)]">
        <div className="mx-auto flex max-w-3xl flex-col">
          <div className="flex items-start justify-between gap-3 px-1">
            <input value={seleccionada.titulo} onChange={(event) => actualizar({ titulo: event.target.value })} className="min-w-0 flex-1 bg-transparent text-[28px] font-bold tracking-tight outline-none sm:text-3xl" placeholder="Título de la nota" />
            <button type="button" onClick={eliminar} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-500/10 text-rose-500" aria-label="Eliminar nota"><Trash2 className="h-4 w-4" /></button>
          </div>

          <div className={`mt-1 min-h-6 px-1 text-xs ${tema.muted}`}>
            {seleccionada.origen === 'estudio_profundo' ? `Estudio Profundo${seleccionada.referencia ? ` · ${seleccionada.referencia}` : ''}` : seleccionada.referencia || tipos.find((tipo) => tipo.id === seleccionada.tipo)?.nombre || 'Nota personal'}
          </div>

          <div className={`mt-2 grid gap-2 px-0.5 ${seleccionada.tipo === 'predicacion' ? 'grid-cols-3' : 'grid-cols-2'}`} aria-label="Opciones de la nota">
            <button
              type="button"
              onClick={() => alternarMenu('detalles')}
              aria-expanded={menuAbierto === 'detalles'}
              aria-controls="cuaderno-panel-detalles"
              className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-full px-2 text-[11px] font-bold transition active:scale-[0.98] ${menuAbierto === 'detalles' ? 'bg-sky-500/20 text-sky-700 ring-1 ring-sky-400/35' : 'bg-sky-500/10 text-sky-700 ring-1 ring-sky-400/15 backdrop-blur-xl'}`}
            >
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-sky-500" />
              <span className="truncate">Detalles</span>
              <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${menuAbierto === 'detalles' ? 'rotate-180' : ''}`} />
            </button>

            {seleccionada.tipo === 'predicacion' && <button
              type="button"
              onClick={() => alternarMenu('predicacion')}
              aria-expanded={menuAbierto === 'predicacion'}
              aria-controls="cuaderno-panel-predicacion"
              className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-full px-2 text-[11px] font-bold transition active:scale-[0.98] ${menuAbierto === 'predicacion' ? 'bg-amber-500/20 text-amber-800 ring-1 ring-amber-400/35' : 'bg-amber-500/10 text-amber-800 ring-1 ring-amber-400/15 backdrop-blur-xl'}`}
            >
              <Mic2 className="h-4 w-4 shrink-0 text-amber-500" />
              <span className="truncate">Predicación</span>
              <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${menuAbierto === 'predicacion' ? 'rotate-180' : ''}`} />
            </button>}

            <button
              type="button"
              onClick={() => alternarMenu('herramientas')}
              aria-expanded={menuAbierto === 'herramientas'}
              aria-controls="cuaderno-panel-herramientas"
              className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-full px-2 text-[11px] font-bold transition active:scale-[0.98] ${menuAbierto === 'herramientas' ? 'bg-violet-500/20 text-violet-800 ring-1 ring-violet-400/35' : 'bg-violet-500/10 text-violet-800 ring-1 ring-violet-400/15 backdrop-blur-xl'}`}
            >
              <NotebookPen className="h-4 w-4 shrink-0 text-violet-500" />
              <span className="truncate">Edición</span>
              <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${menuAbierto === 'herramientas' ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {menuAbierto === 'detalles' && <section id="cuaderno-panel-detalles" className={`mt-2 rounded-[22px] p-3 ${tema.glass}`} aria-label="Detalles de la nota">
            <p className={`mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] ${tema.muted}`}>Organización</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="min-w-0"><span className={`mb-1 block text-[10px] font-bold ${tema.muted}`}>Tipo</span><select value={seleccionada.tipo} onChange={(event) => cambiarTipo(event.target.value as TipoNota)} className={`min-h-10 w-full rounded-xl border px-2.5 text-sm ${tema.field}`}>{tipos.map((tipo) => <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>)}</select></label>
              <label className="min-w-0"><span className={`mb-1 block text-[10px] font-bold ${tema.muted}`}>Paquete pastoral</span><select value={seleccionada.paqueteId} onChange={(event) => { const paquete = paquetes.find((item) => item.id === event.target.value); actualizar({ paqueteId: event.target.value, paquete: paquete?.titulo ?? '' }) }} className={`min-h-10 w-full rounded-xl border px-2.5 text-sm ${tema.field}`}><option value="">Sin paquete</option>{paquetes.map((paquete) => <option key={paquete.id} value={paquete.id}>{paquete.titulo}</option>)}</select></label>
            </div>
            <div className="my-3 h-px bg-current/10" />
            <p className={`mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] ${tema.muted}`}>Contexto bíblico</p>
            <label><span className={`mb-1 block text-[10px] font-bold ${tema.muted}`}>Referencia bíblica</span><input value={seleccionada.referencia} onChange={(event) => actualizar({ referencia: event.target.value })} placeholder="Ej. Juan 3:16" className={`min-h-10 w-full rounded-xl border px-3 text-sm ${tema.field}`} /></label>
          </section>}

          {seleccionada.tipo === 'predicacion' && menuAbierto === 'predicacion' && <section id="cuaderno-panel-predicacion" className={`mt-2 rounded-[22px] p-3 ${tema.glass}`} aria-label="Datos de predicación">
            <div className="mb-2 flex items-center justify-between gap-3 px-0.5">
              <p className={`text-[10px] font-extrabold uppercase tracking-[0.12em] ${tema.muted}`}>Identidad</p>
              <button type="button" onClick={exportarPredicacion} className={`flex min-h-8 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-bold ${tema.glassStrong}`} aria-label="Exportar predicación PDF"><Download className="h-3.5 w-3.5" /><span>Exportar</span></button>
            </div>

            <div className="grid grid-cols-[78px_minmax(0,1fr)] gap-2">
              <label className="min-w-0"><span className={`mb-1 block text-[10px] font-bold ${tema.muted}`}>N.º de prédica</span><input readOnly value={seleccionada.numeroPredicacion ? `#${seleccionada.numeroPredicacion}` : '—'} className={`min-h-10 w-full rounded-xl border px-2.5 text-sm font-bold ${tema.field}`} /></label>
              <label className="min-w-0"><span className={`mb-1 block text-[10px] font-bold ${tema.muted}`}>Fecha</span><input type="date" value={seleccionada.fechaPredicacion} onChange={(event) => actualizar({ fechaPredicacion: event.target.value })} className={`min-h-10 w-full min-w-0 rounded-xl border px-2.5 text-sm ${tema.field}`} /></label>
            </div>

            <label className="mt-2 block"><span className={`mb-1 block text-[10px] font-bold ${tema.muted}`}>Estado</span><input value={seleccionada.estadoPredicacion} onChange={(event) => actualizar({ estadoPredicacion: event.target.value })} placeholder="Ej. Lista para predicar" maxLength={100} className={`min-h-10 w-full rounded-xl border px-3 text-sm ${tema.field}`} /></label>

            <div className="my-3 h-px bg-current/10" />
            <p className={`mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] ${tema.muted}`}>Contexto</p>

            <div className="grid grid-cols-2 gap-2">
              <label className="min-w-0"><span className={`mb-1 block text-[10px] font-bold ${tema.muted}`}>Serie</span><input value={seleccionada.serie} onChange={(event) => actualizar({ serie: event.target.value })} placeholder="Serie" maxLength={300} className={`min-h-10 w-full min-w-0 rounded-xl border px-3 text-sm ${tema.field}`} /></label>
              <label className="min-w-0"><span className={`mb-1 block text-[10px] font-bold ${tema.muted}`}>Lugar</span><input value={seleccionada.lugar} onChange={(event) => actualizar({ lugar: event.target.value })} placeholder="Lugar" maxLength={300} className={`min-h-10 w-full min-w-0 rounded-xl border px-3 text-sm ${tema.field}`} /></label>
            </div>
            <label className="mt-2 block"><span className={`mb-1 block text-[10px] font-bold ${tema.muted}`}>Predicador</span><input value={seleccionada.predicador} onChange={(event) => actualizar({ predicador: event.target.value })} placeholder="Nombre del predicador" maxLength={300} className={`min-h-10 w-full rounded-xl border px-3 text-sm ${tema.field}`} /></label>
          </section>}

          {menuAbierto === 'herramientas' && <section id="cuaderno-panel-herramientas" className={`mt-2 rounded-[22px] px-3 pb-3 pt-1 ${tema.glass}`} aria-label="Herramientas de edición">
            <NotesEditingToolbar
              textareaRef={textareaRef}
              value={seleccionada.contenido}
              onChange={(contenido) => actualizar({ contenido })}
              reference={seleccionada.referencia}
              fontSize={editorFontSize}
              onFontSizeChange={setEditorFontSize}
              buttonClass={tema.glassStrong}
              mutedClass={tema.muted}
            />
          </section>}

          <textarea
            ref={textareaRef}
            value={seleccionada.contenido}
            onChange={(event) => actualizar({ contenido: event.target.value })}
            placeholder="Empieza a escribir tus apuntes, ideas, bosquejo o conclusiones…"
            className="mt-3 min-h-[58vh] flex-1 resize-none border-0 bg-transparent px-1 py-2 outline-none"
            style={{ fontSize: `${editorFontSize}px`, lineHeight: 1.85 }}
          />
          <p className={`pb-3 pr-1 text-right text-[10px] ${tema.muted}`}>Guardado automático</p>
        </div>
      </section> : <div className="grid min-h-[55vh] place-items-center px-6 text-center"><div><NotebookPen className="mx-auto h-11 w-11 text-violet-500" /><h2 className="mt-3 text-lg font-bold">Tu cuaderno está listo</h2><p className={`mx-auto mt-2 max-w-sm text-sm leading-6 ${tema.muted}`}>Tus notas, estudios y predicaciones estarán aquí en un solo lugar.</p><button type="button" onClick={nuevaNota} className="mt-4 rounded-full bg-violet-600 px-5 py-3 text-sm font-bold text-white">Crear primera nota</button></div></div>}
    </div>
  )

  if (embedded) return <div className={`min-h-[60vh] ${tema.page}`}>{contenido}</div>

  return <main className={`min-h-screen px-4 pb-24 pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 ${tema.page}`}>{contenido}</main>
}
