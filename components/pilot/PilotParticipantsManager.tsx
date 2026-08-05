'use client'

import { useMemo, useState, useTransition } from 'react'
import { Check, Loader2, UserMinus, Users } from 'lucide-react'
import { agregarParticipantePiloto, desactivarParticipantePiloto } from '@/app/actions/piloto'
import { mostrarToast } from '@/lib/ui/toast'

type ProfileOption = { id: string; nombre_completo: string | null; email: string | null; rol: string | null }
type Participant = { profile_id: string; active: boolean; invited_at: string; profiles: ProfileOption | null }

export default function PilotParticipantsManager({ profiles, participants }: { profiles: ProfileOption[]; participants: Participant[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pending, startTransition] = useTransition()
  const activeIds = useMemo(() => new Set(participants.filter((item) => item.active).map((item) => item.profile_id)), [participants])
  const available = profiles.filter((profile) => !activeIds.has(profile.id))
  const active = participants.filter((item) => item.active)

  const toggle = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])

  const addSelected = () => {
    if (selectedIds.length === 0) return
    startTransition(async () => {
      let added = 0
      for (const id of selectedIds) {
        const result = await agregarParticipantePiloto(id)
        if (result.success) added += 1
      }
      mostrarToast(`${added} ${added === 1 ? 'persona agregada' : 'personas agregadas'} al piloto.`, added > 0 ? 'ok' : 'error')
      if (added > 0) setSelectedIds([])
    })
  }

  const remove = (profileId: string) => startTransition(async () => {
    const result = await desactivarParticipantePiloto(profileId)
    mostrarToast(result.error || 'Persona retirada del piloto.', result.success ? 'ok' : 'error')
  })

  return (
    <section className="overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.05]">
      <div className="border-b border-slate-100 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-600"><Users className="h-5 w-5" /></span>
          <div><h2 className="text-base font-extrabold text-[#171923]">Participantes del piloto</h2><p className="mt-1 text-xs leading-5 text-slate-500">Selección temporal para esta etapa de pruebas. Puedes marcar varias personas antes de agregarlas.</p></div>
        </div>

        <div className="mt-4 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/70 p-2">
          {available.length === 0 ? <p className="px-3 py-5 text-center text-sm text-slate-400">No hay más personas disponibles.</p> : available.map((profile) => {
            const checked = selectedIds.includes(profile.id)
            return <button key={profile.id} type="button" onClick={() => toggle(profile.id)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left active:bg-white">
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border ${checked ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-transparent'}`}><Check className="h-4 w-4" /></span>
              <span className="min-w-0"><span className="block truncate text-sm font-bold text-[#171923]">{profile.nombre_completo || profile.email || 'Usuario'}</span><span className="block truncate text-xs text-slate-400">{profile.rol || 'servidor'}</span></span>
            </button>
          })}
        </div>

        <button type="button" onClick={addSelected} disabled={selectedIds.length === 0 || pending} className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 text-sm font-bold text-white disabled:opacity-50">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
          Agregar seleccionados{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
        </button>
      </div>

      <div>{active.length === 0 ? <p className="px-5 py-8 text-center text-sm text-slate-500">Aún no has seleccionado participantes.</p> : active.map((item, index) => <div key={item.profile_id} className={`flex min-w-0 items-center justify-between gap-3 px-4 py-3.5 sm:px-5 ${index < active.length - 1 ? 'border-b border-slate-100' : ''}`}><div className="min-w-0"><p className="truncate text-sm font-bold text-[#171923]">{item.profiles?.nombre_completo || item.profiles?.email || 'Usuario'}</p><p className="mt-0.5 truncate text-xs text-slate-400">{item.profiles?.rol || 'servidor'} · desde {new Date(item.invited_at).toLocaleDateString('es-SV')}</p></div><button type="button" onClick={() => remove(item.profile_id)} disabled={pending} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600 disabled:opacity-50" aria-label="Retirar del piloto"><UserMinus className="h-4 w-4" /></button></div>)}</div>
    </section>
  )
}
