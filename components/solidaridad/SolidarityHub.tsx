'use client'

import { useMemo, useState, useTransition } from 'react'
import { CheckCircle2, ChevronDown, HandCoins, HeartHandshake, PackageCheck, Phone, ShieldCheck, Sparkles, Users, X } from 'lucide-react'
import {
  cancelarAporteSolidario,
  cancelarSolicitudAyudaSolidaria,
  crearSolicitudAyudaSolidaria,
  registrarAporteSolidario,
} from '@/app/actions/solidaridad'
import BankAccountCards from '@/components/solidaridad/BankAccountCards'
import SolidarityChat from '@/components/solidaridad/SolidarityChat'
import {
  SOLIDARITY_CONTRIBUTION_STATUS_LABELS,
  SOLIDARITY_CONTRIBUTION_TYPE_LABELS,
  SOLIDARITY_REQUEST_STATUS_LABELS,
  type ChurchBankAccount,
  type PantryNeed,
  type ServiceNeed,
  type SolidarityContactPreference,
  type SolidarityContributionType,
  type SolidarityHelpType,
} from '@/lib/solidarity/types'

type RequestItem = {
  id: string
  tipo_ayuda: SolidarityHelpType
  hogar_personas: number | null
  necesidad: string
  detalle_adicional: string | null
  contacto_preferido: SolidarityContactPreference
  telefono: string | null
  estado: keyof typeof SOLIDARITY_REQUEST_STATUS_LABELS
  respuesta: string | null
  created_at: string
}

type ContributionItem = {
  id: string
  tipo: SolidarityContributionType
  monto: number | null
  moneda: string
  detalle: string
  telefono: string | null
  anonimo: boolean
  estado: keyof typeof SOLIDARITY_CONTRIBUTION_STATUS_LABELS
  respuesta: string | null
  agradecido_at: string | null
  created_at: string
}

type Tab = 'solicitar' | 'aportar' | 'seguimiento'

const contributionTypes: SolidarityContributionType[] = ['alimentos', 'monetario', 'tiempo', 'transporte', 'herramientas', 'objetos', 'oficios', 'habilidades', 'conocimientos', 'voluntariado', 'otro']
const contactOptions: Array<[SolidarityContactPreference, string]> = [['aplicacion', 'Dentro de VIDA'], ['whatsapp', 'WhatsApp'], ['telefono', 'Llamada']]

const requestTone: Record<string, string> = {
  enviada: 'bg-sky-50 text-sky-700', revisando: 'bg-amber-50 text-amber-700', aprobada: 'bg-amber-50 text-amber-700',
  programada: 'bg-violet-50 text-violet-700', entregada: 'bg-emerald-50 text-emerald-700', rechazada: 'bg-slate-100 text-slate-700', cancelada: 'bg-slate-100 text-slate-600',
}
const contributionTone: Record<string, string> = {
  ofrecido: 'bg-sky-50 text-sky-700', contactando: 'bg-amber-50 text-amber-700', recibido: 'bg-emerald-50 text-emerald-700',
  asignado: 'bg-amber-50 text-amber-700', completado: 'bg-emerald-50 text-emerald-700', cancelado: 'bg-slate-100 text-slate-600',
}

const fieldClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-violet-400'

function pantryMessage(need: PantryNeed) {
  const minimum = Number(need.minimo_necesario)
  const current = Number(need.existencia_actual)
  if (minimum <= 0) return 'necesidad activa'
  const missingRatio = Math.max(0, minimum - current) / minimum
  if (missingRatio > 0.65) return 'hace falta bastante'
  if (missingRatio > 0.25) return 'hace falta'
  return 'un poco más y se cubre'
}

function serviceType(need: ServiceNeed): SolidarityContributionType {
  if (need.categoria === 'transporte') return 'transporte'
  if (need.categoria === 'oficios') return 'oficios'
  if (need.categoria === 'tiempo') return 'tiempo'
  return 'habilidades'
}

export default function SolidarityHub({ userId, requests, contributions, pantryNeeds, serviceNeeds, bankAccounts, initialTab = 'solicitar' }: {
  userId: string
  requests: RequestItem[]
  contributions: ContributionItem[]
  pantryNeeds: PantryNeed[]
  serviceNeeds: ServiceNeed[]
  bankAccounts: ChurchBankAccount[]
  initialTab?: Tab
}) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [showExtra, setShowExtra] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [requestForm, setRequestForm] = useState({
    helpType: 'paquete_despensa' as SolidarityHelpType,
    need: '', additionalDetail: '', householdSize: '', phone: '', contactPreference: 'aplicacion' as SolidarityContactPreference,
  })
  const [contributionForm, setContributionForm] = useState({
    type: 'alimentos' as SolidarityContributionType, amount: '', detail: '', phone: '', anonymous: false, pantryNeedId: '',
  })

  const sortedPantry = useMemo(() => [...pantryNeeds].sort((a, b) => {
    const deficitA = Math.max(0, Number(a.minimo_necesario) - Number(a.existencia_actual))
    const deficitB = Math.max(0, Number(b.minimo_necesario) - Number(b.existencia_actual))
    return deficitB - deficitA
  }), [pantryNeeds])

  const activeRequests = useMemo(() => requests.filter((item) => !['entregada', 'rechazada', 'cancelada'].includes(item.estado)).length, [requests])
  const completedSeeds = useMemo(() => contributions.filter((item) => ['recibido', 'completado'].includes(item.estado)).length, [contributions])
  const selectedNeed = sortedPantry.find((item) => item.id === contributionForm.pantryNeedId) || null
  const selectedService = serviceNeeds.find((item) => item.id === selectedServiceId) || null

  const submitRequest = () => {
    setMessage(null)
    startTransition(async () => {
      const result = await crearSolicitudAyudaSolidaria({
        helpType: requestForm.helpType,
        need: requestForm.need,
        additionalDetail: requestForm.additionalDetail,
        householdSize: requestForm.householdSize ? Number(requestForm.householdSize) : null,
        phone: requestForm.phone,
        contactPreference: requestForm.contactPreference,
      })
      if (!result.success) {
        setMessage({ type: 'error', text: result.error || 'No fue posible enviar el mensaje.' })
        return
      }
      setRequestForm({ helpType: 'paquete_despensa', need: '', additionalDetail: '', householdSize: '', phone: '', contactPreference: 'aplicacion' })
      setShowExtra(false)
      setMessage({ type: 'ok', text: 'Conversación creada. Puedes seguir hablando con el equipo aquí mismo.' })
      setTab('seguimiento')
    })
  }

  const submitContribution = () => {
    setMessage(null)
    startTransition(async () => {
      const result = await registrarAporteSolidario({
        ...contributionForm,
        amount: contributionForm.type === 'monetario' ? Number(contributionForm.amount) : null,
        pantryNeedId: contributionForm.type === 'alimentos' ? contributionForm.pantryNeedId || null : null,
      })
      if (!result.success) {
        setMessage({ type: 'error', text: result.error || 'No fue posible registrar la siembra.' })
        return
      }
      setContributionForm({ type: 'alimentos', amount: '', detail: '', phone: '', anonymous: false, pantryNeedId: '' })
      setSelectedServiceId('')
      setMessage({ type: 'ok', text: 'Gracias por sembrar. Puedes coordinar con el equipo aquí mismo.' })
      setTab('seguimiento')
    })
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-[#f5f5f7] pb-[calc(7rem+env(safe-area-inset-bottom))] text-slate-900">
      <section className="overflow-hidden rounded-b-[32px] bg-[linear-gradient(145deg,#302072,#5b3df5_58%,#7c64ff)] px-4 pb-6 pt-[calc(1.5rem+env(safe-area-inset-top))] text-white sm:px-6">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/14 ring-1 ring-white/20"><HeartHandshake className="h-7 w-7" /></span>
          <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">Vida Internacional</p><h1 className="mt-1 text-[31px] font-extrabold leading-none tracking-[-0.04em]">Ayuda Solidaria</h1><p className="mt-2 text-sm text-white/90">Pide ayuda o encuentra una forma concreta de sembrar.</p></div>
        </div>
        <div className="mt-4 flex gap-4 text-xs text-white/90"><span><strong className="text-white">{activeRequests}</strong> ayudas activas</span><span><strong className="text-white">{completedSeeds}</strong> siembras</span></div>
      </section>

      <div className="px-4 pt-4 sm:px-6">
        <div className="grid grid-cols-3 rounded-[18px] bg-white p-1 ring-1 ring-black/[0.05]">
          {([['solicitar', 'Necesito ayuda'], ['aportar', 'Quiero sembrar'], ['seguimiento', 'Seguimiento']] as Array<[Tab, string]>).map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); setMessage(null) }} className={`min-h-11 rounded-[14px] px-2 text-[12px] font-bold transition ${tab === id ? 'bg-[#5b3df5] text-white' : 'text-slate-700'}`}>{label}</button>
          ))}
        </div>

        {message ? <div className={`mt-4 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ${message.type === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>{message.type === 'ok' ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <X className="mt-0.5 h-5 w-5 shrink-0" />}<p>{message.text}</p></div> : null}

        {tab === 'solicitar' ? (
          <section className="mt-5">
            <div className="mb-4"><h2 className="text-xl font-extrabold text-[#171923]">¿Cómo podemos ayudarte?</h2><p className="mt-1 text-sm text-slate-600">Elige una opción y completa solo lo necesario.</p></div>
            <div className="mb-4 flex items-start gap-2 text-xs text-slate-600"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" /><p><strong className="text-slate-800">Es privado.</strong> Solo lo ve el equipo autorizado.</p></div>

            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setRequestForm((current) => ({ ...current, helpType: 'paquete_despensa', need: '' }))} className={`min-h-12 rounded-2xl border px-3 text-center text-sm font-extrabold ${requestForm.helpType === 'paquete_despensa' ? 'border-violet-400 bg-violet-50 text-violet-800' : 'border-slate-200 bg-white text-slate-800'}`}><span className="inline-flex items-center gap-2"><PackageCheck className="h-4 w-4" />Paquete de despensa</span></button>
              <button type="button" onClick={() => setRequestForm((current) => ({ ...current, helpType: 'general' }))} className={`min-h-12 rounded-2xl border px-3 text-center text-sm font-extrabold ${requestForm.helpType === 'general' ? 'border-violet-400 bg-violet-50 text-violet-800' : 'border-slate-200 bg-white text-slate-800'}`}>Otra ayuda</button>
            </div>

            <div className="mt-4 space-y-4">
              {requestForm.helpType === 'general' ? <label className="block"><span className="mb-2 block text-xs font-bold text-slate-800">¿Qué necesitas?</span><textarea value={requestForm.need} onChange={(event) => setRequestForm((current) => ({ ...current, need: event.target.value }))} placeholder="Ej. necesito ayuda con transporte esta semana" rows={3} maxLength={3000} className={`${fieldClass} resize-none py-3 leading-6`} /></label> : <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-800"><Users className="h-4 w-4" />¿Para cuántas personas?</span><input type="number" min={1} max={30} value={requestForm.householdSize} onChange={(event) => setRequestForm((current) => ({ ...current, householdSize: event.target.value }))} placeholder="Ej. 4" className={`${fieldClass} h-12`} /></label>}

              <div><p className="mb-2 text-xs font-bold text-slate-800">¿Cómo prefieres que te contactemos?</p><div className="grid grid-cols-3 gap-2">{contactOptions.map(([value, label]) => <button key={value} type="button" onClick={() => setRequestForm((current) => ({ ...current, contactPreference: value }))} className={`min-h-10 rounded-xl border px-2 text-[11px] font-bold ${requestForm.contactPreference === value ? 'border-violet-400 bg-violet-50 text-violet-800' : 'border-slate-200 bg-white text-slate-800'}`}>{label}</button>)}</div></div>

              {requestForm.contactPreference !== 'aplicacion' ? <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-800"><Phone className="h-4 w-4" />Teléfono</span><input type="tel" value={requestForm.phone} onChange={(event) => setRequestForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Ej. 7000-0000" maxLength={40} className={`${fieldClass} h-12`} /></label> : <p className="text-xs text-slate-600">La conversación seguirá aquí dentro de Ayuda Solidaria.</p>}

              <button type="button" onClick={() => setShowExtra((value) => !value)} className="flex min-h-10 w-full items-center justify-between border-y border-slate-200 py-2 text-left text-sm font-bold text-slate-800">Algo más <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">Opcional <ChevronDown className={`h-4 w-4 transition ${showExtra ? 'rotate-180' : ''}`} /></span></button>
              {showExtra ? <div className="space-y-4"><label className="block"><textarea value={requestForm.additionalDetail} onChange={(event) => setRequestForm((current) => ({ ...current, additionalDetail: event.target.value }))} placeholder="Si quieres compartir algo más, escríbelo aquí." rows={2} maxLength={3000} className={`${fieldClass} resize-none py-3 leading-6`} /></label>{requestForm.helpType === 'general' ? <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-800"><Users className="h-4 w-4" />Personas en tu hogar <span className="font-medium text-slate-600">(opcional)</span></span><input type="number" min={1} max={30} value={requestForm.householdSize} onChange={(event) => setRequestForm((current) => ({ ...current, householdSize: event.target.value }))} placeholder="Ej. 4" className={`${fieldClass} h-12`} /></label> : null}</div> : null}

              <button disabled={pending} onClick={submitRequest} className="min-h-12 w-full rounded-2xl bg-[#5b3df5] px-5 text-sm font-extrabold text-white disabled:opacity-60">{pending ? 'Abriendo conversación…' : 'Continuar'}</button>
              <p className="text-center text-[11px] text-slate-600">Después de continuar, podrás hablar con el equipo como en un chat.</p>
            </div>
          </section>
        ) : null}

        {tab === 'aportar' ? (
          <section className="mt-5">
            <div className="mb-4 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-600"><HandCoins className="h-5 w-5" /></span><div><h2 className="font-extrabold text-[#171923]">Quiero sembrar</h2><p className="text-xs text-slate-600">Comida, dinero, tiempo, transporte o servicio.</p></div></div>
            <div className="space-y-5">
              <div><p className="text-sm font-extrabold text-[#171923]">Hoy hace falta</p>{sortedPantry.length === 0 ? <p className="mt-2 text-sm text-slate-600">No hay productos urgentes ahora.</p> : <div className="mt-3 grid grid-cols-2 gap-2">{sortedPantry.map((need) => { const selected = contributionForm.pantryNeedId === need.id; return <button key={need.id} type="button" onClick={() => { setSelectedServiceId(''); setContributionForm((current) => ({ ...current, type: 'alimentos', pantryNeedId: selected ? '' : need.id, detail: selected ? current.detail : current.detail || `Puedo ayudar con ${need.producto}` })) }} className={`rounded-2xl border p-3 text-left ${selected ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}><span className="block text-sm font-extrabold text-slate-900">{need.producto}</span><span className="mt-1 block text-[11px] text-slate-600">{pantryMessage(need)}</span></button>})}</div>}</div>

              {serviceNeeds.length > 0 ? <div><p className="mb-2 text-sm font-extrabold text-[#171923]">También necesitamos personas</p><div className="space-y-2">{serviceNeeds.map((need) => { const selected = selectedServiceId === need.id; return <button key={need.id} type="button" onClick={() => { setSelectedServiceId(selected ? '' : need.id); setContributionForm((current) => ({ ...current, type: serviceType(need), pantryNeedId: '', detail: selected ? current.detail : `Puedo ayudar con: ${need.titulo}` })) }} className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left ${selected ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}><span className="min-w-0"><span className="block text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">{need.categoria}</span><span className="block truncate text-sm font-bold text-slate-900">{need.titulo}</span></span><span className="text-[11px] font-bold text-slate-600">{selected ? 'Elegido' : 'Puedo ayudar'}</span></button>})}</div></div> : null}

              <div><p className="mb-2 text-sm font-extrabold text-[#171923]">Otras formas de ayudar</p><div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{contributionTypes.map((type) => <button key={type} type="button" onClick={() => { setSelectedServiceId(''); setContributionForm((current) => ({ ...current, type, pantryNeedId: type === 'alimentos' ? current.pantryNeedId : '' })) }} className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-bold ${contributionForm.type === type && !selectedService ? 'bg-emerald-600 text-white' : 'bg-white text-slate-800 ring-1 ring-slate-200'}`}>{SOLIDARITY_CONTRIBUTION_TYPE_LABELS[type]}</button>)}</div></div>
              {contributionForm.type === 'monetario' ? <div><p className="mb-2 text-sm font-extrabold text-emerald-900">Cuenta oficial</p><BankAccountCards accounts={bankAccounts} emptyText="Administración aún no ha configurado una cuenta para Ayuda Solidaria." /></div> : null}
              {selectedNeed ? <p className="text-xs font-semibold text-emerald-700">Ayudando con: {selectedNeed.producto}</p> : null}
              {selectedService ? <p className="text-xs font-semibold text-emerald-700">Ayudando con: {selectedService.titulo}</p> : null}
              {contributionForm.type === 'monetario' ? <label className="block"><span className="mb-2 block text-xs font-bold text-slate-800">Monto</span><input type="number" min={0.01} step="0.01" value={contributionForm.amount} onChange={(event) => setContributionForm((current) => ({ ...current, amount: event.target.value }))} placeholder="0.00" className={`${fieldClass} h-12`} /></label> : null}
              <label className="block"><span className="mb-2 block text-xs font-bold text-slate-800">¿Cómo te gustaría ayudar?</span><textarea value={contributionForm.detail} onChange={(event) => setContributionForm((current) => ({ ...current, detail: event.target.value }))} rows={3} maxLength={2000} placeholder="Ej. puedo llevar 10 libras esta semana" className={`${fieldClass} resize-none py-3 leading-6`} /></label>
              <details className="border-y border-slate-200 py-2"><summary className="cursor-pointer list-none text-sm font-bold text-slate-800 [&::-webkit-details-marker]:hidden">Más opciones <span className="float-right text-xs font-medium text-slate-600">Opcional</span></summary><div className="space-y-3 pt-3"><input type="tel" value={contributionForm.phone} onChange={(event) => setContributionForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Teléfono (opcional)" maxLength={40} className={`${fieldClass} h-12`} /><label className="flex items-start gap-3 text-sm text-slate-800"><input type="checkbox" checked={contributionForm.anonymous} onChange={(event) => setContributionForm((current) => ({ ...current, anonymous: event.target.checked }))} className="mt-1 h-4 w-4 accent-emerald-600" /><span><strong>Nombre privado ante la persona ayudada</strong><span className="mt-1 block text-xs text-slate-600">El equipo sí sabrá quién eres para coordinar y agradecerte.</span></span></label></div></details>
              <button disabled={pending} onClick={submitContribution} className="min-h-12 w-full rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white disabled:opacity-60">{pending ? 'Registrando…' : 'Sembrar'}</button>
            </div>
          </section>
        ) : null}

        {tab === 'seguimiento' ? (
          <section className="mt-5">
            <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold text-[#171923]">Tu actividad</h2><p className="mt-1 text-xs text-slate-600">Todo lo de Ayuda Solidaria vive aquí.</p></div><span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700"><Sparkles className="h-3.5 w-3.5" />{completedSeeds} semillas</span></div>

            <details open className="border-y border-slate-200 py-1"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-sm font-extrabold text-slate-800 [&::-webkit-details-marker]:hidden">Mis ayudas <span className="text-xs font-medium text-slate-600">{requests.length}</span></summary><div className="divide-y divide-slate-100">{requests.length === 0 ? <p className="py-6 text-center text-sm text-slate-600">Aún no has pedido ayuda.</p> : requests.map((item) => <article key={item.id} className="py-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-900">{item.tipo_ayuda === 'paquete_despensa' ? 'Paquete de despensa' : item.necesidad}</p><p className="mt-1 text-xs text-slate-600">{new Date(item.created_at).toLocaleString('es-SV')}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${requestTone[item.estado] || 'bg-slate-100 text-slate-700'}`}>{SOLIDARITY_REQUEST_STATUS_LABELS[item.estado]}</span></div>{item.tipo_ayuda === 'paquete_despensa' && item.hogar_personas ? <p className="mt-2 text-xs text-slate-600">Para {item.hogar_personas} persona{item.hogar_personas === 1 ? '' : 's'}</p> : null}{item.respuesta ? <p className="mt-2 text-sm leading-6 text-slate-700">{item.respuesta}</p> : null}<SolidarityChat contextType="solicitud" contextId={item.id} currentUserId={userId} label="Conversación" defaultOpen={item.contacto_preferido === 'aplicacion' && !['entregada', 'rechazada', 'cancelada'].includes(item.estado)} />{['enviada', 'revisando', 'aprobada'].includes(item.estado) ? <button type="button" disabled={pending} onClick={() => startTransition(async () => { const result = await cancelarSolicitudAyudaSolidaria(item.id); setMessage({ type: result.success ? 'ok' : 'error', text: result.success ? 'Solicitud cancelada.' : result.error || 'No fue posible cancelar.' }) })} className="mt-3 text-xs font-bold text-slate-600">Cancelar</button> : null}</article>)}</div></details>

            <details className="border-b border-slate-200 py-1"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-sm font-extrabold text-slate-800 [&::-webkit-details-marker]:hidden">Mis siembras <span className="text-xs font-medium text-slate-600">{contributions.length}</span></summary><div className="divide-y divide-slate-100">{contributions.length === 0 ? <p className="py-6 text-center text-sm text-slate-600">Aún no has sembrado.</p> : contributions.map((item) => <article key={item.id} className="py-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-900">{SOLIDARITY_CONTRIBUTION_TYPE_LABELS[item.tipo]}</p><p className="mt-1 text-xs text-slate-600">{new Date(item.created_at).toLocaleString('es-SV')}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${contributionTone[item.estado] || 'bg-slate-100 text-slate-700'}`}>{SOLIDARITY_CONTRIBUTION_STATUS_LABELS[item.estado]}</span></div>{item.monto ? <p className="mt-2 text-sm font-extrabold text-emerald-700">${Number(item.monto).toFixed(2)} {item.moneda}</p> : null}<p className="mt-2 text-sm leading-6 text-slate-700">{item.detalle}</p>{item.respuesta ? <p className="mt-2 text-sm leading-6 text-slate-700">{item.respuesta}</p> : null}{item.agradecido_at ? <p className="mt-2 inline-flex items-center gap-2 text-[10px] font-bold text-emerald-700"><Sparkles className="h-3 w-3" />Agradecimiento registrado</p> : null}<SolidarityChat contextType="aporte" contextId={item.id} currentUserId={userId} label="Coordinar" />{['ofrecido', 'contactando', 'asignado'].includes(item.estado) ? <button type="button" disabled={pending} onClick={() => startTransition(async () => { const result = await cancelarAporteSolidario(item.id); setMessage({ type: result.success ? 'ok' : 'error', text: result.success ? 'Siembra cancelada.' : result.error || 'No fue posible cancelar.' }) })} className="mt-3 text-xs font-bold text-slate-600">Cancelar</button> : null}</article>)}</div></details>
          </section>
        ) : null}
      </div>
    </div>
  )
}
