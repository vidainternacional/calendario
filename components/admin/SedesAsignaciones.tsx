'use client'

import { useEffect, useState } from 'react'
import { obtenerAdministracionSedes, clasificarMinisterioSede, crearMinisterioEnSede, asignarPastorSede, type AdministracionSedes } from '@/app/actions/sedes-administracion'
import { useMisSedes } from '@/lib/sedes/useMisSedes'

export default function SedesAsignaciones({ userId }: { userId: string }) {
  const { sedes } = useMisSedes(userId)
  const [datos, setDatos] = useState<AdministracionSedes | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const field = 'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900'
  async function refresh() { const result = await obtenerAdministracionSedes(); if (result.datos) setDatos(result.datos);else setMessage(result.error || 'No se pudo cargar.') }
  useEffect(() => { let active = true; void obtenerAdministracionSedes().then(r => { if (active) { if (r.datos) setDatos(r.datos); else setMessage(r.error || 'No se pudo cargar.') } }); return () => { active = false } }, [])
  async function execute(action: () => Promise<{ success?: boolean; error?: string }>) {
    setBusy(true);setMessage('')
    try { const result = await action();if (result.error) setMessage(result.error);else { await refresh();setMessage('Cambio guardado. No se trasladaron miembros ni se cambiaron roles generales.') } } catch { setMessage('No se pudo confirmar el guardado. Vuelve a cargar antes de reintentar.') } finally { setBusy(false) }
  }
  return <section className="mt-6 space-y-4 text-slate-800">
    <details className="border-t border-slate-200 pt-3"><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">Ministerios de cada sede</summary>
      <p className="my-2 text-xs leading-5 text-slate-500">Clasifica los ministerios existentes sin mover a sus integrantes. Cada sede tendrá sus propios equipos, aunque compartan nombre.</p>
      {datos?.ministerios.map(m => <div key={m.id} className="grid gap-2 border-b border-slate-100 py-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center"><span className="text-sm font-semibold">{m.nombre}</span><select aria-label={`Sede de ${m.nombre}`} className={field} value={draft[m.id] ?? m.sede ?? ''} onChange={e => setDraft({ ...draft, [m.id]: e.target.value })}><option value="">Sin clasificar</option>{sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select><button type="button" disabled={busy || !(draft[m.id] || m.sede)} className="min-h-11 text-sm font-semibold underline disabled:opacity-40" onClick={() => void execute(() => clasificarMinisterioSede(m.id, draft[m.id] || m.sede || '', m.sede))}>Guardar</button></div>)}
      <details className="mt-4"><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">Crear ministerio en una sede</summary><form className="mt-2 space-y-3" onSubmit={e => { e.preventDefault();const form = e.currentTarget;void execute(async () => { const result = await crearMinisterioEnSede(new FormData(form));if (result.success) form.reset();return result }) }}>
        <label className="block text-sm">Nombre<input name="nombre" required minLength={2} maxLength={100} className={field} placeholder="Alabanza" /></label>
        <label className="block text-sm">Sede<select name="sede" required className={field}><option value="">Elegir sede</option>{sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select></label>
        <label className="block text-sm">Presentación<textarea name="descripcion" maxLength={2000} rows={3} className={field} /></label>
        <button disabled={busy} className="min-h-11 rounded-full bg-rose-700 px-5 text-sm font-semibold text-white disabled:opacity-40">Crear ministerio</button>
      </form></details>
    </details>
    <details className="border-t border-slate-200 pt-3"><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">Pastores responsables</summary>
      <p className="my-2 text-xs leading-5 text-slate-500">Se asignan cuentas con rol pastoral activo. La congregación que elige una persona no le concede estos permisos. El pastor general conserva su alcance general.</p>
      {datos?.pastores.map(p => <fieldset key={p.id} className="border-b border-slate-100 py-3"><legend className="pt-3 text-sm font-semibold">{p.nombre}</legend><div className="flex flex-wrap gap-x-5">{sedes.map(s => <label key={s.id} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5 accent-rose-700" disabled={busy} checked={datos.responsables.some(r => r.profile_id === p.id && r.sede_id === s.id)} onChange={e => { const checked = e.target.checked;void execute(() => asignarPastorSede(p.id, s.id, checked)) }} />{s.nombre}</label>)}</div></fieldset>)}
    </details>
    <p role="status" className="text-sm leading-6">{busy ? 'Guardando…' : message}</p>
  </section>
}
