'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Copy,
  Headphones,
  Highlighter,
  Loader2,
  Minus,
  Moon,
  MoreHorizontal,
  NotebookPen,
  Plus,
  Share2,
  Sparkles,
  Square,
  Star,
  Sun,
  Trash2,
  Volume2,
  X,
} from 'lucide-react'
import { toggleFavorito, favoritosDelCapitulo, type Favorito } from '@/app/actions/biblia'
import { agregarVersiculoAlProyecto } from '@/app/actions/pastoral-proyecto-versiculos'
import { mostrarToast } from '@/lib/ui/toast'

const API = 'https://bible.helloao.org/api'
const POS_KEY = 'vida-biblia-posicion'
const PREF_KEY = 'vida-biblia-preferencias'

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
    if (c && typeof c === 'object' && 'text' in (c as Record<string, unknown>)) return String((c as Record<string, unknown>).text)
    return ''
  }).join(' ').replace(/\s+/g, ' ').trim()
}

function leerPosicion(): Posicion | null {
  try {
    const raw = localStorage.getItem(POS_KEY)
    return raw ? JSON.parse(raw) as Posicion : null
  } catch { return null }
}

function leerPreferencias(): Preferencias {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (!raw) return { modo: 'claro', fuente: 18 }
    const parsed = JSON.parse(raw) as Preferencias
    return {
      modo: ['claro', 'oscuro', 'sepia'].includes(parsed.modo) ? parsed.modo : 'claro',
      fuente: Math.min(24, Math.max(15, Number(parsed.fuente) || 18)),
    }
  } catch { return { modo: 'claro', fuente: 18 } }
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
  const [guardandoVerso, setGuardandoVerso] = useState<number | null>(null)
  const [modoLectura, setModoLectura] = useState<ModoLectura>('claro')
  const [tamanoFuente, setTamanoFuente] = useState(18)
  const [vista, setVista] = useState<Vista>('leer')
  const [isPending, startTransition] = useTransition()
  const saltoRef = useRef<Posicion | null>(null)
  const listoRef = useRef(false)

  useEffect(() => {
    const prefs = leerPreferencias()
    setModoLectura(prefs.modo)
    setTamanoFuente(prefs.fuente)
  }, [])

  useEffect(() => {
    try { localStorage.setItem(PREF_KEY, JSON.stringify({ modo: modoLectura, fuente: tamanoFuente })) } catch {}
  }, [modoLectura, tamanoFuente])

  useEffect(() => {
    saltoRef.current = leerPosicion()
    fetch(`${API}/available_translations.json`).then(r => r.json()).then(d => {
      const todas: Traduccion[] = d.translations ?? []
      const lista = [...todas.filter(t => t.language === 'spa' || t.language === 'es'), ...todas.filter(t => ['eng', 'en'].includes(t.language)).slice(0, 3)]
      setTraducciones(lista)
      const guardada = saltoRef.current
      const inicial = guardada && lista.some(t => t.id === guardada.trad) ? guardada.trad : lista[0]?.id ?? ''
      setTrad(inicial)
      setTradComparada(lista.find(t => t.id !== inicial)?.id ?? inicial)
    }).catch(() => setError('No se pudo conectar con la biblioteca bíblica.'))
  }, [])

  useEffect(() => {
    if (!trad) return
    fetch(`${API}/${trad}/books.json`).then(r => r.json()).then(d => {
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

  const libroActual = useMemo(() => libros.find(b => b.id === libro), [libros, libro])
  const traduccionActual = useMemo(() => traducciones.find(t => t.id === trad), [traducciones, trad])
  const pasaje = `${libroActual?.name ?? ''} ${capitulo}`

  useEffect(() => {
    if (!trad || !libro) return
    let activo = true
    setCargando(true)
    setError(null)
    setVersoSel(null)
    window.speechSynthesis?.cancel()
    setLeyendo(false)
    fetch(`${API}/${trad}/${libro}/${capitulo}.json`).then(r => r.json()).then(d => {
      if (!activo) return
      const contenido: VersoApi[] = d.chapter?.content ?? []
      setVersos(contenido.filter(c => c.type === 'verse' && typeof c.number === 'number').map(c => ({ n: c.number as number, t: textoDeVerso(c) })))
    }).catch(() => activo && setError('No se pudo cargar el capítulo.')).finally(() => activo && setCargando(false))
    favoritosDelCapitulo(trad, libro, capitulo).then(favs => activo && setFavoritos(new Set(favs))).catch(() => activo && setFavoritos(new Set()))
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
    const voz = synth.getVoices().find(v => v.lang.startsWith('es'))
    if (voz) u.voice = voz
    u.lang = 'es'; u.rate = 0.95
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

  const marcarFavorito = async (v: Verso) => {
    if (!libroActual || guardandoVerso !== null) return
    setGuardandoVerso(v.n)
    try {
      const resultado = await toggleFavorito({ traduccion: trad, libro_id: libro, libro_nombre: libroActual.name, capitulo, verso: v.n, texto: v.t })
      if ('error' in resultado) return mostrarToast(resultado.error || 'No se pudo guardar el favorito')
      setFavoritos(prev => {
        const siguiente = new Set(prev)
        if (resultado.favorito) siguiente.add(v.n); else siguiente.delete(v.n)
        return siguiente
      })
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
    claro: { page: 'bg-[#f7f7f4]', panel: 'bg-white border-slate-200', text: 'text-slate-800', title: 'text-slate-950', muted: 'text-slate-500', selected: 'bg-violet-50 ring-1 ring-violet-200' },
    oscuro: { page: 'bg-slate-950', panel: 'bg-slate-900 border-slate-800', text: 'text-slate-200', title: 'text-white', muted: 'text-slate-400', selected: 'bg-violet-950/70 ring-1 ring-violet-800' },
    sepia: { page: 'bg-[#efe5d0]', panel: 'bg-[#fffaf0] border-[#dac8a5]', text: 'text-[#493c2d]', title: 'text-[#2d241b]', muted: 'text-[#7d6b54]', selected: 'bg-[#ead9b5] ring-1 ring-[#c9ad78]' },
  }[modoLectura]

  const tabs: Array<[Vista, string, typeof BookOpen]> = [
    ['leer', 'Leer', BookOpen],
    ['estudio', 'Estudio', Sparkles],
    ['comparar', 'Comparar', Copy],
    ['notas', 'Notas', NotebookPen],
  ]

  return (
    <section className={`${esPastoral ? '' : `min-h-screen ${tema.page}`} transition-colors`}>
      <div className={esPastoral ? '' : 'mx-auto max-w-4xl px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6'}>
        {!esPastoral && (
          <header className="mb-4 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#C0392B] text-white"><BookOpen className="h-5 w-5" /></span><div><h1 className={`text-xl font-bold ${tema.title}`}>Biblia</h1><p className={`text-xs ${tema.muted}`}>Leer, estudiar y guardar</p></div></div>
            <button type="button" className={`grid h-11 w-11 place-items-center rounded-full border ${tema.panel}`} aria-label="Más opciones"><MoreHorizontal className="h-5 w-5" /></button>
          </header>
        )}

        <div className={`overflow-hidden ${esPastoral ? 'rounded-[24px] border border-slate-200 bg-white' : `rounded-[26px] border shadow-sm ${tema.panel}`}`}>
          <div className={`sticky top-0 z-20 border-b p-3 backdrop-blur-xl ${esPastoral ? 'border-slate-200 bg-white/95' : `${tema.panel} bg-opacity-95`}`}>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 sm:grid-cols-[180px_1fr_130px]">
              <select value={trad} onChange={e => cambiarTrad(e.target.value)} className="min-h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800">{traducciones.map(t => <option key={t.id} value={t.id}>{t.shortName || t.name}</option>)}</select>
              <select value={libro} onChange={e => cambiarLibro(e.target.value)} className="min-h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800">{libros.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
              <select value={capitulo} onChange={e => setCapitulo(Number(e.target.value))} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800">{Array.from({ length: libroActual?.numberOfChapters ?? 1 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}</select>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex min-w-max gap-1.5">{tabs.map(([id,label,Icon])=><button key={id} type="button" onClick={()=>setVista(id)} className={`flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold ${vista===id?'bg-violet-600 text-white':'bg-slate-100 text-slate-600'}`}><Icon className="h-3.5 w-3.5"/>{label}</button>)}</div>
              <div className="flex shrink-0 items-center gap-1 rounded-xl bg-slate-100 p-1"><button type="button" onClick={()=>setTamanoFuente(v=>Math.max(15,v-1))} className="grid h-8 w-8 place-items-center"><Minus className="h-3.5 w-3.5"/></button><button type="button" onClick={()=>setTamanoFuente(v=>Math.min(24,v+1))} className="grid h-8 w-8 place-items-center"><Plus className="h-3.5 w-3.5"/></button></div>
            </div>
          </div>

          {esPastoral && versiculosProyecto.length > 0 && (
            <div className="border-b border-violet-100 bg-violet-50/70 p-4 sm:p-5">
              <div className="flex items-center justify-between"><div><p className="text-sm font-bold text-violet-950">Versículos del proyecto</p><p className="mt-0.5 text-xs text-violet-700">Se actualizan automáticamente.</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-violet-700">{versiculosProyecto.length}</span></div>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{versiculosProyecto.map(v=><article key={v.id} className="min-w-[260px] rounded-2xl border border-violet-100 bg-white p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-violet-700">{v.referencia}</p><p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-600">{v.texto}</p></div>{onEliminarVersiculo&&<button type="button" onClick={()=>onEliminarVersiculo(v.id)} disabled={eliminandoId===v.id} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600">{eliminandoId===v.id?<Loader2 className="h-4 w-4 animate-spin"/>:<Trash2 className="h-4 w-4"/>}</button>}</div></article>)}</div>
            </div>
          )}

          {vista === 'leer' && (
            <div className="p-4 sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-3"><button type="button" onClick={irAnterior} disabled={capitulo<=1} className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 disabled:opacity-30"><ChevronLeft className="h-5 w-5"/></button><div className="text-center"><h2 className={`text-2xl font-bold ${esPastoral?'text-slate-950':tema.title}`}>{pasaje}</h2><p className={`mt-1 text-xs ${esPastoral?'text-slate-500':tema.muted}`}>{traduccionActual?.name}</p></div><button type="button" onClick={irSiguiente} disabled={capitulo>=(libroActual?.numberOfChapters??1)} className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 disabled:opacity-30"><ChevronRight className="h-5 w-5"/></button></div>
              <div className="mb-5 flex flex-wrap items-center justify-center gap-2"><button type="button" onClick={()=>leyendo?detener():hablar()} className="flex min-h-10 items-center gap-2 rounded-full bg-indigo-600 px-4 text-xs font-bold text-white">{leyendo?<Square className="h-3.5 w-3.5"/>:<Headphones className="h-3.5 w-3.5"/>}{leyendo?'Detener':'Escuchar capítulo'}</button>{!esPastoral&&(['claro','sepia','oscuro'] as ModoLectura[]).map(m=><button key={m} type="button" onClick={()=>setModoLectura(m)} className={`grid h-10 w-10 place-items-center rounded-full border ${modoLectura===m?'border-violet-500 bg-violet-600 text-white':'border-slate-200 bg-white text-slate-500'}`}>{m==='claro'?<Sun className="h-4 w-4"/>:m==='sepia'?<Coffee className="h-4 w-4"/>:<Moon className="h-4 w-4"/>}</button>)}</div>
              {cargando&&<div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-violet-500"/></div>}
              {error&&<p className="py-12 text-center text-sm font-semibold text-rose-600">{error}</p>}
              {!cargando&&!error&&<article className={`mx-auto max-w-[720px] ${esPastoral?'text-slate-800':tema.text}`} style={{fontSize:tamanoFuente,lineHeight:1.95}}>{versos.map(v=>{const referencia=`${pasaje}:${v.n}`;const seleccionado=versoSel===v.n;return <div key={v.n} className="relative"><p onClick={()=>setVersoSel(seleccionado?null:v.n)} className={`cursor-pointer rounded-xl px-2 py-1.5 transition ${seleccionado?(esPastoral?'bg-violet-50 ring-1 ring-violet-200':tema.selected):'hover:bg-slate-100/60'}`}><sup className="mr-1.5 text-[10px] font-black text-[#C0392B]">{v.n}</sup>{v.t}{favoritos.has(v.n)&&<Star className="ml-1.5 inline h-3 w-3 fill-amber-400 text-amber-400"/>}</p>{seleccionado&&<div className="mb-3 mt-1 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg sm:grid-cols-4">{esPastoral?<button type="button" onClick={()=>agregarAlProyecto(v)} disabled={isPending} className="col-span-2 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 text-xs font-bold text-white sm:col-span-2">{isPending?<Loader2 className="h-4 w-4 animate-spin"/>:<Plus className="h-4 w-4"/>}Agregar al proyecto</button>:<button type="button" onClick={()=>marcarFavorito(v)} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-amber-50 px-3 text-xs font-bold text-amber-700"><Star className="h-3.5 w-3.5"/>{favoritos.has(v.n)?'Quitar':'Guardar'}</button>}<button type="button" onClick={()=>hablar(v.n)} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-indigo-50 px-3 text-xs font-bold text-indigo-700"><Volume2 className="h-3.5 w-3.5"/>Escuchar</button><button type="button" onClick={()=>compartirVersiculo(referencia,v.t)} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700"><Share2 className="h-3.5 w-3.5"/>Compartir</button>{!esPastoral&&<Link href={`/estudios/profundo?pasaje=${encodeURIComponent(`${referencia} — ${v.t}`)}`} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#C0392B] px-3 text-xs font-bold text-white"><Sparkles className="h-3.5 w-3.5"/>Estudiar</Link>}</div>}</div>})}</article>}
            </div>
          )}

          {vista === 'estudio' && <div className="p-5 sm:p-7"><div className="rounded-2xl border border-violet-100 bg-violet-50 p-5"><Sparkles className="h-6 w-6 text-violet-600"/><h2 className="mt-3 text-xl font-bold text-violet-950">Estudio del capítulo</h2><p className="mt-2 text-sm leading-6 text-violet-800">Seleccione un versículo en Leer para abrir explicación, contexto y preguntas. La arquitectura para texto original y Strong’s se añadirá después de aprobar esta experiencia base.</p><Link href={`/estudios/profundo?pasaje=${encodeURIComponent(versoSel?`${pasaje}:${versoSel}`:pasaje)}`} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white"><Sparkles className="h-4 w-4"/>Abrir estudio profundo</Link></div></div>}

          {vista === 'comparar' && <div className="p-5 sm:p-7"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1"><span className="mb-1 block text-xs font-bold text-slate-600">Segunda traducción</span><select value={tradComparada} onChange={e=>setTradComparada(e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">{traducciones.filter(t=>t.id!==trad).map(t=><option key={t.id} value={t.id}>{t.shortName||t.name}</option>)}</select></label></div>{cargandoComparacion?<div className="grid place-items-center py-14"><Loader2 className="h-6 w-6 animate-spin text-violet-500"/></div>:<div className="space-y-3">{versos.map(v=>{const otro=versosComparados.find(x=>x.n===v.n);return <article key={v.n} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2"><div><p className="text-[10px] font-bold uppercase text-violet-600">{traduccionActual?.shortName||traduccionActual?.name}</p><p className="mt-2 text-sm leading-6 text-slate-700"><sup className="mr-1 font-bold text-[#C0392B]">{v.n}</sup>{v.t}</p></div><div><p className="text-[10px] font-bold uppercase text-indigo-600">{traducciones.find(t=>t.id===tradComparada)?.shortName||traducciones.find(t=>t.id===tradComparada)?.name}</p><p className="mt-2 text-sm leading-6 text-slate-700"><sup className="mr-1 font-bold text-[#C0392B]">{v.n}</sup>{otro?.t||'No disponible'}</p></div></article>})}</div>}</div>}

          {vista === 'notas' && <div className="p-5 sm:p-7"><div className="grid gap-4 sm:grid-cols-2"><article className="rounded-2xl border border-amber-100 bg-amber-50 p-5"><Highlighter className="h-6 w-6 text-amber-600"/><h2 className="mt-3 font-bold text-amber-950">Resaltados</h2><p className="mt-2 text-sm leading-6 text-amber-900/70">La siguiente entrega conectará colores y resaltados persistentes por versículo.</p></article><article className="rounded-2xl border border-sky-100 bg-sky-50 p-5"><NotebookPen className="h-6 w-6 text-sky-600"/><h2 className="mt-3 font-bold text-sky-950">Notas personales</h2><p className="mt-2 text-sm leading-6 text-sky-900/70">Las notas se organizarán por versículo, capítulo y carpeta de estudio.</p></article></div></div>}
        </div>
      </div>
    </section>
  )
}
