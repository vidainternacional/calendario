'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { ArrowRight, Search, X } from 'lucide-react'

const BOOK_ALIASES: Record<string, string> = {
  gen: 'genesis', ex: 'exodo', lev: 'levitico', num: 'numeros', dt: 'deuteronomio',
  jos: 'josue', jue: 'jueces', rut: 'rut', '1sa': '1samuel', '2sa': '2samuel',
  '1re': '1reyes', '2re': '2reyes', '1cr': '1cronicas', '2cr': '2cronicas',
  esd: 'esdras', neh: 'nehemias', est: 'ester', job: 'job', sal: 'salmos',
  prov: 'proverbios', ec: 'eclesiastes', cant: 'cantares', is: 'isaias', jer: 'jeremias',
  lam: 'lamentaciones', ez: 'ezequiel', dan: 'daniel', os: 'oseas', jl: 'joel', am: 'amos',
  abd: 'abdias', jon: 'jonas', miq: 'miqueas', nah: 'nahum', hab: 'habacuc', sof: 'sofonias',
  hag: 'hageo', zac: 'zacarias', mal: 'malaquias', mt: 'mateo', mc: 'marcos', mr: 'marcos',
  lc: 'lucas', jn: 'juan', hch: 'hechos', rom: 'romanos', '1co': '1corintios',
  '2co': '2corintios', gal: 'galatas', ef: 'efesios', fil: 'filipenses', col: 'colosenses',
  '1ts': '1tesalonicenses', '2ts': '2tesalonicenses', '1ti': '1timoteo', '2ti': '2timoteo',
  tit: 'tito', flm: 'filemon', heb: 'hebreos', stg: 'santiago', '1p': '1pedro', '2p': '2pedro',
  '1jn': '1juan', '2jn': '2juan', '3jn': '3juan', jud: 'judas', ap: 'apocalipsis',
}

function normalizar(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function compacto(value: string) {
  return normalizar(value).replace(/\s+/g, '')
}

function parsearReferencia(value: string) {
  const match = value.trim().match(/^(.+?)\s+(\d{1,3})(?:\s*[:.,]\s*(\d{1,3}))?$/)
  if (!match) return null
  return {
    libro: match[1].trim(),
    capitulo: Number(match[2]),
    versiculo: match[3] ? Number(match[3]) : null,
  }
}

function dispararCambio(select: HTMLSelectElement, value: string) {
  select.value = value
  select.dispatchEvent(new Event('change', { bubbles: true }))
}

async function esperarHasta<T>(resolver: () => T | null, timeout = 4000): Promise<T | null> {
  const inicio = Date.now()
  while (Date.now() - inicio < timeout) {
    const resultado = resolver()
    if (resultado) return resultado
    await new Promise(resolve => window.setTimeout(resolve, 60))
  }
  return null
}

export default function BibliaQuickReferenceSearch() {
  const [abierto, setAbierto] = useState(false)
  const [consulta, setConsulta] = useState('')
  const [error, setError] = useState('')
  const [buscando, setBuscando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!abierto) return
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80)
    return () => window.clearTimeout(timer)
  }, [abierto])

  const cerrar = () => {
    if (buscando) return
    setAbierto(false)
    setError('')
  }

  const buscar = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    const referencia = parsearReferencia(consulta)
    if (!referencia) {
      setError('Escriba una referencia como Juan 3:16 o Salmos 23:1.')
      return
    }

    setBuscando(true)
    try {
      const libroSelect = document.querySelector<HTMLSelectElement>('select[aria-label="Libro de la Biblia"]')
      const capituloSelect = document.querySelector<HTMLSelectElement>('select[aria-label="Capítulo"]')
      if (!libroSelect || !capituloSelect) {
        setError('La Biblia todavía se está cargando. Intente de nuevo en un momento.')
        return
      }

      const buscadoCompacto = compacto(referencia.libro)
      const objetivo = BOOK_ALIASES[buscadoCompacto] ?? buscadoCompacto
      const opciones = Array.from(libroSelect.options)
      const libroOpcion = opciones.find(option => {
        const nombre = compacto(option.textContent ?? '')
        return nombre === objetivo || nombre.startsWith(objetivo) || objetivo.startsWith(nombre)
      })

      if (!libroOpcion) {
        setError(`No encontré “${referencia.libro}”. Pruebe con el nombre completo o una abreviatura común.`)
        return
      }

      if (libroSelect.value !== libroOpcion.value) dispararCambio(libroSelect, libroOpcion.value)

      const opcionCapitulo = await esperarHasta(() => {
        const select = document.querySelector<HTMLSelectElement>('select[aria-label="Capítulo"]')
        if (!select) return null
        return Array.from(select.options).find(option => Number(option.value) === referencia.capitulo) ?? null
      })

      if (!opcionCapitulo) {
        setError(`El capítulo ${referencia.capitulo} no existe en ${libroOpcion.textContent?.trim() || referencia.libro}.`)
        return
      }

      const capituloActual = document.querySelector<HTMLSelectElement>('select[aria-label="Capítulo"]')
      if (!capituloActual) return
      dispararCambio(capituloActual, String(referencia.capitulo))

      if (referencia.versiculo) {
        const opcionVersiculo = await esperarHasta(() => {
          const select = document.querySelector<HTMLSelectElement>('select[aria-label="Versículo"]')
          if (!select || select.disabled) return null
          return Array.from(select.options).find(option => Number(option.value) === referencia.versiculo) ?? null
        }, 5000)

        if (!opcionVersiculo) {
          setError(`No encontré el versículo ${referencia.versiculo} en ese capítulo.`)
          return
        }

        const versiculoSelect = document.querySelector<HTMLSelectElement>('select[aria-label="Versículo"]')
        if (versiculoSelect) dispararCambio(versiculoSelect, String(referencia.versiculo))
      }

      setAbierto(false)
      setConsulta('')
    } finally {
      setBuscando(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Buscar versículo"
        className="fixed bottom-[calc(5.6rem+env(safe-area-inset-bottom))] right-4 z-[88] inline-flex h-12 items-center gap-2 rounded-full bg-[#C0392B] px-4 text-sm font-bold text-white shadow-xl shadow-black/15 transition active:scale-95"
      >
        <Search className="h-5 w-5" />
        <span>Buscar</span>
      </button>

      {abierto && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/35 p-3 backdrop-blur-[2px] sm:items-center" onMouseDown={event => event.target === event.currentTarget && cerrar()}>
          <section className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl" role="dialog" aria-modal="true" aria-label="Buscar versículo">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950">Buscar versículo</h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">Escriba la referencia y vaya directo al pasaje.</p>
              </div>
              <button type="button" onClick={cerrar} aria-label="Cerrar buscador" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={buscar} className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Referencia</span>
                <div className="flex h-13 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100">
                  <Search className="h-5 w-5 shrink-0 text-slate-400" />
                  <input
                    ref={inputRef}
                    value={consulta}
                    onChange={event => setConsulta(event.target.value)}
                    placeholder="Ej. Juan 3:16"
                    autoComplete="off"
                    enterKeyHint="go"
                    className="h-12 min-w-0 flex-1 bg-transparent text-base font-semibold text-slate-950 outline-none placeholder:font-normal placeholder:text-slate-400"
                  />
                </div>
              </label>

              <p className="text-xs text-slate-500">También funciona con abreviaturas como <strong>1 Cor 13:4</strong>, <strong>Mt 5:14</strong> o <strong>Sal 23:1</strong>.</p>
              {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

              <button type="submit" disabled={buscando || !consulta.trim()} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
                {buscando ? 'Buscando…' : 'Ir al versículo'}
                {!buscando && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  )
}
