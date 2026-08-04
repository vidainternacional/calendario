'use client'

import { useMemo, useState, useTransition } from 'react'
import { CheckCircle2, HandCoins, HeartHandshake, Phone, Search, ShoppingBasket, Users } from 'lucide-react'
import { actualizarAporteSolidario, actualizarSolicitudAyudaSolidaria } from '@/app/actions/solidaridad'
import {
  SOLIDARITY_CONTRIBUTION_STATUS_LABELS,
  SOLIDARITY_REQUEST_STATUS_LABELS,
  type SolidarityContributionStatus,
  type SolidarityRequestStatus,
} from '@/lib/solidarity/types'

type RequestItem = {
  id: string
  hogar_personas: number
  urgencia: string
  necesidad: string
  telefono: string | null
  contacto_preferido: string
  estado: SolidarityRequestStatus
  respuesta: string | null
  created_at: string
  profiles: { nombre_completo?: string | null; email?: string | null } | null
}

type ContributionItem = {
  id: string
  tipo: string
  monto: number | null
  moneda: string
  detalle: string
  telefono: string | null
  anonimo: boolean
  estado: SolidarityContributionStatus
  respuesta: string | null
  created_at: string
  profiles: { nombre_completo?: string | null; email?: string | null } | null
}

const requestStatuses: SolidarityRequestStatus[] = ['enviada', 'revisando', 'aprobada', 'programada', 'entregada', 'rechazada', 'cancelada']
const contributionStatuses: SolidarityContributionStatus[] = ['ofrecido', 'contactando', 'recibido', 'asignado', 'completado', 'cancelado']

export default function SolidarityAdminBoard({ requests, contributions }: { requests: RequestItem[]; contributions: ContributionItem[] }) {
  const [tab, setTab] = useState<'solicitudes' | 'aportes'>('solicitudes')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('todos')
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [responses, setResponses] = useState<Record<string, string>>({})

  const normalized = query.trim().toLocaleLowerCase('es')
  const filteredRequests = useMemo(() => requests.filter((item) => {
    const haystack = `${item.profiles?.nombre_completo || ''} ${item.profiles?.email || ''} ${item.necesidad}`.toLocaleLowerCase('es')
    return (status === 'todos' || item.estado === status) && (!normalized || haystack.includes(normalized))
  }), [requests, status, normalized])
  const filteredContributions = useMemo(() => contributions.filter((item) => {
    const haystack = `${item.profiles?.nombre_completo || ''} ${item.profiles?.email || ''} ${item.detalle}`.toLocaleLowerCase('es')
    return (status === 'todos' || item.estado === status) && (!normalized || haystack.includes(normalized))
  }), [contributions, status, normalized])

  const updateRequest = (id: string, next: SolidarityRequestStatus) => {
    setMessage(null)
    startTransition(async () => {
      const result = await actualizarSolicitudAyudaSolidaria({ id, status: next, response: responses[id] })
      setMessage(result.success ? 'Solicitud actualizada.' : result.error || 'No fue posible actualizar.')
    })
  }

  const updateContribution = (id: string, next: SolidarityContributionStatus) => {
    setMessage(null)
    startTransition(async () => {
      const result = await actualizarAporteSolidario({ id, status: next, response: responses[id] })
      setMessage(result.success ? 'Aporte actualizado.' : result.error || 'No fue posible actualizar.')
    })
  }

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3">
        <button onClick={() => { setTab('solicitudes'); setStatus('todos') }} className={`rounded-[22px] p-4 text-left ring-1 ring-black/[0.05] ${tab === 'solicitudes' ? 'bg-violet-600 text-white' : 'bg-white text-[#171923]'}`}>
          <ShoppingBasket className="h-5 w-5" />
          <p className="mt-4 text-3xl font-extrabold">{requests.length}</p>
          <p className={`mt-1 text-xs ${tab === 'solicitudes' ? 'text-white/70' : 'text-slate-400'}`}>solicitudes recibidas</p>
        </button>
        <button onClick={() => { setTab('aportes'); setStatus('todos') }} className={`rounded-[22px] p-4 text-left ring-1 ring-black/[0.05] ${tab === 'aportes' ? 'bg-emerald-600 text-white' : 'bg-white text-[#171923]'}`}>
          <HandCoins className="h-5 w-5" />
          <p className="mt-4 text-3xl font-extrabold">{contributions.length}</p>
          <p className={`mt-1 text-xs ${tab === 'aportes' ? 'text-white/70' : 'text-slate-400'}`}>aportes registrados</p>
        </button>
      </section>

      <section className="rounded-[22px] bg-white p-3 ring-1 ring-black/[0.05]">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex min-h-11 flex-1 items-center gap-2 rounded-2xl bg-slate-100 px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por persona o detalle" className="min-w-0 flex-1 bg-transparent text-sm text-[#171923] outline-none placeholder:text-slate-400" />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-11 rounded-2xl border-0 bg-slate-100 px-3 text-sm font-semibold text-slate-700 outline-none">
            <option value="todos">Todos los estados</option>
            {(tab === 'solicitudes' ? requestStatuses : contributionStatuses).map((item) => (
              <option key={item} value={item}>{tab === 'solicitudes' ? SOLIDARITY_REQUEST_STATUS_LABELS[item as SolidarityRequestStatus] : SOLIDARITY_CONTRIBUTION_STATUS_LABELS[item as SolidarityContributionStatus]}</option>
            ))}
          </select>
        </div>
      </section>

      {message && <p className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">{message}</p>}

      {tab === 'solicitudes' ? (
        <section className="space-y-3">
          {filteredRequests.length === 0 ? <Empty label="No hay solicitudes con estos filtros." /> : filteredRequests.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.05]">
              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-extrabold text-[#171923]">{item.profiles?.nombre_completo || 'Persona registrada'}</p>
                    <p className="mt-1 text-xs text-slate-400">{item.profiles?.email || 'Sin correo visible'} · {new Date(item.created_at).toLocaleString('es-SV')}</p>
                  </div>
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-bold text-violet-700">{SOLIDARITY_REQUEST_STATUS_LABELS[item.estado]}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5"><Users className="h-3.5 w-3.5" /> {item.hogar_personas} personas</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 capitalize">{item.urgencia}</span>
                  {item.telefono && <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5"><Phone className="h-3.5 w-3.5" /> {item.telefono}</span>}
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.necesidad}</p>
                <label className="mt-4 block">
                  <span className="mb-2 block text-xs font-bold text-slate-500">Respuesta visible para la persona</span>
                  <textarea value={responses[item.id] ?? item.respuesta ?? ''} onChange={(event) => setResponses((current) => ({ ...current, [item.id]: event.target.value }))} rows={3} maxLength={2000} placeholder="Ej. Su solicitud fue aprobada. Nos comunicaremos para coordinar la entrega." className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-5 outline-none focus:border-violet-400 focus:bg-white" />
                </label>
              </div>
              <div className="border-t border-slate-100 bg-slate-50 p-3">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {requestStatuses.filter((next) => next !== item.estado).map((next) => (
                    <button key={next} disabled={pending} onClick={() => updateRequest(item.id, next)} className="min-h-10 shrink-0 rounded-xl bg-white px-3 text-xs font-bold text-slate-600 ring-1 ring-slate-200 disabled:opacity-50">
                      {SOLIDARITY_REQUEST_STATUS_LABELS[next]}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="space-y-3">
          {filteredContributions.length === 0 ? <Empty label="No hay aportes con estos filtros." /> : filteredContributions.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.05]">
              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-extrabold text-[#171923]">{item.anonimo ? 'Aporte reservado' : item.profiles?.nombre_completo || 'Persona registrada'}</p>
                    <p className="mt-1 text-xs text-slate-400">{item.profiles?.email || 'Sin correo visible'} · {new Date(item.created_at).toLocaleString('es-SV')}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">{SOLIDARITY_CONTRIBUTION_STATUS_LABELS[item.estado]}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 capitalize">{item.tipo}</span>
                  {item.monto && <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">${Number(item.monto).toFixed(2)} {item.moneda}</span>}
                  {item.telefono && <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5"><Phone className="h-3.5 w-3.5" /> {item.telefono}</span>}
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.detalle}</p>
                <label className="mt-4 block">
                  <span className="mb-2 block text-xs font-bold text-slate-500">Respuesta visible para la persona</span>
                  <textarea value={responses[item.id] ?? item.respuesta ?? ''} onChange={(event) => setResponses((current) => ({ ...current, [item.id]: event.target.value }))} rows={3} maxLength={2000} placeholder="Ej. Gracias por su disposición. Le contactaremos para coordinar la entrega." className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-5 outline-none focus:border-emerald-400 focus:bg-white" />
                </label>
              </div>
              <div className="border-t border-slate-100 bg-slate-50 p-3">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {contributionStatuses.filter((next) => next !== item.estado).map((next) => (
                    <button key={next} disabled={pending} onClick={() => updateContribution(item.id, next)} className="min-h-10 shrink-0 rounded-xl bg-white px-3 text-xs font-bold text-slate-600 ring-1 ring-slate-200 disabled:opacity-50">
                      {SOLIDARITY_CONTRIBUTION_STATUS_LABELS[next]}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-[24px] bg-white px-5 py-12 text-center ring-1 ring-black/[0.05]">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400"><HeartHandshake className="h-6 w-6" /></span>
      <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
    </div>
  )
}
