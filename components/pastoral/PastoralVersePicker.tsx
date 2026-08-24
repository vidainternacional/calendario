'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BookOpen, Check, ChevronRight, Copy, Loader2, Search, X } from 'lucide-react'
import { mostrarToast } from '@/lib/ui/toast'

const API = 'https://bible.helloao.org/api'

type Traduccion = { id: string; name: string; language: string; shortName?: string }
type Libro = { id: string; name: string; numberOfChapters: number }
type VersoSimple = { type: string; number?: number; text?: string }
type VersiculoElegido = { referencia: string; texto: string; traduccion: string; libroId: string; capitulo: number; verso: number }
type ReferenciaRelacionada = { book: string; chapter: number; verse: number; endVerse?: number; score?: number }

type Props = {
  open: boolean
  onClose: () => void
  onInsert: (versiculo: { referencia: string; texto: string; traduccion: string }) => void
}

function etiquetaTraduccion(t?: Traduccion) {
  if (!t) return 'Biblia'
  return (t.shortName || t.name).toUpperCase()
}

export default function PastoralVersePicker({ open, onClose, onInsert }: Props) {
  const [traducciones, setTraducciones] = useState<Traduccion[]>([])
  const [trad, setTrad] = useState('')
  const [libros, setLibros] = useState<Libro[]>([])
  const [libro, setLibro] = useState('')
  const [capitulo, setCapitulo] = useState(1)
  const [versos, setVersos] = useState<VersiculoElegido[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [seleccionados, setSeleccionados] = useState<number[]>([])
  const [concordanciaDe, setConcordanciaDe] = useState<VersiculoElegido | null>(null)
  const [relacionados, setRelacionados] = useState<Array<VersiculoElegido & { score?: number }>>([])
  const [cargando, setCargando] = useState(false)
  const [cargandoRelacionados, setCargandoRelacionados] = useState(false)

  useEffect(() => {
    if (!open || traducciones.length) return
    fetch(`${API}/available_translations.json`).then(r => {
      if (!r.ok) throw new Error('translations')
      return r.json()
    }).then(d => {
      const todas: Traduccion[] = d.translations ?? []
      const esp = todas.filter(t => t.language === 'spa' || t.language === 'es')
      setTraducciones(esp)
      const rv = esp.find(t => /1909|rv1909|reina[ -]?valera/i.test(`${t.name} ${t.shortName ?? ''} ${t.id}`))
      setTrad(rv?.id ?? esp[0]?.id ?? '')
    }).catch(() => mostrarToast('No se pudieron cargar las traducciones'))
  }, [open, traducciones.length])

  useEffect(() => {
    if (!open || !trad) return
    setLibros([])
    setLibro('')
    fetch(`${API}/${trad}/books.json`).then(r => {
      if (!r.ok) throw new Error('books')
      return r.json()
    }).then(d => {
      const lista: Libro[] = d.books ?? []
      setLibros(lista)
      setLibro(lista[0]?.id ?? '')
      setCapitulo(1)
    }).catch(() => mostrarToast('No se pudieron cargar los libros'))
  }, [open, trad])

  const libroActual = useMemo(() => libros.find(b => b.id === libro), [libros, libro])
  const traduccionActual = useMemo(() => traducciones.find(t => t.id === trad), [traducciones, trad])

  useEffect(() => {
    if (!open || !trad || !libro) return
    setCargando(true)
    setVersos([])
    setSeleccionados([])
    setConcordanciaDe(null)
    setRelacionados([])
    fetch(`${API}/${trad}/${libro}/${capitulo}.simple.json`).then(r => {
      if (!r.ok) throw new Error('chapter')
      return r.json()
    }).then(d => {
      const contenido: VersoSimple[] = d.chapter?.content ?? []
      setVersos(contenido.filter(v => v.type === 'verse' && typeof v.number === 'number').map(v => ({
        referencia: `${libroActual?.name ?? libro} ${capitulo}:${v.number}`,
        texto: String(v.text ?? '').trim(),
        traduccion: etiquetaTraduccion(traduccionActual),
        libroId: libro,
        capitulo,
        verso: v.number as number,
      })))
    }).catch(() => mostrarToast('No se pudo cargar el capítulo')).finally(() => setCargando(false))
  }, [open, trad, libro, capitulo, libroActual?.name, traduccionActual?.id])

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return versos
    return versos.filter(v => `${v.referencia} ${v.texto}`.toLowerCase().includes(q))
  }, [versos, busqueda])

  const alternar = (numero: number) => setSeleccionados(actuales => actuales.includes(numero) ? actuales.filter(n => n !== numero) : [...actuales, numero])

  const textoReferencia = async (ref: ReferenciaRelacionada) => {
    const response = await fetch(`${API}/${trad}/${ref.book}/${ref.chapter}.simple.json`)
    if (!response.ok) throw new Error('reference')
    const data = await response.json()
    const contenido: VersoSimple[] = data.chapter?.content ?? []
    const fin = Math.max(ref.verse, ref.endVerse ?? ref.verse)
    return contenido
      .filter(v => v.type === 'verse' && typeof v.number === 'number' && (v.number as number) >= ref.verse && (v.number as number) <= fin)
      .map(v => String(v.text ?? '').trim())
      .filter(Boolean)
      .join(' ')
  }

  const cargarConcordancias = async (versiculo: VersiculoElegido) => {
    setConcordanciaDe(versiculo)
    setCargandoRelacionados(true)
    setRelacionados([])
    try {
      const response = await fetch(`${API}/d/open-cross-ref/${versiculo.libroId}/${versiculo.capitulo}.json`)
      if (!response.ok) throw new Error('crossrefs')
      const d = await response.json()
      const entradas: any[] = d.chapter?.content ?? []
      const entrada = entradas.find((item: any) => Number(item.verse) === versiculo.verso)
      const refs: ReferenciaRelacionada[] = (entrada?.references ?? []).slice(0, 16)
      const resultados: Array<(VersiculoElegido & { score?: number }) | null> = await Promise.all(refs.map(async ref => {
        try {
          const texto = await textoReferencia(ref)
          const nombre = libros.find(b => b.id === ref.book)?.name ?? ref.book
          const rango = ref.endVerse && ref.endVerse !== ref.verse ? `-${ref.endVerse}` : ''
          return {
            referencia: `${nombre} ${ref.chapter}:${ref.verse}${rango}`,
            texto,
            traduccion: etiquetaTraduccion(traduccionActual),
            libroId: ref.book,
            capitulo: ref.chapter,
            verso: ref.verse,
            score: ref.score,
          }
        } catch { return null }
      }))
      setRelacionados(resultados.filter((v): v is VersiculoElegido & { score?: number } => v !== null && Boolean(v.texto)))
    } catch {
      setRelacionados([])
      mostrarToast('No se pudieron cargar las concordancias')
    } finally {
      setCargandoRelacionados(false)
    }
  }

  const agregarSeleccionados = () => {
    const elegidos = versos.filter(v => seleccionados.includes(v.verso))
    if (!elegidos.length) return
    elegidos.forEach(v => onInsert({ referencia: v.referencia, texto: v.texto, traduccion: v.traduccion }))
    setSeleccionados([])
    mostrarToast(`${elegidos.length} versículo${elegidos.length === 1 ? '' : 's'} insertado${elegidos.length === 1 ? '' : 's'}`)
  }

  const agregarUno = (v: VersiculoElegido) => {
    onInsert({ referencia: v.referencia, texto: v.texto, traduccion: v.traduccion })
    mostrarToast(`${v.referencia} insertado`)
  }

  const copiar = async (v: VersiculoElegido) => {
    await navigator.clipboard.writeText(`${v.referencia}\n${v.texto}`)
    mostrarToast('Versículo copiado')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="Seleccionar versículo">
      <section className="flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] bg-[#f8f9fc] shadow-2xl sm:rounded-[28px]">
        <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
          {concordanciaDe ? (
            <button type="button" onClick={() => { setConcordanciaDe(null); setRelacionados([]) }} className="grid h-10 w-10 place-items-center rounded-full bg-slate-200/70" aria-label="Volver a versículos"><ArrowLeft className="h-4 w-4" /></button>
          ) : <BookOpen className="h-5 w-5 text-violet-600" />}
          <div className="min-w-0 flex-1">
            <h2 className="font-bold">{concordanciaDe ? `Concordancias · ${concordanciaDe.referencia}` : 'Agregar versículo'}</h2>
            <p className="text-xs text-slate-500">{concordanciaDe ? 'Toca una referencia para insertarla sin salir de esta ventana.' : 'Selecciona uno o varios y colócalos en la página actual.'}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-slate-200/70" aria-label="Cerrar"><X className="h-4 w-4" /></button>
        </header>

        {!concordanciaDe && <>
          <div className="grid grid-cols-3 gap-2 border-b border-slate-200 p-3">
            <select value={trad} onChange={e => setTrad(e.target.value)} className="min-h-11 rounded-xl bg-white px-2 text-xs font-bold outline-none">
              {traducciones.map(t => <option key={t.id} value={t.id}>{t.shortName || t.name}</option>)}
            </select>
            <select value={libro} onChange={e => { setLibro(e.target.value); setCapitulo(1) }} className="min-h-11 rounded-xl bg-white px-2 text-xs font-bold outline-none">
              {libros.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select value={capitulo} onChange={e => setCapitulo(Number(e.target.value))} className="min-h-11 rounded-xl bg-white px-2 text-xs font-bold outline-none">
              {Array.from({ length: libroActual?.numberOfChapters ?? 1 }, (_, i) => i + 1).map(n => <option key={n} value={n}>Cap. {n}</option>)}
            </select>
          </div>

          <label className="mx-3 mt-3 flex min-h-11 items-center gap-2 rounded-xl bg-white px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar palabra en este capítulo" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          </label>
        </>}

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {concordanciaDe ? (
            cargandoRelacionados ? <div className="grid min-h-48 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-violet-600" /></div> : relacionados.length ? (
              <div className="divide-y divide-slate-200">
                {relacionados.map(v => <article key={`${v.libroId}-${v.capitulo}-${v.verso}`} className="py-3">
                  <button type="button" onClick={() => agregarUno(v)} className="flex w-full items-start gap-3 text-left">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-100 text-lg leading-none text-violet-700">+</span>
                    <span className="min-w-0 flex-1"><strong className="text-xs text-violet-700">{v.referencia}</strong><span className="mt-1 block text-sm leading-6 text-slate-700">{v.texto}</span></span>
                  </button>
                  <div className="mt-2 flex justify-end"><button type="button" onClick={() => copiar(v)} className="inline-flex min-h-9 items-center gap-1.5 px-2 text-xs font-bold text-slate-500"><Copy className="h-3.5 w-3.5" /> Copiar</button></div>
                </article>)}
              </div>
            ) : <div className="grid min-h-48 place-items-center text-center text-sm text-slate-500">No hay concordancias disponibles para este versículo.</div>
          ) : cargando ? <div className="grid min-h-40 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-violet-600" /></div> : (
            <div className="divide-y divide-slate-200">
              {visibles.map(v => {
                const activo = seleccionados.includes(v.verso)
                return <article key={v.verso} className="py-3">
                  <button type="button" onClick={() => alternar(v.verso)} className="flex w-full items-start gap-3 text-left">
                    <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${activo ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300'}`}>{activo && <Check className="h-3.5 w-3.5" />}</span>
                    <span className="min-w-0 flex-1"><strong className="text-xs text-violet-700">{v.referencia}</strong><span className="mt-1 block text-sm leading-6 text-slate-700">{v.texto}</span></span>
                  </button>
                  <div className="mt-2 flex justify-end gap-2">
                    <button type="button" onClick={() => agregarUno(v)} className="inline-flex min-h-9 items-center gap-1.5 px-2 text-xs font-bold text-violet-700">Agregar</button>
                    <button type="button" onClick={() => copiar(v)} className="inline-flex min-h-9 items-center gap-1.5 px-2 text-xs font-bold text-slate-500"><Copy className="h-3.5 w-3.5" /> Copiar</button>
                    <button type="button" onClick={() => void cargarConcordancias(v)} className="inline-flex min-h-9 items-center gap-1.5 px-2 text-xs font-bold text-violet-700">Concordancias <ChevronRight className="h-3.5 w-3.5" /></button>
                  </div>
                </article>
              })}
            </div>
          )}
        </div>

        {!concordanciaDe && <footer className="border-t border-slate-200 bg-white/95 p-3 pb-[calc(.75rem+env(safe-area-inset-bottom))]">
          <button type="button" onClick={agregarSeleccionados} disabled={!seleccionados.length} className="min-h-12 w-full rounded-2xl bg-violet-600 px-4 text-sm font-bold text-white disabled:opacity-35">Insertar {seleccionados.length ? `(${seleccionados.length})` : ''} en la página</button>
        </footer>}
      </section>
    </div>
  )
}