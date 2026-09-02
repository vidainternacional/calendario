'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  HandCoins,
  HeartHandshake,
  PackageCheck,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
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

const contributionTypes: SolidarityContributionType[] = [
  'alimentos', 'monetario', 'tiempo', 'transporte', 'herramientas', 'objetos', 'oficios', 'habilidades', 'conocimientos', 'voluntariado', 'otro',
]

const requestTone: Record<string, string> = {
  enviada: 'bg-sky-50 text-sky-700',
  revisando: 'bg-amber-50 text-amber-700',
  aprobada: 'bg-amber-50 text-amber-700',
  programada: 'bg-violet-50 text-violet-700',
  entregada: 'bg-emerald-50 text-emerald-700',
  rechazada: 'bg-slate-100 text-slate-600',
  cancelada: 'bg-slate-100 text-slate-500',
}

const contributionTone: Record<string, string> = {
  ofrecido: 'bg-sky-50 text-sky-700',
  contactando: 'bg-amber-50 text-amber-700',
  recibido: 'bg-emerald-50 text-emerald-700',
  asignado: 'bg-amber-50 text-amber-700',
  completado: 'bg-emerald-50 text-emerald-700',
  cancelado: 'bg-slate-100 text-slate-500',
}

function pantryMessage(need: PantryNeed) {
  const minimum = Number(need.minimo_necesario)
  const current = Number(need.existencia_actual)
  if (minimum <= 0) return 'necesidad activa'
  const missingRatio = Math.max(0, minimum - current) / minimum
  if (missingRatio > 0.65) return 'hace falta bastante'
  if (missingRatio > 0.25) return 'hace falta'
  return 'un poco más y se cubre'
}

export default function SolidarityHub({
  userId,
  requests,
  contributions,
  pantryNeeds,
  bankAccounts,
  initialTab = 'solicitar',
}: {
  userId: string
  requests: RequestItem[]
  contributions: ContributionItem[]
  pantryNeeds: PantryNeed[]
  bankAccounts: ChurchBankAccount[]
  initialTab?: Tab
}) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [showExtra, setShowExtra] = useState(false)
  const [requestForm, setRequestForm] = useState({
    helpType: 'general' as SolidarityHelpType,
    need: '',
    additionalDetail: '',
    householdSize: '',
    phone: '',
    contactPreference: 'aplicacion' as SolidarityContactPreference,
  })
  const [contributionForm, setContributionForm] = useState({
    type: 'alimentos' as SolidarityContributionType,
    amount: '',
    detail: '',
    phone: '',
    anonymous: false,
    pantryNeedId: '',
  })

  const sortedPantry = useMemo(
    () => [...pantryNeeds].sort((a, b) => {
      const deficitA = Math.max(0, Number(a.minimo_necesario) - Number(a.existencia_actual))
      const deficitB = Math.max(0, Number(b.minimo_necesario) - Number(b.existencia_actual))
      return deficitB - deficitA
    }),
    [pantryNeeds],
  )

  const activeRequests = useMemo(() => requests.filter((item) => !['entregada', 'rechazada', 'cancelada'].includes(item.estado)).length, [requests])
  const completedSeeds = useMemo(() => contributions.filter((item) => ['recibido', 'completado'].includes(item.estado)).length, [contributions])
  const selectedNeed = sortedPantry.find((item) => item.id === contributionForm.pantryNeedId) || null

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
      setRequestForm({ helpType: 'general', need: '', additionalDetail: '', householdSize: '', phone: '', contactPreference: 'aplicacion' })
      setShowExtra(false)
      setMessage({ type: 'ok', text: 'Listo, recibimos tu mensaje. Puedes coordinar con el equipo desde Seguimiento.' })
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
      setMessage({ type: 'ok', text: '¡Gracias por sembrar! El equipo se pondrá en contacto para coordinar.' })
      setTab('seguimiento')
    })
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-[#f5f5f7] pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <section className="overflow-hidden rounded-b-[32px] bg-[linear-gradient(145deg,#302072,#5b3df5_58%,#7c64ff)] px-4 pb-7 pt-[calc(1.5rem+env(safe-area-inset-top))] text-white sm:px-6">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/14 ring-1 ring-white/20 backdrop-blur"><HeartHandshake className="h-7 w-7" /></span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/65">Vida Internacional</p>
            <h1 className="mt-1 text-[31px] font-extrabold leading-none tracking-[-0.04em]">Ayuda Solidaria</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/78">Pide ayuda con confianza o descubre una manera concreta de sembrar.</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15"><p className="text-2xl font-extrabold">{activeRequests}</p><p className="mt-1 text-xs text-white/70">mensajes tuyos activos</p></div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15"><p className="text-2xl font-extrabold">{completedSeeds}</p><p className="mt-1 text-xs text-white/70">siembras completadas</p></div>
        </div>
      </section>

      <div className="px-4 pt-5 sm:px-6">
        <div className="grid grid-cols-3 rounded-[18px] bg-white p-1 ring-1 ring-black/[0.05]">
          {([['solicitar', 'Necesito ayuda'], ['aportar', 'Quiero sembrar'], ['seguimiento', 'Seguimiento']] as Array<[Tab, string]>).map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); setMessage(null) }} className={`min-h-11 rounded-[14px] px-2 text-[12px] font-bold transition ${tab === id ? 'bg-[#5b3df5] text-white shadow-sm' : 'text-slate-500'}`}>{label}</button>
          ))}
        </div>

        {message ? <div className={`mt-4 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ${message.type === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>{message.type === 'ok' ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <X className="mt-0.5 h-5 w-5 shrink-0" />}<p className="leading-5">{message.text}</p></div> : null}

        {tab === 'solicitar' ? (
          <section className="mt-5 overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.045]">
            <header className="border-b border-slate-100 p-5"><h2 className="text-xl font-extrabold text-[#171923]">¿Cómo podemos ayudarte?</h2><p className="mt-1 text-sm leading-5 text-slate-500">Pide lo que necesitas sin tener que justificar tu situación.</p></header>
            <div className="space-y-5 p-5">
              <div className="flex items-start gap-3 rounded-2xl bg-violet-50 px-4 py-3 text-violet-900"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" /><p className="text-xs leading-5"><strong>Lo que compartas aquí es privado.</strong> Solo lo ve el equipo autorizado, nunca se publica.</p></div>

              <div>
                <p className="mb-2 text-xs font-bold text-slate-600">¿Qué necesitas?</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button type="button" onClick={() => setRequestForm((current) => ({ ...current, helpType: 'paquete_despensa', need: '' }))} className={`rounded-2xl border px-4 py-3 text-left ${requestForm.helpType === 'paquete_despensa' ? 'border-violet-300 bg-violet-50 text-violet-800' : 'border-slate-200 bg-slate-50 text-slate-700'}`}><span className="flex items-center gap-2 text-sm font-extrabold"><PackageCheck className="h-4 w-4" />Paquete de despensa</span><span className="mt-1 block text-xs text-slate-500">Solo necesitamos saber para cuántas personas prepararlo.</span></button>
                  <button type="button" onClick={() => setRequestForm((current) => ({ ...current, helpType: 'general' }))} className={`rounded-2xl border px-4 py-3 text-left ${requestForm.helpType === 'general' ? 'border-violet-300 bg-violet-50 text-violet-800' : 'border-slate-200 bg-slate-50 text-slate-700'}`}><span className="text-sm font-extrabold">Otra ayuda</span><span className="mt-1 block text-xs text-slate-500">Cuéntanos simplemente qué necesitas.</span></button>
                </div>
              </div>

              {requestForm.helpType === 'general' ? <label className="block"><span className="mb-2 block text-xs font-bold text-slate-600">¿Qué necesitas?</span><textarea value={requestForm.need} onChange={(event) => setRequestForm((current) => ({ ...current, need: event.target.value }))} placeholder="Por ejemplo: necesito ayuda con transporte esta semana" rows={4} maxLength={3000} className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:bg-white" /></label> : (
                <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600"><Users className="h-4 w-4" />¿Para cuántas personas preparamos el paquete?</span><input type="number" min={1} max={30} value={requestForm.householdSize} onChange={(event) => setRequestForm((current) => ({ ...current, householdSize: event.target.value }))} placeholder="Ej. 4" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-violet-400 focus:bg-white" /></label>
              )}

              <label className="block"><span className="mb-2 block text-xs font-bold text-slate-600">¿Cómo prefieres que te contactemos?</span><select value={requestForm.contactPreference} onChange={(event) => setRequestForm((current) => ({ ...current, contactPreference: event.target.value as SolidarityContactPreference }))} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-violet-400 focus:bg-white"><option value="aplicacion">Dentro de VIDA</option><option value="whatsapp">WhatsApp</option><option value="telefono">Llamada</option></select></label>
              {requestForm.contactPreference !== 'aplicacion' ? <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600"><Phone className="h-4 w-4" />Teléfono</span><input type="tel" value={requestForm.phone} onChange={(event) => setRequestForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Ej. 7000-0000" maxLength={40} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-violet-400 focus:bg-white" /></label> : <p className="rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">La conversación aparecerá en <strong>Seguimiento</strong> y podrás volver a ella desde <strong>Mi Perfil → Mis ayudas</strong>.</p>}

              <button type="button" onClick={() => setShowExtra((value) => !value)} className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-left text-sm font-bold text-slate-600">¿Algo más que quieras contarnos? <ChevronDown className={`h-4 w-4 transition ${showExtra ? 'rotate-180' : ''}`} /></button>
              {showExtra ? <div className="space-y-4 border-l-2 border-violet-100 pl-4"><label className="block"><span className="mb-2 block text-xs font-bold text-slate-600">Algo más <span className="font-medium text-slate-400">(opcional)</span></span><textarea value={requestForm.additionalDetail} onChange={(event) => setRequestForm((current) => ({ ...current, additionalDetail: event.target.value }))} placeholder="No necesitas explicar tu situación. Si quieres compartir algo más, puedes hacerlo aquí." rows={3} maxLength={3000} className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:bg-white" /></label>{requestForm.helpType === 'general' ? <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600"><Users className="h-4 w-4" />Personas en tu hogar <span className="font-medium text-slate-400">(opcional)</span></span><input type="number" min={1} max={30} value={requestForm.householdSize} onChange={(event) => setRequestForm((current) => ({ ...current, householdSize: event.target.value }))} placeholder="Ej. 4" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-violet-400 focus:bg-white" /></label> : null}</div> : null}

              <button disabled={pending} onClick={submitRequest} className="min-h-12 w-full rounded-2xl bg-[#5b3df5] px-5 text-sm font-extrabold text-white shadow-sm disabled:opacity-60">{pending ? 'Enviando…' : 'Enviar'}</button>
            </div>
          </section>
        ) : null}

        {tab === 'aportar' ? (
          <div className="mt-5 space-y-5">
            <section className="overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.045]">
              <header className="border-b border-slate-100 p-5"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-50 text-emerald-600"><HandCoins className="h-5 w-5" /></span><div><h2 className="font-extrabold text-[#171923]">Quiero sembrar</h2><p className="mt-1 text-xs leading-5 text-slate-500">Puede ser comida, tiempo, transporte, un oficio o lo que tengas para dar.</p></div></div></header>
              <div className="space-y-5 p-5">
                <div><p className="text-sm font-extrabold text-[#171923]">Hoy hace falta</p><p className="mt-1 text-xs text-slate-500">Necesidades generales de la despensa; nunca mostramos quién pidió ayuda.</p>
                  {sortedPantry.length === 0 ? <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-400">La despensa no tiene necesidades activas registradas ahora.</p> : <div className="mt-3 grid grid-cols-2 gap-2">{sortedPantry.map((need) => { const selected = contributionForm.pantryNeedId === need.id; return <button key={need.id} type="button" onClick={() => setContributionForm((current) => ({ ...current, type: 'alimentos', pantryNeedId: selected ? '' : need.id, detail: selected ? current.detail : current.detail || `Puedo ayudar con ${need.producto}` }))} className={`rounded-2xl border p-3 text-left ${selected ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}><span className="block text-sm font-extrabold text-slate-800">{need.producto}</span><span className="mt-1 block text-[11px] text-slate-500">{pantryMessage(need)}</span></button>})}</div>}
                </div>

                <div><p className="mb-2 text-sm font-extrabold text-[#171923]">Otras formas de ayudar</p><div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{contributionTypes.map((type) => <button key={type} type="button" onClick={() => setContributionForm((current) => ({ ...current, type, pantryNeedId: type === 'alimentos' ? current.pantryNeedId : '' }))} className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-bold ${contributionForm.type === type ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{SOLIDARITY_CONTRIBUTION_TYPE_LABELS[type]}</button>)}</div></div>

                {contributionForm.type === 'monetario' ? <div className="rounded-2xl bg-emerald-50/60 p-4"><p className="mb-3 text-sm font-extrabold text-emerald-900">Puedes transferir a una cuenta oficial</p><BankAccountCards accounts={bankAccounts} emptyText="El administrador aún no ha configurado una cuenta para Ayuda Solidaria." /><p className="mt-3 text-[11px] leading-5 text-emerald-800/70">VIDA no procesa el cobro dentro de la app. Registra abajo tu siembra para que el equipo pueda darle seguimiento y agradecerte.</p></div> : null}

                {selectedNeed ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">Ayudando con: {selectedNeed.producto}</p> : null}
                {contributionForm.type === 'monetario' ? <label className="block"><span className="mb-2 block text-xs font-bold text-slate-600">Monto que deseas sembrar</span><input type="number" min={0.01} step="0.01" value={contributionForm.amount} onChange={(event) => setContributionForm((current) => ({ ...current, amount: event.target.value }))} placeholder="0.00" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-emerald-400 focus:bg-white" /></label> : null}
                <label className="block"><span className="mb-2 block text-xs font-bold text-slate-600">Cuéntanos cómo te gustaría ayudar</span><textarea value={contributionForm.detail} onChange={(event) => setContributionForm((current) => ({ ...current, detail: event.target.value }))} rows={3} maxLength={2000} placeholder="Ej. puedo llevar 10 libras esta semana" className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white" /></label>
                <label className="block"><span className="mb-2 block text-xs font-bold text-slate-600">Teléfono <span className="font-medium text-slate-400">(opcional)</span></span><input type="tel" value={contributionForm.phone} onChange={(event) => setContributionForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Ej. 7000-0000" maxLength={40} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-emerald-400 focus:bg-white" /></label>
                <label className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3"><input type="checkbox" checked={contributionForm.anonymous} onChange={(event) => setContributionForm((current) => ({ ...current, anonymous: event.target.checked }))} className="mt-1 h-4 w-4 accent-emerald-600" /><span><span className="block text-sm font-bold text-[#171923]">Prefiero mantener mi nombre en privado ante la persona ayudada</span><span className="mt-1 block text-xs leading-5 text-slate-500">El equipo sí sabrá quién eres para coordinar y agradecerte.</span></span></label>
                <button disabled={pending} onClick={submitContribution} className="min-h-12 w-full rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white shadow-sm disabled:opacity-60">{pending ? 'Registrando…' : 'Sembrar'}</button>
              </div>
            </section>
          </div>
        ) : null}

        {tab === 'seguimiento' ? (
          <div className="mt-5 space-y-5">
            <section className="rounded-[24px] bg-white p-5 ring-1 ring-black/[0.045]"><div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-emerald-600" /><div><h2 className="font-extrabold text-[#171923]">Mi jardín de semillas</h2><p className="mt-1 text-xs text-slate-500">{completedSeeds} siembra{completedSeeds === 1 ? '' : 's'} completada{completedSeeds === 1 ? '' : 's'}. Sin rankings ni cantidades públicas.</p></div></div></section>

            <section className="overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.045]"><header className="border-b border-slate-100 p-5"><h2 className="font-extrabold text-[#171923]">Mis ayudas</h2></header><div className="divide-y divide-slate-100">{requests.length === 0 ? <p className="px-5 py-8 text-center text-sm text-slate-400">Aún no has pedido ayuda. Si la necesitas, aquí estamos.</p> : requests.map((item) => <article key={item.id} className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-800">{item.tipo_ayuda === 'paquete_despensa' ? 'Paquete de despensa' : item.necesidad}</p><p className="mt-1 text-xs text-slate-400">{new Date(item.created_at).toLocaleString('es-SV')}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${requestTone[item.estado] || 'bg-slate-100 text-slate-600'}`}>{SOLIDARITY_REQUEST_STATUS_LABELS[item.estado]}</span></div>{item.tipo_ayuda === 'paquete_despensa' && item.hogar_personas ? <p className="mt-2 text-xs text-slate-500">Paquete para {item.hogar_personas} persona{item.hogar_personas === 1 ? '' : 's'}</p> : null}{item.respuesta ? <p className="mt-3 rounded-xl bg-violet-50 px-3 py-2 text-sm leading-6 text-violet-900">{item.respuesta}</p> : null}<SolidarityChat contextType="solicitud" contextId={item.id} currentUserId={userId} label={item.contacto_preferido === 'aplicacion' ? 'Conversación en VIDA' : 'Chat dentro de VIDA'} />{['enviada', 'revisando', 'aprobada'].includes(item.estado) ? <button type="button" disabled={pending} onClick={() => startTransition(async () => { const result = await cancelarSolicitudAyudaSolidaria(item.id); setMessage({ type: result.success ? 'ok' : 'error', text: result.success ? 'Mensaje cancelado.' : result.error || 'No fue posible cancelar.' }) })} className="mt-3 text-xs font-bold text-slate-400">Cancelar pedido</button> : null}</article>)}</div></section>

            <section className="overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.045]"><header className="border-b border-slate-100 p-5"><h2 className="font-extrabold text-[#171923]">Mis siembras</h2></header><div className="divide-y divide-slate-100">{contributions.length === 0 ? <p className="px-5 py-8 text-center text-sm text-slate-400">Aún no has sembrado. Mira qué hace falta hoy.</p> : contributions.map((item) => <article key={item.id} className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-800">{SOLIDARITY_CONTRIBUTION_TYPE_LABELS[item.tipo]}</p><p className="mt-1 text-xs text-slate-400">{new Date(item.created_at).toLocaleString('es-SV')}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${contributionTone[item.estado] || 'bg-slate-100 text-slate-600'}`}>{SOLIDARITY_CONTRIBUTION_STATUS_LABELS[item.estado]}</span></div>{item.monto ? <p className="mt-2 text-sm font-extrabold text-emerald-700">${Number(item.monto).toFixed(2)} {item.moneda}</p> : null}<p className="mt-2 text-sm leading-6 text-slate-600">{item.detalle}</p>{item.respuesta ? <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-900">{item.respuesta}</p> : null}{item.agradecido_at ? <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700"><Sparkles className="h-3 w-3" />El equipo registró su agradecimiento</p> : null}<SolidarityChat contextType="aporte" contextId={item.id} currentUserId={userId} label="Coordinar esta siembra" />{['ofrecido', 'contactando', 'asignado'].includes(item.estado) ? <button type="button" disabled={pending} onClick={() => startTransition(async () => { const result = await cancelarAporteSolidario(item.id); setMessage({ type: result.success ? 'ok' : 'error', text: result.success ? 'Siembra cancelada.' : result.error || 'No fue posible cancelar.' }) })} className="mt-3 text-xs font-bold text-slate-400">Cancelar siembra</button> : null}</article>)}</div></section>
          </div>
        ) : null}
      </div>
    </div>
  )
}
