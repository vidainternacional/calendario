'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { BookOpen, Volume2, Square, Sparkles, Loader2, Star, Play, X } from 'lucide-react'
import { toggleFavorito, favoritosDelCapitulo, listarFavoritos, type Favorito } from '@/app/actions/biblia'

const API = 'https://bible.helloao.org/api'
const POS_KEY = 'vida-biblia-posicion'

type Traduccion = { id: string; name: string; language: string; shortName?: string }
type Libro = { id: string; name: string; numberOfChapters: number }
type Verso = { type: string; number?: number; content?: unknown[] }

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

type Posicion = { trad: string; libro: string; capitulo: number }

function leerPosicion(): Posicion | null {
  try {
    const raw = localStorage.getItem(POS_KEY)
    return raw ? (JSON.parse(raw) as Posicion) : null
  } catch { return null }
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
  const [pending, startTransition] = useTransition()

  // Salto pendiente: restaurar posición guardada o ir a un favorito
  const saltoRef = useRef<Posicion | null>(null)
  const listoRef = useRef(false) // true cuando ya se puede guardar posición

  // ── Traducciones (con restauración de posición) ──
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

  // ── Libros ──
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

  // ── Capítulo ──
  useEffect(() => {
    if (!trad || !libro) return
    setCargando(true); setError(null); setVersoSel(null)
    window.speechSynthesis?.cancel(); setLeyendo(false)
    fetch(`${API}/${trad}/${libro}/${capitulo}.json`)
      .then(r => r.json())
      .then(d => {
        const contenido: Verso[] = d.chapter?.content ?? []
        setVersos(
          contenido
            .filter(c => c.type === 'verse' && typeof c.number === 'number')
            .map(c => ({ n: c.number as number, t: textoDeVerso(c) }))
        )
      })
      .catch(() => setError('No se pudo cargar el capítulo.'))
      .finally(() => setCargando(false))

    // Favoritos de este capítulo + guardar posición de lectura
    startTransition(async () => {
      const favs = await favoritosDelCapitulo(trad, libro, capitulo)
      setFavoritos(new Set(favs))
    })
    if (listoRef.current) {
      try { localStorage.setItem(POS_KEY, JSON.stringify({ trad, libro, capitulo })) } catch {}
    }
  }, [trad, libro, capitulo])

  // Cambio manual de libro/traducción → capítulo 1 (solo si no hay salto pendiente)
  const cambiarLibro = (id: string) => { setLibro(id); setCapitulo(1) }
  const cambiarTrad = (id: string) => { setTrad(id); setCapitulo(1) }

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  // ── Audio ──
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

  // ── Favoritos ──
  const marcarFavorito = (v: { n: number; t: string }) => {
    if (!libroActual) return
    startTransition(async () => {
      const r = await toggleFavorito({
        traduccion: trad, libro_id: libro, libro_nombre: libroActual.name,
        capitulo, verso: v.n, texto: v.t,
      })
      if ('favorito' in r) {
        setFavoritos(prev => {
          const s = new Set(prev)
          if (r.favorito) s.add(v.n); else s.delete(v.n)
          return s
        })
        setListaFavs(null) // refrescar lista la próxima vez
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
      // misma traducción: saltar directo
      saltoRef.current = null
      setLibro(f.libro_id); setCapitulo(f.capitulo)
      setTimeout(() => { listoRef.current = true }, 0)
    } else {
      setTrad(f.traduccion)
    }
  }

  const pasaje = `${libroActual?.name ?? ''} ${capitulo}`
  const selectCls = "text-sm font-medium px-3 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl outline-none"

  return (
    <main className="px-4 py-8 max-w-3xl mx-auto pb-28">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="bg-[#C0392B] p-2.5 rounded-xl text-white"><BookOpen className="w-5 h-5" /></div>
          <h1 className="text-2xl font-bold text-[#171923]">Biblia</h1>
        </div>
        <button onClick={abrirFavoritos} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Favoritos
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-6 ml-[52px]">Lee, escucha y estudia la Palabra</p>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select value={trad} onChange={e => cambiarTrad(e.target.value)} className={selectCls} style={{ colorScheme: 'light' }}>
          {traducciones.map(t => <option key={t.id} value={t.id}>{t.shortName ?? t.name}</option>)}
        </select>
        <select value={libro} onChange={e => cambiarLibro(e.target.value)} className={selectCls} style={{ colorScheme: 'light' }}>
          {libros.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={capitulo} onChange={e => setCapitulo(Number(e.target.value))} className={selectCls} style={{ colorScheme: 'light' }}>
          {Array.from({ length: libroActual?.numberOfChapters ?? 1 }, (_, i) => i + 1).map(n => <option key={n} value={n}>Capítulo {n}</option>)}
        </select>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => (leyendo ? detener() : hablar())} disabled={!versos.length}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 ${leyendo ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'}`}>
          {leyendo ? <><Square className="w-4 h-4" /> Detener</> : <><Volume2 className="w-4 h-4" /> Escuchar</>}
        </button>
        <Link href={`/estudios/profundo?pasaje=${encodeURIComponent(versoSel ? `${pasaje}:${versoSel}` : pasaje)}`}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-[#C0392B] text-white">
          <Sparkles className="w-4 h-4" /> Estudiar con IA
        </Link>
      </div>

      <article className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <h2 className="text-xl font-bold text-[#171923] mb-5">{pasaje}</h2>
        {cargando && <div className="flex justify-center py-14"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>}
        {error && <p className="text-sm text-rose-600 text-center py-8">{error}</p>}
        {!cargando && !error && (
          <div className="space-y-1 text-[15px] leading-relaxed text-slate-700">
            {versos.map(v => (
              <div key={v.n}>
                <p onClick={() => setVersoSel(versoSel === v.n ? null : v.n)}
                  className={`cursor-pointer rounded-lg px-2 py-1.5 -mx-2 transition-colors ${versoSel === v.n ? 'bg-indigo-50' : favoritos.has(v.n) ? 'bg-amber-50/70' : 'active:bg-slate-50'}`}>
                  <sup className="text-[10px] font-bold text-[#C0392B] mr-1.5">{v.n}</sup>
                  {v.t}
                  {favoritos.has(v.n) && <Star className="inline w-3 h-3 ml-1.5 fill-amber-400 text-amber-400" />}
                </p>
                {versoSel === v.n && (
                  <div className="flex gap-2 px-2 py-2">
                    <button onClick={() => hablar(v.n)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-indigo-600 text-white rounded-lg">
                      <Play className="w-3 h-3" /> Escuchar desde aquí
                    </button>
                    <button onClick={() => marcarFavorito(v)} disabled={pending}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border ${favoritos.has(v.n) ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-slate-600 border-slate-200'}`}>
                      <Star className={`w-3 h-3 ${favoritos.has(v.n) ? 'fill-amber-400 text-amber-400' : ''}`} />
                      {favoritos.has(v.n) ? 'Quitar favorito' : 'Guardar favorito'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </article>

      <p className="text-[11px] text-slate-400 text-center mt-4">Textos provistos por Free Use Bible API · dominio público</p>

      {/* ── Panel de favoritos ── */}
      {panelFavs && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center sm:justify-center" onClick={e => { if (e.target === e.currentTarget) setPanelFavs(false) }}>
          <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-[#171923] flex items-center gap-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Mis versículos favoritos
              </h3>
              <button onClick={() => setPanelFavs(false)} className="p-2 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              {listaFavs === null && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>}
              {listaFavs?.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">
                  Aún no guardas versículos.<br />Toca cualquier versículo y elige ⭐ Guardar favorito.
                </p>
              )}
              {listaFavs?.map(f => (
                <button key={f.id} onClick={() => irAFavorito(f)}
                  className="w-full text-left bg-amber-50/60 border border-amber-100 rounded-2xl p-4 hover:border-amber-300 transition-colors">
                  <p className="text-xs font-bold text-amber-700 mb-1">{f.libro_nombre} {f.capitulo}:{f.verso}</p>
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{f.texto}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
