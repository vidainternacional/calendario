'use client'

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Copy, Plus, Save, Trash2 } from 'lucide-react'
import { combinarPlantillasAdministradas, crearPlantillaAdministrada, esPlantillaBase, type PlantillaAdministrada } from '@/components/pastoral/pastoral-template-admin-model'
import { guardarPlantillasPastoralesAdmin } from '@/app/actions/pastoral-templates-admin'

const FONDOS = [
  '#ffffff', '#f8fafc', '#fff7ed', '#f5f3ff', '#0f172a', '#172554', '#3f1d2e', '#163b2b',
  'linear-gradient(145deg,#fffdf8 0%,#f1e7d8 100%)', 'linear-gradient(145deg,#07111f 0%,#172554 100%)',
  'linear-gradient(145deg,#10271e 0%,#1e4936 100%)', 'linear-gradient(135deg,#312e81 0%,#6d28d9 55%,#a855f7 100%)',
]

export default function PastoralTemplateAdminBuilder({ initialCatalog }: { initialCatalog: unknown }) {
  const inicial = useMemo(() => combinarPlantillasAdministradas(initialCatalog), [initialCatalog])
  const [catalogo, setCatalogo] = useState<PlantillaAdministrada[]>(inicial)
  const [plantillaId, setPlantillaId] = useState(inicial[0]?.id ?? '')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const plantilla = catalogo.find((item) => item.id === plantillaId) ?? catalogo[0]

  const actualizarPlantilla = (patch: Partial<PlantillaAdministrada>) => plantilla && setCatalogo((actual) => actual.map((item) => item.id === plantilla.id ? { ...item, ...patch } : item))
  const nueva = () => {
    const item = crearPlantillaAdministrada(catalogo.length)
    setCatalogo((actual) => [...actual, item])
    setPlantillaId(item.id)
    setMensaje('')
  }
  const duplicar = () => {
    if (!plantilla) return
    const base = crearPlantillaAdministrada(catalogo.length)
    const copia: PlantillaAdministrada = { ...JSON.parse(JSON.stringify(plantilla)), id: base.id, nombre: `${plantilla.nombre} copia`.slice(0, 80), orden: catalogo.length, activa: true }
    setCatalogo((actual) => [...actual, copia])
    setPlantillaId(copia.id)
    setMensaje('')
  }
  const eliminar = () => {
    if (!plantilla) return
    if (esPlantillaBase(plantilla.id)) {
      actualizarPlantilla({ activa: false })
      setMensaje('Fondo base ocultado. Puede volver a activarlo cuando quiera.')
      return
    }
    const siguientes = catalogo.filter((item) => item.id !== plantilla.id).map((item, orden) => ({ ...item, orden }))
    setCatalogo(siguientes)
    setPlantillaId(siguientes[0]?.id ?? '')
    setMensaje('Fondo eliminado del catálogo administrable.')
  }
  const moverOrden = (delta: number) => {
    if (!plantilla) return
    const indice = catalogo.findIndex((item) => item.id === plantilla.id)
    const destino = Math.max(0, Math.min(catalogo.length - 1, indice + delta))
    if (indice === destino) return
    const siguientes = [...catalogo]
    const [movida] = siguientes.splice(indice, 1)
    siguientes.splice(destino, 0, movida)
    setCatalogo(siguientes.map((item, orden) => ({ ...item, orden })))
  }
  const guardar = async () => {
    setGuardando(true)
    setMensaje('')
    try {
      const resultado = await guardarPlantillasPastoralesAdmin(catalogo)
      setMensaje(resultado.success ? 'Fondos guardados. El Centro Pastoral usará este catálogo.' : (resultado.error || 'No se pudo guardar.'))
    } finally {
      setGuardando(false)
    }
  }

  if (!plantilla) return null
  const fondoColor = /^#[0-9a-f]{6}$/i.test(plantilla.fondo) ? plantilla.fondo : '#ffffff'

  return <section className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04] sm:p-5">
    <div className="flex flex-wrap items-center gap-2">
      <div><h2 className="text-sm font-extrabold text-[#171923]">Fondos del Centro Pastoral</h2><p className="mt-1 text-xs leading-5 text-slate-500">Administre aquí únicamente los fondos que aparecen en el editor. El texto y su formato se editan dentro de cada proyecto.</p></div>
      <button type="button" onClick={nueva} className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-full border border-slate-200 px-3 text-xs font-bold text-slate-700"><Plus className="h-4 w-4" /> Nuevo</button>
    </div>
    {mensaje && <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">{mensaje}</div>}

    <div className="mt-4 grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">{catalogo.map((item) => <button key={item.id} type="button" onClick={() => setPlantillaId(item.id)} className={`grid gap-1 rounded-xl p-1.5 text-left ${item.id === plantilla.id ? 'bg-indigo-50 ring-2 ring-indigo-300' : 'bg-slate-50'}`}><span className="aspect-[16/9] w-full rounded-lg border border-black/5" style={{ background: item.fondo }} /><span className="truncate px-1 text-[11px] font-bold text-slate-700">{item.nombre}</span>{!item.activa && <span className="px-1 text-[10px] font-bold text-amber-600">Oculto</span>}</button>)}</div>

    <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
      <input value={plantilla.nombre} onChange={(e) => actualizarPlantilla({ nombre: e.target.value })} className="min-h-11 rounded-xl bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none ring-1 ring-slate-100 focus:ring-indigo-300" aria-label="Nombre del fondo" />
      <div className="flex items-center gap-1"><button type="button" onClick={() => moverOrden(-1)} className="grid h-11 w-11 place-items-center rounded-full border border-slate-200" aria-label="Subir fondo"><ArrowUp className="h-4 w-4" /></button><button type="button" onClick={() => moverOrden(1)} className="grid h-11 w-11 place-items-center rounded-full border border-slate-200" aria-label="Bajar fondo"><ArrowDown className="h-4 w-4" /></button><button type="button" onClick={duplicar} className="grid h-11 w-11 place-items-center rounded-full border border-slate-200" aria-label="Duplicar fondo"><Copy className="h-4 w-4" /></button><button type="button" onClick={eliminar} className="grid h-11 w-11 place-items-center rounded-full border border-rose-200 text-rose-600" aria-label="Eliminar fondo"><Trash2 className="h-4 w-4" /></button></div>
    </div>

    <div className="mt-3 grid grid-cols-2 gap-2"><select value={plantilla.categoria} onChange={(e) => actualizarPlantilla({ categoria: e.target.value as PlantillaAdministrada['categoria'] })} className="min-h-11 rounded-xl bg-slate-50 px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-100"><option>Cristianas</option><option>Minimalistas</option><option>Generales</option></select><label className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 text-xs font-bold text-slate-600 ring-1 ring-slate-100"><input type="checkbox" checked={plantilla.activa} onChange={(e) => actualizarPlantilla({ activa: e.target.checked })} /> Visible</label></div>

    <div className="mt-4 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
      <div className="aspect-[16/9] w-full rounded-xl border border-black/5 shadow-inner" style={{ background: plantilla.fondo }} />
      <p className="mt-3 text-[11px] font-bold text-slate-500">Fondo</p>
      <div className="mt-2 flex flex-wrap gap-2">{FONDOS.map((fondo) => <button key={fondo} type="button" onClick={() => actualizarPlantilla({ fondo })} className={`h-9 w-9 rounded-full border-2 ${plantilla.fondo === fondo ? 'border-indigo-500' : 'border-white ring-1 ring-slate-200'}`} style={{ background: fondo }} aria-label="Elegir fondo" />)}<input type="color" value={fondoColor} onChange={(e) => actualizarPlantilla({ fondo: e.target.value })} className="h-9 w-9 rounded-full border-0 bg-transparent p-0" aria-label="Color de fondo" /></div>
    </div>

    <button type="button" onClick={() => void guardar()} disabled={guardando} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" />{guardando ? 'Guardando…' : 'Guardar fondos'}</button>
  </section>
}
