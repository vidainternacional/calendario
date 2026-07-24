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
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="mt-4 inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-[#171923] transition-colors hover:bg-slate-100 active:scale-[0.98]"
      >
        <Pencil className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="break-words">Editar mi información</span>
      </button>
    )
  }

  const inputCls = 'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-800 outline-none focus:border-transparent focus:ring-2 focus:ring-indigo-500 sm:text-sm'

  return (
    <form action={enviar} className="mt-5 min-w-0 space-y-3 border-t border-slate-100 pt-5">
      <div className="min-w-0">
        <label htmlFor="perfil-nombre" className="mb-1.5 block text-xs font-semibold text-slate-500">Nombre completo</label>
        <input id="perfil-nombre" name="nombre" defaultValue={nombre} required autoComplete="name" className={inputCls} style={{ colorScheme: 'light' }} />
      </div>
      <div className="min-w-0">
        <label htmlFor="perfil-telefono" className="mb-1.5 block text-xs font-semibold text-slate-500">Teléfono</label>
        <input id="perfil-telefono" name="telefono" type="tel" inputMode="tel" autoComplete="tel" defaultValue={telefono ?? ''} placeholder="Ej: 7777-7777" className={inputCls} style={{ colorScheme: 'light' }} />
      </div>
      <div className="min-w-0">
        <label htmlFor="perfil-fecha-nacimiento" className="mb-1.5 block text-xs font-semibold text-slate-500">Fecha de nacimiento 🎂</label>
        <input id="perfil-fecha-nacimiento" name="fecha_nacimiento" type="date" defaultValue={fechaNacimiento ?? ''} className={inputCls} style={{ colorScheme: 'light' }} />
        <p className="mt-1 text-[11px] text-slate-400">Para felicitarte en tu cumpleaños</p>
      </div>
      {msg && (
        <p role="status" className={`break-words text-xs font-medium ${msg.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>
          {msg}
        </p>
      )}
      <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
        <button
          type="submit"
          disabled={pending}
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Check className="h-4 w-4" aria-hidden="true" /> {pending ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={() => { setAbierto(false); setMsg(null) }}
          className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-500"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
