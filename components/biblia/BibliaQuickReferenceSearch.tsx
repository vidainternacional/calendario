'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Search } from 'lucide-react'

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
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}
function compacto(value: string) { return normalizar(value).replace(/\s+/g, '') }
function parsearReferencia(value: string) {
  const match = value.trim().match(/^(.+?)\s+(\d{1,3})(?:\s*[:.,]\s*(\d{1,3}))?$/)
  if (!match) return null
  return { libro: match[1].trim(), capitulo: Number(match[2]), versiculo: match[3] ? Number(match[3]) : null }
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
  const [consulta, setConsulta] = useState('')
  const [error, setError] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const colocar = () => {
      const libro = document.querySelector<HTMLSelectElement>('select[aria-label="Libro de la Biblia"]')
      const grid = libro?.closest('div.mx-auto.grid') as HTMLElement | null
      const sticky = grid?.parentElement as HTMLElement | null
      if (!grid || !sticky) return false
      const existente = sticky.querySelector<HTMLElement>('[data-biblia-buscador-rapido="true"]')
      if (existente) { setPortalTarget(existente); return true }
      const mount = document.createElement('div')
      mount.dataset.bibliaBuscadorRapido = 'true'
      mount.className = 'mx-auto mt-2.5 max-w-2xl'
      mountRef.current = mount
      const tabs = grid.nextElementSibling
      if (tabs) sticky.insertBefore(mount, tabs)
      else sticky.appendChild(mount)
      setPortalTarget(mount)
      return true
    }
    if (colocar()) return
    const observer = new MutationObserver(() => { if (colocar()) observer.disconnect() })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])
  useEffect(() => () => { mountRef.current?.remove() }, [])

  const buscar = async (event: FormEvent) => {
    event.preventDefault(); setError('')
    const referencia = parsearReferencia(consulta)
    if (!referencia) { setError('Escriba una referencia como Juan 3:16.'); return }
    setBuscando(true)
    try {
      const libroSelect = document.querySelector<HTMLSelectElement>('select[aria-label="Libro de la Biblia"]')
      const capituloSelect = document.querySelector<HTMLSelectElement>('select[aria-label="Capítulo"]')
      if (!libroSelect || !capituloSelect) { setError('La Biblia todavía se está cargando.'); return }
      const buscadoCompacto = compacto(referencia.libro)
      const objetivo = BOOK_ALIASES[buscadoCompacto] ?? buscadoCompacto
      const libroOpcion = Array.from(libroSelect.options).find(option => {
        const nombre = compacto(option.textContent ?? '')
        return nombre === objetivo || nombre.startsWith(objetivo) || objetivo.startsWith(nombre)
      })
      if (!libroOpcion) { setError(`No encontré “${referencia.libro}”.`); return }
      if (libroSelect.value !== libroOpcion.value) dispararCambio(libroSelect, libroOpcion.value)
      const opcionCapitulo = await esperarHasta(() => {
        const select = document.querySelector<HTMLSelectElement>('select[aria-label="Capítulo"]')
        if (!select) return null
        return Array.from(select.options).find(option => Number(option.value) === referencia.capitulo) ?? null
      })
      if (!opcionCapitulo) { setError(`El capítulo ${referencia.capitulo} no existe en ${libroOpcion.textContent?.trim() || referencia.libro}.`); return }
      const capituloActual = document.querySelector<HTMLSelectElement>('select[aria-label="Capítulo"]')
      if (!capituloActual) return
      dispararCambio(capituloActual, String(referencia.capitulo))
      if (referencia.versiculo) {
        const opcionVersiculo = await esperarHasta(() => {
          const select = document.querySelector<HTMLSelectElement>('select[aria-label="Versículo"]')
          if (!select || select.disabled) return null
          return Array.from(select.options).find(option => Number(option.value) === referencia.versiculo) ?? null
        }, 5000)
        if (!opcionVersiculo) { setError(`No encontré el versículo ${referencia.versiculo} en ese capítulo.`); return }
        const versiculoSelect = document.querySelector<HTMLSelectElement>('select[aria-label="Versículo"]')
        if (versiculoSelect) dispararCambio(versiculoSelect, String(referencia.versiculo))
      }
      setConsulta('')
    } finally { setBuscando(false) }
  }

  if (!portalTarget) return null
  return createPortal(<>
    <form onSubmit={buscar} className="vida-biblia-search-shell flex h-11 w-full items-center rounded-2xl border px-1.5 shadow-sm backdrop-blur-xl transition">
      <Search className="vida-biblia-search-icon ml-2 h-4 w-4 shrink-0" aria-hidden="true" />
      <input value={consulta} onChange={event => { setConsulta(event.target.value); if (error) setError('') }} placeholder="Buscar un versículo…  Ej. Juan 3:16" aria-label="Buscar un versículo por referencia" autoComplete="off" enterKeyHint="go" className="vida-biblia-search-input h-full min-w-0 flex-1 bg-transparent px-2.5 text-[13px] font-semibold outline-none placeholder:font-medium" />
      <button type="submit" disabled={buscando || !consulta.trim()} aria-label="Ir al versículo" className="vida-biblia-search-go grid h-8 w-8 shrink-0 place-items-center rounded-xl transition active:scale-95 disabled:shadow-none">
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
    {error && <p className="vida-biblia-search-error mt-1.5 px-2 text-[11px] font-semibold">{error}</p>}
    <style>{`
      .vida-biblia-search-shell { border-color:#e2e8f0; background:rgba(255,255,255,.9); }
      .vida-biblia-search-input { color:#1e293b; }
      .vida-biblia-search-input::placeholder,.vida-biblia-search-icon { color:#94a3b8; }
      .vida-biblia-search-go { background:#7c3aed; color:white; box-shadow:0 1px 2px rgba(0,0,0,.08); }
      .vida-biblia-search-go:disabled { background:#e2e8f0; color:#94a3b8; }
      .vida-biblia-search-error { color:#dc2626; }
      [data-biblia-tema="oscuro"] .vida-biblia-search-shell { border-color:#334155; background:rgba(15,23,42,.9); }
      [data-biblia-tema="oscuro"] .vida-biblia-search-input { color:#f1f5f9; }
      [data-biblia-tema="oscuro"] .vida-biblia-search-input::placeholder,[data-biblia-tema="oscuro"] .vida-biblia-search-icon { color:#64748b; }
      [data-biblia-tema="oscuro"] .vida-biblia-search-go:disabled { background:#334155; color:#64748b; }
      [data-biblia-tema="sepia"] .vida-biblia-search-shell { border-color:#cdb991; background:rgba(255,248,232,.92); }
      [data-biblia-tema="sepia"] .vida-biblia-search-input { color:#493c2d; }
      [data-biblia-tema="sepia"] .vida-biblia-search-input::placeholder,[data-biblia-tema="sepia"] .vida-biblia-search-icon { color:#8f7b60; }
      [data-biblia-tema="sepia"] .vida-biblia-search-go:disabled { background:#dfcfad; color:#8f7b60; }
    `}</style>
  </>, portalTarget)
}
