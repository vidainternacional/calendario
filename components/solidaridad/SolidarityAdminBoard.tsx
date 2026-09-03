'use client'

import { useMemo, useState, useTransition } from 'react'
import { ChevronDown, HeartHandshake, MessageCircle, Phone, Search, Sparkles, Sprout } from 'lucide-react'
import { actualizarAporteSolidario, actualizarSolicitudAyudaSolidaria, marcarAgradecimientoAporte } from '@/app/actions/solidaridad'
import SolidarityChat from '@/components/solidaridad/SolidarityChat'
import SolidarityPantryManager from '@/components/solidaridad/SolidarityPantryManager'
import {
  SOLIDARITY_CONTRIBUTION_STATUS_LABELS,
  SOLIDARITY_CONTRIBUTION_TYPE_LABELS,
  SOLIDARITY_REQUEST_STATUS_LABELS,
  type PantryNeed,
  type SolidarityContributionStatus,
  type SolidarityContributionType,
  type SolidarityHelpType,
  type SolidarityRequestStatus,
} from '@/lib/solidarity/types'

type RequestItem = {
  id: string
  profile_id: string
  tipo_ayuda: SolidarityHelpType
  hogar_personas: number | null
  necesidad: string
  detalle_adicional: string | null
  telefono: string | null
  contacto_preferido: string
  estado: SolidarityRequestStatus
  respuesta: string | null
  created_at: string
  profiles: { nombre_completo?: string | null; email?: string | null } | null
}

type ContributionItem = {
  id: string
  profile_id: string
  tipo: SolidarityContributionType
  monto: number | null
  moneda: string
  detalle: string
  telefono: string | null
  anonimo: boolean
  estado: SolidarityContributionStatus
  respuesta: string | null
  agradecido_at: string | null
  created_at: string
  profiles: { nombre_completo?: string | null; email?: string | null } | null
}

const requestNext: Partial<Record<SolidarityRequestStatus, SolidarityRequestStatus>> = {
  enviada: 'revisando', revisando: 'programada', aprobada: 'programada', programada: 'entregada',
}
const contributionNext: Partial<Record<SolidarityContributionStatus, SolidarityContributionStatus>> = {
  ofrecido: 'contactando', contactando: 'completado', asignado: 'completado', recibido: 'completado',
}

function phoneHref(phone: string, whatsapp = false) {
  const digits = phone.replace(/\D/g, '')
  return whatsapp ? `https://wa.me/${digits}` : `tel:${phone}`
}

export default function SolidarityAdminBoard({ currentUserId, requests, contributions, pantryNeeds }: {
  currentUserId: string
  requests: RequestItem[]
  contributions: ContributionItem[]
  pantryNeeds: PantryNeed[]
}) {
  const [query, setQuery] = useState('')
  const [showClosed, setShowClosed] = useState(false)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [responses, setResponses] = useState<Record<string, string>>({})

  const normalized = query.trim().toLocaleLowerCase('es')
  const newRequests = requests.filter((item) => item.estado === 'enviada')
  const newContributions = contributions.filter((item) => item.estado === 'ofrecido')

  const inProgressRequests = useMemo(() => requests.filter((item) => {
    const active = ['revisando', 'aprobada', 'programada'].includes(item.estado)
    const closed = ['entregada', 'rechazada', 'cancelada'].includes(item.estado)
    const haystack = `${item.profiles?.nombre_completo || ''} ${item.profiles?.email || ''} ${item.necesidad} ${item.detalle_adicional || ''}`.toLocaleLowerCase('es')
    return (active || (showClosed && closed)) && (!normalized || haystack.includes(normalized))
  }), [requests, normalized, showClosed])

  const inProgressContributions = useMemo(() => contributions.filter((item) => {
    const active = ['contactando', 'asignado', 'recibido'].includes(item.estado)
    const closed = ['completado', 'cancelado'].includes(item.estado)
    const haystack = `${item.profiles?.nombre_completo || ''} ${item.profiles?.email || ''} ${item.detalle}`.toLocaleLowerCase('es')
    return (active || (showClosed && closed)) && (!normalized || haystack.includes(normalized))
  }), [contributions, normalized, showClosed])

  const donors = useMemo(() => {
    const map = new Map<string, { profileId: string; name: string; email: string; completed: number; pendingThanks: number; lastAt: string }>()
    contributions.filter((item) => ['recibido', 'completado'].includes(item.estado)).forEach((item) => {
      const current = map.get(item.profile_id)
      const name = item.profiles?.nombre_completo || 'Persona registrada'
      const email = item.profiles?.email || ''
      const pendingThanks = item.agradecido_at ? 0 : 1
      if (!current) {
        map.set(item.profile_id, { profileId: item.profile_id, name, email, completed: 1, pendingThanks, lastAt: item.created_at })
        return
      }
      current.completed += 1
      current.pendingThanks += pendingThanks
      if (new Date(item.created_at).getTime() > new Date(current.lastAt).getTime()) current.lastAt = item.created_at
    })
    return [...map.values()].sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime())
  }, [contributions])

  const updateRequest = (item: RequestItem, status: SolidarityRequestStatus) => {
    setMessage(null)
    startTransition(async () => {
      const result = await actualizarSolicitudAyudaSolidaria({ id: item.id, status, response: responses[item.id] ?? item.respuesta ?? '' })
      setMessage(result.success ? 'Actualizado.' : result.error || 'No fue posible actualizar.')
    })
  }

  const updateContribution = (item: ContributionItem, status: SolidarityContributionStatus) => {
    setMessage(null)
    startTransition(async () => {
      const result = await actualizarAporteSolidario({ id: item.id, status, response: responses[item.id] ?? item.respuesta ?? '' })
      setMessage(result.success ? 'Actualizado.' : result.error || 'No fue posible actualizar.')
    })
  }

  const thankContribution = (item: ContributionItem, thanked: boolean) => {
    startTransition(async () => {
      const result = await marcarAgradecimientoAporte(item.id, thanked)
      setMessage(result.success ? (thanked ? 'Agradecimiento registrado.' : 'Marcado nuevamente como pendiente.') : result.error || 'No fue posible actualizar el agradecimiento.')
    })
  }

  const requestCard = (item: RequestItem) => {
    const next = requestNext[item.estado]
    return (
      <article key={item.id} className="rounded-2xl bg-white p-4 ring-1 ring-black/[0.05]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-extrabold text-[#171923]">{item.profiles?.nombre_completo || 'Persona registrada'}</p>{item.tipo_ayuda === 'paquete_despensa' ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">Paquete</span> : null}</div><p className="mt-1 text-xs text-slate-400">{new Date(item.created_at).toLocaleString('es-SV')}</p></div>
          <span className="shrink-0 rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">{SOLIDARITY_REQUEST_STATUS_LABELS[item.estado]}</span>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">{item.tipo_ayuda === 'paquete_despensa' ? `Paquete de despensa${item.hogar_personas ? ` · ${item.hogar_personas} personas` : ''}` : item.necesidad}</p>
        {item.detalle_adicional ? <details className="mt-2"><summary className="cursor-pointer text-xs font-bold text-slate-400">Ver detalle</summary><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-500">{item.detalle_adicional}</p></details> : null}
        {item.telefono ? <div className="mt-3 flex gap-2"><a href={phoneHref(item.telefono)} className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700"><Phone className="h-4 w-4" />Llamar</a><a href={phoneHref(item.telefono, true)} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-emerald-50 px-3 text-xs font-bold text-emerald-700"><MessageCircle className="h-4 w-4" />WhatsApp</a></div> : null}
        <SolidarityChat contextType="solicitud" contextId={item.id} currentUserId={currentUserId} label="Conversación" />
        <details className="mt-2 border-t border-slate-100 pt-2"><summary className="flex min-h-9 cursor-pointer list-none items-center justify-between text-xs font-bold text-slate-500 [&::-webkit-details-marker]:hidden">Nota visible <ChevronDown className="h-4 w-4" /></summary><textarea value={responses[item.id] ?? item.respuesta ?? ''} onChange={(event) => setResponses((current) => ({ ...current, [item.id]: event.target.value }))} rows={2} maxLength={2000} placeholder="Mensaje visible para la persona" className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400" /></details>
        <div className="mt-3 flex flex-wrap gap-2">{next ? <button disabled={pending} onClick={() => updateRequest(item, next)} className="min-h-9 rounded-xl bg-[#5b3df5] px-3 text-xs font-extrabold text-white disabled:opacity-50">{SOLIDARITY_REQUEST_STATUS_LABELS[next]}</button> : null}{!['entregada', 'rechazada', 'cancelada'].includes(item.estado) ? <button disabled={pending} onClick={() => updateRequest(item, 'rechazada')} className="min-h-9 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-600 disabled:opacity-50">No pudimos ayudar</button> : null}</div>
      </article>
    )
  }

  const contributionCard = (item: ContributionItem) => {
    const next = contributionNext[item.estado]
    const completed = ['recibido', 'completado'].includes(item.estado)
    return (
      <article key={item.id} className="rounded-2xl bg-white p-4 ring-1 ring-black/[0.05]">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-extrabold text-[#171923]">{item.profiles?.nombre_completo || 'Persona registrada'}</p><p className="mt-1 text-xs text-slate-400">{SOLIDARITY_CONTRIBUTION_TYPE_LABELS[item.tipo]} · {new Date(item.created_at).toLocaleString('es-SV')}</p>{item.anonimo ? <p className="mt-1 text-[10px] font-bold text-violet-500">Identidad reservada ante la persona ayudada</p> : null}</div><span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{SOLIDARITY_CONTRIBUTION_STATUS_LABELS[item.estado]}</span></div>
        {item.monto ? <p className="mt-3 text-lg font-extrabold text-emerald-700">${Number(item.monto).toFixed(2)} {item.moneda}</p> : null}
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.detalle}</p>
        {item.telefono ? <div className="mt-3 flex gap-2"><a href={phoneHref(item.telefono)} className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700"><Phone className="h-4 w-4" />Llamar</a><a href={phoneHref(item.telefono, true)} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-emerald-50 px-3 text-xs font-bold text-emerald-700"><MessageCircle className="h-4 w-4" />WhatsApp</a></div> : null}
        <SolidarityChat contextType="aporte" contextId={item.id} currentUserId={currentUserId} label="Coordinar" />
        <details className="mt-2 border-t border-slate-100 pt-2"><summary className="flex min-h-9 cursor-pointer list-none items-center justify-between text-xs font-bold text-slate-500 [&::-webkit-details-marker]:hidden">Nota visible <ChevronDown className="h-4 w-4" /></summary><textarea value={responses[item.id] ?? item.respuesta ?? ''} onChange={(event) => setResponses((current) => ({ ...current, [item.id]: event.target.value }))} rows={2} maxLength={2000} placeholder="Mensaje visible para quien siembra" className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-400" /></details>
        <div className="mt-3 flex flex-wrap gap-2">{next ? <button disabled={pending} onClick={() => updateContribution(item, next)} className="min-h-9 rounded-xl bg-emerald-600 px-3 text-xs font-extrabold text-white disabled:opacity-50">{SOLIDARITY_CONTRIBUTION_STATUS_LABELS[next]}</button> : null}{!['completado', 'cancelado'].includes(item.estado) ? <button disabled={pending} onClick={() => updateContribution(item, 'cancelado')} className="min-h-9 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-600 disabled:opacity-50">Cancelar</button> : null}{completed ? <button disabled={pending} onClick={() => thankContribution(item, !item.agradecido_at)} className={`inline-flex min-h-9 items-center gap-2 rounded-xl px-3 text-xs font-extrabold disabled:opacity-50 ${item.agradecido_at ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}><Sparkles className="h-4 w-4" />{item.agradecido_at ? 'Agradecido ✓' : 'Agradecer'}</button> : null}</div>
      </article>
    )
  }

  return (
    <div className="space-y-4">
      {message ? <p className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">{message}</p> : null}

      <details open className="group overflow-hidden rounded-[22px] bg-white ring-1 ring-black/[0.05]">
        <summary className="flex cursor-pointer list-none items-center justify-between p-4 [&::-webkit-details-marker]:hidden"><div><p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-violet-600">Hoy</p><h2 className="mt-1 text-lg font-extrabold text-[#171923]">Lo que necesita atención</h2></div><ChevronDown className="h-5 w-5 text-slate-400 transition group-open:rotate-180" /></summary>
        <div className="border-t border-slate-100 p-4"><div className="mb-4 flex gap-4 text-xs text-slate-500"><span><strong className="text-violet-700">{newRequests.length}</strong> ayudas nuevas</span><span><strong className="text-emerald-700">{newContributions.length}</strong> siembras nuevas</span></div>{newRequests.length === 0 && newContributions.length === 0 ? <p className="py-5 text-center text-sm text-slate-400">Nada nuevo por atender ahora.</p> : null}<div className="space-y-3">{newRequests.map(requestCard)}{newContributions.map(contributionCard)}</div></div>
      </details>

      <details open className="group overflow-hidden rounded-[22px] bg-white ring-1 ring-black/[0.05]">
        <summary className="flex cursor-pointer list-none items-center justify-between p-4 [&::-webkit-details-marker]:hidden"><div><p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">En curso</p><h2 className="mt-1 text-lg font-extrabold text-[#171923]">Coordinación y seguimiento</h2></div><ChevronDown className="h-5 w-5 text-slate-400 transition group-open:rotate-180" /></summary>
        <div className="border-t border-slate-100 p-4"><label className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-100 px-3"><Search className="h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por persona o detalle" className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" /></label><label className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500"><input type="checkbox" checked={showClosed} onChange={(event) => setShowClosed(event.target.checked)} className="h-4 w-4 accent-[#5b3df5]" />Mostrar resueltos y cancelados</label><div className="mt-4 space-y-3">{inProgressRequests.length === 0 && inProgressContributions.length === 0 ? <p className="py-5 text-center text-sm text-slate-400">No hay elementos con estos filtros.</p> : null}{inProgressRequests.map(requestCard)}{inProgressContributions.map(contributionCard)}</div></div>
      </details>

      <details className="group overflow-hidden rounded-[22px] bg-white ring-1 ring-black/[0.05]">
        <summary className="flex cursor-pointer list-none items-center justify-between p-4 [&::-webkit-details-marker]:hidden"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Sprout className="h-4 w-4" /></span><div><p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-emerald-600">Sembradores</p><h2 className="text-base font-extrabold text-[#171923]">Personas a quienes agradecer</h2></div></div><span className="inline-flex items-center gap-2 text-xs font-bold text-slate-400">{donors.length}<ChevronDown className="h-5 w-5 transition group-open:rotate-180" /></span></summary>
        <div className="border-t border-slate-100 p-4">{donors.length === 0 ? <p className="py-5 text-center text-sm text-slate-400">Aún no hay siembras completadas.</p> : <div className="space-y-2">{donors.map((donor) => <article key={donor.profileId} className="border-b border-slate-100 py-3 last:border-0"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-extrabold text-slate-800">{donor.name}</p>{donor.email ? <p className="mt-1 truncate text-xs text-slate-400">{donor.email}</p> : null}<p className="mt-1 text-xs text-slate-500">{donor.completed} siembra{donor.completed === 1 ? '' : 's'} · última {new Date(donor.lastAt).toLocaleDateString('es-SV')}</p></div>{donor.pendingThanks > 0 ? <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">{donor.pendingThanks} por agradecer</span> : <span className="shrink-0 text-[10px] font-bold text-emerald-700">Al día</span>}</div></article>)}</div>}</div>
      </details>

      <details className="group overflow-hidden rounded-[22px] bg-white ring-1 ring-black/[0.05]">
        <summary className="flex cursor-pointer list-none items-center justify-between p-4 [&::-webkit-details-marker]:hidden"><div><p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-emerald-600">Despensa</p><h2 className="text-base font-extrabold text-[#171923]">Lo que tenemos y lo que falta</h2></div><ChevronDown className="h-5 w-5 text-slate-400 transition group-open:rotate-180" /></summary>
        <div className="border-t border-slate-100 p-4"><SolidarityPantryManager needs={pantryNeeds} /></div>
      </details>

      <div className="flex items-start gap-3 px-1 py-2 text-slate-500"><HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" /><p className="text-xs leading-5">La prioridad pastoral se decide en la conversación con la persona.</p></div>
    </div>
  )
}
