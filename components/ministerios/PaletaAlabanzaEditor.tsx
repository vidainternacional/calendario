'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Check,
  ChevronDown,
  Droplets,
  Grid3X3,
  LibraryBig,
  Palette,
  Plus,
  SlidersHorizontal,
  SwatchBook,
  X,
} from 'lucide-react'
import {
  crearPaletaBibliotecaMinisterial,
  listarPaletasBibliotecaMinisterial,
  type PaletaBibliotecaMinisterial,
} from '@/app/actions/paletas-ministeriales'

type Props = {
  action: (formData: FormData) => void | Promise<void>
  initialColors: string[]
  initialObservaciones?: string | null
  initialReferenciaUrl?: string | null
  puedeProgramar: boolean
}

type EstadoGuardado = 'idle' | 'saving' | 'saved' | 'error'
type Seccion = 'guardadas' | 'rapidas' | 'personalizar'
type VistaColor = 'visual' | 'hex' | 'muestras'

const PRESETS = [
  { nombre: 'Neutros cálidos', estilo: 'Editorial', colores: ['#F7F2EA', '#D8C5B2', '#A88F7A', '#6D5B4D', '#2F2925'] },
  { nombre: 'Blanco y negro', estilo: 'Clásica', colores: ['#FFFFFF', '#E5E7EB', '#9CA3AF', '#374151', '#111827'] },
  { nombre: 'Tierra', estilo: 'Natural', colores: ['#F4E9DC', '#D4A373', '#A26745', '#6B4F3A', '#3F352F'] },
  { nombre: 'Sage y crema', estilo: 'Suave', colores: ['#FAF7EF', '#DDE5D1', '#A7B892', '#71816D', '#38443A'] },
  { nombre: 'Azul noche', estilo: 'Elegante', colores: ['#F8FAFC', '#CBD5E1', '#64748B', '#1E3A5F', '#0F172A'] },
  { nombre: 'Pastel suave', estilo: 'Luminoso', colores: ['#FFF7F3', '#F8D7DA', '#E9D5FF', '#BFDBFE', '#D1FAE5'] },
  { nombre: 'Borgoña y nude', estilo: 'Formal', colores: ['#F7EDE8', '#E6C8BD', '#B97878', '#7F1D3A', '#3B1725'] },
  { nombre: 'Otoño', estilo: 'Cálido', colores: ['#F5E6CC', '#D9A05B', '#B85C38', '#7A3E2B', '#3D2B24'] },
  { nombre: 'Arena y oliva', estilo: 'Orgánica', colores: ['#F6F0E4', '#D9C7A3', '#A3A380', '#6B705C', '#3F4238'] },
  { nombre: 'Lavanda suave', estilo: 'Serena', colores: ['#FAF7FF', '#E9D5FF', '#C4B5FD', '#8B5CF6', '#4C1D95'] },
  { nombre: 'Azul cielo', estilo: 'Fresca', colores: ['#F0F9FF', '#BAE6FD', '#7DD3FC', '#38BDF8', '#0369A1'] },
  { nombre: 'Marfil y dorado', estilo: 'Celebración', colores: ['#FFFBEB', '#FEF3C7', '#FDE68A', '#D4A017', '#78350F'] },
  { nombre: 'Verde bosque', estilo: 'Profunda', colores: ['#F0FDF4', '#BBF7D0', '#4ADE80', '#166534', '#052E16'] },
  { nombre: 'Rosa empolvado', estilo: 'Romántica', colores: ['#FFF1F2', '#FECDD3', '#FDA4AF', '#BE6477', '#7F1D3A'] },
  { nombre: 'Terracota', estilo: 'Cálida', colores: ['#FFF7ED', '#FED7AA', '#FB923C', '#C2410C', '#7C2D12'] },
  { nombre: 'Azul petróleo', estilo: 'Moderna', colores: ['#ECFEFF', '#A5F3FC', '#22D3EE', '#0E7490', '#164E63'] },
  { nombre: 'Crema y cacao', estilo: 'Acogedora', colores: ['#FFF8ED', '#EAD7C2', '#C19A6B', '#7C5A3C', '#3B2F2F'] },
  { nombre: 'Gris piedra', estilo: 'Minimalista', colores: ['#F8FAFC', '#E2E8F0', '#94A3B8', '#475569', '#1E293B'] },
  { nombre: 'Primavera', estilo: 'Alegre', colores: ['#FFF7ED', '#FDE68A', '#A7F3D0', '#93C5FD', '#C4B5FD'] },
  { nombre: 'Coral suave', estilo: 'Cálida', colores: ['#FFF7F5', '#FED7D7', '#FEB2B2', '#F97368', '#9F3A38'] },
  { nombre: 'Mostaza y carbón', estilo: 'Urbana', colores: ['#FFFBEB', '#FDE68A', '#D6A21E', '#52525B', '#18181B'] },
  { nombre: 'Eucalipto', estilo: 'Natural', colores: ['#F5F7F2', '#DDE6D5', '#A7B7A0', '#667761', '#35413A'] },
  { nombre: 'Vino y crema', estilo: 'Formal', colores: ['#FFF8F3', '#F5E1D8', '#C58B8B', '#7F1D3A', '#3F0D1E'] },
  { nombre: 'Azul mediterráneo', estilo: 'Vibrante', colores: ['#F0FDFA', '#99F6E4', '#2DD4BF', '#0F766E', '#134E4A'] },
  { nombre: 'Lila y ciruela', estilo: 'Creativa', colores: ['#FAF5FF', '#E9D5FF', '#C084FC', '#7E22CE', '#3B0764'] },
  { nombre: 'Menta y lino', estilo: 'Ligera', colores: ['#FFFBF5', '#E8F5EC', '#B7DFC8', '#6BAF92', '#365B4C'] },
  { nombre: 'Café y camel', estilo: 'Tierra', colores: ['#FFF7ED', '#E7C8A0', '#C08A5B', '#8B5E3C', '#4A3428'] },
  { nombre: 'Negro y dorado', estilo: 'Elegante', colores: ['#FFFBEB', '#F8E7A1', '#C8A951', '#3F3F46', '#09090B'] },
  { nombre: 'Rojo profundo', estilo: 'Intensa', colores: ['#FFF1F2', '#FECDD3', '#FB7185', '#BE123C', '#4C0519'] },
  { nombre: 'Océano', estilo: 'Fresca', colores: ['#F0FDFA', '#CCFBF1', '#5EEAD4', '#0891B2', '#164E63'] },
  { nombre: 'Durazno y salvia', estilo: 'Suave', colores: ['#FFF7ED', '#FED7AA', '#FDBA74', '#A3B18A', '#588157'] },
  { nombre: 'Fiesta tropical', estilo: 'Viva', colores: ['#FFF7ED', '#FBBF24', '#F97316', '#EF4444', '#7C3AED'] },
]

const FALLBACK = ['#111827', '#F8FAFC', '#7C3AED', '#D4A373', '#94A3B8']
const MUESTRAS = [
  '#FFFFFF', '#F8FAFC', '#E2E8F0', '#94A3B8', '#475569', '#111827',
  '#FFF7ED', '#FED7AA', '#FB923C', '#EA580C', '#7C2D12',
  '#FFF1F2', '#FDA4AF', '#FB7185', '#E11D48', '#881337',
  '#FFFBEB', '#FDE68A', '#F59E0B', '#B45309', '#78350F',
  '#F0FDF4', '#BBF7D0', '#4ADE80', '#16A34A', '#14532D',
  '#F0FDFA', '#99F6E4', '#2DD4BF', '#0F766E', '#134E4A',
  '#F0F9FF', '#BAE6FD', '#38BDF8', '#0284C7', '#0C4A6E',
  '#FAF5FF', '#E9D5FF', '#C084FC', '#7E22CE', '#3B0764',
]

function normalizarHex(value: string, fallback: string) {
  const clean = value.trim().toUpperCase()
  return /^#[0-9A-F]{6}$/.test(clean) ? clean : fallback
}

function normalizarColores(values: string[]) {
  return Array.from({ length: 5 }, (_, index) => normalizarHex(values[index] || FALLBACK[index], FALLBACK[index]))
}

function errorTexto(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo completar la acción.'
}

const inputStyle = {
  color: '#0f172a',
  WebkitTextFillColor: '#0f172a',
  colorScheme: 'light',
} as const

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
  const [paletas, setPaletas] = useState<PaletaBibliotecaMinisterial[]>([])
  const [cargandoPaletas, setCargandoPaletas] = useState(true)
  const [paletaAbierta, setPaletaAbierta] = useState<string | null>(null)
  const [paletaSeleccionada, setPaletaSeleccionada] = useState<string | null>(null)
  const [estadoServicio, setEstadoServicio] = useState<EstadoGuardado>('idle')
  const [estadoBiblioteca, setEstadoBiblioteca] = useState<EstadoGuardado>('idle')
  const [mensajeBiblioteca, setMensajeBiblioteca] = useState<string | null>(null)
  const [seccion, setSeccion] = useState<Seccion>('guardadas')
  const [vistaColor, setVistaColor] = useState<VistaColor>('visual')
  const [indiceMuestra, setIndiceMuestra] = useState(0)
  const [crearAbierta, setCrearAbierta] = useState(false)

  useEffect(() => {
    let vigente = true
    if (!ministerioId) {
      setCargandoPaletas(false)
      return
    }

    setCargandoPaletas(true)
    listarPaletasBibliotecaMinisterial(ministerioId)
      .then((rows) => {
        if (vigente) setPaletas(rows)
      })
      .catch((error) => {
        if (vigente) setMensajeBiblioteca(errorTexto(error))
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
    setEstadoServicio('idle')
  }

  function usarPaletaGuardada(item: PaletaBibliotecaMinisterial) {
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
    colores.forEach((color, index) => formData.set(`color_${index + 1}`, color))
    setEstadoServicio('saving')

    try {
      await action(formData)
      setEstadoServicio('saved')
      window.setTimeout(() => router.refresh(), 900)
      window.setTimeout(() => setEstadoServicio('idle'), 2800)
    } catch {
      setEstadoServicio('error')
      window.setTimeout(() => setEstadoServicio('idle'), 2800)
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
    setMensajeBiblioteca(null)

    try {
      const creada = await crearPaletaBibliotecaMinisterial(ministerioId, formData)
      setPaletas((prev) => [creada, ...prev.filter((item) => item.id !== creada.id)])
      setPaletaSeleccionada(creada.id)
      setPaletaAbierta(creada.id)
      setEstadoBiblioteca('saved')
      form.reset()
      window.setTimeout(() => {
        setEstadoBiblioteca('idle')
        setCrearAbierta(false)
      }, 2200)
    } catch (error) {
      setEstadoBiblioteca('error')
      setMensajeBiblioteca(errorTexto(error))
      window.setTimeout(() => setEstadoBiblioteca('idle'), 3200)
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

  const menu = [
    { id: 'guardadas' as const, label: 'Guardadas', icon: LibraryBig, detail: `${paletas.length}` },
    { id: 'rapidas' as const, label: 'Plantillas', icon: SwatchBook, detail: `${PRESETS.length}` },
    { id: 'personalizar' as const, label: 'Personalizar', icon: SlidersHorizontal, detail: '3 vistas' },
  ]

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

      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="grid grid-cols-3 gap-2">
          {menu.map((item) => {
            const Icon = item.icon
            const activa = seccion === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSeccion(item.id)}
                className="flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-1 py-2 text-center"
                aria-pressed={activa}
              >
                <span className={`grid h-14 w-14 place-items-center rounded-full ring-1 transition ${activa ? 'bg-pink-600 text-white ring-pink-600 shadow-sm' : 'bg-white text-slate-500 ring-slate-200'}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className={`truncate text-[10px] font-extrabold ${activa ? 'text-pink-700' : 'text-slate-600'}`}>{item.label}</span>
                <span className="text-[9px] font-semibold text-slate-400">{item.detail}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-3 overflow-hidden rounded-[22px] bg-white ring-1 ring-slate-100">
          {seccion === 'guardadas' && (
            <div className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold text-slate-800">Plantillas guardadas</p>
                  <p className="mt-0.5 text-[10px] leading-4 text-slate-400">Reutiliza una combinación sin modificar los servicios anteriores.</p>
                </div>
                <span className="rounded-full bg-pink-50 px-2 py-1 text-[9px] font-extrabold text-pink-700">{paletas.length}</span>
              </div>

              {mensajeBiblioteca && (
                <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[10px] font-semibold text-rose-700 ring-1 ring-rose-100">{mensajeBiblioteca}</p>
              )}

              <div className="mt-3 overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-100">
                {cargandoPaletas ? (
                  <p className="p-4 text-xs text-slate-400">Cargando paletas...</p>
                ) : paletas.length === 0 ? (
                  <p className="p-4 text-xs leading-5 text-slate-500">Todavía no hay paletas reutilizables. Guarda la combinación actual para crear la primera.</p>
                ) : paletas.map((item, index) => {
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
                            {seleccionada && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold text-emerald-700">En uso</span>}
                          </span>
                          <span className="mt-1.5 flex h-4 max-w-40 overflow-hidden rounded-full ring-1 ring-black/5">
                            {normalizarColores(item.colores).map((color, colorIndex) => <span key={`${item.id}-${colorIndex}`} className="flex-1" style={{ backgroundColor: color }} />)}
                          </span>
                        </span>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${abierta ? 'rotate-180' : ''}`} />
                      </button>

                      {abierta && (
                        <div className="border-t border-slate-100 bg-white p-3">
                          {item.observaciones && <p className="text-[11px] leading-5 text-slate-500">{item.observaciones}</p>}
                          <button
                            type="button"
                            onClick={() => usarPaletaGuardada(item)}
                            className={`mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[11px] font-extrabold ${seleccionada ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'}`}
                          >
                            {seleccionada ? <Check className="h-4 w-4" /> : <Palette className="h-4 w-4" />}
                            {seleccionada ? 'Paleta seleccionada' : 'Usar esta paleta'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={() => setCrearAbierta((prev) => !prev)}
                className="mt-3 flex min-h-11 w-full items-center justify-between rounded-xl bg-indigo-50 px-3 text-[11px] font-extrabold text-indigo-700 ring-1 ring-indigo-100"
              >
                <span className="inline-flex items-center gap-2"><Plus className="h-4 w-4" /> Guardar combinación actual</span>
                {crearAbierta ? <X className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {crearAbierta && (
                <form onSubmit={guardarEnBiblioteca} className="mt-3 grid gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                  <input
                    name="nombre"
                    required
                    maxLength={80}
                    placeholder="Nombre de la paleta"
                    className="h-11 w-full rounded-xl bg-white px-3 text-xs font-semibold text-slate-900 outline-none ring-1 ring-slate-100 placeholder:text-slate-400"
                    style={inputStyle}
                  />
                  <div className="flex h-9 overflow-hidden rounded-xl ring-1 ring-black/5">
                    {colores.map((color, index) => <span key={`${color}-${index}`} className="flex-1" style={{ backgroundColor: color }} />)}
                  </div>
                  <button
                    disabled={estadoBiblioteca === 'saving'}
                    className={`flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold ${estadoBiblioteca === 'saved' ? 'bg-emerald-600 text-white' : estadoBiblioteca === 'error' ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'}`}
                  >
                    {estadoBiblioteca === 'saved' && <Check className="h-4 w-4" />}
                    {estadoBiblioteca === 'saving' ? 'Guardando...' : estadoBiblioteca === 'saved' ? 'Paleta guardada' : estadoBiblioteca === 'error' ? 'No se guardó' : 'Guardar en biblioteca'}
                  </button>
                </form>
              )}
            </div>
          )}

          {seccion === 'rapidas' && (
            <div className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold text-slate-800">Plantillas rápidas</p>
                  <p className="mt-0.5 text-[10px] leading-4 text-slate-400">{PRESETS.length} combinaciones listas para usar y ajustar.</p>
                </div>
                <SwatchBook className="h-5 w-5 text-pink-500" />
              </div>
              <div className="mt-3 grid max-h-[430px] grid-cols-2 gap-2 overflow-y-auto pr-0.5">
                {PRESETS.map((item) => (
                  <button
                    key={item.nombre}
                    type="button"
                    onClick={() => aplicarPreset(item.nombre, item.colores)}
                    className={`rounded-2xl p-3 text-left ring-1 transition active:scale-[0.99] ${preset === item.nombre ? 'bg-pink-50 ring-pink-200' : 'bg-slate-50 ring-slate-100'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[10px] font-extrabold text-slate-700">{item.nombre}</span>
                      {preset === item.nombre && <Check className="h-3.5 w-3.5 shrink-0 text-pink-500" />}
                    </div>
                    <span className="mt-0.5 block text-[8px] font-bold uppercase tracking-wide text-slate-400">{item.estilo}</span>
                    <span className="mt-2 flex overflow-hidden rounded-lg ring-1 ring-black/5">
                      {item.colores.map((color, index) => <span key={`${item.nombre}-${index}`} className="h-6 flex-1" style={{ backgroundColor: color }} />)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {seccion === 'personalizar' && (
            <div className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold text-slate-800">Personalizar colores</p>
                  <p className="mt-0.5 text-[10px] leading-4 text-slate-400">Elige la vista que te resulte más cómoda.</p>
                </div>
                <SlidersHorizontal className="h-5 w-5 text-indigo-500" />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-slate-50 p-1 ring-1 ring-slate-100">
                {([
                  { id: 'visual' as const, label: 'Visual', icon: Droplets },
                  { id: 'hex' as const, label: 'HEX', icon: Grid3X3 },
                  { id: 'muestras' as const, label: 'Muestras', icon: Palette },
                ]).map((item) => {
                  const Icon = item.icon
                  const activa = vistaColor === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setVistaColor(item.id)}
                      className={`flex h-10 items-center justify-center gap-1 rounded-lg text-[9px] font-extrabold ${activa ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-100' : 'text-slate-400'}`}
                    >
                      <Icon className="h-3.5 w-3.5" /> {item.label}
                    </button>
                  )
                })}
              </div>

              {vistaColor === 'visual' && (
                <div className="mt-3 space-y-2">
                  {colores.map((color, index) => (
                    <div key={`${index}-${color}`} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 ring-1 ring-slate-100">
                      <input
                        type="color"
                        value={color}
                        onChange={(event) => cambiarColor(index, event.target.value)}
                        className="h-11 w-12 shrink-0 cursor-pointer rounded-xl border-0 bg-transparent p-0"
                        aria-label={`Elegir color ${index + 1} desde el cuadro izquierdo`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Color {index + 1}</p>
                        <p className="mt-0.5 font-mono text-xs font-extrabold text-slate-800">{color}</p>
                      </div>
                      <input
                        type="color"
                        value={color}
                        onChange={(event) => cambiarColor(index, event.target.value)}
                        className="h-11 w-12 shrink-0 cursor-pointer rounded-xl border-0 bg-transparent p-0"
                        aria-label={`Elegir color ${index + 1} desde el cuadro derecho`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {vistaColor === 'hex' && (
                <div className="mt-3 space-y-2">
                  {colores.map((color, index) => (
                    <label key={`${index}-${color}`} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 ring-1 ring-slate-100">
                      <span className="h-10 w-10 shrink-0 rounded-lg ring-1 ring-black/5" style={{ backgroundColor: color }} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-400">Color {index + 1}</span>
                        <input
                          key={`hex-${index}-${color}`}
                          defaultValue={color}
                          onBlur={(event) => cambiarColor(index, event.target.value)}
                          maxLength={7}
                          className="mt-1 h-9 w-full rounded-lg bg-white px-3 font-mono text-xs font-extrabold text-slate-900 outline-none ring-1 ring-slate-100"
                          style={inputStyle}
                          aria-label={`Código HEX color ${index + 1}`}
                        />
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {vistaColor === 'muestras' && (
                <div className="mt-3">
                  <p className="text-[10px] font-semibold text-slate-500">Primero elige cuál color quieres cambiar:</p>
                  <div className="mt-2 grid grid-cols-5 gap-2">
                    {colores.map((color, index) => (
                      <button
                        key={`${index}-${color}`}
                        type="button"
                        onClick={() => setIndiceMuestra(index)}
                        className={`relative aspect-square rounded-xl ring-2 ${indiceMuestra === index ? 'ring-indigo-500 ring-offset-2' : 'ring-transparent'}`}
                        style={{ backgroundColor: color }}
                        aria-label={`Editar color ${index + 1}`}
                      >
                        {indiceMuestra === index && <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-8 gap-2">
                    {MUESTRAS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => cambiarColor(indiceMuestra, color)}
                        className="aspect-square rounded-full ring-1 ring-black/10 transition active:scale-90"
                        style={{ backgroundColor: color }}
                        aria-label={`Usar ${color}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 flex h-12 overflow-hidden rounded-xl ring-1 ring-black/5">
          {colores.map((color, index) => <span key={`${color}-${index}`} className="flex-1" style={{ backgroundColor: color }} />)}
        </div>

        <form onSubmit={guardarServicio} className="mt-3 grid gap-3">
          <textarea
            name="observaciones"
            value={observaciones}
            onChange={(event) => {
              setObservaciones(event.target.value)
              marcarPersonalizada()
            }}
            placeholder="Observaciones para este servicio"
            className="min-h-20 rounded-xl bg-white p-3 text-xs text-slate-900 outline-none ring-1 ring-slate-100 placeholder:text-slate-400"
            style={inputStyle}
          />
          <input
            name="referencia_url"
            value={referenciaUrl}
            onChange={(event) => {
              setReferenciaUrl(event.target.value)
              marcarPersonalizada()
            }}
            placeholder="Referencia visual o moodboard (opcional)"
            className="h-11 rounded-xl bg-white px-3 text-xs text-slate-900 outline-none ring-1 ring-slate-100 placeholder:text-slate-400"
            style={inputStyle}
          />
          <button
            disabled={estadoServicio === 'saving'}
            className={`flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold transition ${claseBotonServicio}`}
          >
            {estadoServicio === 'saved' && <Check className="h-4 w-4" />}
            {textoBotonServicio}
          </button>
          {!puedeProgramar && <p className="text-center text-[10px] leading-4 text-slate-400">Puedes editar la paleta, pero no el equipo ni el repertorio.</p>}
        </form>
      </div>
    </>
  )
}
