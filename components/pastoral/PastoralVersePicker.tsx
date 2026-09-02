'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, Copy, Link2, Loader2, Plus, Search, X } from 'lucide-react'
import { cargarPalabrasBiblicasVerificadas } from '@/app/actions/lexico-biblico'
import { mostrarToast } from '@/lib/ui/toast'

const API = 'https://bible.helloao.org/api'

type Traduccion = { id: string; name: string; language: string; shortName?: string }
type NombreHebreoLibro = { hebreo: string; transliteracion: string }

const LIBROS_NT = new Set(['MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV'])
const NOMBRES_LIBROS_HEBREOS: Record<string, NombreHebreoLibro> = {
  GEN: { hebreo: 'בְּרֵאשִׁית', transliteracion: 'Bereshit' },
  EXO: { hebreo: 'שְׁמוֹת', transliteracion: 'Shemot' },
  LEV: { hebreo: 'וַיִּקְרָא', transliteracion: 'Vayikra' },
  NUM: { hebreo: 'בְּמִדְבַּר', transliteracion: 'Bamidbar' },
  DEU: { hebreo: 'דְּבָרִים', transliteracion: 'Devarim' },
  JOS: { hebreo: 'יְהוֹשֻׁעַ', transliteracion: 'Yehoshua' },
  JDG: { hebreo: 'שֹׁפְטִים', transliteracion: 'Shoftim' },
  RUT: { hebreo: 'רוּת', transliteracion: 'Rut' },
  '1SA': { hebreo: 'שְׁמוּאֵל א׳', transliteracion: 'Shmuel Alef' },
  '2SA': { hebreo: 'שְׁמוּאֵל ב׳', transliteracion: 'Shmuel Bet' },
  '1KI': { hebreo: 'מְלָכִים א׳', transliteracion: 'Melakhim Alef' },
  '2KI': { hebreo: 'מְלָכִים ב׳', transliteracion: 'Melakhim Bet' },
  '1CH': { hebreo: 'דִּבְרֵי הַיָּמִים א׳', transliteracion: 'Divrei Hayamim Alef' },
  '2CH': { hebreo: 'דִּבְרֵי הַיָּמִים ב׳', transliteracion: 'Divrei Hayamim Bet' },
  EZR: { hebreo: 'עֶזְרָא', transliteracion: 'Ezra' },
  NEH: { hebreo: 'נְחֶמְיָה', transliteracion: 'Nechemiah' },
  EST: { hebreo: 'אֶסְתֵּר', transliteracion: 'Ester' },
  JOB: { hebreo: 'אִיּוֹב', transliteracion: 'Iyov' },
  PSA: { hebreo: 'תְּהִלִּים', transliteracion: 'Tehillim' },
  PRO: { hebreo: 'מִשְׁלֵי', transliteracion: 'Mishlei' },
  ECC: { hebreo: 'קֹהֶלֶת', transliteracion: 'Kohelet' },
  SNG: { hebreo: 'שִׁיר הַשִּׁירִים', transliteracion: 'Shir Hashirim' },
  ISA: { hebreo: 'יְשַׁעְיָהוּ', transliteracion: 'Yeshayahu' },
  JER: { hebreo: 'יִרְמְיָהוּ', transliteracion: 'Yirmeyahu' },
  LAM: { hebreo: 'אֵיכָה', transliteracion: 'Eikhah' },
  EZK: { hebreo: 'יְחֶזְקֵאל', transliteracion: 'Yechezkel' },
  DAN: { hebreo: 'דָּנִיֵּאל', transliteracion: 'Daniel' },
  HOS: { hebreo: 'הוֹשֵׁעַ', transliteracion: 'Hoshea' },
  JOL: { hebreo: 'יוֹאֵל', transliteracion: 'Yoel' },
  AMO: { hebreo: 'עָמוֹס', transliteracion: 'Amos' },
  OBA: { hebreo: 'עֹבַדְיָה', transliteracion: 'Ovadiah' },
  JON: { hebreo: 'יוֹנָה', transliteracion: 'Yonah' },
  MIC: { hebreo: 'מִיכָה', transliteracion: 'Mikhah' },
  NAM: { hebreo: 'נַחוּם', transliteracion: 'Nachum' },
  HAB: { hebreo: 'חֲבַקּוּק', transliteracion: 'Chavakuk' },
  ZEP: { hebreo: 'צְפַנְיָה', transliteracion: 'Tzefanyah' },
  HAG: { hebreo: 'חַגַּי', transliteracion: 'Chaggai' },
  ZEC: { hebreo: 'זְכַרְיָה', transliteracion: 'Zekharyah' },
  MAL: { hebreo: 'מַלְאָכִי', transliteracion: 'Malakhi' },
}

type Libro = { id: string; name: string; numberOfChapters: number }
type VersoSimple = { type: string; number?: number; text?: string }
type VersiculoElegido = { referencia: string; texto: string; traduccion: string; libroId: string; capitulo: number; verso: number }
type ReferenciaRelacionada = { book: string; chapter: number; verse: number; endVerse?: number; score?: number }
type ResultadoLexico = Awaited<ReturnType<typeof cargarPalabrasBiblicasVerificadas>>

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

function normalizarHebreo(value: string | null | undefined) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0591-\u05C7]/g, '')
    .replace(/[^\u05D0-\u05EA]/g, '')
}

function significadoDePalabra(palabra: string, resultado: ResultadoLexico | null) {
  if (!resultado || resultado.status !== 'available') return null
  const objetivo = normalizarHebreo(palabra)
  if (!objetivo) return null
  const occurrence = resultado.occurrences.find((item) => {
    const formas = [item.surfaceForm, item.normalizedForm, item.entry.lemma]
      .map(normalizarHebreo)
      .filter(Boolean)
    return formas.some((forma) => forma === objetivo || forma.includes(objetivo) || objetivo.includes(forma))
  })
  if (!occurrence) return null
  return occurrence.entry.displayGlossEs || occurrence.entry.sourceGloss || occurrence.entry.definition || null
}

function ExploradorPalabrasOriginales({
  versiculo,
  original,
  esHebreo,
  onInsert,
}: {
  versiculo: VersiculoElegido
  original: string
  esHebreo: boolean
  onInsert: (palabra: string) => void
}) {
  const palabras = useMemo(() => original.split(/\s+/).filter(Boolean), [original])
  const [seleccionada, setSeleccionada] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ResultadoLexico | null>(null)
  const [cargandoLexico, setCargandoLexico] = useState(false)
  const [significadoIa, setSignificadoIa] = useState<{ significado: string; transliteracion: string } | null>(null)
  const [cargandoIa, setCargandoIa] = useState(false)
  const [errorIa, setErrorIa] = useState(false)

  useEffect(() => {
    setSeleccionada(null)
    if (!esHebreo) {
      setResultado(null)
      setCargandoLexico(false)
      return
    }
    let activo = true
    setResultado(null)
    setCargandoLexico(true)
    cargarPalabrasBiblicasVerificadas(versiculo.referencia)
      .then((data) => { if (activo) setResultado(data) })
      .catch(() => { if (activo) setResultado(null) })
      .finally(() => { if (activo) setCargandoLexico(false) })
    return () => { activo = false }
  }, [esHebreo, versiculo.referencia])

  const significado = seleccionada && esHebreo ? significadoDePalabra(seleccionada, resultado) : null

  useEffect(() => {
    setSignificadoIa(null)
    setErrorIa(false)
    if (!seleccionada || cargandoLexico || significado) {
      setCargandoIa(false)
      return
    }
    const controller = new AbortController()
    setCargandoIa(true)
    fetch('/api/pastoral/original-word', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ palabra: seleccionada, idioma: esHebreo ? 'hebrew' : 'greek', referencia: versiculo.referencia }),
      signal: controller.signal,
    }).then(async response => {
      if (!response.ok) throw new Error('ai-gloss')
      return response.json() as Promise<{ significado?: string; transliteracion?: string }>
    }).then(data => {
      const significado = String(data.significado ?? '').trim()
      if (!significado) throw new Error('empty-ai-gloss')
      setSignificadoIa({ significado, transliteracion: String(data.transliteracion ?? '').trim() })
    }).catch(error => {
      if ((error as Error)?.name !== 'AbortError') setErrorIa(true)
    }).finally(() => setCargandoIa(false))
    return () => controller.abort()
  }, [seleccionada, cargandoLexico, significado, esHebreo, versiculo.referencia])

  const significadoMostrado = significado ?? significadoIa?.significado ?? null
  const textoParaInsertar = seleccionada ? [
    seleccionada,
    significadoIa?.transliteracion ? `(${significadoIa.transliteracion})` : '',
    significadoMostrado ? `— ${significadoMostrado}` : '',
  ].filter(Boolean).join(' ') : ''

  return <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-3">
    <div dir={esHebreo ? 'rtl' : 'ltr'} className="flex flex-wrap gap-1.5">
      {palabras.map((palabra, indicePalabra) => {
        const activa = seleccionada === palabra
        return <button
          key={`${versiculo.verso}-${indicePalabra}-${palabra}`}
          type="button"
          onClick={() => setSeleccionada(palabra)}
          className={`rounded-full border px-2.5 py-1.5 text-[13px] font-bold transition-colors ${activa ? 'border-indigo-300 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700'}`}
          aria-pressed={activa}
        >{palabra}</button>
      })}
    </div>
    {seleccionada && <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3" dir="ltr">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span lang={esHebreo ? 'he' : 'grc'} dir={esHebreo ? 'rtl' : 'ltr'} className="block text-xl font-black text-slate-900">{seleccionada}</span>
          <p className={`mt-1.5 text-xs font-semibold leading-5 ${significadoMostrado ? 'text-indigo-700' : 'text-slate-500'}`}>
            {significadoMostrado ?? (cargandoLexico || cargandoIa ? 'Buscando significado…' : errorIa ? 'No se pudo obtener la explicación en este momento.' : 'Buscando explicación…')}
          </p>
          {significado && <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-700">Léxico VIDA</span>}
          {!significado && significadoIa && <span className="mt-1 inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-black text-violet-700">Explicación IA</span>}
          {significadoIa?.transliteracion && <span className="ml-1 mt-1 inline-flex text-[10px] font-semibold text-slate-500">{significadoIa.transliteracion}</span>}
        </div>
        <button type="button" disabled={!textoParaInsertar} onClick={() => textoParaInsertar && onInsert(textoParaInsertar)} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full bg-indigo-600 px-3 text-[11px] font-black text-white disabled:opacity-40">
          <Plus className="h-3.5 w-3.5" /> Agregar
        </button>
      </div>
    </div>}
  </div>
}

export default function PastoralVersePicker({ open, embedded = false, onClose, onInsert }: Props) {
  const [traducciones, setTraducciones] = useState<Traduccion[]>([])
  const [todasTraducciones, setTodasTraducciones] = useState<Traduccion[]>([])
  const [trad, setTrad] = useState('')
  const [libros, setLibros] = useState<Libro[]>([])
  const [libro, setLibro] = useState('')
  const [capitulo, setCapitulo] = useState(1)
  const [versos, setVersos] = useState<VersiculoElegido[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [seleccionados, setSeleccionados] = useState<number[]>([])
  const [agregados, setAgregados] = useState<string[]>([])
  const [concordanciaDe, setConcordanciaDe] = useState<VersiculoElegido | null>(null)
  const [palabrasDe, setPalabrasDe] = useState<VersiculoElegido | null>(null)
  const [relacionados, setRelacionados] = useState<Array<VersiculoElegido & { score?: number }>>([])
  const [cargando, setCargando] = useState(false)
  const [cargandoRelacionados, setCargandoRelacionados] = useState(false)
  const [modoOriginal, setModoOriginal] = useState(false)
  const [originales, setOriginales] = useState<Record<number, string>>({})
  const [cargandoOriginal, setCargandoOriginal] = useState(false)

  useEffect(() => {
    if (!open || traducciones.length) return
    fetch(`${API}/available_translations.json`).then(r => {
      if (!r.ok) throw new Error('translations')
      return r.json()
    }).then(d => {
      const todas: Traduccion[] = d.translations ?? []
      setTodasTraducciones(todas)
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
  const esNuevoTestamento = LIBROS_NT.has(libro)
  const libroHebreoActual = !esNuevoTestamento ? NOMBRES_LIBROS_HEBREOS[libro] ?? null : null
  const idiomaOriginal = esNuevoTestamento ? 'Griego' : 'Hebreo'
  const traduccionOriginal = useMemo(() => {
    const candidatos = todasTraducciones.filter(t => esNuevoTestamento ? t.language === 'grc' : ['hbo', 'heb'].includes(t.language))
    const preferida = esNuevoTestamento
      ? candidatos.find(t => /^(Byz|TR)$/i.test(t.id)) ?? candidatos.find(t => /byzant|textus/i.test(`${t.name} ${t.shortName ?? ''}`))
      : candidatos.find(t => /^WLC$/i.test(t.id)) ?? candidatos.find(t => /westminster|leningrad/i.test(`${t.name} ${t.shortName ?? ''}`))
    return preferida ?? candidatos[0] ?? null
  }, [todasTraducciones, esNuevoTestamento])
  const etiquetaOriginal = traduccionOriginal ? `${idiomaOriginal} · ${(traduccionOriginal.shortName || traduccionOriginal.id).toUpperCase()}` : idiomaOriginal

  useEffect(() => {
    if (!open || !trad || !libro) return
    setCargando(true)
    setVersos([])
    setSeleccionados([])
    setConcordanciaDe(null)
    setPalabrasDe(null)
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

  useEffect(() => {
    if (!open || !modoOriginal || !traduccionOriginal || !libro) { setOriginales({}); setPalabrasDe(null); return }
    setCargandoOriginal(true)
    fetch(`${API}/${traduccionOriginal.id}/${libro}/${capitulo}.simple.json`).then(r => {
      if (!r.ok) throw new Error('original')
      return r.json()
    }).then(d => {
      const contenido: VersoSimple[] = d.chapter?.content ?? []
      const mapa: Record<number, string> = {}
      contenido.filter(v => v.type === 'verse' && typeof v.number === 'number').forEach(v => { mapa[v.number as number] = String(v.text ?? '').trim() })
      setOriginales(mapa)
    }).catch(() => {
      setOriginales({})
      mostrarToast(`No se pudo cargar el texto original en ${idiomaOriginal.toLowerCase()}`)
    }).finally(() => setCargandoOriginal(false))
  }, [open, modoOriginal, traduccionOriginal?.id, libro, capitulo, idiomaOriginal])

  const textoVersiculoActual = (v: VersiculoElegido) => modoOriginal ? (originales[v.verso] ?? '') : v.texto
  const traduccionVersiculoActual = (v: VersiculoElegido) => modoOriginal ? etiquetaOriginal : v.traduccion

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return versos
    return versos.filter(v => `${v.referencia} ${v.texto}`.toLowerCase().includes(q))
  }, [versos, busqueda])

  const claveVersiculo = (v: VersiculoElegido) => `${v.libroId}:${v.capitulo}:${v.verso}`
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
    setPalabrasDe(null)
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
    const elegidos = versos.filter(v => seleccionados.includes(v.verso)).sort((a, b) => a.verso - b.verso)
    if (!elegidos.length) return
    const grupos: VersiculoElegido[][] = []
    for (const versiculo of elegidos) {
      const ultimoGrupo = grupos[grupos.length - 1]
      const ultimo = ultimoGrupo?.[ultimoGrupo.length - 1]
      if (ultimo && ultimo.libroId === versiculo.libroId && ultimo.capitulo === versiculo.capitulo && versiculo.verso === ultimo.verso + 1) ultimoGrupo.push(versiculo)
      else grupos.push([versiculo])
    }
    grupos.forEach(grupo => {
      const primero = grupo[0]
      const ultimo = grupo[grupo.length - 1]
      const referencia = grupo.length === 1 ? primero.referencia : `${libroActual?.name ?? libro} ${primero.capitulo}:${primero.verso}-${ultimo.verso}`
      onInsert({ referencia, texto: grupo.map(v => textoVersiculoActual(v)).filter(Boolean).join(' '), traduccion: traduccionVersiculoActual(primero) })
    })
    setAgregados(actuales => Array.from(new Set([...actuales, ...elegidos.map(claveVersiculo)])))
    setSeleccionados([])
    const bloques = grupos.length
    mostrarToast(`${elegidos.length} versículo${elegidos.length === 1 ? '' : 's'} insertado${elegidos.length === 1 ? '' : 's'} en ${bloques} bloque${bloques === 1 ? '' : 's'}`)
  }

  const agregarUno = (v: VersiculoElegido) => {
    const texto = textoVersiculoActual(v)
    if (!texto) return
    onInsert({ referencia: v.referencia, texto, traduccion: traduccionVersiculoActual(v) })
    setAgregados(actuales => actuales.includes(claveVersiculo(v)) ? actuales : [...actuales, claveVersiculo(v)])
    mostrarToast(`${v.referencia} insertado`)
  }

  const insertarPalabraOriginal = (v: VersiculoElegido, palabra: string) => {
    onInsert({ referencia: v.referencia, texto: palabra, traduccion: etiquetaOriginal })
  }

  const copiar = async (v: VersiculoElegido) => {
    await navigator.clipboard.writeText(`${v.referencia}\n${textoVersiculoActual(v) || v.texto}`)
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
              <span className="mt-0.5 block truncate text-xs leading-tight text-slate-500">Desde {concordanciaDe.referencia}</span>
            </div>
          </>
        ) : <>
          <label className="relative inline-flex min-h-10 min-w-[92px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700" title={traduccionActual?.name ?? 'Biblia'}>
            <span className="pointer-events-none block max-w-[92px] truncate">{etiquetaTraduccion(traduccionActual)}</span>
            <select aria-label="Traducción" value={trad} onChange={e => setTrad(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0">
              {traducciones.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <select aria-label="Libro" value={libro} onChange={e => { setLibro(e.target.value); setCapitulo(1) }}>
            {libros.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select aria-label="Capítulo" value={capitulo} onChange={e => setCapitulo(Number(e.target.value))}>
            {Array.from({ length: libroActual?.numberOfChapters ?? 1 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <label className="pastoral-verse-search"><Search /><input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar en este capítulo" /></label>
          {!!seleccionados.length && <button type="button" onClick={agregarSeleccionados} className="pastoral-insert-selected">Insertar selección ({seleccionados.length})</button>}
        </>}
        {!embedded && <button type="button" onClick={onClose} className="pastoral-verse-icon" aria-label="Cerrar"><X /></button>}
      </div>

      {!concordanciaDe && <>
        <div className="mx-3 mt-2 inline-flex w-fit items-center rounded-full border border-slate-200 bg-white p-1 text-[10px] font-black" aria-label="Idioma del texto bíblico">
          <button type="button" onClick={() => { setModoOriginal(false); setPalabrasDe(null) }} className={`min-h-8 rounded-full px-3 ${!modoOriginal ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`} aria-pressed={!modoOriginal}>Español</button>
          <button type="button" disabled={!traduccionOriginal} onClick={() => setModoOriginal(true)} className={`min-h-8 rounded-full px-3 disabled:opacity-40 ${modoOriginal ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`} aria-pressed={modoOriginal}>Original · {idiomaOriginal}</button>
        </div>
        {modoOriginal && libroHebreoActual && <div className="mx-3 mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center">
          <div lang="he" dir="rtl" className="text-[26px] font-bold leading-tight text-slate-900">{libroHebreoActual.hebreo}</div>
          <strong className="mt-2 block text-lg font-black text-indigo-700">{libroHebreoActual.transliteracion}</strong>
          <span className="mt-1 block text-xs font-bold text-slate-500">{libroActual?.name ?? 'Génesis'}</span>
        </div>}
        <p className="pastoral-verse-guide">{modoOriginal ? `El versículo se mantiene limpio en ${idiomaOriginal.toLowerCase()}. Usa Palabras en el versículo que quieras explorar o insertar por partes.` : 'Selecciona varios versículos. Los consecutivos se insertarán juntos en un solo bloque.'}</p>
      </>}

      <div className="pastoral-verse-list">
        {concordanciaDe ? (
          cargandoRelacionados ? <div className="pastoral-verse-loading"><Loader2 /></div> : relacionados.length ? relacionados.map(v => <article key={`${v.libroId}-${v.capitulo}-${v.verso}`} className="pastoral-verse-row">
            <button type="button" onClick={() => agregarUno(v)} className="pastoral-verse-main"><span className="pastoral-verse-add"><Plus /></span><span><strong>{v.referencia}</strong><em>{v.texto}</em></span></button>
            <button type="button" onClick={() => copiar(v)} className="pastoral-verse-mini" aria-label={`Copiar ${v.referencia}`} title="Copiar"><Copy /></button>
          </article>) : <div className="pastoral-verse-empty">No hay concordancias disponibles para este versículo.</div>
        ) : cargando ? <div className="pastoral-verse-loading"><Loader2 /></div> : visibles.length ? visibles.map(v => {
          const activo = seleccionados.includes(v.verso)
          const agregado = agregados.includes(claveVersiculo(v))
          const referenciaVisible = modoOriginal && libroHebreoActual ? `${v.capitulo}:${v.verso}` : v.referencia
          const palabrasAbiertas = palabrasDe ? claveVersiculo(palabrasDe) === claveVersiculo(v) : false
          return <article key={`${v.libroId}-${v.capitulo}-${v.verso}`} className="pastoral-verse-row">
            <button type="button" onClick={() => alternar(v.verso)} className="pastoral-verse-main">
              <span className="min-w-0 flex-1">
                <strong dir="ltr" className="block pb-2">{referenciaVisible}</strong>
                <em dir={modoOriginal && !esNuevoTestamento ? 'rtl' : 'ltr'} lang={modoOriginal ? (esNuevoTestamento ? 'grc' : 'he') : 'es'} className="block pt-1 leading-relaxed">{modoOriginal ? (cargandoOriginal ? 'Cargando original…' : originales[v.verso] || 'Original no disponible') : v.texto}</em>
              </span>
              <span className={`ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-colors ${activo || agregado ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white text-transparent'}`} aria-label={agregado ? 'Versículo agregado' : activo ? 'Versículo seleccionado' : 'Versículo no seleccionado'} title={agregado ? 'Versículo agregado' : activo ? 'Versículo seleccionado' : undefined}>{(activo || agregado) && <Check className="h-4 w-4" strokeWidth={3} />}</span>
            </button>
            <div className="pastoral-verse-row-actions">
              <button type="button" onClick={() => agregarUno(v)} className="pastoral-verse-mini" aria-label={`Insertar ${v.referencia}`} title="Insertar"><Plus /></button>
              <button type="button" onClick={() => copiar(v)} className="pastoral-verse-mini" aria-label={`Copiar ${v.referencia}`} title="Copiar"><Copy /></button>
              <button type="button" onClick={() => void cargarConcordancias(v)} className="pastoral-verse-mini" aria-label={`Ver concordancias de ${v.referencia}`} title="Concordancias"><Link2 /></button>
              {modoOriginal && originales[v.verso] && <button type="button" onClick={() => setPalabrasDe(palabrasAbiertas ? null : v)} className={`min-h-8 rounded-full border px-2.5 text-[10px] font-black ${palabrasAbiertas ? 'border-indigo-300 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`} aria-expanded={palabrasAbiertas}>Palabras</button>}
            </div>
            {modoOriginal && palabrasAbiertas && originales[v.verso] && <ExploradorPalabrasOriginales versiculo={v} original={originales[v.verso]} esHebreo={!esNuevoTestamento} onInsert={(palabra) => insertarPalabraOriginal(v, palabra)} />}
          </article>
        }) : <div className="pastoral-verse-empty">No hay versículos que coincidan.</div>}
      </div>
    </section>
  )

  if (embedded) return contenido
  return <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="Seleccionar versículo">{contenido}</div>
}
