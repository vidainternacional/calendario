'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { BookOpen, Loader2, Plus, Search } from 'lucide-react'
import { agregarVersiculoPastoral } from '@/app/actions/pastoral'
import { mostrarToast } from '@/lib/ui/toast'

const API = 'https://bible.helloao.org/api'

type Traduccion = { id: string; name: string; language: string; shortName?: string }
type Libro = { id: string; name: string; numberOfChapters: number }
type Contenido = { type: string; number?: number; content?: unknown[] }
type Resultado = {
  traduccion: string
  libroId: string
  libroNombre: string
  capitulo: number
  verso: number
  texto: string
}

type Props = {
  coleccionId: string
  onSaved: () => void
}

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9ñáéíóúü\s]/gi, ' ').replace(/\s+/g, ' ').trim()
}

function textoDeVerso(item: Contenido) {
  if (!Array.isArray(item.content)) return ''
  return item.content.map((parte) => {
    if (typeof parte === 'string') return parte
    if (parte && typeof parte === 'object' && 'text' in (parte as Record<string, unknown>)) {
      return String((parte as Record<string, unknown>).text)
    }
    return ''
  }).join(' ').replace(/\s+/g, ' ').trim()
}

function extraerVersosCompleto(data: any, traduccion: Traduccion): Resultado[] {
  const resultados: Resultado[] = []
  const books = Array.isArray(data?.books) ? data.books : []

  for (const book of books) {
    const chapters = Array.isArray(book?.chapters) ? book.chapters : []
    for (const chapterEntry of chapters) {
      const numeroCapitulo = Number(chapterEntry?.number ?? chapterEntry?.chapter?.number)
      const contenido: Contenido[] = chapterEntry?.chapter?.content ?? chapterEntry?.content ?? []
      for (const item of contenido) {
        if (item?.type !== 'verse' || typeof item.number !== 'number') continue
        const texto = textoDeVerso(item)
        if (!texto) continue
        resultados.push({
          traduccion: traduccion.shortName || traduccion.name,
          libroId: String(book.id),
          libroNombre: String(book.name ?? book.commonName ?? book.id),
          capitulo: numeroCapitulo,
          verso: item.number,
          texto,
        })
      }
    }
  }
  return resultados
}

export default function PastoralVerseFinder({ coleccionId, onSaved }: Props) {
  const [pestana, setPestana] = useState<'concordancia' | 'referencia'>('concordancia')
  const [traducciones, setTraducciones] = useState<Traduccion[]>([])
  const [traduccionId, setTraduccionId] = useState('')
  const [libros, setLibros] = useState<Libro[]>([])
  const [libroId, setLibroId] = useState('')
  const [capitulo, setCapitulo] = useState(1)
  const [versosCapitulo, setVersosCapitulo] = useState<Resultado[]>([])
  const [verso, setVerso] = useState(1)
  const [consulta, setConsulta] = useState('')
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [indiceCompleto, setIndiceCompleto] = useState<Resultado[] | null>(null)
  const [cargandoBase, setCargandoBase] = useState(true)
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetch(`${API}/available_translations.json`)
      .then((respuesta) => respuesta.json())
      .then((data) => {
        const todas: Traduccion[] = data.translations ?? []
        const espanolas = todas.filter((item) => item.language === 'spa' || item.language === 'es')
        const preferida = espanolas.find((item) => /rvr|reina/i.test(`${item.shortName ?? ''} ${item.name}`)) ?? espanolas[0]
        setTraducciones(espanolas)
        setTraduccionId(preferida?.id ?? '')
      })
      .catch(() => setError('No se pudo cargar la biblioteca bíblica.'))
      .finally(() => setCargandoBase(false))
  }, [])

  useEffect(() => {
    if (!traduccionId) return
    setLibros([])
    setLibroId('')
    setIndiceCompleto(null)
    fetch(`${API}/${traduccionId}/books.json`)
      .then((respuesta) => respuesta.json())
      .then((data) => {
        const lista: Libro[] = data.books ?? []
        setLibros(lista)
        setLibroId(lista[0]?.id ?? '')
      })
      .catch(() => setError('No se pudieron cargar los libros.'))
  }, [traduccionId])

  useEffect(() => {
    if (!traduccionId || !libroId) return
    setCapitulo(1)
  }, [traduccionId, libroId])

  useEffect(() => {
    if (!traduccionId || !libroId || capitulo < 1) return
    const traduccion = traducciones.find((item) => item.id === traduccionId)
    const libro = libros.find((item) => item.id === libroId)
    if (!traduccion || !libro) return

    setVersosCapitulo([])
    fetch(`${API}/${traduccionId}/${libroId}/${capitulo}.json`)
      .then((respuesta) => respuesta.json())
      .then((data) => {
        const contenido: Contenido[] = data.chapter?.content ?? []
        const lista = contenido
          .filter((item) => item.type === 'verse' && typeof item.number === 'number')
          .map((item) => ({
            traduccion: traduccion.shortName || traduccion.name,
            libroId,
            libroNombre: libro.name,
            capitulo,
            verso: item.number as number,
            texto: textoDeVerso(item),
          }))
          .filter((item) => item.texto)
        setVersosCapitulo(lista)
        setVerso(lista[0]?.verso ?? 1)
      })
      .catch(() => setError('No se pudo cargar el capítulo seleccionado.'))
  }, [traduccionId, libroId, capitulo, traducciones, libros])

  const libroActual = useMemo(() => libros.find((item) => item.id === libroId), [libros, libroId])
  const resultadoReferencia = useMemo(() => versosCapitulo.find((item) => item.verso === verso) ?? null, [versosCapitulo, verso])

  const buscarConcordancia = async () => {
    const terminos = normalizar(consulta).split(' ').filter((item) => item.length >= 2)
    if (!terminos.length) {
      setError('Escribe una palabra o frase para buscar concordancias.')
      return
    }

    setBuscando(true)
    setError(null)
    try {
      let indice = indiceCompleto
      if (!indice) {
        const traduccion = traducciones.find((item) => item.id === traduccionId)
        if (!traduccion) throw new Error('translation')
        const respuesta = await fetch(`${API}/${traduccionId}/complete.json`)
        if (!respuesta.ok) throw new Error('complete')
        indice = extraerVersosCompleto(await respuesta.json(), traduccion)
        setIndiceCompleto(indice)
      }

      const frase = normalizar(consulta)
      const encontrados = indice
        .map((item) => {
          const texto = normalizar(item.texto)
          const coincidencias = terminos.filter((termino) => texto.includes(termino)).length
          const score = texto.includes(frase) ? 100 + coincidencias : coincidencias
          return { item, score }
        })
        .filter(({ score }) => score > 0 && (terminos.length === 1 || score >= Math.ceil(terminos.length / 2)))
        .sort((a, b) => b.score - a.score)
        .slice(0, 30)
        .map(({ item }) => item)

      setResultados(encontrados)
      if (!encontrados.length) setError('No encontramos concordancias con esas palabras en la traducción seleccionada.')
    } catch {
      setError('No se pudo completar la concordancia. Intenta nuevamente o usa la búsqueda por referencia.')
    } finally {
      setBuscando(false)
    }
  }

  const guardar = (resultado: Resultado, nota: string) => {
    const formData = new FormData()
    formData.set('traduccion', resultado.traduccion)
    formData.set('libro_id', resultado.libroId)
    formData.set('libro_nombre', resultado.libroNombre)
    formData.set('capitulo', String(resultado.capitulo))
    formData.set('verso', String(resultado.verso))
    formData.set('texto', resultado.texto)
    formData.set('nota', nota)

    startTransition(async () => {
      const respuesta = await agregarVersiculoPastoral(coleccionId, formData)
      mostrarToast(respuesta.success ? 'Versículo agregado a la guía' : respuesta.error)
      if (respuesta.success) onSaved()
    })
  }

  if (cargandoBase) {
    return <div className="flex min-h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Tipo de búsqueda bíblica">
        <button type="button" role="tab" aria-selected={pestana === 'concordancia'} onClick={() => { setPestana('concordancia'); setError(null) }} className={`min-h-11 rounded-lg text-xs font-bold ${pestana === 'concordancia' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Concordancia</button>
        <button type="button" role="tab" aria-selected={pestana === 'referencia'} onClick={() => { setPestana('referencia'); setError(null) }} className={`min-h-11 rounded-lg text-xs font-bold ${pestana === 'referencia' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>Referencia</button>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-bold text-slate-700">Traducción</span>
        <select value={traduccionId} onChange={(event) => setTraduccionId(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900">
          {traducciones.map((item) => <option key={item.id} value={item.id}>{item.shortName ? `${item.shortName} — ${item.name}` : item.name}</option>)}
        </select>
      </label>

      {pestana === 'concordancia' ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input value={consulta} onChange={(event) => setConsulta(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void buscarConcordancia() } }} placeholder="Ej. no temas, fe, esperanza" className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" />
            <button type="button" onClick={buscarConcordancia} disabled={buscando} className="flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-60">{buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Buscar</button>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">Busca palabras o frases. Los resultados más cercanos aparecerán primero.</p>

          {resultados.length > 0 && (
            <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
              {resultados.map((item) => <ResultadoCard key={`${item.libroId}-${item.capitulo}-${item.verso}`} resultado={item} pending={isPending} onSave={guardar} />)}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Libro</span><select value={libroId} onChange={(event) => setLibroId(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900">{libros.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Capítulo</span><select value={capitulo} onChange={(event) => setCapitulo(Number(event.target.value))} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900">{Array.from({ length: libroActual?.numberOfChapters ?? 1 }, (_, indice) => indice + 1).map((numero) => <option key={numero} value={numero}>{numero}</option>)}</select></label>
            <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Versículo</span><select value={verso} onChange={(event) => setVerso(Number(event.target.value))} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900">{versosCapitulo.map((item) => <option key={item.verso} value={item.verso}>{item.verso}</option>)}</select></label>
          </div>
          {resultadoReferencia && <ResultadoCard resultado={resultadoReferencia} pending={isPending} onSave={guardar} />}
        </div>
      )}

      {error && <div role="alert" className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
    </div>
  )
}

function ResultadoCard({ resultado, pending, onSave }: { resultado: Resultado; pending: boolean; onSave: (resultado: Resultado, nota: string) => void }) {
  const [nota, setNota] = useState('')
  return (
    <article className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white"><BookOpen className="h-5 w-5" /></span>
        <div className="min-w-0"><p className="font-bold text-indigo-900">{resultado.libroNombre} {resultado.capitulo}:{resultado.verso}</p><p className="mt-0.5 text-[11px] text-indigo-500">{resultado.traduccion}</p></div>
      </div>
      <blockquote className="mt-3 text-sm leading-6 text-slate-800">“{resultado.texto}”</blockquote>
      <textarea value={nota} onChange={(event) => setNota(event.target.value)} maxLength={1000} rows={2} placeholder="Nota pastoral opcional" className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900" />
      <button type="button" disabled={pending} onClick={() => onSave(resultado, nota)} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 text-xs font-semibold text-white disabled:opacity-60">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Agregar a la guía</button>
    </article>
  )
}
