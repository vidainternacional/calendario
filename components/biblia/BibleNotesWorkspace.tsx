'use client'

import Link from 'next/link'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, BookOpen, Download, FileText, Mic2, NotebookPen, Plus, Search, Trash2 } from 'lucide-react'
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
    claro: { page: 'bg-[#f7f7f4] text-slate-900', panel: 'border-slate-200 bg-white', soft: 'bg-slate-100 text-slate-700', editor: 'bg-[#fafaf8]', field: 'border-slate-200 bg-white text-slate-900', muted: 'text-slate-500', selected: 'bg-violet-100 ring-violet-300' },
    sepia: { page: 'bg-[#efe5d0] text-[#34291f]', panel: 'border-[#d4c09b] bg-[#fff8e8]', soft: 'bg-[#ead9b5] text-[#493c2d]', editor: 'bg-[#f7ecd6]', field: 'border-[#cdb991] bg-[#fff8e8] text-[#382d21]', muted: 'text-[#7d6b54]', selected: 'bg-[#e4cea3] ring-[#c6a76b]' },
    oscuro: { page: 'bg-slate-950 text-white', panel: 'border-slate-800 bg-slate-900', soft: 'bg-slate-800 text-slate-200', editor: 'bg-slate-950/45', field: 'border-slate-700 bg-slate-900 text-white', muted: 'text-slate-400', selected: 'bg-violet-950 ring-violet-700' },
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
  }

  const exportarPredicacion = () => {
    if (!seleccionada || seleccionada.tipo !== 'predicacion') return
    window.print()
  }

  if (!modo || !tema || !notasCargadas) {
    return <div className="min-h-[55vh] bg-[var(--background)] text-[var(--foreground)]" aria-hidden="true" />
  }

  const contenido = (
    <div className={embedded ? 'p-3 sm:p-5' : 'mx-auto max-w-5xl'}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {!embedded && <Link href="/estudios" aria-label="Volver a Estudios" className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border ${tema.field}`}><ArrowLeft className="h-5 w-5" /></Link>}
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold">Cuaderno</h1>
            <p className={`truncate text-xs ${tema.muted}`}>{notas.length} {notas.length === 1 ? 'nota' : 'notas'} · versículos, estudios, predicaciones y apuntes</p>
          </div>
        </div>
        <button type="button" onClick={nuevaNota} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-violet-600 px-4 text-sm font-bold text-white" aria-label="Nueva nota"><Plus className="h-5 w-5" /><span>Nueva</span></button>
      </header>

      <section className={`overflow-hidden rounded-[26px] border shadow-sm ${tema.panel}`}>
        <div className={`border-b p-3 sm:p-4 ${modo === 'oscuro' ? 'border-slate-800' : modo === 'sepia' ? 'border-[#d4c09b]' : 'border-slate-200'}`}>
          <label className={`flex min-h-12 items-center gap-2 rounded-2xl px-3 ${tema.soft}`}><Search className="h-5 w-5 opacity-60" /><input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar en todo el cuaderno" className="w-full bg-transparent text-base outline-none placeholder:opacity-60" /></label>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{(['todas', ...tipos.map((tipo) => tipo.id)] as const).map((id) => <button key={id} type="button" onClick={() => setFiltro(id)} className={`min-h-10 shrink-0 rounded-full px-4 text-xs font-bold ${filtro === id ? 'bg-violet-600 text-white' : tema.soft}`}>{id === 'todas' ? 'Todas' : tipos.find((tipo) => tipo.id === id)?.nombre}</button>)}</div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">{origenes.map((origen) => <button key={origen.id} type="button" onClick={() => setFiltroOrigen(origen.id)} className={`min-h-9 shrink-0 rounded-full border px-3 text-[11px] font-bold ${filtroOrigen === origen.id ? 'border-violet-500 bg-violet-50 text-violet-700' : `${tema.field} ${tema.muted}`}`}>{origen.nombre}</button>)}</div>

          <div className="mt-4 flex min-h-[112px] gap-3 overflow-x-auto overscroll-x-contain pb-2">
            <button type="button" onClick={nuevaNota} className={`flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed ${tema.field}`}><Plus className="h-5 w-5" /><span className="text-[11px] font-bold">Nueva nota</span></button>
            {notasFiltradas.map((nota) => <button key={nota.id} type="button" onClick={() => setSeleccionadaId(nota.id)} className={`flex h-24 w-28 shrink-0 flex-col items-start justify-between rounded-2xl px-3 py-3 text-left ring-1 ${seleccionadaId === nota.id ? tema.selected : `${tema.soft} ring-transparent`}`}><span className="line-clamp-2 w-full text-xs font-bold leading-4">{nota.titulo || 'Sin título'}</span><span className="line-clamp-2 w-full text-[10px] leading-4 opacity-65">{nota.tipo === 'predicacion' && nota.numeroPredicacion ? `Prédica #${nota.numeroPredicacion}` : `${nota.origen === 'estudio_profundo' ? 'Estudio Profundo · ' : ''}${nota.referencia || tipos.find((tipo) => tipo.id === nota.tipo)?.nombre || 'Nota'}`}</span></button>)}
          </div>
        </div>

        {seleccionada ? <section className={`min-h-[calc(100vh-330px)] p-4 sm:p-6 ${tema.editor}`}>
          <div className="mx-auto flex min-h-[calc(100vh-380px)] max-w-3xl flex-col">
            <div className="flex items-start justify-between gap-3"><input value={seleccionada.titulo} onChange={(event) => actualizar({ titulo: event.target.value })} className="min-w-0 flex-1 bg-transparent text-2xl font-bold outline-none sm:text-3xl" placeholder="Título de la nota" /><button type="button" onClick={eliminar} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-rose-500/10 text-rose-500" aria-label="Eliminar nota"><Trash2 className="h-4 w-4" /></button></div>

            {seleccionada.origen === 'estudio_profundo' && <div className={`mt-3 flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-bold ${tema.field}`}><FileText className="h-4 w-4 text-violet-500" /><span>Origen: Estudio Profundo</span>{seleccionada.referencia && <span className={`ml-auto truncate font-semibold ${tema.muted}`}>{seleccionada.referencia}</span>}</div>}

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label><span className={`mb-1 block text-xs font-bold uppercase ${tema.muted}`}>Tipo</span><select value={seleccionada.tipo} onChange={(event) => cambiarTipo(event.target.value as TipoNota)} className={`min-h-12 w-full rounded-xl border px-3 text-base ${tema.field}`}>{tipos.map((tipo) => <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>)}</select></label>
              <label><span className={`mb-1 block text-xs font-bold uppercase ${tema.muted}`}>Referencia</span><input value={seleccionada.referencia} onChange={(event) => actualizar({ referencia: event.target.value })} placeholder="Ej. Juan 3:16" className={`min-h-12 w-full rounded-xl border px-3 text-base ${tema.field}`} /></label>
              <label><span className={`mb-1 block text-xs font-bold uppercase ${tema.muted}`}>Paquete pastoral</span><select value={seleccionada.paqueteId} onChange={(event) => { const paquete = paquetes.find((item) => item.id === event.target.value); actualizar({ paqueteId: event.target.value, paquete: paquete?.titulo ?? '' }) }} className={`min-h-12 w-full rounded-xl border px-3 text-base ${tema.field}`}><option value="">Sin paquete</option>{paquetes.map((paquete) => <option key={paquete.id} value={paquete.id}>{paquete.titulo}</option>)}</select></label>
            </div>

            {seleccionada.tipo === 'predicacion' && <section className={`mt-4 rounded-2xl border p-3 sm:p-4 ${tema.field}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">Datos de predicación</p>
                  <p className={`mt-1 text-xs ${tema.muted}`}>{seleccionada.numeroPredicacion ? `Prédica #${seleccionada.numeroPredicacion}` : 'El número correlativo se asignará al sincronizar con Internet.'}</p>
                </div>
                <button type="button" onClick={exportarPredicacion} className={`flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3 text-xs font-bold ${tema.soft}`} aria-label="Exportar predicación PDF"><Download className="h-4 w-4" /><span>Exportar</span></button>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label><span className={`mb-1 block text-xs font-bold uppercase ${tema.muted}`}>N.º de prédica</span><input readOnly value={seleccionada.numeroPredicacion ? `#${seleccionada.numeroPredicacion}` : 'Pendiente'} className={`min-h-12 w-full rounded-xl border px-3 text-base font-bold ${tema.field}`} /></label>
                <label><span className={`mb-1 block text-xs font-bold uppercase ${tema.muted}`}>Fecha</span><input type="date" value={seleccionada.fechaPredicacion} onChange={(event) => actualizar({ fechaPredicacion: event.target.value })} className={`min-h-12 w-full rounded-xl border px-3 text-base ${tema.field}`} /></label>
                <label><span className={`mb-1 block text-xs font-bold uppercase ${tema.muted}`}>Serie</span><input value={seleccionada.serie} onChange={(event) => actualizar({ serie: event.target.value })} placeholder="Nombre de la serie" maxLength={300} className={`min-h-12 w-full rounded-xl border px-3 text-base ${tema.field}`} /></label>
                <label><span className={`mb-1 block text-xs font-bold uppercase ${tema.muted}`}>Lugar</span><input value={seleccionada.lugar} onChange={(event) => actualizar({ lugar: event.target.value })} placeholder="Lugar" maxLength={300} className={`min-h-12 w-full rounded-xl border px-3 text-base ${tema.field}`} /></label>
                <label><span className={`mb-1 block text-xs font-bold uppercase ${tema.muted}`}>Predicador</span><input value={seleccionada.predicador} onChange={(event) => actualizar({ predicador: event.target.value })} placeholder="Nombre" maxLength={300} className={`min-h-12 w-full rounded-xl border px-3 text-base ${tema.field}`} /></label>
                <label><span className={`mb-1 block text-xs font-bold uppercase ${tema.muted}`}>Estado</span><input value={seleccionada.estadoPredicacion} onChange={(event) => actualizar({ estadoPredicacion: event.target.value })} placeholder="Ej. Borrador" maxLength={100} className={`min-h-12 w-full rounded-xl border px-3 text-base ${tema.field}`} /></label>
              </div>
            </section>}

            <NotesEditingToolbar
              textareaRef={textareaRef}
              value={seleccionada.contenido}
              onChange={(contenido) => actualizar({ contenido })}
              reference={seleccionada.referencia}
              fontSize={editorFontSize}
              onFontSizeChange={setEditorFontSize}
              buttonClass={tema.soft}
              mutedClass={tema.muted}
            />

            <div className={`mt-3 rounded-xl px-3 py-2 text-right text-xs ${tema.muted}`}>Guardado automático · los cambios se sincronizan con tu cuaderno</div>
            <textarea
              ref={textareaRef}
              value={seleccionada.contenido}
              onChange={(event) => actualizar({ contenido: event.target.value })}
              placeholder="Empieza a escribir tus apuntes, ideas, bosquejo o conclusiones…"
              className={`mt-2 min-h-[55vh] flex-1 resize-none rounded-2xl border p-4 outline-none transition focus:ring-2 focus:ring-violet-500/25 ${tema.field}`}
              style={{ fontSize: `${editorFontSize}px`, lineHeight: 1.8 }}
            />
          </div>
        </section> : <div className="grid min-h-[55vh] place-items-center px-6 text-center"><div><NotebookPen className="mx-auto h-12 w-12 text-violet-500" /><h2 className="mt-3 text-lg font-bold">Tu cuaderno está listo</h2><p className={`mx-auto mt-2 max-w-sm text-sm leading-6 ${tema.muted}`}>Aquí se reunirán tus notas de Biblia, Estudio Profundo, predicaciones y apuntes personales.</p><button type="button" onClick={nuevaNota} className="mt-4 rounded-full bg-violet-600 px-5 py-3 text-sm font-bold text-white">Crear primera nota</button></div></div>}
      </section>
    </div>
  )

  if (embedded) return <div className={`min-h-[60vh] ${tema.page}`}>{contenido}</div>

  return <main className={`min-h-screen px-4 pb-24 pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 ${tema.page}`}>{contenido}</main>
}
