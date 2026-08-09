'use client'

import { useState } from 'react'
import { Edit3, Plus, Power, PowerOff } from 'lucide-react'
import MinisterioModal from '@/components/admin/MinisterioModal'
import { toggleMinisterioActivo } from '@/app/actions/admin'

export default function MinisteriosAdminClient({ ministerios }: { ministerios: any[] }) {
  const [editing, setEditing] = useState<any | null>(null)
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="space-y-4">
        <button type="button" onClick={() => { setEditing(null); setOpen(true) }} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm active:scale-[.99]"><Plus className="h-4 w-4" />Nuevo ministerio</button>

        <div className="space-y-3">
          {ministerios.map((ministerio) => (
            <article key={ministerio.id} className={`relative overflow-hidden rounded-[22px] bg-white p-4 shadow-sm ring-1 ${ministerio.activo ? 'ring-black/[0.04]' : 'ring-rose-100 opacity-70'}`}>
              <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: ministerio.color_primario }} />
              <div className="flex items-start justify-between gap-3 pl-2">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-2xl">{ministerio.emoji || '✨'}</div>
                  <div className="min-w-0">
                    <h2 className="break-words text-sm font-extrabold text-[#171923]">{ministerio.nombre}</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{ministerio.descripcion || 'Sin descripción'}</p>
                    <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${ministerio.activo ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{ministerio.activo ? 'Activo' : 'Inactivo'}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => { setEditing(ministerio); setOpen(true) }} className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-600" aria-label={`Editar ${ministerio.nombre}`}><Edit3 className="h-4 w-4" /></button>
                  <form action={async () => { await toggleMinisterioActivo(ministerio.id, !ministerio.activo) }}>
                    <button type="submit" className={`flex h-11 w-11 items-center justify-center rounded-full ${ministerio.activo ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`} aria-label={ministerio.activo ? 'Desactivar ministerio' : 'Activar ministerio'}>{ministerio.activo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}</button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <MinisterioModal ministerio={editing} isOpen={open} onClose={() => { setOpen(false); setEditing(null) }} />
    </>
  )
}
