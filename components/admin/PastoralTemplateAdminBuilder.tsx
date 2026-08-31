'use client'

import { useMemo, useState } from 'react'
import { AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, Copy, Plus, Save, Trash2 } from 'lucide-react'
import PastoralVisualCanvas from '@/components/pastoral/PastoralVisualCanvas'
import { FUENTES_PASTORALES, escaparHtmlCanvas, type Alineacion, type DiapositivaCanvas, type ElementoCanvas } from '@/components/pastoral/pastoral-canvas-model'
import { combinarPlantillasAdministradas, crearPlantillaAdministrada, esPlantillaBase, type CajaPlantillaAdministrada, type PlantillaAdministrada, type RolPlantillaAdministrada } from '@/components/pastoral/pastoral-template-admin-model'
import { guardarPlantillasPastoralesAdmin } from '@/app/actions/pastoral-templates-admin'

const ROLES: Array<{ id: RolPlantillaAdministrada; label: string }> = [
  { id: 'titulo', label: 'Título' }, { id: 'subtitulo', label: 'Subtítulo' }, { id: 'cuerpo', label: 'Párrafo' },
]
const FONDOS = [
  '#ffffff', '#f8fafc', '#fff7ed', '#f5f3ff', '#0f172a', '#172554', '#3f1d2e', '#163b2b',
  'linear-gradient(145deg,#fffdf8 0%,#f1e7d8 100%)', 'linear-gradient(145deg,#07111f 0%,#172554 100%)',
  'linear-gradient(145deg,#10271e 0%,#1e4936 100%)', 'linear-gradient(135deg,#312e81 0%,#6d28d9 55%,#a855f7 100%)',
]
const nombreFuente = (fuente: string) => fuente.includes('playfair') ? 'Playfair Display' : fuente.includes('montserrat') ? 'Montserrat' : fuente.includes('eb-garamond') ? 'EB Garamond' : fuente.includes('bebas') ? 'Bebas Neue' : fuente

function textoDesdeHtml(html: string) {
  if (typeof document === 'undefined') return html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
  const div = document.createElement('div'); div.innerHTML = html
  return div.innerText.replace(/\n{3,}/g, '\n\n').trim()
}

function paginaDesdePlantilla(plantilla: PlantillaAdministrada): DiapositivaCanvas {
  const elementos: ElementoCanvas[] = ROLES.map(({ id: rol }, index) => ({
    id: `plantilla-admin-${rol}`, tipo: 'texto', rol,
    x: plantilla[rol].x, y: plantilla[rol].y, w: plantilla[rol].w, h: plantilla[rol].h, z: 10 - index,
    contenido: escaparHtmlCanvas(plantilla.muestras[rol]).replace(/\n/g, '<br>'), fuente: plantilla[rol].fuente,
    tamano_fuente: plantilla[rol].pt, color: plantilla.colorTexto, alineacion: plantilla[rol].alineacion,
    peso: rol === 'titulo' ? 800 : rol === 'subtitulo' ? 700 : 500, interlineado: plantilla[rol].interlineado, opacidad: 1,
  }))
  return { titulo: '', contenido: '', recurso_id: null, plantilla: 'limpia', fondo: plantilla.fondo, color_texto: plantilla.colorTexto, alineacion: 'centro', tamano: 'normal', formato: '16:9', fondo_modo: 'color', fondo_tema: 'claro', fondo_recurso_id: null, elementos }
}

export default function PastoralTemplateAdminBuilder({ initialCatalog }: { initialCatalog: unknown }) {
  const inicial = useMemo(() => combinarPlantillasAdministradas(initialCatalog), [initialCatalog])
  const [catalogo, setCatalogo] = useState<PlantillaAdministrada[]>(inicial)
  const [plantillaId, setPlantillaId] = useState(inicial[0]?.id ?? '')
  const [rolSeleccionado, setRolSeleccionado] = useState<RolPlantillaAdministrada>('titulo')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const plantilla = catalogo.find((item) => item.id === plantillaId) ?? catalogo[0]
  const pagina = useMemo(() => plantilla ? paginaDesdePlantilla(plantilla) : null, [plantilla])
  const caja = plantilla?.[rolSeleccionado]

  const actualizarPlantilla = (patch: Partial<PlantillaAdministrada>) => plantilla && setCatalogo((actual) => actual.map((item) => item.id === plantilla.id ? { ...item, ...patch } : item))
  const actualizarCaja = (rol: RolPlantillaAdministrada, patch: Partial<CajaPlantillaAdministrada>) => plantilla && setCatalogo((actual) => actual.map((item) => item.id === plantilla.id ? { ...item, [rol]: { ...item[rol], ...patch } } : item))
  const cambiarMuestra = (rol: RolPlantillaAdministrada, texto: string) => plantilla && setCatalogo((actual) => actual.map((item) => item.id === plantilla.id ? { ...item, muestras: { ...item.muestras, [rol]: texto } } : item))

  const seleccionarElemento = (id: string | null) => {
    const rol = String(id ?? '').replace('plantilla-admin-', '') as RolPlantillaAdministrada
    if (ROLES.some((item) => item.id === rol)) setRolSeleccionado(rol)
  }
  const patchElemento = (id: string, patch: Partial<ElementoCanvas>) => {
    const rol = id.replace('plantilla-admin-', '') as RolPlantillaAdministrada
    if (!ROLES.some((item) => item.id === rol)) return
    const siguiente: Partial<CajaPlantillaAdministrada> = {}
    if (typeof patch.x === 'number') siguiente.x = patch.x
    if (typeof patch.y === 'number') siguiente.y = patch.y
    if (typeof patch.w === 'number') siguiente.w = patch.w
    if (typeof patch.h === 'number') siguiente.h = patch.h
    actualizarCaja(rol, siguiente)
  }
  const nueva = () => {
    const item = crearPlantillaAdministrada(catalogo.length)
    setCatalogo((actual) => [...actual, item]); setPlantillaId(item.id); setRolSeleccionado('titulo'); setMensaje('')
  }
  const duplicar = () => {
    if (!plantilla) return
    const base = crearPlantillaAdministrada(catalogo.length)
    const copia: PlantillaAdministrada = { ...JSON.parse(JSON.stringify(plantilla)), id: base.id, nombre: `${plantilla.nombre} copia`.slice(0, 80), orden: catalogo.length, activa: true }
    setCatalogo((actual) => [...actual, copia]); setPlantillaId(copia.id); setMensaje('')
  }
  const eliminar = () => {
    if (!plantilla) return
    if (esPlantillaBase(plantilla.id)) { actualizarPlantilla({ activa: false }); setMensaje('Plantilla base ocultada. Puede volver a activarla cuando quiera.'); return }
    const siguientes = catalogo.filter((item) => item.id !== plantilla.id).map((item, orden) => ({ ...item, orden }))
    setCatalogo(siguientes); setPlantillaId(siguientes[0]?.id ?? ''); setMensaje('Plantilla eliminada del catálogo administrable.')
  }
  const moverOrden = (delta: number) => {
    if (!plantilla) return
    const indice = catalogo.findIndex((item) => item.id === plantilla.id)
    const destino = Math.max(0, Math.min(catalogo.length - 1, indice + delta))
    if (indice === destino) return
    const siguientes = [...catalogo]; const [movida] = siguientes.splice(indice, 1); siguientes.splice(destino, 0, movida)
    setCatalogo(siguientes.map((item, orden) => ({ ...item, orden })))
  }
  const guardar = async () => {
    setGuardando(true); setMensaje('')
    try { const resultado = await guardarPlantillasPastoralesAdmin(catalogo); setMensaje(resultado.success ? 'Plantillas guardadas. El Centro Pastoral usará este catálogo.' : (resultado.error || 'No se pudo guardar.')) }
    finally { setGuardando(false) }
  }

  if (!plantilla || !pagina || !caja) return null
  const fuentes = FUENTES_PASTORALES.includes(caja.fuente as any) ? [...FUENTES_PASTORALES] : [caja.fuente, ...FUENTES_PASTORALES]
  const fondoColor = /^#[0-9a-f]{6}$/i.test(plantilla.fondo) ? plantilla.fondo : '#ffffff'

  return <section className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04] sm:p-5">
    <div className="flex flex-wrap items-center gap-2"><div><h2 className="text-sm font-extrabold text-[#171923]">Plantillas del Centro Pastoral</h2><p className="mt-1 text-xs leading-5 text-slate-500">Cree y edite aquí el catálogo que aparece en Plantillas. Solo Administrador puede guardarlo.</p></div><button type="button" onClick={nueva} className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-full border border-slate-200 px-3 text-xs font-bold text-slate-700"><Plus className="h-4 w-4" /> Nueva</button></div>
    {mensaje && <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">{mensaje}</div>}

    <div className="mt-4 grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">{catalogo.map((item) => <button key={item.id} type="button" onClick={() => { setPlantillaId(item.id); setRolSeleccionado('titulo') }} className={`grid gap-1 rounded-xl p-1.5 text-left ${item.id === plantilla.id ? 'bg-indigo-50 ring-2 ring-indigo-300' : 'bg-slate-50'}`}><span className="aspect-[16/9] w-full rounded-lg border border-black/5" style={{ background: item.fondo }} /><span className="truncate px-1 text-[11px] font-bold text-slate-700">{item.nombre}</span>{!item.activa && <span className="px-1 text-[10px] font-bold text-amber-600">Oculta</span>}</button>)}</div>

    <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"><input value={plantilla.nombre} onChange={(e) => actualizarPlantilla({ nombre: e.target.value })} className="min-h-11 rounded-xl bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none ring-1 ring-slate-100 focus:ring-indigo-300" aria-label="Nombre de plantilla" /><div className="flex items-center gap-1"><button type="button" onClick={() => moverOrden(-1)} className="grid h-11 w-11 place-items-center rounded-full border border-slate-200" aria-label="Subir plantilla"><ArrowUp className="h-4 w-4" /></button><button type="button" onClick={() => moverOrden(1)} className="grid h-11 w-11 place-items-center rounded-full border border-slate-200" aria-label="Bajar plantilla"><ArrowDown className="h-4 w-4" /></button><button type="button" onClick={duplicar} className="grid h-11 w-11 place-items-center rounded-full border border-slate-200" aria-label="Duplicar plantilla"><Copy className="h-4 w-4" /></button><button type="button" onClick={eliminar} className="grid h-11 w-11 place-items-center rounded-full border border-rose-200 text-rose-600" aria-label="Eliminar plantilla"><Trash2 className="h-4 w-4" /></button></div></div>
    <div className="mt-3 grid grid-cols-2 gap-2"><select value={plantilla.categoria} onChange={(e) => actualizarPlantilla({ categoria: e.target.value as PlantillaAdministrada['categoria'] })} className="min-h-11 rounded-xl bg-slate-50 px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-100"><option>Cristianas</option><option>Minimalistas</option><option>Generales</option></select><label className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 text-xs font-bold text-slate-600 ring-1 ring-slate-100"><input type="checkbox" checked={plantilla.activa} onChange={(e) => actualizarPlantilla({ activa: e.target.checked })} /> Visible</label></div>

    <div className="pastoral-template-admin-builder mt-4 overflow-hidden rounded-2xl bg-slate-100 p-2 ring-1 ring-slate-200"><PastoralVisualCanvas pagina={pagina} biblioteca={[]} editable seleccion={`plantilla-admin-${rolSeleccionado}`} onSelect={seleccionarElemento} onPatchElement={patchElemento} onTextInput={(id, html) => cambiarMuestra(id.replace('plantilla-admin-', '') as RolPlantillaAdministrada, textoDesdeHtml(html))} /></div>
    <p className="mt-2 text-[11px] leading-5 text-slate-500">Toque un texto para seleccionarlo. Use <b>Mover</b> y la esquina para colocarlo y redimensionarlo; la caja siempre queda dentro del canvas.</p>

    <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-slate-50 p-1">{ROLES.map((rol) => <button key={rol.id} type="button" onClick={() => setRolSeleccionado(rol.id)} className={`min-h-10 rounded-lg text-xs font-bold ${rolSeleccionado === rol.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>{rol.label}</button>)}</div>
    <textarea value={plantilla.muestras[rolSeleccionado]} onChange={(e) => cambiarMuestra(rolSeleccionado, e.target.value)} className="mt-3 min-h-24 w-full resize-y rounded-xl bg-slate-50 p-3 text-sm leading-5 text-slate-700 outline-none ring-1 ring-slate-100 focus:ring-indigo-300" aria-label={`Texto de ejemplo de ${rolSeleccionado}`} />

    <div className="mt-3 grid grid-cols-2 gap-2"><label className="grid gap-1 text-[11px] font-bold text-slate-500">Fuente<select value={caja.fuente} onChange={(e) => actualizarCaja(rolSeleccionado, { fuente: e.target.value })} className="min-h-11 rounded-xl bg-slate-50 px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-100">{fuentes.map((fuente) => <option key={fuente} value={fuente}>{nombreFuente(fuente)}</option>)}</select></label><label className="grid gap-1 text-[11px] font-bold text-slate-500">Tamaño · {Math.round(caja.pt)} pt<input type="range" min="8" max="72" step="1" value={caja.pt} onChange={(e) => actualizarCaja(rolSeleccionado, { pt: Number(e.target.value) })} /></label><label className="grid gap-1 text-[11px] font-bold text-slate-500">Interlineado · {caja.interlineado.toFixed(2)}<input type="range" min="0.8" max="2" step="0.05" value={caja.interlineado} onChange={(e) => actualizarCaja(rolSeleccionado, { interlineado: Number(e.target.value) })} /></label><div className="grid gap-1 text-[11px] font-bold text-slate-500"><span>Alineación</span><div className="flex gap-1">{([['izquierda', AlignLeft], ['centro', AlignCenter], ['derecha', AlignRight]] as Array<[Alineacion, typeof AlignLeft]>).map(([alineacion, Icon]) => <button key={alineacion} type="button" onClick={() => actualizarCaja(rolSeleccionado, { alineacion })} className={`grid h-11 flex-1 place-items-center rounded-xl border ${caja.alineacion === alineacion ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'}`}><Icon className="h-4 w-4" /></button>)}</div></div></div>

    <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4"><div><p className="text-[11px] font-bold text-slate-500">Fondo</p><div className="mt-2 flex flex-wrap gap-2">{FONDOS.map((fondo) => <button key={fondo} type="button" onClick={() => actualizarPlantilla({ fondo })} className={`h-9 w-9 rounded-full border-2 ${plantilla.fondo === fondo ? 'border-indigo-500' : 'border-white ring-1 ring-slate-200'}`} style={{ background: fondo }} aria-label="Elegir fondo" />)}<input type="color" value={fondoColor} onChange={(e) => actualizarPlantilla({ fondo: e.target.value })} className="h-9 w-9 rounded-full border-0 bg-transparent p-0" aria-label="Color de fondo" /></div></div><div><p className="text-[11px] font-bold text-slate-500">Color del texto</p><input type="color" value={plantilla.colorTexto} onChange={(e) => actualizarPlantilla({ colorTexto: e.target.value })} className="mt-2 h-9 w-12 rounded-lg border-0 bg-transparent p-0" /></div></div>
    <button type="button" onClick={() => void guardar()} disabled={guardando} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" />{guardando ? 'Guardando…' : 'Guardar plantillas'}</button>

    <style jsx global>{`.pastoral-template-admin-builder .pastoral-canvas-action{display:grid;width:38px;height:38px;place-items:center;border-radius:999px;background:white;color:#475569;box-shadow:0 5px 18px rgba(15,23,42,.16);border:1px solid rgba(148,163,184,.35);touch-action:none}.pastoral-template-admin-builder .pastoral-canvas-action svg{width:16px;height:16px}.pastoral-template-admin-builder .pastoral-canvas-resize-handle{right:-7px;bottom:-7px;width:18px;height:18px;border-radius:999px;background:#4f46e5;border:3px solid white;box-shadow:0 2px 8px rgba(15,23,42,.2)}`}</style>
  </section>
}
