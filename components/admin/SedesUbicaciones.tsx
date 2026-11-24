'use client'

import { useEffect, useState } from 'react'
import { guardarUbicacionSede, obtenerUbicacionesSedes, type UbicacionSede } from '@/app/actions/sedes-administracion'

type Sede = { id: string; nombre: string; ubicacion: UbicacionSede | null }
export default function SedesUbicaciones() {
  const [sedes, setSedes] = useState<Sede[]>([])
  const [aviso, setAviso] = useState('')
  const [pending, setPending] = useState(false)
  useEffect(() => { let active = true; obtenerUbicacionesSedes().then(r => { if (active) { setSedes(r.sedes || []); setAviso(r.error || '') } }).catch(() => { if (active) setAviso('No se pudieron consultar las ubicaciones.') }); return () => { active = false } }, [])
  const input = 'mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900'
  async function guardar(event: React.FormEvent<HTMLFormElement>, sede: Sede) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const ubicacion = { latitud: Number(form.get('latitud')), longitud: Number(form.get('longitud')), radio_metros: Number(form.get('radio')) }
    setPending(true); setAviso('')
    try {
      const result = await guardarUbicacionSede(sede.id, ubicacion, sede.ubicacion)
      if (result.error) setAviso(result.error)
      else { setSedes(items => items.map(item => item.id === sede.id ? { ...item, ubicacion } : item)); setAviso('Ubicación del templo guardada. No se modificó la ubicación de ninguna persona.') }
    } catch { setAviso('No se pudo confirmar el guardado. Vuelve a consultar antes de reintentar.') }
    finally { setPending(false) }
  }
  return <details className="mt-5 border-t border-slate-200 pt-3 text-slate-900">
    <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">Ubicación de los templos</summary>
    <p className="mt-2 text-sm leading-6 text-slate-600">Coordenadas del templo para confirmar llegada. Chalchuapa necesita su propia ubicación; no se usa la de Santa Ana automáticamente. En un evento especial también puedes elegir otra sede o una ubicación específica.</p>
    {sedes.map(sede => <details key={sede.id} className="mt-3 border-b border-slate-200 py-2">
      <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">{sede.nombre} · {sede.ubicacion ? 'Configurada' : 'Pendiente'}</summary>
      <form onSubmit={e => void guardar(e, sede)} className="grid gap-3 py-3 sm:grid-cols-3">
        <label className="text-sm">Latitud<input name="latitud" type="number" step="any" min="-90" max="90" required defaultValue={sede.ubicacion?.latitud} className={input} /></label>
        <label className="text-sm">Longitud<input name="longitud" type="number" step="any" min="-180" max="180" required defaultValue={sede.ubicacion?.longitud} className={input} /></label>
        <label className="text-sm">Radio en metros<input name="radio" type="number" min="25" max="1000" required defaultValue={sede.ubicacion?.radio_metros || 150} className={input} /></label>
        <button disabled={pending} className="min-h-11 rounded-full bg-rose-700 px-4 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-3">{pending ? 'Guardando…' : 'Guardar ubicación'}</button>
      </form>
    </details>)}
    <p role="status" className="mt-3 text-sm leading-6">{aviso}</p>
  </details>
}
