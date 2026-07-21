'use client'

import { useState, useTransition } from 'react'
import { Pencil, Check } from 'lucide-react'
import { actualizarMiPerfil } from '@/app/actions/perfil'

export default function EditarPerfilForm({ nombre, telefono, fechaNacimiento }: {
  nombre: string; telefono: string | null; fechaNacimiento: string | null
}) {
  const [abierto, setAbierto] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const enviar = (fd: FormData) =>
    startTransition(async () => {
      const r = await actualizarMiPerfil(fd)
      setMsg(r.error ?? '✓ Información actualizada')
      if (!r.error) setTimeout(() => { setAbierto(false); setMsg(null) }, 1200)
    })

  if (!abierto) {
    return (
      <button onClick={() => setAbierto(true)}
        className="mt-4 flex items-center gap-2 text-xs font-semibold px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-[#171923] rounded-xl border border-slate-200 transition-colors">
        <Pencil className="w-3.5 h-3.5" /> Editar mi información
      </button>
    )
  }

  const inputCls = "w-full text-sm px-3 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"

  return (
    <form action={enviar} className="mt-5 space-y-3 border-t border-slate-100 pt-5">
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nombre completo</label>
        <input name="nombre" defaultValue={nombre} required className={inputCls} style={{ colorScheme: 'light' }} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Teléfono</label>
        <input name="telefono" defaultValue={telefono ?? ''} placeholder="Ej: 7777-7777" className={inputCls} style={{ colorScheme: 'light' }} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Fecha de nacimiento 🎂</label>
        <input name="fecha_nacimiento" type="date" defaultValue={fechaNacimiento ?? ''} className={inputCls} style={{ colorScheme: 'light' }} />
        <p className="text-[11px] text-slate-400 mt-1">Para felicitarte en tu cumpleaños</p>
      </div>
      {msg && <p className={`text-xs font-medium ${msg.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>{msg}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending}
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 bg-indigo-600 text-white rounded-xl disabled:opacity-50">
          <Check className="w-4 h-4" /> {pending ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" onClick={() => { setAbierto(false); setMsg(null) }}
          className="px-4 text-sm font-semibold text-slate-500 bg-slate-50 rounded-xl border border-slate-200">Cancelar</button>
      </div>
    </form>
  )
}
