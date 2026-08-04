'use client'

import { useMemo, useState, useTransition } from 'react'
import { Loader2, Plus, UserMinus } from 'lucide-react'
import { agregarParticipantePiloto, desactivarParticipantePiloto } from '@/app/actions/piloto'
import { mostrarToast } from '@/lib/ui/toast'

type ProfileOption = {
  id: string
  nombre_completo: string | null
  email: string | null
  rol: string | null
}

type Participant = {
  profile_id: string
  active: boolean
  invited_at: string
  profiles: ProfileOption | null
}

export default function PilotParticipantsManager({
  profiles,
  participants,
}: {
  profiles: ProfileOption[]
  participants: Participant[]
}) {
  const [selected, setSelected] = useState('')
  const [pending, startTransition] = useTransition()
  const activeIds = useMemo(() => new Set(participants.filter((item) => item.active).map((item) => item.profile_id)), [participants])
  const available = profiles.filter((profile) => !activeIds.has(profile.id))
  const active = participants.filter((item) => item.active)

  const add = () => {
    if (!selected) return
    startTransition(async () => {
      const result = await agregarParticipantePiloto(selected)
      mostrarToast(result.error || 'Persona agregada al piloto.', result.success ? 'ok' : 'error')
      if (result.success) setSelected('')
    })
  }

  const remove = (profileId: string) => {
    startTransition(async () => {
      const result = await desactivarParticipantePiloto(profileId)
      mostrarToast(result.error || 'Persona retirada del piloto.', result.success ? 'ok' : 'error')
    })
  }

  return (
    <section className="overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.05]">
      <div className="border-b border-slate-100 p-4 sm:p-5">
        <h2 className="text-base font-extrabold text-[#171923]">Participantes del piloto</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">Solo las personas activas recibirán el recorrido inicial y aparecerán en las métricas.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            className="min-h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none"
          >
            <option value="">Seleccionar persona…</option>
            {available.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.nombre_completo || profile.email || 'Usuario'} · {profile.rol || 'servidor'}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={add}
            disabled={!selected || pending}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-bold text-white disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Agregar
          </button>
        </div>
      </div>

      <div>
        {active.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">Aún no has seleccionado participantes.</p>
        ) : (
          active.map((item, index) => (
            <div key={item.profile_id} className={`flex min-w-0 items-center justify-between gap-3 px-4 py-3.5 sm:px-5 ${index < active.length - 1 ? 'border-b border-slate-100' : ''}`}>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#171923]">{item.profiles?.nombre_completo || item.profiles?.email || 'Usuario'}</p>
                <p className="mt-0.5 truncate text-xs text-slate-400">{item.profiles?.rol || 'servidor'} · desde {new Date(item.invited_at).toLocaleDateString('es-SV')}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(item.profile_id)}
                disabled={pending}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600 disabled:opacity-50"
                aria-label="Retirar del piloto"
              >
                <UserMinus className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
