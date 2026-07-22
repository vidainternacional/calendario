'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { BookOpen, Volume2, Square, Sparkles, Loader2, Star, Play, X, Sun, Moon, Coffee, Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { toggleFavorito, favoritosDelCapitulo, listarFavoritos, type Favorito } from '@/app/actions/biblia'

const API = 'https://bible.helloao.org/api'
const POS_KEY = 'vida-biblia-posicion'
const PREF_KEY = 'vida-biblia-preferencias'

type Traduccion = { id: string; name: string; language: string; shortName?: string }
type Libro = { id: string; name: string; numberOfChapters: number }
type Verso = { type: string; number?: number; content?: unknown[] }
type ModoLectura = 'claro' | 'oscuro' | 'sepia'
type Preferencias = { modo: ModoLectura; fuente: number }

type Posicion = { trad: string; libro: string; capitulo: number }

function textoDeVerso(v: Verso): string {
  if (!Array.isArray(v.content)) return ''
  return v.content
    .map((c) => {
      if (typeof c === 'string') return c
      if (c && typeof c === 'object' && 'text' in (c as Record<string, unknown>)) return String((c as Record<string, unknown>).text)
      return ''
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function leerPosicion(): Posicion | null {
  try {
    const raw = localStorage.getItem(POS_KEY)
    return raw ? (JSON.parse(raw) as Posicion) : null
  } catch { return null }
}

function leerPreferencias(): Preferencias {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (!raw) return { modo: 'claro', fuente: 17 }
    const parsed = JSON.parse(raw) as Preferencias
    return {
      modo: ['claro', 'oscuro', 'sepia'].includes(parsed.modo) ? parsed.modo : 'claro',
      fuente: Math.min(24, Math.max(14, Number(parsed.fuente) || 17)),
    }
  } catch {
    return { modo: 'claro', fuente: 17 }
  }
}

export default function BibliaClient() {
  const [traducciones, setTraducciones] = useState<Traduccion[]>([])
  const [trad, setTrad] = useState('')
  const [libros, setLibros] = useState<Libro[]>([])
  const [libro, setLibro] = useState('')
  const [capitulo, setCapitulo] = useState(1)
  const [versos, setVersos] = useState<{ n: number; t: string }[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [leyendo, setLeyendo] = useState(false)
  const [versoSel, setVersoSel] = useState<number | null>(null)
  const [favoritos, setFavoritos] = useState<Set<number>>(new Set())
  const [panelFavs, setPanelFavs] = useState(false)
  const [listaFavs, setListaFavs] = useState<Favorito[] | null>(null)
  const [modoLectura, setModoLectura] = useState<ModoLectura>('claro')
  const [tamanoFuente, setTamanoFuente] = useState(17)
  const [pending, startTransition] = useTransition()

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
    fetch(`${API}/available_translations.json`)
      .then(r => r.json())
      .then(d => {
        const todas: Traduccion[] = d.translations ?? []
        const esp = todas.filter(t => t.language === 'spa' || t.language === 'es')
        const eng = todas.filter(t => ['eng', 'en'].includes(t.language)).slice(0, 3)
        const lista = [...esp, ...eng]
        setTraducciones(lista)
        const guardada = saltoRef.current
        if (guardada && lista.some(t => t.id === guardada.trad)) setTrad(guardada.trad)
        else if (lista[0]) setTrad(lista[0].id)
      })
      .catch(() => setError('No se pudo conectar con la biblioteca bíblica.'))
  }, [])

  useEffect(() => {
    if (!trad) return
    fetch(`${API}/${trad}/books.json`)
      .then(r => r.json())
      .then(d => {
        const bs: Libro[] = d.books ?? []
        setLibros(bs)
        const salto = saltoRef.current
        if (salto && bs.some(b => b.id === salto.libro)) {
          setLibro(salto.libro)
          setCapitulo(salto.capitulo)
          saltoRef.current = null
          setTimeout(() => { listoRef.current = true }, 0)
        } else {
          setLibro(prev => (bs.some(b => b.id === prev) ? prev : bs[0]?.id ?? ''))
          listoRef.current = true
        }
      })
      .catch(() => setError('No se pudieron cargar los libros.'))
  }, [trad])

  const libroActual = useMemo(() => libros.find(b => b.id === libro), [libros, libro])

  useEffect(() => {
    if (!trad || !libro) return
    setCargando(true); setError(null); setVersoSel(null)
    window.speechSynthesis?.cancel(); setLeyendo(false)
    fetch(`${API}/${trad}/${libro}/${capitulo}.json`)
      .then(r => r.json())
      .then(d => {
        const contenido: Verso[] = d.chapter?.content ?? []
        setVersos(contenido.filter(c => c.type === 'verse' && typeof c.number === 'number').map(c => ({ n: c.number as number, t: textoDeVerso(c) })))
      })
      .catch(() => setError('No se pudo cargar el capítulo.'))
      .finally(() => setCargando(false))

    startTransition(async () => {
      const favs = await favoritosDelCapitulo(trad, libro, capitulo)
      setFavoritos(new Set(favs))
    })
    if (listoRef.current) {
      try { localStorage.setItem(POS_KEY, JSON.stringify({ trad, libro, capitulo })) } catch {}
    }
  }, [trad, libro, capitulo])

  const cambiarLibro = (id: string) => { setLibro(id); setCapitulo(1) }
  const cambiarTrad = (id: string) => { setTrad(id); setCapitulo(1) }

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  const hablar = (desde?: number) => {
    const synth = window.speechSynthesis
    if (!synth) return
    synth.cancel()
    const lista = typeof desde === 'number' ? versos.filter(v => v.n >= desde) : versos
    if (!lista.length) return
    const intro = typeof desde === 'number'
      ? `${libroActual?.name ?? ''} ${capitulo}, desde el versículo ${desde}. `
      : `${libroActual?.name ?? ''}, capítulo ${capitulo}. `
    const u = new SpeechSynthesisUtterance(intro + lista.map(v => v.t).join(' '))
    const esVoz = synth.getVoices().find(v => v.lang.startsWith('es'))
    if (esVoz) u.voice = esVoz
    u.lang = 'es'; u.rate = 0.95
    u.onend = () => setLeyendo(false)
    u.onerror = () => setLeyendo(false)
    synth.speak(u)
    setLeyendo(true)
  }

  const detener = () => { window.speechSynthesis?.cancel(); setLeyendo(false) }

  const marcarFavorito = (v: { n: number; t: string }) => {
    if (!libroActual) return
    startTransition(async () => {
      const r = await toggleFavorito({ traduccion: trad, libro_id: libro, libro_nombre: libroActual.name, capitulo, verso: v.n, texto: v.t })
      if ('favorito' in r) {
        setFavoritos(prev => {
          const s = new Set(prev)
          if (r.favorito) s.add(v.n); else s.delete(v.n)
          return s
        })
        setListaFavs(null)
      }
    })
  }

  const abrirFavoritos = () => {
    setPanelFavs(true)
    if (listaFavs === null) startTransition(async () => setListaFavs(await listarFavoritos()))
  }

  const irAFavorito = (f: Favorito) => {
    setPanelFavs(false)
    saltoRef.current = { trad: f.traduccion, libro: f.libro_id, capitulo: f.capitulo }
    listoRef.current = false
    if (f.traduccion === trad) {
      saltoRef.current = null
      setLibro(f.libro_id); setCapitulo(f.capitulo)
      setTimeout(() => { listoRef.current = true }, 0)
    } else {
      setTrad(f.traduccion)
    }
  }

  const irAnterior = () => setCapitulo(c => Math.max(1, c - 1))
  const irSiguiente = () => setCapitulo(c => Math.min(libroActual?.numberOfChapters ?? c, c + 1))
  const pasaje = `${libroActual?.name ?? ''} ${capitulo}`
  const selectCls = 'min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm'

  const tema = {
    claro: { page: 'bg-slate-50', card: 'bg-white border-slate-100', text: 'text-slate-700', title: 'text-[#171923]', muted: 'text-slate-500', control: 'bg-slate-50 border-slate-200 text-slate-700', selected: 'bg-indigo-50' },
    oscuro: { page: 'bg-slate-950', card: 'bg-slate-900 border-slate-800', text: 'text-slate-200', title: 'text-white', muted: 'text-slate-400', control: 'bg-slate-800 border-slate-700 text-slate-200', selected: 'bg-indigo-950/80' },
    sepia: { page: 'bg-[#f4ecd8]', card: 'bg-[#fffaf0] border-[#decfb0]', text: 'text-[#4f402e]', title: 'text-[#2f261b]', muted: 'text-[#7a684f]', control: 'bg-[#f7eedc] border-[#d6c5a6] text-[#4f402e]', selected: 'bg-[#efe1c1]' },
  }[modoLectura]

  return (
    <main className={`min-h-screen max-w-none px-4 py-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(7rem+env(safe-area-inset-bottom))] transition-colors ${tema.page}`}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-1 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="shrink-0 rounded-xl bg-[#C0392B] p-2.5 text-white"><BookOpen className="h-5 w-5" /></div>
            <h1 className={`truncate text-2xl font-bold ${tema.title}`}>Biblia</h1>
          </div>
          <button onClick={abrirFavoritos} className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-700">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Favoritos
          </button>
        </div>
        <p className={`mb-6 ml-[52px] text-sm ${tema.muted}`}>Lee, escucha y estudia la Palabra</p>

        <div className={`mb-4 rounded-2xl border p-3 shadow-sm ${tema.card}`}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select value={trad} onChange={e => cambiarTrad(e.target.value)} className={selectCls} style={{ colorScheme: 'light' }}>
              {traducciones.map(t => <option key={t.id} value={t.id}>{t.shortName ? `${t.shortName} — ${t.name}` : t.name}</option>)}
            </select>
            <select value={libro} onChange={e => cambiarLibro(e.target.value)} className={selectCls} style={{ colorScheme: 'light' }}>
              {libros.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select value={capitulo} onChange={e => setCapitulo(Number(e.target.value))} className={selectCls} style={{ colorScheme: 'light' }}>
              {Array.from({ length: libroActual?.numberOfChapters ?? 1 }, (_, i) => i + 1).map(n => <option key={n} value={n}>Capítulo {n}</option>)}
            </select>
          </div>
        </div>

        <div className={`mb-5 rounded-2xl border p-3 shadow-sm ${tema.card}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {([
                ['claro', Sun, 'Claro'],
                ['sepia', Coffee, 'Sepia'],
                ['oscuro', Moon, 'Oscuro'],
              ] as const).map(([modo, Icon, label]) => (
                <button key={modo} type="button" onClick={() => setModoLectura(modo)} aria-pressed={modoLectura === modo}
                  className={`flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors ${modoLectura === modo ? 'border-indigo-300 bg-indigo-600 text-white' : tema.control}`}>
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
            <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1">
              <button type="button" onClick={() => setTamanoFuente(v => Math.max(14, v - 1))} disabled={tamanoFuente <= 14} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 disabled:opacity-30" aria-label="Reducir tamaño de letra"><Minus className="h-4 w-4" /></button>
              <span className="min-w-12 text-center text-xs font-bold text-slate-700">{tamanoFuente}px</span>
              <button type="button" onClick={() => setTamanoFuente(v => Math.min(24, v + 1))} disabled={tamanoFuente >= 24} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 disabled:opacity-30" aria-label="Aumentar tamaño de letra"><Plus className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button onClick={() => (leyendo ? detener() : hablar())} disabled={!versos.length}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-40 ${leyendo ? 'bg-rose-600' : 'bg-indigo-600'}`}>
            {leyendo ? <><Square className="h-4 w-4" /> Detener</> : <><Volume2 className="h-4 w-4" /> Escuchar</>}
          </button>
          <Link href={`/estudios/profundo?pasaje=${encodeURIComponent(versoSel ? `${pasaje}:${versoSel}` : pasaje)}`}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#C0392B] text-sm font-semibold text-white">
            <Sparkles className="h-4 w-4" /> Estudiar con IA
          </Link>
        </div>

        <article className={`rounded-3xl border p-4 shadow-sm sm:p-8 ${tema.card}`}>
          <div className="mb-6 flex items-center justify-between gap-3">
            <button onClick={irAnterior} disabled={capitulo <= 1} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border font-bold disabled:opacity-30 ${tema.control}`} aria-label="Capítulo anterior"><ChevronLeft className="h-5 w-5" /></button>
            <div className="min-w-0 text-center">
              <h2 className={`break-words text-xl font-bold ${tema.title}`}>{pasaje}</h2>
              <p className={`mt-1 text-xs ${tema.muted}`}>Capítulo {capitulo} de {libroActual?.numberOfChapters ?? 1}</p>
            </div>
            <button onClick={irSiguiente} disabled={capitulo >= (libroActual?.numberOfChapters ?? 1)} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border font-bold disabled:opacity-30 ${tema.control}`} aria-label="Capítulo siguiente"><ChevronRight className="h-5 w-5" /></button>
          </div>

          {cargando && <div className="flex justify-center py-14"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></div>}
          {error && <p className="py-8 text-center text-sm text-rose-600">{error}</p>}
          {!cargando && !error && (
            <div className={`space-y-1 ${tema.text}`} style={{ fontSize: `${tamanoFuente}px`, lineHeight: 1.85 }}>
              {versos.map(v => (
                <div key={v.n}>
                  <p onClick={() => setVersoSel(versoSel === v.n ? null : v.n)}
                    className={`-mx-2 cursor-pointer rounded-xl px-2 py-2 transition-colors ${versoSel === v.n ? tema.selected : favoritos.has(v.n) ? 'bg-amber-50/70' : 'active:bg-slate-100/40'}`}>
                    <sup className="mr-1.5 text-[10px] font-bold text-[#C0392B]">{v.n}</sup>
                    {v.t}
                    {favoritos.has(v.n) && <Star className="ml-1.5 inline h-3 w-3 fill-amber-400 text-amber-400" />}
                  </p>
                  {versoSel === v.n && (
                    <div className="flex flex-col gap-2 px-2 py-2 sm:flex-row">
                      <button onClick={() => hablar(v.n)} className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white"><Play className="h-3 w-3" /> Escuchar desde aquí</button>
                      <button onClick={() => marcarFavorito(v)} disabled={pending}
                        className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold ${favoritos.has(v.n) ? 'border-amber-200 bg-amber-100 text-amber-700' : tema.control}`}>
                        <Star className={`h-3 w-3 ${favoritos.has(v.n) ? 'fill-amber-400 text-amber-400' : ''}`} />
                        {favoritos.has(v.n) ? 'Quitar favorito' : 'Guardar favorito'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!cargando && !error && versos.length > 0 && (
            <div className={`mt-8 border-t pt-5 ${modoLectura === 'oscuro' ? 'border-slate-800' : modoLectura === 'sepia' ? 'border-[#decfb0]' : 'border-slate-100'}`}>
              <p className={`mb-3 text-center text-xs font-semibold ${tema.muted}`}>Continúa tu lectura</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={irAnterior} disabled={capitulo <= 1} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold disabled:opacity-30 ${tema.control}`}><ChevronLeft className="h-4 w-4" /> Anterior</button>
                <button onClick={irSiguiente} disabled={capitulo >= (libroActual?.numberOfChapters ?? 1)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white disabled:opacity-30">Siguiente <ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </article>

        <p className={`mt-4 text-center text-[11px] ${tema.muted}`}>Textos provistos por Free Use Bible API · dominio público</p>
      </div>

      {panelFavs && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/40 sm:items-center sm:justify-center" onClick={e => { if (e.target === e.currentTarget) setPanelFavs(false) }}>
          <div className="max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] sm:max-w-lg sm:rounded-3xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white p-4">
              <h3 className="flex items-center gap-2 font-bold text-[#171923]"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> Mis versículos favoritos</h3>
              <button onClick={() => setPanelFavs(false)} className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3 p-4">
              {listaFavs === null && <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate-300" /></div>}
              {listaFavs?.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Aún no guardas versículos.<br />Toca cualquier versículo y elige ⭐ Guardar favorito.</p>}
              {listaFavs?.map(f => (
                <button key={f.id} onClick={() => irAFavorito(f)} className="w-full rounded-2xl border border-amber-100 bg-amber-50/60 p-4 text-left transition-colors hover:border-amber-300">
                  <p className="mb-1 text-xs font-bold text-amber-700">{f.libro_nombre} {f.capitulo}:{f.verso}</p>
                  <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">{f.texto}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
