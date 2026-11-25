'use client'

import { useEffect, useState } from 'react'
import { obtenerSedeCelebracion, guardarSedeCelebracion } from '@/app/actions/sedes-eventos'
import { obtenerUbicacionesSedes } from '@/app/actions/sedes-administracion'

export default function SedeEventoUbicacion({ eventoId }: { eventoId: string }) {
  const [sedes, setSedes] = useState<{ id: string; nombre: string }[]>([])
  const [sede, setSede] = useState('')
  const [permitido, setPermitido] = useState(false)
  const [aviso, setAviso] = useState('')
  const [pending, setPending] = useState(false)
  useEffect(() => { let active = true; Promise.all([obtenerSedeCelebracion(eventoId), obtenerUbicacionesSedes()]).then(([a, b]) => { if (active) { setPermitido(Boolean(a.datos?.puede_configurar)); setSede(a.datos?.sede_id || ''); setSedes(b.sedes || []); setAviso(a.error || b.error || '') } }).catch(() => { if (active) setAviso('No se pudo consultar la sede de celebración.') }); return () => { active = false } }, [eventoId])
  if (!permitido) return aviso ? <p role="status" className="mt-3 text-sm text-slate-600">{aviso}</p> : null
  return <details className="mt-4 border-t border-slate-200 pt-2 text-slate-900">
    <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">Sede de celebración y llegada</summary>
    <p className="text-sm leading-6 text-slate-600">Para una vigilia conjunta, elige el templo donde se realizará. Esto configura la llegada por GPS y conserva los equipos y sus permisos. La ubicación específica del evento sigue disponible en su ficha de asistencia.</p>
    <label className="mt-3 block text-sm">
      Templo
      <select
        value={sede}
        onChange={e => setSede(e.target.value)}
        className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900"
      >
        <option value="">Ubicación actual del evento</option>
        {sedes.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}
      </select>
    </label>
    <button
      type="button"
      disabled={pending || !sede}
      className="mt-3 min-h-11 rounded-full bg-rose-700 px-4 text-sm font-semibold text-white disabled:opacity-50"
      onClick={async () => {
        setPending(true); setAviso('')
        try {
          const r = await guardarSedeCelebracion(eventoId, sede)
          setAviso(r.error || 'Sede de celebración guardada.')
        } catch { setAviso('No se pudo confirmar el guardado.') }
        finally { setPending(false) }
      }}
    >
      {pending ? 'Guardando…' : 'Usar este templo'}
    </button>
    <p role="status" className="mt-3 text-sm leading-6">{aviso}</p>
  </details>
}
