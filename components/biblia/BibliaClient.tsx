'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Volume2, Square, Sparkles, Loader2 } from 'lucide-react'

const API = 'https://bible.helloao.org/api'

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

  // Traducciones (prioridad español)
  useEffect(() => {
    fetch(`${API}/available_translations.json`)
      .then(r => r.json())
      .then(d => {
        const todas: Traduccion[] = d.translations ?? []
        const esp = todas.filter(t => t.language === 'spa' || t.language === 'es')
        const eng = todas.filter(t => ['eng', 'en'].includes(t.language)).slice(0, 3)
        const lista = [...esp, ...eng]
        setTraducciones(lista)
        if (lista[0]) setTrad(lista[0].id)
      })
      .catch(() => setError('No se pudo conectar con la biblioteca bíblica.'))
  }, [])

  // Libros de la traducción
  useEffect(() => {
    if (!trad) return
    fetch(`${API}/${trad}/books.json`)
      .then(r => r.json())
      .then(d => {
        const bs: Libro[] = d.books ?? []
        setLibros(bs)
        setLibro(prev => (bs.some(b => b.id === prev) ? prev : bs[0]?.id ?? ''))
      })
      .catch(() => setError('No se pudieron cargar los libros.'))
  }, [trad])

  const libroActual = useMemo(() => libros.find(b => b.id === libro), [libros, libro])

  // Capítulo
  useEffect(() => {
    if (!trad || !libro) return
    setCargando(true); setError(null)
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
  }, [trad, libro, capitulo])

  useEffect(() => { setCapitulo(1) }, [libro, trad])
  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  const escuchar = () => {
    const synth = window.speechSynthesis
    if (!synth) return
    if (leyendo) { synth.cancel(); setLeyendo(false); return }
    const texto = `${libroActual?.name ?? ''}, capítulo ${capitulo}. ` + versos.map(v => v.t).join(' ')
    const u = new SpeechSynthesisUtterance(texto)
    const esVoz = synth.getVoices().find(v => v.lang.startsWith('es'))
    if (esVoz) u.voice = esVoz
    u.lang = 'es'
    u.rate = 0.95
    u.onend = () => setLeyendo(false)
    u.onerror = () => setLeyendo(false)
    synth.speak(u)
    setLeyendo(true)
  }

  const pasaje = `${libroActual?.name ?? ''} ${capitulo}`

  return (
    <main className="px-4 py-8 max-w-3xl mx-auto pb-28">
      <div className="flex items-center gap-3 mb-1">
        <div className="bg-[#C0392B] p-2.5 rounded-xl text-white"><BookOpen className="w-5 h-5" /></div>
        <h1 className="text-2xl font-bold text-[#171923]">Biblia</h1>
      </div>
      <p className="text-sm text-slate-500 mb-6 ml-[52px]">Lee, escucha y estudia la Palabra</p>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select value={trad} onChange={e => setTrad(e.target.value)} className="text-sm font-medium px-3 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl outline-none" style={{ colorScheme: 'light' }}>
          {traducciones.map(t => <option key={t.id} value={t.id}>{t.shortName ?? t.name}</option>)}
        </select>
        <select value={libro} onChange={e => setLibro(e.target.value)} className="text-sm font-medium px-3 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl outline-none" style={{ colorScheme: 'light' }}>
          {libros.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={capitulo} onChange={e => setCapitulo(Number(e.target.value))} className="text-sm font-medium px-3 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl outline-none" style={{ colorScheme: 'light' }}>
          {Array.from({ length: libroActual?.numberOfChapters ?? 1 }, (_, i) => i + 1).map(n => <option key={n} value={n}>Capítulo {n}</option>)}
        </select>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={escuchar} disabled={!versos.length}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 ${leyendo ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'}`}>
          {leyendo ? <><Square className="w-4 h-4" /> Detener</> : <><Volume2 className="w-4 h-4" /> Escuchar</>}
        </button>
        <Link href={`/estudios/profundo?pasaje=${encodeURIComponent(pasaje)}`}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-[#C0392B] text-white">
          <Sparkles className="w-4 h-4" /> Estudiar con IA
        </Link>
      </div>

      <article className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <h2 className="text-xl font-bold text-[#171923] mb-5">{pasaje}</h2>
        {cargando && <div className="flex justify-center py-14"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>}
        {error && <p className="text-sm text-rose-600 text-center py-8">{error}</p>}
        {!cargando && !error && (
          <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">
            {versos.map(v => (
              <p key={v.n}><sup className="text-[10px] font-bold text-[#C0392B] mr-1.5">{v.n}</sup>{v.t}</p>
            ))}
          </div>
        )}
      </article>

      <p className="text-[11px] text-slate-400 text-center mt-4">Textos provistos por Free Use Bible API · dominio público</p>
    </main>
  )
}
