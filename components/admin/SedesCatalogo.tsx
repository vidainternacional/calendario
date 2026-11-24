'use client'

import { useState } from 'react'
import { Church } from 'lucide-react'
import { crearSede } from '@/app/actions/sedes'
import { useMisSedes } from '@/lib/sedes/useMisSedes'

export default function SedesCatalogo({ userId }: { userId: string }) {
  const { sedes, loaded, error, refresh } = useMisSedes(userId)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const field = 'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900'
  async function crear(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setPending(true); setMessage('')
    try {
      const result = await crearSede(new FormData(form), userId)
      if (result.success) { form.reset(); await refresh(); setMessage('Sede creada. No se asignaron personas ni equipos automáticamente.') }
      else setMessage(result.error || 'No se pudo crear la sede.')
    } catch { setMessage('No se pudo confirmar el guardado. Vuelve a consultar antes de reintentar.') }
    finally { setPending(false) }
  }
  return <section className="mt-5 text-slate-900">
    <h1 className="text-2xl font-bold">Sedes VIDA</h1>
    <p className="mt-2 text-sm leading-6 text-slate-600">Catálogo real de sedes. La elección de congregación se guarda desde el Perfil; la asignación de equipos y el envío por sede siguen en preparación.</p>
    <ul className="mt-5 divide-y divide-slate-200">
      {sedes.map(sede => <li key={sede.id} className="flex items-center gap-3 py-4">
        <Church className="h-5 w-5 shrink-0 text-rose-700" aria-hidden="true" />
        <div><p className="font-semibold">{sede.nombre}{sede.central && <span className="ml-2 text-xs font-medium text-slate-500">Central</span>}</p><p className="mt-1 text-xs text-slate-500">{sede.pais} · {sede.zona_horaria}</p></div>
      </li>)}
    </ul>
    {!loaded && !error && <p className="py-4 text-sm">Cargando sedes…</p>}
    {error && <p role="alert" className="mt-3 text-sm text-rose-800">{error} <button type="button" className="min-h-11 underline" onClick={() => void refresh()}>Volver a consultar</button></p>}
    <details className="mt-5 border-t border-slate-200 pt-3">
      <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">Agregar sede</summary>
      <form onSubmit={crear} className="mt-3 grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">Nombre<input name="nombre" required minLength={3} maxLength={100} placeholder="VIDA Guatemala" className={field} /></label>
        <label className="space-y-2 text-sm font-medium">Identificador<input name="slug" required maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="guatemala" className={field} /><span className="block text-xs text-slate-500">Letras minúsculas sin espacios; puedes usar guiones.</span></label>
        <label className="space-y-2 text-sm font-medium">País<select name="pais" className={field}><option value="SV">El Salvador</option><option value="GT">Guatemala</option></select></label>
        <label className="space-y-2 text-sm font-medium">Zona horaria<select name="zona_horaria" className={field}><option value="America/El_Salvador">El Salvador</option><option value="America/Guatemala">Guatemala</option></select></label>
        <button disabled={pending || !loaded} className="min-h-11 rounded-full bg-rose-700 px-5 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2">{pending ? 'Creando…' : 'Crear sede'}</button>
      </form>
    </details>
    <p role="status" className="mt-3 text-sm leading-6">{message}</p>
  </section>
}
