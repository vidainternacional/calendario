'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Check, ChevronDown, Droplets, Grid3X3, LibraryBig, Palette, PencilLine, Plus, SlidersHorizontal, SwatchBook, Trash2, X } from 'lucide-react'
import {
  actualizarPaletaBibliotecaMinisterial,
  crearPaletaBibliotecaMinisterial,
  eliminarPaletaBibliotecaMinisterial,
  listarPaletasBibliotecaMinisterial,
  type PaletaBibliotecaMinisterial,
} from '@/app/actions/paletas-ministeriales'
import { MUESTRAS_PALETA, PALETAS_RAPIDAS } from '@/lib/programacion/paletas-presets'

type Props = {
  action: (formData: FormData) => void | Promise<void>
  initialColors: string[]
  initialObservaciones?: string | null
  initialReferenciaUrl?: string | null
  puedeProgramar: boolean
}
type Estado = 'idle' | 'saving' | 'saved' | 'error'
type Seccion = 'guardadas' | 'rapidas' | 'personalizar'
type VistaColor = 'visual' | 'hex' | 'muestras'

const FALLBACK = ['#111827', '#F8FAFC', '#7C3AED', '#D4A373', '#94A3B8']
const inputStyle = { color: '#0f172a', WebkitTextFillColor: '#0f172a', colorScheme: 'light' } as const

function normalizarHex(value: string, fallback: string) {
  const clean = value.trim().toUpperCase()
  return /^#[0-9A-F]{6}$/.test(clean) ? clean : fallback
}
function normalizarColores(values: string[]) {
  return Array.from({ length: 5 }, (_, index) => normalizarHex(values[index] || FALLBACK[index], FALLBACK[index]))
}
function errorTexto(error: unknown) { return error instanceof Error ? error.message : 'No se pudo completar la acción.' }

export default function PaletaAlabanzaEditor({ action, initialColors, initialObservaciones, initialReferenciaUrl, puedeProgramar }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const ministerioId = useMemo(() => pathname.match(/\/ministerios\/([^/]+)\/programacion/)?.[1] || '', [pathname])
  const [colores, setColores] = useState(() => normalizarColores(initialColors))
  const [observaciones, setObservaciones] = useState(initialObservaciones || '')
  const [referenciaUrl, setReferenciaUrl] = useState(initialReferenciaUrl || '')
  const [preset, setPreset] = useState<string | null>(null)
  const [paletas, setPaletas] = useState<PaletaBibliotecaMinisterial[]>([])
  const [cargando, setCargando] = useState(true)
  const [abierta, setAbierta] = useState<string | null>(null)
  const [seleccionada, setSeleccionada] = useState<string | null>(null)
  const [editando, setEditando] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [estadoServicio, setEstadoServicio] = useState<Estado>('idle')
  const [estadoBiblioteca, setEstadoBiblioteca] = useState<Estado>('idle')
  const [estadoPaleta, setEstadoPaleta] = useState<Record<string, Estado>>({})
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [seccion, setSeccion] = useState<Seccion>('guardadas')
  const [vistaColor, setVistaColor] = useState<VistaColor>('visual')
  const [indiceMuestra, setIndiceMuestra] = useState(0)
  const [crearAbierta, setCrearAbierta] = useState(false)

  useEffect(() => {
    let vigente = true
    if (!ministerioId) return
    listarPaletasBibliotecaMinisterial(ministerioId)
      .then((rows) => vigente && setPaletas(rows))
      .catch((error) => vigente && setMensaje(errorTexto(error)))
      .finally(() => vigente && setCargando(false))
    return () => { vigente = false }
  }, [ministerioId])

  function cambiarColor(index: number, value: string) {
    setPreset(null); setSeleccionada(null); setEstadoServicio('idle')
    setColores((prev) => prev.map((item, i) => i === index ? normalizarHex(value, item) : item))
  }
  function aplicarPreset(nombre: string, values: readonly string[]) {
    setPreset(nombre); setSeleccionada(null); setColores(normalizarColores([...values])); setEstadoServicio('idle')
  }
  function usar(item: PaletaBibliotecaMinisterial) {
    setPreset(null); setSeleccionada(item.id); setColores(normalizarColores(item.colores)); setObservaciones(item.observaciones || ''); setReferenciaUrl(item.referencia_url || ''); setAbierta(item.id); setEstadoServicio('idle')
  }

  async function guardarServicio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget)
    colores.forEach((color, i) => data.set(`color_${i + 1}`, color)); setEstadoServicio('saving')
    try { await action(data); setEstadoServicio('saved'); window.setTimeout(() => router.refresh(), 800); window.setTimeout(() => setEstadoServicio('idle'), 2600) }
    catch { setEstadoServicio('error'); window.setTimeout(() => setEstadoServicio('idle'), 2800) }
  }

  async function crear(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!ministerioId) return
    const form = event.currentTarget; const data = new FormData(form)
    colores.forEach((color, i) => data.set(`color_${i + 1}`, color)); data.set('observaciones', observaciones); data.set('referencia_url', referenciaUrl)
    setEstadoBiblioteca('saving'); setMensaje(null)
    try {
      const creada = await crearPaletaBibliotecaMinisterial(ministerioId, data)
      setPaletas((prev) => [creada, ...prev.filter((item) => item.id !== creada.id)]); setSeleccionada(creada.id); setAbierta(creada.id); setEstadoBiblioteca('saved'); form.reset()
      window.setTimeout(() => { setEstadoBiblioteca('idle'); setCrearAbierta(false) }, 1800)
    } catch (error) { setEstadoBiblioteca('error'); setMensaje(errorTexto(error)) }
  }

  async function editar(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault(); if (!ministerioId) return
    setEstadoPaleta((prev) => ({ ...prev, [id]: 'saving' })); setMensaje(null)
    try {
      const data = new FormData(event.currentTarget); data.set('paleta_id', id)
      const actualizada = await actualizarPaletaBibliotecaMinisterial(ministerioId, data)
      setPaletas((prev) => prev.map((item) => item.id === id ? actualizada : item)); setEstadoPaleta((prev) => ({ ...prev, [id]: 'saved' }))
      window.setTimeout(() => setEstadoPaleta((prev) => ({ ...prev, [id]: 'idle' })), 2200)
    } catch (error) { setEstadoPaleta((prev) => ({ ...prev, [id]: 'error' })); setMensaje(errorTexto(error)) }
  }

  async function eliminar(id: string) {
    if (!ministerioId) return
    setEstadoPaleta((prev) => ({ ...prev, [id]: 'saving' })); setMensaje(null)
    const data = new FormData(); data.set('paleta_id', id)
    try {
      await eliminarPaletaBibliotecaMinisterial(ministerioId, data)
      setPaletas((prev) => prev.filter((item) => item.id !== id)); if (seleccionada === id) setSeleccionada(null); setConfirmando(null); setAbierta(null)
    } catch (error) { setEstadoPaleta((prev) => ({ ...prev, [id]: 'error' })); setMensaje(errorTexto(error)); setConfirmando(null) }
  }

  const menu = [
    { id: 'guardadas' as const, label: 'Guardadas', icon: LibraryBig, detail: `${paletas.length}` },
    { id: 'rapidas' as const, label: 'Plantillas', icon: SwatchBook, detail: `${PALETAS_RAPIDAS.length}` },
    { id: 'personalizar' as const, label: 'Personalizar', icon: SlidersHorizontal, detail: '3 vistas' },
  ]

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <div className="grid grid-cols-3 gap-2">
        {menu.map((item) => { const Icon = item.icon; const activa = seccion === item.id; return (
          <button key={item.id} type="button" onClick={() => setSeccion(item.id)} className="flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-1 py-2 text-center" aria-pressed={activa}>
            <span className={`grid h-14 w-14 place-items-center rounded-full ring-1 transition ${activa ? 'bg-pink-600 text-white ring-pink-600 shadow-sm' : 'bg-white text-slate-500 ring-slate-200'}`}><Icon className="h-5 w-5" /></span>
            <span className={`truncate text-[10px] font-extrabold ${activa ? 'text-pink-700' : 'text-slate-600'}`}>{item.label}</span><span className="text-[9px] font-semibold text-slate-400">{item.detail}</span>
          </button>
        )})}
      </div>

      <div className="mt-3 overflow-hidden rounded-[22px] bg-white ring-1 ring-slate-200">
        {seccion === 'guardadas' && <div className="p-3">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-extrabold text-slate-800">Plantillas guardadas</p><p className="mt-0.5 text-[10px] text-slate-400">Puedes usar, editar o eliminar las paletas reutilizables.</p></div><span className="rounded-full bg-pink-50 px-2 py-1 text-[9px] font-extrabold text-pink-700">{paletas.length}</span></div>
          {mensaje && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[10px] font-semibold text-rose-700 ring-1 ring-rose-100">{mensaje}</p>}
          <div className="mt-3 overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-100">
            {cargando ? <p className="p-4 text-xs text-slate-400">Cargando paletas...</p> : paletas.length === 0 ? <p className="p-4 text-xs text-slate-500">Todavía no hay paletas reutilizables.</p> : paletas.map((item, index) => {
              const abiertaAhora = abierta === item.id; const estado = estadoPaleta[item.id] || 'idle'; const editandoAhora = editando === item.id
              return <div key={item.id} className={index ? 'border-t border-slate-100' : ''}>
                <button type="button" onClick={() => setAbierta(abiertaAhora ? null : item.id)} className="flex min-h-[58px] w-full items-center gap-3 px-3 py-2.5 text-left">
                  <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="truncate text-xs font-extrabold text-slate-700">{item.nombre}</span>{seleccionada === item.id && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold text-emerald-700">En uso</span>}</span><span className="mt-1.5 flex h-4 max-w-40 overflow-hidden rounded-full ring-1 ring-black/5">{normalizarColores(item.colores).map((color, i) => <span key={i} className="flex-1" style={{ backgroundColor: color }} />)}</span></span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${abiertaAhora ? 'rotate-180' : ''}`} />
                </button>
                {abiertaAhora && <div className="border-t border-slate-100 bg-white p-3">
                  {!editandoAhora ? <>
                    {item.observaciones && <p className="text-[11px] leading-5 text-slate-500">{item.observaciones}</p>}
                    <button type="button" onClick={() => usar(item)} className={`mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[11px] font-extrabold ${seleccionada === item.id ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'}`}>{seleccionada === item.id && <Check className="h-4 w-4" />}{seleccionada === item.id ? 'Paleta seleccionada' : 'Usar esta paleta'}</button>
                    <div className="mt-2 grid grid-cols-2 gap-2"><button type="button" onClick={() => { setEditando(item.id); setConfirmando(null) }} className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-50 text-[10px] font-bold text-slate-700 ring-1 ring-slate-200"><PencilLine className="h-3.5 w-3.5" />Editar</button><button type="button" onClick={() => setConfirmando(confirmando === item.id ? null : item.id)} className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-rose-50 text-[10px] font-bold text-rose-700"><Trash2 className="h-3.5 w-3.5" />Eliminar</button></div>
                    {confirmando === item.id && <div className="mt-2 rounded-xl bg-rose-50 p-3 ring-1 ring-rose-100"><p className="text-[10px] text-rose-700">Esto elimina la plantilla guardada, pero no cambia las paletas de servicios anteriores.</p><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" onClick={() => setConfirmando(null)} className="h-9 rounded-xl bg-white text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">Cancelar</button><button type="button" onClick={() => eliminar(item.id)} className="h-9 rounded-xl bg-rose-600 text-[10px] font-bold text-white">Confirmar</button></div></div>}
                  </> : <form onSubmit={(event) => editar(event, item.id)} className="grid gap-2 rounded-xl bg-slate-50 p-3">
                    <input name="nombre" defaultValue={item.nombre} required className="h-10 rounded-xl bg-white px-3 text-xs font-semibold text-slate-900 ring-1 ring-slate-100" style={inputStyle} />
                    <div className="grid grid-cols-5 gap-2">{normalizarColores(item.colores).map((color, i) => <input key={i} type="color" name={`color_${i + 1}`} defaultValue={color} className="h-10 w-full cursor-pointer rounded-lg border-0 bg-transparent p-0" aria-label={`Color ${i + 1}`} />)}</div>
                    <textarea name="observaciones" defaultValue={item.observaciones || ''} placeholder="Observaciones" className="min-h-16 rounded-xl bg-white p-3 text-xs text-slate-900 ring-1 ring-slate-100" style={inputStyle} />
                    <input name="referencia_url" defaultValue={item.referencia_url || ''} placeholder="Referencia visual (opcional)" className="h-10 rounded-xl bg-white px-3 text-xs text-slate-900 ring-1 ring-slate-100" style={inputStyle} />
                    <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setEditando(null)} className="h-10 rounded-xl bg-white text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">Cancelar</button><button disabled={estado === 'saving'} className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-[10px] font-bold ${estado === 'saved' ? 'bg-emerald-600 text-white' : estado === 'error' ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'}`}>{estado === 'saved' && <Check className="h-4 w-4" />}{estado === 'saving' ? 'Guardando...' : estado === 'saved' ? 'Guardado' : estado === 'error' ? 'Reintentar' : 'Guardar cambios'}</button></div>
                  </form>}
                </div>}
              </div>
            })}
          </div>
          <button type="button" onClick={() => setCrearAbierta((v) => !v)} className="mt-3 flex min-h-11 w-full items-center justify-between rounded-xl bg-indigo-50 px-3 text-[11px] font-extrabold text-indigo-700 ring-1 ring-indigo-100"><span className="inline-flex items-center gap-2"><Plus className="h-4 w-4" />Guardar combinación actual</span>{crearAbierta ? <X className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
          {crearAbierta && <form onSubmit={crear} className="mt-3 grid gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><input name="nombre" required maxLength={80} placeholder="Nombre de la paleta" className="h-11 rounded-xl bg-white px-3 text-xs font-semibold text-slate-900 ring-1 ring-slate-100" style={inputStyle}/><div className="flex h-9 overflow-hidden rounded-xl ring-1 ring-black/5">{colores.map((color, i) => <span key={i} className="flex-1" style={{ backgroundColor: color }} />)}</div><button disabled={estadoBiblioteca === 'saving'} className={`h-11 rounded-xl text-xs font-bold ${estadoBiblioteca === 'saved' ? 'bg-emerald-600 text-white' : estadoBiblioteca === 'error' ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'}`}>{estadoBiblioteca === 'saving' ? 'Guardando...' : estadoBiblioteca === 'saved' ? 'Paleta guardada' : estadoBiblioteca === 'error' ? 'Reintentar' : 'Guardar en biblioteca'}</button></form>}
        </div>}

        {seccion === 'rapidas' && <div className="p-3"><div className="flex items-start justify-between"><div><p className="text-xs font-extrabold text-slate-800">Plantillas rápidas</p><p className="mt-0.5 text-[10px] text-slate-400">{PALETAS_RAPIDAS.length} combinaciones listas.</p></div><SwatchBook className="h-5 w-5 text-pink-500" /></div><div className="mt-3 grid max-h-[430px] grid-cols-2 gap-2 overflow-y-auto">{PALETAS_RAPIDAS.map((item) => <button key={item.nombre} type="button" onClick={() => aplicarPreset(item.nombre, item.colores)} className={`rounded-2xl p-3 text-left ring-1 ${preset === item.nombre ? 'bg-pink-50 ring-pink-200' : 'bg-slate-50 ring-slate-100'}`}><div className="flex justify-between gap-2"><span className="truncate text-[10px] font-extrabold text-slate-700">{item.nombre}</span>{preset === item.nombre && <Check className="h-3.5 w-3.5 text-pink-500" />}</div><span className="text-[8px] font-bold uppercase text-slate-400">{item.estilo}</span><span className="mt-2 flex overflow-hidden rounded-lg">{item.colores.map((color, i) => <span key={i} className="h-6 flex-1" style={{ backgroundColor: color }} />)}</span></button>)}</div></div>}

        {seccion === 'personalizar' && <div className="p-3"><div className="flex items-start justify-between"><div><p className="text-xs font-extrabold text-slate-800">Personalizar colores</p><p className="mt-0.5 text-[10px] text-slate-400">Visual, HEX o muestras.</p></div><SlidersHorizontal className="h-5 w-5 text-indigo-500" /></div><div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-slate-50 p-1">{([{ id:'visual' as const,label:'Visual',icon:Droplets},{id:'hex' as const,label:'HEX',icon:Grid3X3},{id:'muestras' as const,label:'Muestras',icon:Palette}]).map((item) => {const Icon=item.icon; return <button key={item.id} type="button" onClick={() => setVistaColor(item.id)} className={`flex h-10 items-center justify-center gap-1 rounded-lg text-[9px] font-extrabold ${vistaColor===item.id?'bg-white text-indigo-700 shadow-sm':'text-slate-400'}`}><Icon className="h-3.5 w-3.5" />{item.label}</button>})}</div>
          {vistaColor === 'visual' && <div className="mt-3 space-y-2">{colores.map((color,i)=><div key={i} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 ring-1 ring-slate-100"><input type="color" value={color} onChange={(e)=>cambiarColor(i,e.target.value)} className="h-11 w-12 cursor-pointer border-0 bg-transparent p-0"/><div className="min-w-0 flex-1"><p className="text-[9px] font-bold uppercase text-slate-400">Color {i+1}</p><p className="font-mono text-xs font-extrabold text-slate-800">{color}</p></div><input type="color" value={color} onChange={(e)=>cambiarColor(i,e.target.value)} className="h-11 w-12 cursor-pointer border-0 bg-transparent p-0"/></div>)}</div>}
          {vistaColor === 'hex' && <div className="mt-3 space-y-2">{colores.map((color,i)=><label key={`${i}-${color}`} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2"><span className="h-10 w-10 rounded-lg" style={{backgroundColor:color}}/><span className="min-w-0 flex-1"><span className="block text-[9px] font-bold uppercase text-slate-400">Color {i+1}</span><input defaultValue={color} onBlur={(e)=>cambiarColor(i,e.target.value)} maxLength={7} className="mt-1 h-9 w-full rounded-lg bg-white px-3 font-mono text-xs font-extrabold text-slate-900" style={inputStyle}/></span></label>)}</div>}
          {vistaColor === 'muestras' && <div className="mt-3"><div className="grid grid-cols-5 gap-2">{colores.map((color,i)=><button key={i} type="button" onClick={()=>setIndiceMuestra(i)} className={`relative aspect-square rounded-xl ring-2 ${indiceMuestra===i?'ring-indigo-500 ring-offset-2':'ring-transparent'}`} style={{backgroundColor:color}}>{indiceMuestra===i&&<Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow"/>}</button>)}</div><div className="mt-4 grid grid-cols-8 gap-2">{MUESTRAS_PALETA.map((color)=><button key={color} type="button" onClick={()=>cambiarColor(indiceMuestra,color)} className="aspect-square rounded-full ring-1 ring-black/10" style={{backgroundColor:color}}/>)}</div></div>}
        </div>}
      </div>

      <div className="mt-3 flex h-12 overflow-hidden rounded-xl ring-1 ring-black/5">{colores.map((color,i)=><span key={i} className="flex-1" style={{backgroundColor:color}}/>)}</div>
      <form onSubmit={guardarServicio} className="mt-3 grid gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><textarea name="observaciones" value={observaciones} onChange={(e)=>{setObservaciones(e.target.value);setEstadoServicio('idle')}} placeholder="Observaciones para este servicio" className="min-h-20 rounded-xl bg-white p-3 text-xs text-slate-900 ring-1 ring-slate-100" style={inputStyle}/><input name="referencia_url" value={referenciaUrl} onChange={(e)=>{setReferenciaUrl(e.target.value);setEstadoServicio('idle')}} placeholder="Referencia visual o moodboard (opcional)" className="h-11 rounded-xl bg-white px-3 text-xs text-slate-900 ring-1 ring-slate-100" style={inputStyle}/><button disabled={estadoServicio==='saving'} className={`flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold ${estadoServicio==='saved'?'bg-emerald-600 text-white':estadoServicio==='error'?'bg-rose-600 text-white':'bg-pink-600 text-white'}`}>{estadoServicio==='saved'&&<Check className="h-4 w-4"/>}{estadoServicio==='saving'?'Guardando...':estadoServicio==='saved'?'Guardado':estadoServicio==='error'?'No se guardó':'Guardar paleta del servicio'}</button>{!puedeProgramar&&<p className="text-center text-[10px] text-slate-400">Puedes editar la paleta, pero no el equipo ni el repertorio.</p>}</form>
    </div>
  )
}
