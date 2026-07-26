'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  BookOpen,
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
import { mostrarToast } from '@/lib/ui/toast'

const API = 'https://bible.helloao.org/api'
const POS_KEY = 'vida-biblia-posicion'
const PREF_KEY = 'vida-biblia-preferencias'
const NOTAS_KEY = 'vida-biblia-notas'

type Traduccion = { id: string; name: string; language: string; shortName?: string }
type Libro = { id: string; name: string; numberOfChapters: number }
type VersoApi = { type: string; number?: number; content?: unknown[] }
type Verso = { n: number; t: string }
type ModoLectura = 'claro' | 'oscuro' | 'sepia'
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

function textoDeVerso(v: VersoApi): string {
  if (!Array.isArray(v.content)) return ''
  return v.content.map((c) => {
    if (typeof c === 'string') return c
    if (c && typeof c === 'object' && 'text' in (c as Record<string, unknown>)) {
      return String((c as Record<string, unknown>).text)
    }
    return ''
  }).join(' ').replace(/\s+/g, ' ').trim()
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

function etiquetaTraduccion(t: Traduccion): string {
  return t.shortName || t.name
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
  const [mostrarTamano, setMostrarTamano] = useState(false)
  const [vista, setVista] = useState<Vista>('leer')
  const [voces, setVoces] = useState<SpeechSynthesisVoice[]>([])
  const [vozSeleccionada, setVozSeleccionada] = useState('')
  const [notas, setNotas] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()
  const saltoRef = useRef<Posicion | null>(null)
  const listoRef = useRef(false)

  useEffect(() => {
    const prefs = leerJson<Preferencias>(PREF_KEY, { modo: 'claro', fuente: 18 })
    setModoLectura(['claro', 'oscuro', 'sepia'].includes(prefs.modo) ? prefs.modo : 'claro')
    setTamanoFuente(Math.min(28, Math.max(15, Number(prefs.fuente) || 18)))
    setNotas(leerJson<Record<string, string>>(NOTAS_KEY, {}))
  }, [])

  useEffect(() => {
    try { localStorage.setItem(PREF_KEY, JSON.stringify({ modo: modoLectura, fuente: tamanoFuente })) } catch {}
  }, [modoLectura, tamanoFuente])

  useEffect(() => {
    try { localStorage.setItem(NOTAS_KEY, JSON.stringify(notas)) } catch {}
  }, [notas])

  useEffect(() => {
    const cargarVoces = () => {
      const disponibles = window.speechSynthesis?.getVoices().filter(v => v.lang.toLowerCase().startsWith('es')) ?? []
      setVoces(disponibles)
      setVozSeleccionada(prev => {
        if (prev && disponibles.some(v => v.name === prev)) return prev
        return disponibles.find(v => /paulina/i.test(v.name))?.name ?? disponibles[0]?.name ?? ''
      })
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
      const espanolas = todas.filter(t => t.language === 'spa' || t.language === 'es')
      const ingles = todas.filter(t => ['eng', 'en'].includes(t.language)).slice(0, 3)
      const lista = [...espanolas, ...ingles]
      setTraducciones(lista)
      const guardada = saltoRef.current
      const reinaValera = lista.find(t => /reina[ -]?valera.*1909|rv1909|rvr1909/i.test(`${t.name} ${t.shortName ?? ''} ${t.id}`))
      const inicial = guardada && lista.some(t => t.id === guardada.trad)
        ? guardada.trad
        : reinaValera?.id ?? lista[0]?.id ?? ''
      setTrad(inicial)
      setTradComparada(lista.find(t => t.id !== inicial)?.id ?? inicial)
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
      } else {
        setLibro(prev => bs.some(b => b.id === prev) ? prev : bs[0]?.id ?? '')
      }
      setTimeout(() => { listoRef.current = true }, 0)
    }).catch(() => setError('No se pudieron cargar los libros.'))
  }, [trad])

  const libroActual = useMemo(() => libros.find(b => b.id === libro), [libros, libro])
  const traduccionActual = useMemo(() => traducciones.find(t => t.id === trad), [traducciones, trad])
  const pasaje = `${libroActual?.name ?? ''} ${capitulo}`
  const notaKey = `${trad}:${libro}:${capitulo}`

  useEffect(() => {
    if (!trad || !libro) return
    let activo = true
    setCargando(true)
    setError(null)
    setVersoSel(null)
    setMostrarFavoritos(false)
    window.speechSynthesis?.cancel()
    setLeyendo(false)

    fetch(`${API}/${trad}/${libro}/${capitulo}.json`).then(r => {
      if (!r.ok) throw new Error('chapter')
      return r.json()
    }).then(d => {
      if (!activo) return
      const contenido: VersoApi[] = d.chapter?.content ?? []
      setVersos(contenido.filter(c => c.type === 'verse' && typeof c.number === 'number').map(c => ({ n: c.number as number, t: textoDeVerso(c) })))
    }).catch(() => activo && setError('No se pudo cargar el capítulo.')).finally(() => activo && setCargando(false))

    favoritosDelCapitulo(trad, libro, capitulo)
      .then(favs => activo && setFavoritos(new Set(favs)))
      .catch(() => activo && setFavoritos(new Set()))

    if (listoRef.current) {
      try { localStorage.setItem(POS_KEY, JSON.stringify({ trad, libro, capitulo })) } catch {}
    }
    return () => { activo = false }
  }, [trad, libro, capitulo])

  useEffect(() => {
    if (vista !== 'comparar' || !tradComparada || !libro) return
    let activo = true
    setCargandoComparacion(true)
    fetch(`${API}/${tradComparada}/${libro}/${capitulo}.json`).then(r => r.json()).then(d => {
      if (!activo) return
      const contenido: VersoApi[] = d.chapter?.content ?? []
      setVersosComparados(contenido.filter(c => c.type === 'verse' && typeof c.number === 'number').map(c => ({ n: c.number as number, t: textoDeVerso(c) })))
    }).catch(() => activo && setVersosComparados([])).finally(() => activo && setCargandoComparacion(false))
    return () => { activo = false }
  }, [vista, tradComparada, libro, capitulo])

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

  const detener = () => { window.speechSynthesis?.cancel(); setLeyendo(false) }
  const cambiarLibro = (id: string) => { setLibro(id); setCapitulo(1) }
  const cambiarTrad = (id: string) => { setTrad(id); setCapitulo(1) }
  const irAnterior = () => setCapitulo(c => Math.max(1, c - 1))
  const irSiguiente = () => setCapitulo(c => Math.min(libroActual?.numberOfChapters ?? c, c + 1))
  const irAVersiculo = (numero: number) => {
    if (!numero) return
    setVersoSel(numero)
    requestAnimationFrame(() => document.getElementById(`versiculo-${numero}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }

  const siguienteVoz = () => {
    if (!voces.length) return mostrarToast('No hay voces en español disponibles')
    const actual = Math.max(0, voces.findIndex(v => v.name === vozSeleccionada))
    const siguiente = voces[(actual + 1) % voces.length]
    setVozSeleccionada(siguiente.name)
    mostrarToast(siguiente.name)
  }

  const siguienteTema = () => {
    setModoLectura(actual => actual === 'claro' ? 'sepia' : actual === 'sepia' ? 'oscuro' : 'claro')
  }

  const marcarFavorito = async (v: Verso) => {
    if (!libroActual || guardandoVerso !== null) return
    setGuardandoVerso(v.n)
    try {
      const resultado = await toggleFavorito({ traduccion: trad, libro_id: libro, libro_nombre: libroActual.name, capitulo, verso: v.n, texto: v.t })
      if ('error' in resultado) return mostrarToast(resultado.error || 'No se pudo guardar el favorito')
      setFavoritos(prev => {
        const siguiente = new Set(prev)
        if (resultado.favorito) siguiente.add(v.n)
        else siguiente.delete(v.n)
        return siguiente
      })
      mostrarToast(resultado.favorito ? 'Versículo guardado' : 'Versículo eliminado de favoritos')
    } finally {
      setGuardandoVerso(null)
    }
  }

  const compartirVersiculo = async (referencia: string, texto: string) => {
    const contenido = `“${texto}”\n— ${referencia}\n\nCompartido desde Vida Internacional`
    try {
      if (navigator.share) await navigator.share({ title: referencia, text: contenido })
      else {
        await navigator.clipboard.writeText(contenido)
        mostrarToast('Versículo copiado')
      }
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') mostrarToast('No se pudo compartir')
    }
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
    claro: {
      page: 'bg-[#f7f7f4]', panel: 'bg-white border-slate-200', text: 'text-slate-800', title: 'text-slate-950', muted: 'text-slate-500', selected: 'bg-violet-50 ring-1 ring-violet-200', control: 'border-slate-200 bg-white text-slate-900', soft: 'bg-slate-100 text-slate-700', circle: 'border-slate-200 bg-white text-slate-700', divider: 'border-slate-200',
    },
    oscuro: {
      page: 'bg-slate-950', panel: 'bg-slate-900 border-slate-800', text: 'text-slate-100', title: 'text-white', muted: 'text-slate-400', selected: 'bg-violet-950/70 ring-1 ring-violet-700', control: 'border-slate-700 bg-slate-900 text-white', soft: 'bg-slate-800 text-slate-100', circle: 'border-slate-700 bg-slate-900 text-white', divider: 'border-slate-800',
    },
    sepia: {
      page: 'bg-[#efe5d0]', panel: 'bg-[#fffaf0] border-[#dac8a5]', text: 'text-[#493c2d]', title: 'text-[#2d241b]', muted: 'text-[#7d6b54]', selected: 'bg-[#ead9b5] ring-1 ring-[#c9ad78]', control: 'border-[#cdb991] bg-[#fff8e8] text-[#382d21]', soft: 'bg-[#ead9b5] text-[#493c2d]', circle: 'border-[#cdb991] bg-[#fff8e8] text-[#493c2d]', divider: 'border-[#dac8a5]',
    },
  }[modoLectura]

  const tabs: Array<[Vista, string, typeof BookOpen]> = [
    ['leer', 'Leer', BookOpen],
    ['estudio', 'Estudio', Sparkles],
    ['comparar', 'Comparar', Copy],
    ['notas', 'Notas', NotebookPen],
  ]

  const favoritosVisibles = versos.filter(v => favoritos.has(v.n))
  const vozActual = voces.find(v => v.name === vozSeleccionada)

  return (
    <section className={`${esPastoral ? '' : `min-h-screen ${tema.page}`} transition-colors`}>
      <div className={esPastoral ? '' : 'mx-auto max-w-4xl px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6'}>
        {!esPastoral && (
          <header className="mb-4 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#C0392B] text-white"><BookOpen className="h-5 w-5" /></span>
              <div><h1 className={`text-xl font-bold ${tema.title}`}>Biblia</h1><p className={`text-xs ${tema.muted}`}>Leer, estudiar y guardar</p></div>
            </div>
            <button type="button" onClick={() => setMostrarFavoritos(v => !v)} aria-label="Favoritos" aria-expanded={mostrarFavoritos} className={`relative grid h-11 w-11 place-items-center rounded-full border ${tema.circle}`}>
              <Star className={`h-5 w-5 ${favoritos.size ? 'fill-amber-400 text-amber-400' : ''}`} />
              {favoritos.size > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">{favoritos.size}</span>}
            </button>
          </header>
        )}

        <div className={`overflow-hidden rounded-[26px] border shadow-sm ${esPastoral ? 'border-slate-200 bg-white' : tema.panel}`}>
          <div className={`sticky top-0 z-20 border-b p-3 backdrop-blur-xl ${esPastoral ? 'border-slate-200 bg-white/95' : `${tema.divider} ${tema.panel}`}`}>
            <div className="mx-auto grid max-w-2xl grid-cols-2 gap-2 text-center sm:grid-cols-4">
              <select aria-label="Versión de la Biblia" title={traduccionActual ? nombreTraduccion(traduccionActual) : 'Versión'} value={trad} onChange={e => cambiarTrad(e.target.value)} className={`min-h-10 min-w-0 rounded-full border px-2 text-center text-xs font-bold ${esPastoral ? 'border-slate-200 bg-white text-slate-900' : tema.control}`}>
                {traducciones.map(t => <option key={t.id} value={t.id}>{nombreTraduccion(t)}</option>)}
              </select>
              <select aria-label="Libro de la Biblia" value={libro} onChange={e => cambiarLibro(e.target.value)} className={`min-h-10 min-w-0 rounded-full border px-2 text-center text-xs font-bold ${esPastoral ? 'border-slate-200 bg-white text-slate-900' : tema.control}`}>
                {libros.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select aria-label="Capítulo" value={capitulo} onChange={e => setCapitulo(Number(e.target.value))} className={`min-h-10 rounded-full border px-2 text-center text-xs font-bold ${esPastoral ? 'border-slate-200 bg-white text-slate-900' : tema.control}`}>
                {Array.from({ length: libroActual?.numberOfChapters ?? 1 }, (_, i) => i + 1).map(n => <option key={n} value={n}>Cap. {n}</option>)}
              </select>
              <select aria-label="Versículo" value={versoSel ?? ''} onChange={e => irAVersiculo(Number(e.target.value))} disabled={!versos.length} className={`min-h-10 rounded-full border px-2 text-center text-xs font-bold disabled:opacity-50 ${esPastoral ? 'border-slate-200 bg-white text-slate-900' : tema.control}`}>
                <option value="">Versículo</option>
                {versos.map(v => <option key={v.n} value={v.n}>Vers. {v.n}</option>)}
              </select>
            </div>

            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {tabs.map(([id, label, Icon]) => (
                <button key={id} type="button" onClick={() => setVista(id)} className={`flex min-h-10 min-w-0 items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-bold ${vista === id ? 'bg-violet-600 text-white' : esPastoral ? 'bg-slate-100 text-slate-600' : tema.soft}`}>
                  <Icon className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {mostrarFavoritos && !esPastoral && (
            <section className={`border-b p-4 ${tema.divider}`}>
              <div className="mb-3 flex items-center gap-2"><Star className="h-5 w-5 fill-amber-400 text-amber-400" /><h2 className={`font-bold ${tema.title}`}>Favoritos</h2></div>
              {favoritosVisibles.length ? (
                <div className="max-h-72 space-y-2 overflow-y-auto overscroll-contain pr-1">
                  {favoritosVisibles.map(v => (
                    <button key={v.n} type="button" onClick={() => { irAVersiculo(v.n); setMostrarFavoritos(false) }} className={`block w-full rounded-xl p-3 text-left text-sm ${tema.soft}`}>
                      <strong>{pasaje}:{v.n}</strong><span className="ml-2 opacity-80">{v.t}</span>
                    </button>
                  ))}
                </div>
              ) : <p className={`text-sm ${tema.muted}`}>No hay favoritos guardados en este capítulo.</p>}
            </section>
          )}

          {esPastoral && versiculosProyecto.length > 0 && (
            <div className="border-b border-violet-100 bg-violet-50/70 p-4 sm:p-5">
              <div className="flex items-center justify-between"><div><p className="text-sm font-bold text-violet-950">Versículos del proyecto</p><p className="mt-0.5 text-xs text-violet-700">Se actualizan automáticamente.</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-violet-700">{versiculosProyecto.length}</span></div>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{versiculosProyecto.map(v => <article key={v.id} className="min-w-[260px] rounded-2xl border border-violet-100 bg-white p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-violet-700">{v.referencia}</p><p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-600">{v.texto}</p></div>{onEliminarVersiculo && <button type="button" onClick={() => onEliminarVersiculo(v.id)} disabled={eliminandoId === v.id} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600">{eliminandoId === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button>}</div></article>)}</div>
            </div>
          )}

          {vista === 'leer' && (
            <div className="p-4 sm:p-7">
              <div className="mb-4 flex items-center justify-between gap-3">
                <button type="button" onClick={irAnterior} disabled={capitulo <= 1} className={`grid h-11 w-11 place-items-center rounded-full border disabled:opacity-30 ${esPastoral ? 'border-slate-200' : tema.circle}`}><ChevronLeft className="h-5 w-5" /></button>
                <div className="min-w-0 text-center"><h2 className={`text-2xl font-bold ${esPastoral ? 'text-slate-950' : tema.title}`}>{pasaje}</h2><p className={`mt-1 truncate text-xs ${esPastoral ? 'text-slate-500' : tema.muted}`} title={traduccionActual ? nombreTraduccion(traduccionActual) : ''}>{traduccionActual ? nombreTraduccion(traduccionActual) : ''}</p></div>
                <button type="button" onClick={irSiguiente} disabled={capitulo >= (libroActual?.numberOfChapters ?? 1)} className={`grid h-11 w-11 place-items-center rounded-full border disabled:opacity-30 ${esPastoral ? 'border-slate-200' : tema.circle}`}><ChevronRight className="h-5 w-5" /></button>
              </div>

              <div className="mx-auto mb-5 grid max-w-sm grid-cols-4 gap-2">
                <button type="button" onClick={() => leyendo ? detener() : hablar()} aria-label={leyendo ? 'Detener audio' : 'Escuchar capítulo'} title={leyendo ? 'Detener' : 'Escuchar capítulo'} className="grid h-12 w-full place-items-center rounded-full bg-indigo-600 text-white">{leyendo ? <Square className="h-4 w-4" /> : <Headphones className="h-5 w-5" />}</button>
                <button type="button" onClick={siguienteVoz} aria-label={`Cambiar voz. Actual: ${vozActual?.name ?? 'voz del sistema'}`} title={vozActual?.name ?? 'Cambiar voz'} className={`grid h-12 w-full place-items-center rounded-full border ${esPastoral ? 'border-slate-200 bg-white text-violet-700' : tema.circle}`}><Volume2 className="h-5 w-5" /></button>
                <button type="button" onClick={() => setMostrarTamano(v => !v)} aria-label="Cambiar tamaño de letra" aria-expanded={mostrarTamano} title={`Tamaño ${tamanoFuente}`} className={`grid h-12 w-full place-items-center rounded-full border ${mostrarTamano ? 'border-violet-500 bg-violet-600 text-white' : esPastoral ? 'border-slate-200 bg-white text-slate-700' : tema.circle}`}><Type className="h-5 w-5" /></button>
                {!esPastoral ? <button type="button" onClick={siguienteTema} aria-label="Cambiar tema" title={`Tema ${modoLectura}`} className={`grid h-12 w-full place-items-center rounded-full border ${tema.circle}`}>{modoLectura === 'oscuro' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}</button> : <button type="button" onClick={() => hablar(versoSel ?? 1)} aria-label="Escuchar desde el versículo seleccionado" className="grid h-12 w-full place-items-center rounded-full border border-slate-200 bg-white text-slate-700"><Volume2 className="h-5 w-5" /></button>}
              </div>

              {mostrarTamano && (
                <div className={`mx-auto mb-5 flex max-w-[220px] items-center justify-between rounded-full border p-1.5 ${esPastoral ? 'border-slate-200 bg-white text-slate-700' : tema.control}`}>
                  <button type="button" aria-label="Reducir letra" onClick={() => setTamanoFuente(v => Math.max(15, v - 1))} className="grid h-10 w-10 place-items-center rounded-full"><Minus className="h-4 w-4" /></button>
                  <span className="text-sm font-bold">{tamanoFuente}px</span>
                  <button type="button" aria-label="Aumentar letra" onClick={() => setTamanoFuente(v => Math.min(28, v + 1))} className="grid h-10 w-10 place-items-center rounded-full"><Plus className="h-4 w-4" /></button>
                </div>
              )}

              {cargando && <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div>}
              {error && <p className="py-12 text-center text-sm font-semibold text-rose-600">{error}</p>}
              {!cargando && !error && <article className={`mx-auto max-w-[720px] ${esPastoral ? 'text-slate-800' : tema.text}`} style={{ fontSize: tamanoFuente, lineHeight: 1.95 }}>{versos.map(v => {
                const referencia = `${pasaje}:${v.n}`
                const seleccionado = versoSel === v.n
                return <div id={`versiculo-${v.n}`} key={v.n} className="relative scroll-mt-48"><p onClick={() => setVersoSel(seleccionado ? null : v.n)} className={`cursor-pointer rounded-xl px-2 py-1.5 transition ${seleccionado ? (esPastoral ? 'bg-violet-50 ring-1 ring-violet-200' : tema.selected) : ''}`}><sup className="mr-1.5 text-[11px] font-black text-[#C0392B]">{v.n}</sup>{v.t}{favoritos.has(v.n) && <Star className="ml-1.5 inline h-3 w-3 fill-amber-400 text-amber-400" />}</p>{seleccionado && <div className="mb-3 mt-1 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 text-slate-800 shadow-lg sm:grid-cols-4">{esPastoral ? <button type="button" onClick={() => agregarAlProyecto(v)} disabled={isPending} className="col-span-2 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 text-xs font-bold text-white sm:col-span-2">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Agregar al proyecto</button> : <button type="button" onClick={() => marcarFavorito(v)} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-amber-50 px-3 text-xs font-bold text-amber-700"><Star className="h-3.5 w-3.5" />{favoritos.has(v.n) ? 'Quitar' : 'Guardar'}</button>}<button type="button" onClick={() => hablar(v.n)} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-indigo-50 px-3 text-xs font-bold text-indigo-700"><Volume2 className="h-3.5 w-3.5" />Escuchar</button><button type="button" onClick={() => compartirVersiculo(referencia, v.t)} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700"><Share2 className="h-3.5 w-3.5" />Compartir</button>{!esPastoral && <Link href={`/estudios/profundo?pasaje=${encodeURIComponent(`${referencia} — ${v.t}`)}`} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#C0392B] px-3 text-xs font-bold text-white"><Sparkles className="h-3.5 w-3.5" />Estudiar</Link>}</div>}</div>
              })}</article>}
            </div>
          )}

          {vista === 'estudio' && (
            <div className="p-5 sm:p-7">
              <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
                <Sparkles className="h-6 w-6 text-violet-600" />
                <h2 className="mt-3 text-xl font-bold text-violet-950">Estudio del capítulo</h2>
                <p className="mt-2 text-sm leading-6 text-violet-800">Abre el estudio profundo del capítulo actual o selecciona primero un versículo desde Leer.</p>
                <Link href={`/estudios/profundo?pasaje=${encodeURIComponent(versoSel ? `${pasaje}:${versoSel}` : pasaje)}`} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white"><Sparkles className="h-4 w-4" />Abrir estudio profundo</Link>
              </div>
            </div>
          )}

          {vista === 'comparar' && (
            <div className="p-5 sm:p-7">
              <label className="mb-4 block"><span className={`mb-1 block text-xs font-bold ${tema.muted}`}>Segunda traducción</span><select value={tradComparada} onChange={e => setTradComparada(e.target.value)} className={`min-h-11 w-full rounded-xl border px-3 text-sm ${tema.control}`}>{traducciones.filter(t => t.id !== trad).map(t => <option key={t.id} value={t.id}>{nombreTraduccion(t)}</option>)}</select></label>
              {cargandoComparacion ? <div className="grid place-items-center py-14"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div> : <div className="space-y-3">{versos.map(v => { const otro = versosComparados.find(x => x.n === v.n); return <article key={v.n} className={`grid gap-3 rounded-2xl border p-4 sm:grid-cols-2 ${tema.control}`}><div><p className="text-[10px] font-bold uppercase text-violet-600">{traduccionActual ? etiquetaTraduccion(traduccionActual) : ''}</p><p className="mt-2 text-sm leading-6"><sup className="mr-1 font-bold text-[#C0392B]">{v.n}</sup>{v.t}</p></div><div><p className="text-[10px] font-bold uppercase text-indigo-600">{traducciones.find(t => t.id === tradComparada) ? etiquetaTraduccion(traducciones.find(t => t.id === tradComparada) as Traduccion) : ''}</p><p className="mt-2 text-sm leading-6"><sup className="mr-1 font-bold text-[#C0392B]">{v.n}</sup>{otro?.t || 'No disponible'}</p></div></article> })}</div>}
            </div>
          )}

          {vista === 'notas' && (
            <div className="p-5 sm:p-7">
              <div className={`rounded-2xl border p-5 ${tema.control}`}>
                <NotebookPen className="h-6 w-6 text-violet-600" />
                <h2 className={`mt-3 text-lg font-bold ${tema.title}`}>Notas de {pasaje}</h2>
                <p className={`mt-1 text-xs ${tema.muted}`}>Se guardan automáticamente en este dispositivo.</p>
                <textarea value={notas[notaKey] ?? ''} onChange={e => setNotas(prev => ({ ...prev, [notaKey]: e.target.value }))} placeholder="Escribe observaciones, ideas o aplicaciones…" className={`mt-4 min-h-48 w-full resize-y rounded-xl border p-3 text-sm outline-none ${tema.control}`} />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
