'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Headphones,
  Loader2,
  Minus,
  Moon,
  NotebookPen,
  Plus,
  Share2,
  Sparkles,
  Square,
  Star,
  Sun,
  Trash2,
  Type,
  Volume2,
} from 'lucide-react'
import { toggleFavorito, favoritosDelCapitulo } from '@/app/actions/biblia'
import { agregarVersiculoAlProyecto } from '@/app/actions/pastoral-proyecto-versiculos'
import BibleHistoricalContextPanel from '@/components/biblia/BibleHistoricalContextPanel'
import BibleTextualStudyPanel from '@/components/biblia/BibleTextualStudyPanel'
import BibleNotesWorkspace from '@/components/biblia/BibleNotesWorkspace'
import { getBookAuthorship } from '@/lib/biblia/book-authorship'
import { OPEN_BIBLE_VOICE_SETTINGS_EVENT } from '@/lib/biblia/voice-events'
import { mostrarToast } from '@/lib/ui/toast'

const API = 'https://bible.helloao.org/api'
const POS_KEY = 'vida-biblia-posicion'
const PREF_KEY = 'vida-biblia-preferencias'
const COMPARE_MODE_KEY = 'vida-biblia-modo-comparacion'

type Traduccion = { id: string; name: string; language: string; shortName?: string }
type Libro = { id: string; name: string; numberOfChapters: number }
type VersoApi = { type: string; number?: number; content?: unknown[] }
type Verso = { n: number; t: string }
type ResultadoVersion = { traduccion: Traduccion; texto: string; disponible: boolean }
type ModoLectura = 'claro' | 'oscuro' | 'sepia'
type ModoComparacion = 'dos' | 'todas'
type Preferencias = { modo: ModoLectura; fuente: number }
type Posicion = { trad: string; libro: string; capitulo: number }
type Vista = 'leer' | 'estudio' | 'comparar' | 'notas'

type Props = {
  modo?: 'general' | 'pastoral'
  paqueteId?: string
  versiculosProyecto?: Array<{ id: string; referencia: string; texto: string; traduccion: string }>
  onEliminarVersiculo?: (id: string) => void
  eliminandoId?: string | null
  onProyectoActualizado?: () => void
}

function textoDeContenido(content: unknown[] | undefined): string {
  if (!Array.isArray(content)) return ''
  return content.map((parte) => {
    if (typeof parte === 'string') return parte
    if (parte && typeof parte === 'object' && 'text' in (parte as Record<string, unknown>)) {
      return String((parte as Record<string, unknown>).text)
    }
    return ''
  }).join(' ').replace(/\s+/g, ' ').trim()
}

function textoDeVerso(v: VersoApi): string {
  return textoDeContenido(v.content)
}

function leerJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

function nombreTraduccion(t: Traduccion): string {
  if (!t.shortName || t.shortName === t.name) return t.name
  return `${t.name} (${t.shortName})`
}

function etiquetaTraduccion(t: Traduccion | undefined): string {
  if (!t) return 'Biblia'
  const corta = (t.shortName || '').trim()
  if (corta && corta.length <= 12) return corta.toUpperCase()
  const iniciales = t.name.split(/\s+/).filter(Boolean).map(p => p[0]).join('').replace(/[^a-z0-9]/gi, '')
  return (iniciales.slice(0, 8) || t.name.slice(0, 10)).toUpperCase()
}

function esModoLectura(value: string | undefined): value is ModoLectura {
  return value === 'claro' || value === 'oscuro' || value === 'sepia'
}

function TranslationPicker({
  label,
  value,
  translations,
  onChange,
  className,
  compact = false,
}: {
  label: string
  value: string
  translations: Traduccion[]
  onChange: (value: string) => void
  className: string
  compact?: boolean
}) {
  const selected = translations.find(t => t.id === value)
  return (
    <label className="block min-w-0">
      {!compact && <span className="mb-1 block text-[11px] font-black uppercase tracking-wide opacity-70">{label}</span>}
      <span className={`relative flex h-12 min-w-0 items-center justify-center rounded-2xl border px-9 text-center text-sm font-black ${className}`} title={selected ? nombreTraduccion(selected) : label}>
        <span className="truncate">{etiquetaTraduccion(selected)}</span>
        <ChevronDown className="absolute right-3 h-4 w-4 opacity-70" aria-hidden="true" />
        <select
          aria-label={label}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        >
          {translations.map(t => <option key={t.id} value={t.id}>{nombreTraduccion(t)}</option>)}
        </select>
      </span>
    </label>
  )
}

export default function BibliaClient({
  modo = 'general',
  paqueteId,
  versiculosProyecto = [],
  onEliminarVersiculo,
  eliminandoId,
  onProyectoActualizado,
}: Props) {
  const esPastoral = modo === 'pastoral'
  const [traducciones, setTraducciones] = useState<Traduccion[]>([])
  const [trad, setTrad] = useState('')
  const [tradComparada, setTradComparada] = useState('')
  const [libros, setLibros] = useState<Libro[]>([])
  const [libro, setLibro] = useState('')
  const [capitulo, setCapitulo] = useState(1)
  const [versos, setVersos] = useState<Verso[]>([])
  const [versosComparados, setVersosComparados] = useState<Verso[]>([])
  const [subtituloCapitulo, setSubtituloCapitulo] = useState('')
  const [modoComparacion, setModoComparacion] = useState<ModoComparacion>('dos')
  const [resultadosTodas, setResultadosTodas] = useState<ResultadoVersion[]>([])
  const [cargandoTodas, setCargandoTodas] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [cargandoComparacion, setCargandoComparacion] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [leyendo, setLeyendo] = useState(false)
  const [versoSel, setVersoSel] = useState<number | null>(null)
  const [favoritos, setFavoritos] = useState<Set<number>>(new Set())
  const [mostrarFavoritos, setMostrarFavoritos] = useState(false)
  const [guardandoVerso, setGuardandoVerso] = useState<number | null>(null)
  const [modoLectura, setModoLectura] = useState<ModoLectura>('claro')
  const [tamanoFuente, setTamanoFuente] = useState(18)
  const [preferenciasListas, setPreferenciasListas] = useState(esPastoral)
  const [mostrarTamano, setMostrarTamano] = useState(false)
  const [vista, setVista] = useState<Vista>('leer')
  const [voces, setVoces] = useState<SpeechSynthesisVoice[]>([])
  const [vozSeleccionada, setVozSeleccionada] = useState('')
  const [isPending, startTransition] = useTransition()
  const saltoRef = useRef<Posicion | null>(null)
  const listoRef = useRef(false)

  useLayoutEffect(() => {
    if (esPastoral) return
    const prefs = leerJson<Preferencias>(PREF_KEY, { modo: 'claro', fuente: 18 })
    const modoInicial = esModoLectura(prefs.modo) ? prefs.modo : 'claro'
    document.documentElement.dataset.bibliaTema = modoInicial
    document.body.dataset.bibliaTema = modoInicial
    setModoLectura(modoInicial)
    setTamanoFuente(Math.min(28, Math.max(15, Number(prefs.fuente) || 18)))
    setModoComparacion(localStorage.getItem(COMPARE_MODE_KEY) === 'todas' ? 'todas' : 'dos')
    setPreferenciasListas(true)
  }, [esPastoral])

  useEffect(() => {
    if (!preferenciasListas || esPastoral) return
    try { localStorage.setItem(PREF_KEY, JSON.stringify({ modo: modoLectura, fuente: tamanoFuente })) } catch {}
  }, [modoLectura, tamanoFuente, preferenciasListas, esPastoral])

  useEffect(() => {
    if (esPastoral) return
    try { localStorage.setItem(COMPARE_MODE_KEY, modoComparacion) } catch {}
  }, [modoComparacion, esPastoral])

  useEffect(() => {
    const cargarVoces = () => {
      const disponibles = window.speechSynthesis?.getVoices().filter(v => v.lang.toLowerCase().startsWith('es')) ?? []
      setVoces(disponibles)
      setVozSeleccionada(prev => prev && disponibles.some(v => v.name === prev) ? prev : disponibles.find(v => /paulina/i.test(v.name))?.name ?? disponibles[0]?.name ?? '')
    }
    cargarVoces()
    window.speechSynthesis?.addEventListener('voiceschanged', cargarVoces)
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', cargarVoces)
  }, [])

  useEffect(() => {
    saltoRef.current = leerJson<Posicion | null>(POS_KEY, null)
    fetch(`${API}/available_translations.json`).then(r => {
      if (!r.ok) throw new Error('translations')
      return r.json()
    }).then(d => {
      const todas: Traduccion[] = d.translations ?? []
      const lista = [...todas.filter(t => t.language === 'spa' || t.language === 'es'), ...todas.filter(t => ['eng', 'en'].includes(t.language)).slice(0, 3)]
      setTraducciones(lista)
      const guardada = saltoRef.current
      const reinaValera = lista.find(t => /reina[ -]?valera.*1909|rv1909|rvr1909/i.test(`${t.name} ${t.shortName ?? ''} ${t.id}`))
      const inicial = guardada && lista.some(t => t.id === guardada.trad) ? guardada.trad : reinaValera?.id ?? lista[0]?.id ?? ''
      setTrad(inicial)
      setTradComparada(lista.find(t => t.id !== inicial)?.id ?? '')
    }).catch(() => setError('No se pudo conectar con la biblioteca bíblica.'))
  }, [])

  useEffect(() => {
    if (!trad) return
    fetch(`${API}/${trad}/books.json`).then(r => {
      if (!r.ok) throw new Error('books')
      return r.json()
    }).then(d => {
      const bs: Libro[] = d.books ?? []
      setLibros(bs)
      const salto = saltoRef.current
      if (salto && bs.some(b => b.id === salto.libro)) {
        setLibro(salto.libro)
        setCapitulo(salto.capitulo)
        saltoRef.current = null
      } else setLibro(prev => bs.some(b => b.id === prev) ? prev : bs[0]?.id ?? '')
      setTimeout(() => { listoRef.current = true }, 0)
    }).catch(() => setError('No se pudieron cargar los libros.'))
  }, [trad])

  useEffect(() => {
    if (tradComparada === trad || !traducciones.some(t => t.id === tradComparada)) {
      setTradComparada(traducciones.find(t => t.id !== trad)?.id ?? '')
    }
  }, [trad, tradComparada, traducciones])

  const libroActual = useMemo(() => libros.find(b => b.id === libro), [libros, libro])
  const traduccionActual = useMemo(() => traducciones.find(t => t.id === trad), [traducciones, trad])
  const traduccionComparada = useMemo(() => traducciones.find(t => t.id === tradComparada), [traducciones, tradComparada])
  const autoria = useMemo(() => getBookAuthorship(libroActual?.name), [libroActual?.name])
  const pasaje = `${libroActual?.name ?? ''} ${capitulo}`
  const pasajeEstudio = versoSel ? `${pasaje}:${versoSel}` : pasaje
  const numeroComparacion = versoSel ?? versos[0]?.n ?? 1

  useEffect(() => {
    if (!trad || !libro) return
    let activo = true
    setCargando(true)
    setError(null)
    setVersoSel(null)
    setMostrarFavoritos(false)
    setSubtituloCapitulo('')
    window.speechSynthesis?.cancel()
    setLeyendo(false)
    fetch(`${API}/${trad}/${libro}/${capitulo}.json`).then(r => {
      if (!r.ok) throw new Error('chapter')
      return r.json()
    }).then(d => {
      if (!activo) return
      const contenido: VersoApi[] = d.chapter?.content ?? []
      const subtitulo = contenido.find(c => c.type === 'hebrew_subtitle')
      setSubtituloCapitulo(subtitulo ? textoDeContenido(subtitulo.content) : '')
      setVersos(contenido.filter(c => c.type === 'verse' && typeof c.number === 'number').map(c => ({ n: c.number as number, t: textoDeVerso(c) })))
    }).catch(() => activo && setError('No se pudo cargar el capítulo.')).finally(() => activo && setCargando(false))
    favoritosDelCapitulo(trad, libro, capitulo).then(favs => activo && setFavoritos(new Set(favs))).catch(() => activo && setFavoritos(new Set()))
    if (listoRef.current) try { localStorage.setItem(POS_KEY, JSON.stringify({ trad, libro, capitulo })) } catch {}
    return () => { activo = false }
  }, [trad, libro, capitulo])

  useEffect(() => {
    if (vista !== 'comparar' || modoComparacion !== 'dos' || !tradComparada || !libro) return
    let activo = true
    setCargandoComparacion(true)
    setVersosComparados([])
    fetch(`${API}/${tradComparada}/${libro}/${capitulo}.json`).then(r => {
      if (!r.ok) throw new Error('comparison')
      return r.json()
    }).then(d => {
      if (!activo) return
      const contenido: VersoApi[] = d.chapter?.content ?? []
      setVersosComparados(contenido.filter(c => c.type === 'verse' && typeof c.number === 'number').map(c => ({ n: c.number as number, t: textoDeVerso(c) })))
    }).catch(() => activo && setVersosComparados([])).finally(() => activo && setCargandoComparacion(false))
    return () => { activo = false }
  }, [vista, modoComparacion, tradComparada, libro, capitulo])

  useEffect(() => {
    if (vista !== 'comparar' || modoComparacion !== 'todas' || !libro || !traducciones.length) return
    let activo = true
    setCargandoTodas(true)
    setResultadosTodas([])
    let indice = 0
    const resultados: ResultadoVersion[] = new Array(traducciones.length)

    const trabajador = async () => {
      while (indice < traducciones.length) {
        const actual = indice++
        const traduccion = traducciones[actual]
        try {
          const respuesta = await fetch(`${API}/${traduccion.id}/${libro}/${capitulo}.json`)
          if (!respuesta.ok) throw new Error('chapter')
          const data = await respuesta.json()
          const contenido: VersoApi[] = data.chapter?.content ?? []
          const verso = contenido.find(item => item.type === 'verse' && item.number === numeroComparacion)
          const texto = verso ? textoDeVerso(verso) : ''
          resultados[actual] = { traduccion, texto: texto || 'No disponible en esta traducción.', disponible: Boolean(texto) }
        } catch {
          resultados[actual] = { traduccion, texto: 'No disponible en esta traducción.', disponible: false }
        }
      }
    }

    Promise.all(Array.from({ length: Math.min(4, traducciones.length) }, () => trabajador())).then(() => {
      if (activo) setResultadosTodas(resultados.filter(Boolean))
    }).finally(() => {
      if (activo) setCargandoTodas(false)
    })

    return () => { activo = false }
  }, [vista, modoComparacion, libro, capitulo, numeroComparacion, traducciones])

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  const hablar = (desde?: number) => {
    const synth = window.speechSynthesis
    if (!synth) return
    synth.cancel()
    const lista = typeof desde === 'number' ? versos.filter(v => v.n >= desde) : versos
    if (!lista.length) return
    const u = new SpeechSynthesisUtterance(`${pasaje}. ${lista.map(v => v.t).join(' ')}`)
    const voz = voces.find(v => v.name === vozSeleccionada) ?? voces[0]
    if (voz) u.voice = voz
    u.lang = voz?.lang ?? 'es-ES'
    u.rate = 0.95
    u.onend = () => setLeyendo(false)
    u.onerror = () => setLeyendo(false)
    synth.speak(u)
    setLeyendo(true)
  }

  const cambiarLibro = (id: string) => { setLibro(id); setCapitulo(1) }
  const cambiarTrad = (id: string) => { setTrad(id); setCapitulo(1) }
  const irAVersiculo = (numero: number) => {
    if (!numero) return
    setVersoSel(numero)
    requestAnimationFrame(() => document.getElementById(`versiculo-${numero}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }
  const abrirOpcionesVoz = () => {
    window.dispatchEvent(new Event(OPEN_BIBLE_VOICE_SETTINGS_EVENT))
  }

  const marcarFavorito = async (v: Verso) => {
    if (!libroActual || guardandoVerso !== null) return
    setGuardandoVerso(v.n)
    try {
      const resultado = await toggleFavorito({ traduccion: trad, libro_id: libro, libro_nombre: libroActual.name, capitulo, verso: v.n, texto: v.t })
      if ('error' in resultado) return mostrarToast(resultado.error || 'No se pudo guardar el favorito')
      setFavoritos(prev => { const next = new Set(prev); resultado.favorito ? next.add(v.n) : next.delete(v.n); return next })
      mostrarToast(resultado.favorito ? 'Versículo guardado' : 'Versículo eliminado de favoritos')
    } finally { setGuardandoVerso(null) }
  }

  const compartirVersiculo = async (referencia: string, texto: string) => {
    const contenido = `“${texto}”\n— ${referencia}\n\nCompartido desde Vida Internacional`
    try {
      if (navigator.share) await navigator.share({ title: referencia, text: contenido })
      else { await navigator.clipboard.writeText(contenido); mostrarToast('Versículo copiado') }
    } catch (e) { if ((e as Error)?.name !== 'AbortError') mostrarToast('No se pudo compartir') }
  }

  const agregarAlProyecto = (v: Verso) => {
    if (!paqueteId || !libroActual) return
    const formData = new FormData()
    formData.set('libro_nombre', libroActual.name)
    formData.set('capitulo', String(capitulo))
    formData.set('verso', String(v.n))
    formData.set('texto', v.t)
    formData.set('traduccion', traduccionActual?.shortName || traduccionActual?.name || 'Biblia')
    startTransition(async () => {
      const resultado = await agregarVersiculoAlProyecto(paqueteId, formData)
      if (!resultado.success) return mostrarToast(resultado.error)
      mostrarToast('Versículo agregado al proyecto')
      onProyectoActualizado?.()
    })
  }

  const tema = {
    claro: { page: 'bg-[#f7f7f4]', panel: 'bg-white border-slate-200', text: 'text-slate-800', title: 'text-slate-950', muted: 'text-slate-500', selected: 'bg-violet-50 ring-1 ring-violet-200', control: 'border-slate-200 bg-white text-slate-900', soft: 'bg-slate-100 text-slate-700', circle: 'border-slate-200 bg-white text-slate-700', divider: 'border-slate-200' },
    oscuro: { page: 'bg-slate-950', panel: 'bg-slate-900 border-slate-800', text: 'text-slate-100', title: 'text-white', muted: 'text-slate-400', selected: 'bg-violet-950/70 ring-1 ring-violet-700', control: 'border-slate-700 bg-slate-900 text-white', soft: 'bg-slate-800 text-slate-100', circle: 'border-slate-700 bg-slate-900 text-white', divider: 'border-slate-800' },
    sepia: { page: 'bg-[#efe5d0]', panel: 'bg-[#fffaf0] border-[#dac8a5]', text: 'text-[#493c2d]', title: 'text-[#2d241b]', muted: 'text-[#7d6b54]', selected: 'bg-[#ead9b5] ring-1 ring-[#c9ad78]', control: 'border-[#cdb991] bg-[#fff8e8] text-[#382d21]', soft: 'bg-[#ead9b5] text-[#493c2d]', circle: 'border-[#cdb991] bg-[#fff8e8] text-[#493c2d]', divider: 'border-[#dac8a5]' },
  }[modoLectura]

  const tabs: Array<[Vista, string, typeof BookOpen]> = [['leer', 'Leer', BookOpen], ['estudio', 'Estudio', Sparkles], ['comparar', 'Comparar', Copy], ['notas', 'Notas', NotebookPen]]
  const favoritosVisibles = versos.filter(v => favoritos.has(v.n))
  const vozActual = voces.find(v => v.name === vozSeleccionada)
  const selectClass = esPastoral ? 'border-slate-200 bg-white text-slate-900' : tema.control

  return (
    <section className={`${esPastoral ? '' : `min-h-screen ${tema.page}`} ${preferenciasListas ? 'transition-colors' : ''}`}>
      <div className={esPastoral ? '' : `mx-auto ${vista === 'notas' ? 'max-w-5xl' : 'max-w-4xl'} px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6`}>
        {!esPastoral && <header className="mb-4 flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#C0392B] text-white"><BookOpen className="h-5 w-5" /></span><div><h1 className={`text-xl font-bold ${tema.title}`}>Biblia</h1><p className={`text-xs ${tema.muted}`}>Leer, estudiar y guardar</p></div></div><button type="button" onClick={() => setMostrarFavoritos(v => !v)} aria-label="Favoritos" className={`relative grid h-11 w-11 place-items-center rounded-full border ${tema.circle}`}><Star className={`h-5 w-5 ${favoritos.size ? 'fill-amber-400 text-amber-400' : ''}`} />{favoritos.size > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">{favoritos.size}</span>}</button></header>}

        <div className={`overflow-hidden rounded-[26px] border shadow-sm ${esPastoral ? 'border-slate-200 bg-white' : tema.panel}`}>
          <div className={`sticky top-0 z-20 border-b p-3 backdrop-blur-xl ${esPastoral ? 'border-slate-200 bg-white/95' : `${tema.divider} ${tema.panel}`}`}>
            <div className="mx-auto grid h-[104px] max-w-2xl grid-cols-2 grid-rows-2 gap-2 text-center sm:h-[48px] sm:grid-cols-4 sm:grid-rows-1">
              <TranslationPicker label="Versión" value={trad} translations={traducciones} onChange={cambiarTrad} className={selectClass} compact />
              <select aria-label="Libro de la Biblia" value={libro} onChange={e => cambiarLibro(e.target.value)} className={`h-12 min-w-0 rounded-2xl border px-2 text-center text-xs font-bold ${selectClass}`}>{libros.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
              <select aria-label="Capítulo" value={capitulo} onChange={e => setCapitulo(Number(e.target.value))} className={`h-12 min-w-0 rounded-2xl border px-2 text-center text-xs font-bold ${selectClass}`}>{Array.from({ length: libroActual?.numberOfChapters ?? 1 }, (_, i) => i + 1).map(n => <option key={n} value={n}>Cap. {n}</option>)}</select>
              <select aria-label="Versículo" value={versoSel ?? ''} onChange={e => irAVersiculo(Number(e.target.value))} disabled={!versos.length} className={`h-12 min-w-0 rounded-2xl border px-2 text-center text-xs font-bold disabled:opacity-50 ${selectClass}`}><option value="">Versículo</option>{versos.map(v => <option key={v.n} value={v.n}>Vers. {v.n}</option>)}</select>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1.5">{tabs.map(([id, label, Icon]) => <button key={id} type="button" onClick={() => setVista(id)} className={`flex min-h-10 min-w-0 items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-bold ${vista === id ? 'bg-violet-600 text-white' : esPastoral ? 'bg-slate-100 text-slate-600' : tema.soft}`}><Icon className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{label}</span></button>)}</div>
          </div>

          {mostrarFavoritos && !esPastoral && <section className={`border-b p-4 ${tema.divider}`}><div className="mb-3 flex items-center gap-2"><Star className="h-5 w-5 fill-amber-400 text-amber-400" /><h2 className={`font-bold ${tema.title}`}>Favoritos</h2></div>{favoritosVisibles.length ? <div className="max-h-72 space-y-2 overflow-y-auto">{favoritosVisibles.map(v => <button key={v.n} type="button" onClick={() => { irAVersiculo(v.n); setMostrarFavoritos(false) }} className={`block w-full rounded-xl p-3 text-left text-sm ${tema.soft}`}><strong>{pasaje}:{v.n}</strong><span className="ml-2 opacity-80">{v.t}</span></button>)}</div> : <p className={`text-sm ${tema.muted}`}>No hay favoritos guardados en este capítulo.</p>}</section>}

          {esPastoral && versiculosProyecto.length > 0 && <div className="border-b border-violet-100 bg-violet-50/70 p-4"><div className="flex items-center justify-between"><p className="text-sm font-bold text-violet-950">Versículos del proyecto</p><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-violet-700">{versiculosProyecto.length}</span></div><div className="mt-3 flex gap-2 overflow-x-auto">{versiculosProyecto.map(v => <article key={v.id} className="min-w-[260px] rounded-2xl border border-violet-100 bg-white p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-violet-700">{v.referencia}</p><p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-600">{v.texto}</p></div>{onEliminarVersiculo && <button type="button" onClick={() => onEliminarVersiculo(v.id)} disabled={eliminandoId === v.id} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600">{eliminandoId === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button>}</div></article>)}</div></div>}

          {vista === 'leer' && <div className="p-4 sm:p-7">
            <div className="mb-3 flex items-center justify-between gap-3"><button type="button" onClick={() => setCapitulo(c => Math.max(1, c - 1))} disabled={capitulo <= 1} className={`grid h-11 w-11 place-items-center rounded-full border disabled:opacity-30 ${esPastoral ? 'border-slate-200' : tema.circle}`}><ChevronLeft className="h-5 w-5" /></button><div className="min-w-0 text-center"><h2 className={`text-2xl font-bold ${esPastoral ? 'text-slate-950' : tema.title}`}>{pasaje}</h2><p className={`mt-1 truncate text-xs ${esPastoral ? 'text-slate-500' : tema.muted}`} title={traduccionActual ? nombreTraduccion(traduccionActual) : ''}>{traduccionActual ? nombreTraduccion(traduccionActual) : ''}</p></div><button type="button" onClick={() => setCapitulo(c => Math.min(libroActual?.numberOfChapters ?? c, c + 1))} disabled={capitulo >= (libroActual?.numberOfChapters ?? 1)} className={`grid h-11 w-11 place-items-center rounded-full border disabled:opacity-30 ${esPastoral ? 'border-slate-200' : tema.circle}`}><ChevronRight className="h-5 w-5" /></button></div>
            {(subtituloCapitulo || autoria) && <div className="mx-auto mb-5 max-w-[720px] text-center">
              {subtituloCapitulo && <p className={`text-sm font-bold italic leading-6 ${esPastoral ? 'text-slate-800' : tema.text}`}>{subtituloCapitulo}</p>}
              {autoria && <p className={`mt-1 text-xs leading-5 ${esPastoral ? 'text-slate-500' : tema.muted}`}><span className="font-bold">Autoría:</span> {autoria.attribution}. {autoria.note}</p>}
            </div>}
            <div className="mx-auto mb-5 grid max-w-sm grid-cols-4 gap-2"><button type="button" aria-label={leyendo ? 'Detener lectura en voz alta' : 'Escuchar capítulo'} title={leyendo ? 'Detener lectura' : 'Escuchar capítulo'} onClick={() => leyendo ? (window.speechSynthesis?.cancel(), setLeyendo(false)) : hablar()} className="grid h-12 place-items-center rounded-full bg-indigo-600 text-white">{leyendo ? <Square className="h-4 w-4" /> : <Headphones className="h-5 w-5" />}</button><button type="button" onClick={abrirOpcionesVoz} aria-label="Opciones de voz y audio" title={vozActual ? `Opciones de audio · ${vozActual.name}` : 'Opciones de voz y audio'} className={`grid h-12 place-items-center rounded-full border ${tema.circle}`}><Volume2 className="h-5 w-5" /></button><button type="button" onClick={() => setMostrarTamano(v => !v)} className={`grid h-12 place-items-center rounded-full border ${mostrarTamano ? 'border-violet-500 bg-violet-600 text-white' : tema.circle}`}><Type className="h-5 w-5" /></button><button type="button" onClick={() => setModoLectura(actual => actual === 'claro' ? 'sepia' : actual === 'sepia' ? 'oscuro' : 'claro')} className={`grid h-12 place-items-center rounded-full border ${tema.circle}`}>{modoLectura === 'oscuro' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}</button></div>
            {mostrarTamano && <div className={`mx-auto mb-5 flex max-w-[220px] items-center justify-between rounded-full border p-1.5 ${selectClass}`}><button type="button" onClick={() => setTamanoFuente(v => Math.max(15, v - 1))} className="grid h-10 w-10 place-items-center"><Minus className="h-4 w-4" /></button><span className="text-sm font-bold">{tamanoFuente}px</span><button type="button" onClick={() => setTamanoFuente(v => Math.min(28, v + 1))} className="grid h-10 w-10 place-items-center"><Plus className="h-4 w-4" /></button></div>}
            {cargando && <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div>}{error && <p className="py-12 text-center text-sm font-semibold text-rose-600">{error}</p>}{!cargando && !error && <article className={`mx-auto max-w-[720px] ${esPastoral ? 'text-slate-800' : tema.text}`} style={{ fontSize: tamanoFuente, lineHeight: 1.95 }}>{versos.map(v => { const referencia = `${pasaje}:${v.n}`; const seleccionado = versoSel === v.n; return <div id={`versiculo-${v.n}`} key={v.n} className="relative scroll-mt-48"><p onClick={() => setVersoSel(seleccionado ? null : v.n)} className={`cursor-pointer rounded-xl px-2 py-1.5 ${seleccionado ? tema.selected : ''}`}><sup className="mr-1.5 text-[11px] font-black text-[#C0392B]">{v.n}</sup>{v.t}</p>{seleccionado && <div className="mb-3 mt-1 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 text-slate-800 shadow-lg sm:grid-cols-4">{esPastoral ? <button type="button" onClick={() => agregarAlProyecto(v)} disabled={isPending} className="col-span-2 min-h-11 rounded-xl bg-violet-600 text-xs font-bold text-white">Agregar al proyecto</button> : <button type="button" onClick={() => marcarFavorito(v)} className="min-h-11 rounded-xl bg-amber-50 text-xs font-bold text-amber-700">{favoritos.has(v.n) ? 'Quitar' : 'Guardar'}</button>}<button type="button" onClick={() => hablar(v.n)} className="min-h-11 rounded-xl bg-indigo-50 text-xs font-bold text-indigo-700">Escuchar</button><button type="button" onClick={() => compartirVersiculo(referencia, v.t)} className="min-h-11 rounded-xl bg-slate-100 text-xs font-bold text-slate-700"><Share2 className="mr-1 inline h-3.5 w-3.5" />Compartir</button>{!esPastoral && <Link href={`/estudios/profundo?pasaje=${encodeURIComponent(`${referencia} — ${v.t}`)}`} className="flex min-h-11 items-center justify-center rounded-xl bg-[#C0392B] text-xs font-bold text-white">Estudiar</Link>}</div>}</div> })}</article>}
          </div>}

          {vista === 'estudio' && <div className="space-y-4 p-5 sm:p-7">
            <div className={`rounded-2xl border p-5 ${selectClass}`}>
              <Sparkles className="h-6 w-6 text-violet-600" />
              <h2 className="mt-3 text-xl font-bold">Estudio del pasaje</h2>
              <p className="mt-2 text-sm leading-6 opacity-75">
                Autoría y contexto parten de {pasajeEstudio}. El contenido verificado permanece separado de cualquier respuesta generada por IA.
              </p>
            </div>
            <BibleHistoricalContextPanel pasaje={pasajeEstudio} modo={esPastoral ? 'claro' : modoLectura} />
            <BibleTextualStudyPanel pasaje={pasajeEstudio} translationId={trad} modo={esPastoral ? 'claro' : modoLectura} />
            <Link href={`/estudios/profundo?pasaje=${encodeURIComponent(pasajeEstudio)}`} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white">
              <Sparkles className="h-4 w-4" />
              Abrir estudio profundo
            </Link>
          </div>}

          {vista === 'comparar' && <div className="p-5 sm:p-7">
            <section className={`mb-5 rounded-3xl border p-4 ${selectClass}`}>
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide opacity-65">Modo de comparación</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setModoComparacion('dos')} className={`min-h-11 rounded-full px-3 text-xs font-bold ${modoComparacion === 'dos' ? 'bg-violet-600 text-white' : tema.soft}`}>Dos Biblias</button>
                <button type="button" onClick={() => setModoComparacion('todas')} className={`min-h-11 rounded-full px-3 text-xs font-bold ${modoComparacion === 'todas' ? 'bg-violet-600 text-white' : tema.soft}`}>Todas las versiones</button>
              </div>
            </section>

            {modoComparacion === 'dos' ? <>
              <section className={`mb-5 rounded-3xl border p-4 ${selectClass}`}><p className="mb-3 text-center text-xs font-black uppercase tracking-wide opacity-70">Comparar el mismo pasaje en dos Biblias</p><div className="grid gap-4 sm:grid-cols-2"><TranslationPicker label="Biblia 1" value={trad} translations={traducciones} onChange={cambiarTrad} className={selectClass} /><TranslationPicker label="Biblia 2" value={tradComparada} translations={traducciones.filter(t => t.id !== trad)} onChange={setTradComparada} className={selectClass} /></div></section>
              {cargandoComparacion ? <div className="grid place-items-center py-14"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div> : <div className="space-y-3">{versos.map(v => { const otro = versosComparados.find(x => x.n === v.n); return <article key={v.n} className={`grid gap-3 rounded-2xl border p-3 sm:grid-cols-2 ${selectClass}`}><div className="rounded-xl bg-violet-500/10 p-4"><p className="text-[11px] font-black uppercase text-violet-600">{etiquetaTraduccion(traduccionActual)}</p><p className="mt-2 text-sm leading-6"><sup className="mr-1 font-bold text-[#C0392B]">{v.n}</sup>{v.t}</p></div><div className="rounded-xl bg-indigo-500/10 p-4"><p className="text-[11px] font-black uppercase text-indigo-600">{etiquetaTraduccion(traduccionComparada)}</p><p className="mt-2 text-sm leading-6"><sup className="mr-1 font-bold text-[#C0392B]">{v.n}</sup>{otro?.t || 'No disponible'}</p></div></article> })}</div>}
            </> : <>
              <section className={`mb-5 rounded-3xl border p-4 ${selectClass}`}>
                <p className="text-sm font-bold">Todas las versiones · {pasaje}:{numeroComparacion}</p>
                <p className="mt-1 text-xs opacity-65">El mismo versículo en todas las traducciones disponibles.</p>
                <label className="mt-4 block"><span className="mb-1 block text-[11px] font-black uppercase tracking-wide opacity-65">Versículo</span><select aria-label="Versículo para comparar en todas las versiones" value={numeroComparacion} onChange={e => setVersoSel(Number(e.target.value))} className={`h-12 w-full rounded-2xl border px-3 text-center text-sm font-bold ${selectClass}`}>{versos.map(v => <option key={v.n} value={v.n}>Versículo {v.n}</option>)}</select></label>
              </section>
              {cargandoTodas ? <div className="grid place-items-center py-14"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div> : <div className="max-h-[62vh] space-y-3 overflow-y-auto overscroll-contain pr-1">{resultadosTodas.map(resultado => <article key={resultado.traduccion.id} className={`rounded-2xl border p-4 ${selectClass}`}><p className="text-[11px] font-black uppercase tracking-wide text-violet-600">{nombreTraduccion(resultado.traduccion)}</p><p className={`mt-2 text-sm leading-6 ${resultado.disponible ? '' : 'opacity-55'}`}><sup className="mr-1.5 font-black text-[#C0392B]">{numeroComparacion}</sup>{resultado.texto}</p></article>)}</div>}
            </>}
          </div>}

          {vista === 'notas' && !esPastoral && <BibleNotesWorkspace modo={modoLectura} embedded />}
        </div>
      </div>
    </section>
  )
}
