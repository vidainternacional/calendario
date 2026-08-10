'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Check, ChevronDown, LibraryBig, Palette, Plus, SlidersHorizontal } from 'lucide-react'
import {
  crearPaletaBibliotecaMinisterial,
  listarPaletasBibliotecaMinisterial,
} from '@/app/actions/paletas-ministeriales'

type Props = {
  action: (formData: FormData) => void | Promise<void>
  initialColors: string[]
  initialObservaciones?: string | null
  initialReferenciaUrl?: string | null
  puedeProgramar: boolean
}

type PaletaGuardada = {
  id: string
  nombre: string
  colores: string[]
  observaciones: string | null
  referencia_url: string | null
}

type EstadoGuardado = 'idle' | 'saving' | 'saved' | 'error'

const PRESETS = [
  { nombre: 'Neutros cálidos', estilo: 'Editorial', colores: ['#F7F2EA', '#D8C5B2', '#A88F7A', '#6D5B4D', '#2F2925'] },
  { nombre: 'Blanco y negro', estilo: 'Clásica', colores: ['#FFFFFF', '#E5E7EB', '#9CA3AF', '#374151', '#111827'] },
  { nombre: 'Tierra', estilo: 'Natural', colores: ['#F4E9DC', '#D4A373', '#A26745', '#6B4F3A', '#3F352F'] },
  { nombre: 'Sage y crema', estilo: 'Suave', colores: ['#FAF7EF', '#DDE5D1', '#A7B892', '#71816D', '#38443A'] },
  { nombre: 'Azul noche', estilo: 'Elegante', colores: ['#F8FAFC', '#CBD5E1', '#64748B', '#1E3A5F', '#0F172A'] },
  { nombre: 'Pastel suave', estilo: 'Luminoso', colores: ['#FFF7F3', '#F8D7DA', '#E9D5FF', '#BFDBFE', '#D1FAE5'] },
  { nombre: 'Borgoña y nude', estilo: 'Formal', colores: ['#F7EDE8', '#E6C8BD', '#B97878', '#7F1D3A', '#3B1725'] },
  { nombre: 'Otoño', estilo: 'Cálido', colores: ['#F5E6CC', '#D9A05B', '#B85C38', '#7A3E2B', '#3D2B24'] },
]

const FALLBACK = ['#111827', '#F8FAFC', '#7C3AED', '#D4A373', '#94A3B8']

function normalizarHex(value: string, fallback: string) {
  const clean = value.trim().toUpperCase()
  return /^#[0-9A-F]{6}$/.test(clean) ? clean : fallback
}

function normalizarColores(values: string[]) {
  return Array.from({ length: 5 }, (_, index) => normalizarHex(values[index] || FALLBACK[index], FALLBACK[index]))
}

export default function PaletaAlabanzaEditor({
  action,
  initialColors,
  initialObservaciones,
  initialReferenciaUrl,
  puedeProgramar,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const ministerioId = useMemo(() => pathname.match(/\/ministerios\/([^/]+)\/programacion/)?.[1] || '', [pathname])
  const inicial = useMemo(() => normalizarColores(initialColors), [initialColors])

  const [colores, setColores] = useState<string[]>(inicial)
  const [observaciones, setObservaciones] = useState(initialObservaciones || '')
  const [referenciaUrl, setReferenciaUrl] = useState(initialReferenciaUrl || '')
  const [preset, setPreset] = useState<string | null>(null)
  const [paletas, setPaletas] = useState<PaletaGuardada[]>([])
  const [cargandoPaletas, setCargandoPaletas] = useState(true)
  const [paletaAbierta, setPaletaAbierta] = useState<string | null>(null)
  const [paletaSeleccionada, setPaletaSeleccionada] = useState<string | null>(null)
  const [estadoServicio, setEstadoServicio] = useState<EstadoGuardado>('idle')
  const [estadoBiblioteca, setEstadoBiblioteca] = useState<EstadoGuardado>('idle')

  async function recargarPaletas() {
    if (!ministerioId) return
    setCargandoPaletas(true)
    try {
      const rows = await listarPaletasBibliotecaMinisterial(ministerioId)
      setPaletas(rows as PaletaGuardada[])
    } catch {
      setPaletas([])
    } finally {
      setCargandoPaletas(false)
    }
  }

  useEffect(() => {
    let vigente = true
    if (!ministerioId) {
      setCargandoPaletas(false)
      return
    }

    setCargandoPaletas(true)
    listarPaletasBibliotecaMinisterial(ministerioId)
      .then((rows) => {
        if (vigente) setPaletas(rows as PaletaGuardada[])
      })
      .catch(() => {
        if (vigente) setPaletas([])
      })
      .finally(() => {
        if (vigente) setCargandoPaletas(false)
      })

    return () => {
      vigente = false
    }
  }, [ministerioId])

  function marcarPersonalizada() {
    setPreset(null)
    setPaletaSeleccionada(null)
    if (estadoServicio === 'saved') setEstadoServicio('idle')
  }

  function cambiarColor(index: number, value: string) {
    marcarPersonalizada()
    setColores((prev) => prev.map((color, i) => i === index ? normalizarHex(value, color) : color))
  }

  function aplicarPreset(nombre: string, nuevos: string[]) {
    setPreset(nombre)
    setPaletaSeleccionada(null)
    setColores(normalizarColores(nuevos))
    if (estadoServicio === 'saved') setEstadoServicio('idle')
  }

  function usarPaletaGuardada(item: PaletaGuardada) {
    setPreset(null)
    setPaletaSeleccionada(item.id)
    setColores(normalizarColores(item.colores))
    setObservaciones(item.observaciones || '')
    setReferenciaUrl(item.referencia_url || '')
    setPaletaAbierta(item.id)
    setEstadoServicio('idle')
  }

  async function guardarServicio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setEstadoServicio('saving')
    try {
      await action(formData)
      setEstadoServicio('saved')
      window.setTimeout(() => router.refresh(), 900)
      window.setTimeout(() => setEstadoServicio('idle'), 2600)
    } catch {
      setEstadoServicio('error')
      window.setTimeout(() => setEstadoServicio('idle'), 2600)
    }
  }

  async function guardarEnBiblioteca(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ministerioId) return
    const form = event.currentTarget
    const formData = new FormData(form)
    colores.forEach((color, index) => formData.set(`color_${index + 1}`, color))
    formData.set('observaciones', observaciones)
    formData.set('referencia_url', referenciaUrl)

    setEstadoBiblioteca('saving')
    try {
      await crearPaletaBibliotecaMinisterial(ministerioId, formData)
      form.reset()
      await recargarPaletas()
      setEstadoBiblioteca('saved')
      window.setTimeout(() => setEstadoBiblioteca('idle'), 2400)
    } catch {
      setEstadoBiblioteca('error')
      window.setTimeout(() => setEstadoBiblioteca('idle'), 3000)
    }
  }

  const claseBotonServicio = estadoServicio === 'saved'
    ? 'bg-emerald-600 text-white'
    : estadoServicio === 'error'
      ? 'bg-rose-600 text-white'
      : 'bg-pink-600 text-white'

  const textoBotonServicio = estadoServicio === 'saving'
    ? 'Guardando...'
    : estadoServicio === 'saved'
      ? 'Guardado'
      : estadoServicio === 'error'
        ? 'No se guardó'
        : 'Guardar paleta del servicio'

  const claseBotonBiblioteca = estadoBiblioteca === 'saved'
    ? 'bg-emerald-600 text-white'
    : estadoBiblioteca === 'error'
      ? 'bg-rose-600 text-white'
      : 'bg-indigo-600 text-white'

  const textoBotonBiblioteca = estadoBiblioteca === 'saving'
    ? 'Guardando...'
    : estadoBiblioteca === 'saved'
      ? 'Paleta guardada'
      : estadoBiblioteca === 'error'
        ? 'No se guardó'
        : 'Guardar en biblioteca'

  return (
    <>
      <style jsx global>{`
        #dia-seleccionado .bg-indigo-50.ring-indigo-200 > a[href*="#servicio-activo"] {
          background: #dcfce7 !important;
          color: #166534 !important;
          box-shadow: inset 0 0 0 1px #bbf7d0 !important;
          font-size: 0 !important;
        }
        #dia-seleccionado .bg-indigo-50.ring-indigo-200 > a[href*="#servicio-activo"]::before {
          content: 'Programación abierta';
          font-size: 11px;
          font-weight: 800;
        }
        #dia-seleccionado .bg-indigo-50.ring-indigo-200 > a[href*="#servicio-activo"] svg {
          color: #16a34a !important;
          transform: rotate(90deg);
        }
      `}</style>

      <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4">
        <details className="overflow-hidden rounded-[20px] bg-white ring-1 ring-slate-100">
          <summary className="flex min-h-[58px] cursor-pointer list-none items-center gap-3 px-3 py-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pink-50 text-pink-600">
              <LibraryBig className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-extrabold text-slate-700">Paletas guardadas</span>
              <span className="block text-[10px] text-slate-400">
                {cargandoPaletas ? 'Cargando...' : `${paletas.length} ${paletas.length === 1 ? 'paleta reutilizable' : 'paletas reutilizables'}`}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
          </summary>

          <div className="border-t border-slate-100 bg-slate-50/70 p-3">
            {cargandoPaletas ? (
              <p className="rounded-xl bg-white p-3 text-xs text-slate-400 ring-1 ring-slate-100">Cargando biblioteca...</p>
            ) : paletas.length === 0 ? (
              <p className="rounded-xl bg-white p-3 text-xs leading-5 text-slate-500 ring-1 ring-slate-100">
                Todavía no hay paletas guardadas. Crea la primera con los colores que tengas preparados abajo.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100">
                {paletas.map((item, index) => {
                  const abierta = paletaAbierta === item.id
                  const seleccionada = paletaSeleccionada === item.id
                  return (
                    <div key={item.id} className={index ? 'border-t border-slate-100' : ''}>
                      <button
                        type="button"
                        onClick={() => setPaletaAbierta(abierta ? null : item.id)}
                        className="flex min-h-[58px] w-full items-center gap-3 px-3 py-2.5 text-left"
                        aria-expanded={abierta}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-xs font-extrabold text-slate-700">{item.nombre}</span>
                            {seleccionada && <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold text-emerald-700">En uso</span>}
                          </span>
                          <span className="mt-1.5 flex h-4 max-w-40 overflow-hidden rounded-full ring-1 ring-black/5">
                            {normalizarColores(item.colores).map((color, colorIndex) => (
                              <span key={`${item.id}-${color}-${colorIndex}`} className="flex-1" style={{ backgroundColor: color }} />
                            ))}
                          </span>
                        </span>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${abierta ? 'rotate-180' : ''}`} />
                      </button>

                      {abierta && (
                        <div className="border-t border-slate-100 bg-slate-50/70 p-3">
                          {item.observaciones && <p className="text-[11px] leading-5 text-slate-500">{item.observaciones}</p>}
                          {item.referencia_url && <p className="mt-1 truncate text-[10px] text-slate-400">{item.referencia_url}</p>}
                          <button
                            type="button"
                            onClick={() => usarPaletaGuardada(item)}
                            className={`mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[11px] font-extrabold ${seleccionada ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'}`}
                          >
                            {seleccionada && <Check className="h-4 w-4" />}
                            {seleccionada ? 'Paleta seleccionada' : 'Usar esta paleta'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </details>

        <details className="overflow-hidden rounded-[20px] bg-white ring-1 ring-slate-100">
          <summary className="flex min-h-[56px] cursor-pointer list-none items-center gap-3 px-3 py-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-600">
              <Plus className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-extrabold text-slate-700">Guardar como nueva paleta</span>
              <span className="block text-[10px] text-slate-400">Añade estos colores a la biblioteca para futuros servicios.</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
          </summary>
          <form onSubmit={guardarEnBiblioteca} className="grid gap-3 border-t border-slate-100 bg-slate-50/70 p-3">
            <input
              name="nombre"
              required
              maxLength={80}
              placeholder="Nombre de la paleta, ej.: Domingo blanco y beige"
              className="h-11 w-full rounded-xl bg-white px-3 text-xs font-semibold outline-none ring-1 ring-slate-100"
            />
            <div className="flex h-9 overflow-hidden rounded-xl ring-1 ring-black/5">
              {colores.map((color, index) => <span key={`${color}-${index}`} className="flex-1" style={{ backgroundColor: color }} />)}
            </div>
            <button disabled={estadoBiblioteca === 'saving'} className={`flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold ${claseBotonBiblioteca}`}>
              {estadoBiblioteca === 'saved' && <Check className="h-4 w-4" />}
              {textoBotonBiblioteca}
            </button>
          </form>
        </details>

        <details className="overflow-hidden rounded-[20px] bg-white ring-1 ring-slate-100">
          <summary className="flex min-h-[56px] cursor-pointer list-none items-center gap-3 px-3 py-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pink-50 text-pink-600"><Palette className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-extrabold text-slate-700">Plantillas rápidas</span>
              <span className="block text-[10px] text-slate-400">Elige una base y personalízala si lo necesitas.</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
          </summary>
          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50/70 p-3">
            {PRESETS.map((item) => (
              <button
                key={item.nombre}
                type="button"
                onClick={() => aplicarPreset(item.nombre, item.colores)}
                className={`rounded-2xl p-3 text-left ring-1 transition active:scale-[0.99] ${preset === item.nombre ? 'bg-pink-50 ring-pink-200' : 'bg-white ring-slate-100'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[11px] font-extrabold text-slate-700">{item.nombre}</span>
                  {preset === item.nombre && <Check className="h-3.5 w-3.5 shrink-0 text-pink-500" />}
                </div>
                <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-wide text-slate-400">{item.estilo}</span>
                <span className="mt-2 flex overflow-hidden rounded-lg ring-1 ring-black/5">
                  {item.colores.map((color) => <span key={color} className="h-6 flex-1" style={{ backgroundColor: color }} />)}
                </span>
              </button>
            ))}
          </div>
        </details>

        <form onSubmit={guardarServicio} className="grid gap-4 rounded-[20px] bg-slate-50 p-3 ring-1 ring-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-indigo-500" />
              <p className="text-xs font-extrabold text-slate-700">Personalizar colores</p>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Toca el cuadro de color o escribe el código HEX exacto.</p>
            <div className="mt-3 space-y-2">
              {colores.map((color, index) => (
                <div key={index} className="flex items-center gap-2 rounded-xl bg-white p-2 ring-1 ring-slate-100">
                  <input
                    type="color"
                    value={color}
                    onChange={(event) => cambiarColor(index, event.target.value)}
                    className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                    aria-label={`Elegir color ${index + 1}`}
                  />
                  <input
                    name={`color_${index + 1}`}
                    value={color}
                    onChange={(event) => cambiarColor(index, event.target.value)}
                    onBlur={(event) => cambiarColor(index, event.target.value)}
                    className="h-10 min-w-0 flex-1 rounded-lg bg-slate-50 px-3 font-mono text-xs font-bold uppercase text-slate-700 outline-none ring-1 ring-slate-100"
                    maxLength={7}
                    aria-label={`HEX color ${index + 1}`}
                  />
                  <span className="h-10 w-10 shrink-0 rounded-lg ring-1 ring-black/5" style={{ backgroundColor: color }} />
                </div>
              ))}
            </div>
            <div className="mt-3 flex overflow-hidden rounded-xl ring-1 ring-black/5">
              {colores.map((color, index) => <span key={`${color}-${index}`} className="h-12 flex-1" style={{ backgroundColor: color }} />)}
            </div>
          </div>

          <textarea
            name="observaciones"
            value={observaciones}
            onChange={(event) => {
              setObservaciones(event.target.value)
              marcarPersonalizada()
            }}
            placeholder="Ej.: tonos neutros, evitar estampados fuertes, pantalón oscuro…"
            className="min-h-24 rounded-xl bg-white p-3 text-xs outline-none ring-1 ring-slate-100"
          />
          <input
            name="referencia_url"
            value={referenciaUrl}
            onChange={(event) => {
              setReferenciaUrl(event.target.value)
              marcarPersonalizada()
            }}
            placeholder="Referencia visual o moodboard (opcional)"
            className="h-11 rounded-xl bg-white px-3 text-xs outline-none ring-1 ring-slate-100"
          />
          <button disabled={estadoServicio === 'saving'} className={`flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold transition ${claseBotonServicio}`}>
            {estadoServicio === 'saved' && <Check className="h-4 w-4" />}
            {textoBotonServicio}
          </button>
          {!puedeProgramar && <p className="text-center text-[10px] leading-4 text-slate-400">Puedes editar la paleta, pero no el equipo ni el repertorio.</p>}
        </form>
      </div>
    </>
  )
}
