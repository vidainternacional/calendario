'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, ChevronRight, Copy, Loader2, Plus, Search, X } from 'lucide-react'
import { mostrarToast } from '@/lib/ui/toast'

const API = 'https://bible.helloao.org/api'

type Traduccion = { id: string; name: string; language: string; shortName?: string }
type Libro = { id: string; name: string; numberOfChapters: number }
type VersoSimple = { type: string; number?: number; text?: string }
type VersiculoElegido = { referencia: string; texto: string; traduccion: string; libroId: string; capitulo: number; verso: number }
type ReferenciaRelacionada = { book: string; chapter: number; verse: number; endVerse?: number; score?: number }

type Props = {
  open: boolean
  embedded?: boolean
  onClose: () => void
  onInsert: (versiculo: { referencia: string; texto: string; traduccion: string }) => void
}

function etiquetaTraduccion(t?: Traduccion) {
  if (!t) return 'Biblia'
  return (t.shortName || t.name).toUpperCase()
}

export default function PastoralVersePicker({ open, embedded = false, onClose, onInsert }: Props) {
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
      const entradas: Array<{ verse?: number; references?: ReferenciaRelacionada[] }> = d.chapter?.content ?? []
      const entrada = entradas.find((item) => Number(item.verse) === versiculo.verso)
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

  const contenido = (
    <section className={`pastoral-verse-picker ${embedded ? 'is-embedded' : 'is-modal'}`} aria-label="Seleccionar versículo">
      <div className="pastoral-verse-toolbar">
        {concordanciaDe ? (
          <>
            <button type="button" onClick={() => { setConcordanciaDe(null); setRelacionados([]) }} className="pastoral-verse-icon" aria-label="Volver a versículos"><ArrowLeft /></button>
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-[15px] font-semibold leading-tight text-slate-900">Concordancias</strong>
              <span className="mt-0.5 block truncate text-xs leading-tight text-slate-500">{concordanciaDe.referencia}</span>
            </div>
          </>
        ) : <>
          <select aria-label="Traducción" value={trad} onChange={e => setTrad(e.target.value)}>
            {traducciones.map(t => <option key={t.id} value={t.id}>{t.shortName || t.name}</option>)}
          </select>
          <select aria-label="Libro" value={libro} onChange={e => { setLibro(e.target.value); setCapitulo(1) }}>
            {libros.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select aria-label="Capítulo" value={capitulo} onChange={e => setCapitulo(Number(e.target.value))}>
            {Array.from({ length: libroActual?.numberOfChapters ?? 1 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <label className="pastoral-verse-search"><Search /><input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar" /></label>
          {!!seleccionados.length && <button type="button" onClick={agregarSeleccionados} className="pastoral-insert-selected">Insertar {seleccionados.length}</button>}
        </>}
        {!embedded && <button type="button" onClick={onClose} className="pastoral-verse-icon" aria-label="Cerrar"><X /></button>}
      </div>

      <div className="pastoral-verse-list">
        {concordanciaDe ? (
          cargandoRelacionados ? <div className="pastoral-verse-loading"><Loader2 /></div> : relacionados.length ? relacionados.map(v => <article key={`${v.libroId}-${v.capitulo}-${v.verso}`} className="pastoral-verse-row">
            <button type="button" onClick={() => agregarUno(v)} className="pastoral-verse-main"><span className="pastoral-verse-add"><Plus /></span><span><strong>{v.referencia}</strong><em>{v.texto}</em></span></button>
            <button type="button" onClick={() => copiar(v)} className="pastoral-verse-mini" aria-label={`Copiar ${v.referencia}`}><Copy /></button>
          </article>) : <div className="pastoral-verse-empty">No hay concordancias disponibles.</div>
        ) : cargando ? <div className="pastoral-verse-loading"><Loader2 /></div> : visibles.length ? visibles.map(v => {
          const activo = seleccionados.includes(v.verso)
          return <article key={v.verso} className="pastoral-verse-row">
            <button type="button" onClick={() => alternar(v.verso)} className="pastoral-verse-main">
              <span className={`pastoral-verse-check ${activo ? 'is-active' : ''}`}>{activo && <Check />}</span>
              <span><strong>{v.referencia}</strong><em>{v.texto}</em></span>
            </button>
            <div className="pastoral-verse-row-actions">
              <button type="button" onClick={() => agregarUno(v)} className="pastoral-verse-mini" aria-label={`Agregar ${v.referencia}`}><Plus /></button>
              <button type="button" onClick={() => copiar(v)} className="pastoral-verse-mini" aria-label={`Copiar ${v.referencia}`}><Copy /></button>
              <button type="button" onClick={() => void cargarConcordancias(v)} className="pastoral-verse-mini" aria-label={`Concordancias de ${v.referencia}`} title="Concordancias"><ChevronRight /></button>
            </div>
          </article>
        }) : <div className="pastoral-verse-empty">No hay versículos que coincidan.</div>}
      </div>
    </section>
  )

  if (embedded) return contenido

  return <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="Seleccionar versículo">{contenido}</div>
}