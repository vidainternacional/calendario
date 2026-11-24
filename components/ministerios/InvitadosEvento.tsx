'use client'

import { useEffect, useState } from 'react'
import { obtenerMusicosInvitables, cambiarInvitacionMusico, type DirectorioMusicos } from '@/app/actions/sedes-eventos'
export default function InvitadosEvento({ eventoId, ministerioId }: { eventoId: string; ministerioId: string }) {
  const [open, setOpen] = useState(false), [datos, setDatos] = useState<DirectorioMusicos | null>(null), [filtro, setFiltro] = useState(''), [busy, setBusy] = useState(false), [message, setMessage] = useState('')
  useEffect(() => { if (!open) return;let active = true;void obtenerMusicosInvitables(eventoId, ministerioId).then(r => { if (active) { if (r.datos) setDatos(r.datos);else setMessage(r.error || 'No se pudo cargar.') } });return () => { active = false } }, [open, eventoId, ministerioId])
  return <details className="mt-4 border-t border-slate-200 pt-2" onToggle={e => setOpen(e.currentTarget.open)}><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-slate-800">Músicos invitados de otras sedes</summary>
    <p className="mb-3 text-xs leading-5 text-slate-500">La invitación permite ver solo este repertorio. No agrega a la persona al ministerio ni abre sus conversaciones privadas.</p>
    <input type="search" value={filtro} onChange={e => setFiltro(e.target.value)} aria-label="Buscar músico de otra sede" placeholder="Buscar músico o sede" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900" />
    <div className="mt-2 max-h-80 divide-y divide-slate-100 overflow-y-auto">{datos?.personas.filter(p => `${p.nombre} ${p.sedes.join(' ')}`.toLocaleLowerCase('es').includes(filtro.toLocaleLowerCase('es'))).map(p => <label key={p.id} className="flex min-h-14 items-center justify-between gap-3 py-3 text-sm text-slate-800"><span>{p.nombre}<span className="mt-1 block text-xs text-slate-500">{p.sedes.join(' · ') || 'Sede sin clasificar'}</span></span><input type="checkbox" className="h-5 w-5 shrink-0 accent-rose-700" disabled={busy} checked={datos.invitados.some(i => i.id === p.id)} onChange={async e => { const selected = e.target.checked;setBusy(true);setMessage('');try { const result = await cambiarInvitacionMusico(eventoId, ministerioId, p.id, selected);if (result.error) setMessage(result.error);else { const next = await obtenerMusicosInvitables(eventoId, ministerioId);if (next.datos) setDatos(next.datos);setMessage(result.aviso || 'Invitación actualizada. Se conserva el historial del servicio.') } } catch { setMessage('No se pudo confirmar el cambio.') } finally { setBusy(false) } }} /></label>)}</div>
    <p role="status" className="mt-2 text-xs leading-5 text-slate-600">{busy ? 'Guardando…' : message || (!datos && open ? 'Cargando directorio…' : '')}</p>
  </details>
}
