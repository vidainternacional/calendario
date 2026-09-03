'use client'

import { useMemo, useState, useTransition } from 'react'
import { ArrowLeft, ChevronDown, MessageCircle, Phone, Search, Sparkles } from 'lucide-react'
import {
  actualizarAporteSolidario,
  actualizarSolicitudAyudaSolidaria,
  marcarAgradecimientoAporte,
} from '@/app/actions/solidaridad'
import UserAvatar from '@/components/comunidad/UserAvatar'
import SolidarityChat from '@/components/solidaridad/SolidarityChat'
import SolidarityPantryManager from '@/components/solidaridad/SolidarityPantryManager'
import {
  SOLIDARITY_CONTRIBUTION_STATUS_LABELS,
  SOLIDARITY_CONTRIBUTION_TYPE_LABELS,
  SOLIDARITY_REQUEST_STATUS_LABELS,
  type PantryNeed,
  type PantryPackage,
  type PantryPackageItem,
  type ServiceNeed,
  type SolidarityContributionStatus,
  type SolidarityContributionType,
  type SolidarityHelpType,
  type SolidarityRequestStatus,
} from '@/lib/solidarity/types'

type PersonInfo = { nombre_completo?: string | null; email?: string | null; avatar_url?: string | null } | null

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
  profiles: PersonInfo
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
  profiles: PersonInfo
}

type Conversation =
  | { key: string; kind: 'solicitud'; item: RequestItem; createdAt: string; name: string; avatarUrl: string | null; preview: string }
  | { key: string; kind: 'aporte'; item: ContributionItem; createdAt: string; name: string; avatarUrl: string | null; preview: string }

type View = 'ayudas' | 'siembras' | 'despensa'

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

function timeLabel(value: string) {
  const date = new Date(value)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) return date.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })
  return date.toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit' })
}

export default function SolidarityAdminBoard({ currentUserId, requests, contributions, pantryNeeds, serviceNeeds, packages, packageItems }: {
  currentUserId: string
  requests: RequestItem[]
  contributions: ContributionItem[]
  pantryNeeds: PantryNeed[]
  serviceNeeds: ServiceNeed[]
  packages: PantryPackage[]
  packageItems: PantryPackageItem[]
}) {
  const [view, setView] = useState<View>('ayudas')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [responses, setResponses] = useState<Record<string, string>>({})

  const helpConversations = useMemo<Conversation[]>(() => requests.map((item) => ({
    key: `solicitud:${item.id}`,
    kind: 'solicitud' as const,
    item,
    createdAt: item.created_at,
    name: item.profiles?.nombre_completo || 'Persona registrada',
    avatarUrl: item.profiles?.avatar_url || null,
    preview: item.tipo_ayuda === 'paquete_despensa' ? `Paquete de despensa${item.hogar_personas ? ` · ${item.hogar_personas} personas` : ''}` : item.necesidad,
  })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [requests])

  const seedConversations = useMemo<Conversation[]>(() => contributions.map((item) => ({
    key: `aporte:${item.id}`,
    kind: 'aporte' as const,
    item,
    createdAt: item.created_at,
    name: item.profiles?.nombre_completo || 'Persona registrada',
    avatarUrl: item.profiles?.avatar_url || null,
    preview: `${SOLIDARITY_CONTRIBUTION_TYPE_LABELS[item.tipo]} · ${item.detalle}`,
  })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [contributions])

  const conversations = view === 'siembras' ? seedConversations : helpConversations
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es')
    if (!normalized) return conversations
    return conversations.filter((item) => `${item.name} ${item.preview}`.toLocaleLowerCase('es').includes(normalized))
  }, [conversations, query])
  const selected = [...helpConversations, ...seedConversations].find((item) => item.key === selectedKey) || null

  const updateRequest = (item: RequestItem, status: SolidarityRequestStatus) => startTransition(async () => {
    const result = await actualizarSolicitudAyudaSolidaria({ id: item.id, status, response: responses[item.id] ?? item.respuesta ?? '' })
    setMessage(result.success ? 'Actualizado.' : result.error || 'No fue posible actualizar.')
  })
  const updateContribution = (item: ContributionItem, status: SolidarityContributionStatus) => startTransition(async () => {
    const result = await actualizarAporteSolidario({ id: item.id, status, response: responses[item.id] ?? item.respuesta ?? '' })
    setMessage(result.success ? 'Actualizado.' : result.error || 'No fue posible actualizar.')
  })
  const thankContribution = (item: ContributionItem) => startTransition(async () => {
    const result = await marcarAgradecimientoAporte(item.id, !item.agradecido_at)
    setMessage(result.success ? (item.agradecido_at ? 'Marcado como pendiente.' : 'Agradecimiento registrado.') : result.error || 'No fue posible actualizar.')
  })

  const list = (
    <div>
      <label className="flex min-h-11 items-center gap-2 border-b border-slate-200 px-4">
        <Search className="h-4 w-4 text-slate-500" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={view === 'siembras' ? 'Buscar quienes quieren sembrar' : 'Buscar solicitudes de ayuda'} className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500" />
      </label>
      <div className="divide-y divide-slate-100">
        {filtered.length === 0 ? <p className="px-4 py-10 text-center text-sm text-slate-600">No hay conversaciones para mostrar.</p> : filtered.map((conversation) => {
          const status = conversation.kind === 'solicitud' ? SOLIDARITY_REQUEST_STATUS_LABELS[conversation.item.estado] : SOLIDARITY_CONTRIBUTION_STATUS_LABELS[conversation.item.estado]
          return <button key={conversation.key} type="button" onClick={() => setSelectedKey(conversation.key)} className="flex w-full items-center gap-3 px-3 py-3 text-left active:bg-slate-50"><UserAvatar nombre={conversation.name} avatarUrl={conversation.avatarUrl} size="md" /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-extrabold text-slate-900">{conversation.name}</p><span className="shrink-0 text-[10px] text-slate-500">{timeLabel(conversation.createdAt)}</span></div><div className="mt-0.5 flex items-center gap-2"><p className="min-w-0 flex-1 truncate text-xs text-slate-600">{conversation.preview}</p><span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${conversation.kind === 'solicitud' ? 'bg-violet-50 text-violet-700' : 'bg-emerald-50 text-emerald-700'}`}>{status}</span></div></div></button>
        })}
      </div>
    </div>
  )

  return (
    <div className="overflow-hidden bg-white text-slate-900">
      {message ? <p className="border-b border-slate-100 bg-slate-900 px-4 py-2 text-xs font-semibold text-white">{message}</p> : null}

      {!selected ? <div className="grid grid-cols-3 border-b border-slate-200 bg-white">
        <button type="button" onClick={() => { setView('ayudas'); setQuery('') }} className={`min-h-12 border-b-2 px-2 text-[11px] font-extrabold ${view === 'ayudas' ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-600'}`}>Necesitan ayuda</button>
        <button type="button" onClick={() => { setView('siembras'); setQuery('') }} className={`min-h-12 border-b-2 px-2 text-[11px] font-extrabold ${view === 'siembras' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-600'}`}>Quieren sembrar</button>
        <button type="button" onClick={() => { setView('despensa'); setQuery('') }} className={`min-h-12 border-b-2 px-2 text-[11px] font-extrabold ${view === 'despensa' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-600'}`}>Despensa</button>
      </div> : null}

      {!selected && view !== 'despensa' ? list : null}
      {!selected && view === 'despensa' ? <SolidarityPantryManager needs={pantryNeeds} serviceNeeds={serviceNeeds} packages={packages} packageItems={packageItems} /> : null}

      {selected ? <div>
        <div className="flex min-h-16 items-center gap-3 border-b border-slate-200 bg-white px-3 py-2">
          <button type="button" onClick={() => setSelectedKey(null)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-700 active:bg-slate-100" aria-label="Volver"><ArrowLeft className="h-5 w-5" /></button>
          <UserAvatar nombre={selected.name} avatarUrl={selected.avatarUrl} size="md" />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-slate-900">{selected.name}</p><p className="truncate text-[11px] text-slate-600">{selected.kind === 'solicitud' ? 'Necesita ayuda' : 'Quiere sembrar'}</p></div>
          {selected.item.telefono ? <div className="flex shrink-0 gap-1"><a href={phoneHref(selected.item.telefono)} className="grid h-9 w-9 place-items-center rounded-full text-slate-600" aria-label="Llamar"><Phone className="h-4 w-4" /></a><a href={phoneHref(selected.item.telefono, true)} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-full text-emerald-600" aria-label="WhatsApp"><MessageCircle className="h-4 w-4" /></a></div> : null}
        </div>

        <SolidarityChat contextType={selected.kind} contextId={selected.item.id} currentUserId={currentUserId} alwaysOpen />

        <details className="border-t border-slate-200 bg-white">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 text-xs font-bold text-slate-700 [&::-webkit-details-marker]:hidden">Detalles y estado <ChevronDown className="h-4 w-4" /></summary>
          <div className="space-y-3 border-t border-slate-100 px-4 py-3">
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">{selected.preview}</p>
            {selected.kind === 'solicitud' && selected.item.detalle_adicional ? <p className="text-sm leading-6 text-slate-700">{selected.item.detalle_adicional}</p> : null}
            {selected.kind === 'aporte' && selected.item.monto ? <p className="text-sm font-extrabold text-emerald-700">${Number(selected.item.monto).toFixed(2)} {selected.item.moneda}</p> : null}
            <textarea value={responses[selected.item.id] ?? selected.item.respuesta ?? ''} onChange={(event) => setResponses((current) => ({ ...current, [selected.item.id]: event.target.value }))} rows={2} maxLength={2000} placeholder="Nota visible para la persona" className="w-full resize-none border-0 border-b border-slate-200 bg-transparent px-0 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-500" />
            {selected.kind === 'solicitud' ? <div className="flex flex-wrap gap-2">{requestNext[selected.item.estado] ? <button disabled={pending} onClick={() => updateRequest(selected.item, requestNext[selected.item.estado]!)} className="min-h-9 rounded-full bg-violet-600 px-3 text-xs font-extrabold text-white disabled:opacity-50">{SOLIDARITY_REQUEST_STATUS_LABELS[requestNext[selected.item.estado]!]}</button> : null}{!['entregada', 'rechazada', 'cancelada'].includes(selected.item.estado) ? <button disabled={pending} onClick={() => updateRequest(selected.item, 'rechazada')} className="min-h-9 rounded-full bg-slate-100 px-3 text-xs font-bold text-slate-700">No pudimos ayudar</button> : null}</div> : <div className="flex flex-wrap gap-2">{contributionNext[selected.item.estado] ? <button disabled={pending} onClick={() => updateContribution(selected.item, contributionNext[selected.item.estado]!)} className="min-h-9 rounded-full bg-emerald-600 px-3 text-xs font-extrabold text-white disabled:opacity-50">{SOLIDARITY_CONTRIBUTION_STATUS_LABELS[contributionNext[selected.item.estado]!]}</button> : null}{!['completado', 'cancelado'].includes(selected.item.estado) ? <button disabled={pending} onClick={() => updateContribution(selected.item, 'cancelado')} className="min-h-9 rounded-full bg-slate-100 px-3 text-xs font-bold text-slate-700">Cancelar</button> : null}{['recibido', 'completado'].includes(selected.item.estado) ? <button disabled={pending} onClick={() => thankContribution(selected.item)} className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-extrabold ${selected.item.agradecido_at ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}><Sparkles className="h-3.5 w-3.5" />{selected.item.agradecido_at ? 'Agradecido ✓' : 'Agradecer'}</button> : null}</div>}
          </div>
        </details>
      </div> : null}
    </div>
  )
}
