'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  CheckCircle2,
  Clock3,
  HandCoins,
  HeartHandshake,
  PackageCheck,
  Phone,
  ShieldCheck,
  ShoppingBasket,
  Users,
  X,
} from 'lucide-react'
import {
  cancelarAporteSolidario,
  cancelarSolicitudAyudaSolidaria,
  crearSolicitudAyudaSolidaria,
  registrarAporteSolidario,
} from '@/app/actions/solidaridad'
import {
  SOLIDARITY_CONTRIBUTION_STATUS_LABELS,
  SOLIDARITY_CONTRIBUTION_TYPE_LABELS,
  SOLIDARITY_REQUEST_STATUS_LABELS,
  type PantryNeed,
  type SolidarityContactPreference,
  type SolidarityContributionType,
  type SolidarityUrgency,
} from '@/lib/solidarity/types'

type RequestItem = {
  id: string
  hogar_personas: number
  urgencia: SolidarityUrgency
  necesidad: string
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
  created_at: string
}

type Tab = 'solicitar' | 'aportar' | 'seguimiento'

const requestTone: Record<string, string> = {
  enviada: 'bg-sky-50 text-sky-700',
  revisando: 'bg-amber-50 text-amber-700',
  aprobada: 'bg-emerald-50 text-emerald-700',
  programada: 'bg-violet-50 text-violet-700',
  entregada: 'bg-emerald-50 text-emerald-700',
  rechazada: 'bg-rose-50 text-rose-700',
  cancelada: 'bg-slate-100 text-slate-500',
}

const contributionTone: Record<string, string> = {
  ofrecido: 'bg-sky-50 text-sky-700',
  contactando: 'bg-amber-50 text-amber-700',
  recibido: 'bg-violet-50 text-violet-700',
  asignado: 'bg-indigo-50 text-indigo-700',
  completado: 'bg-emerald-50 text-emerald-700',
  cancelado: 'bg-slate-100 text-slate-500',
}

export default function SolidarityHub({
  requests,
  contributions,
  pantryNeeds,
}: {
  requests: RequestItem[]
  contributions: ContributionItem[]
  pantryNeeds: PantryNeed[]
}) {
  const [tab, setTab] = useState<Tab>('solicitar')
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [requestForm, setRequestForm] = useState({
    householdSize: 1,
    urgency: 'normal' as SolidarityUrgency,
    need: '',
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

  const trackingCount = requests.length + contributions.length
  const activeRequests = useMemo(
    () => requests.filter((item) => !['entregada', 'rechazada', 'cancelada'].includes(item.estado)).length,
    [requests],
  )

  const submitRequest = () => {
    setMessage(null)
    startTransition(async () => {
      const result = await crearSolicitudAyudaSolidaria(requestForm)
      if (!result.success) {
        setMessage({ type: 'error', text: result.error || 'No fue posible enviar la solicitud.' })
        return
      }
      setRequestForm({ householdSize: 1, urgency: 'normal', need: '', phone: '', contactPreference: 'aplicacion' })
      setMessage({ type: 'ok', text: 'La solicitud fue enviada de forma privada al equipo pastoral.' })
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
        setMessage({ type: 'error', text: result.error || 'No fue posible registrar el aporte.' })
        return
      }
      setContributionForm({ type: 'alimentos', amount: '', detail: '', phone: '', anonymous: false, pantryNeedId: '' })
      setMessage({ type: 'ok', text: 'Tu siembra fue registrada. El equipo de la iglesia dará seguimiento.' })
      setTab('seguimiento')
    })
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-[#f5f5f7] pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <section className="overflow-hidden rounded-b-[32px] bg-[linear-gradient(145deg,#302072,#5b3df5_58%,#7c64ff)] px-4 pb-7 pt-[calc(1.5rem+env(safe-area-inset-top))] text-white sm:px-6">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/14 ring-1 ring-white/20 backdrop-blur">
            <HeartHandshake className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/65">Vida Internacional</p>
            <h1 className="mt-1 text-[31px] font-extrabold leading-none tracking-[-0.04em]">Ayuda Solidaria</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/78">
              Solicita apoyo con privacidad o registra cómo deseas sembrar para una familia.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
            <p className="text-2xl font-extrabold">{activeRequests}</p>
            <p className="mt-1 text-xs text-white/70">solicitudes tuyas activas</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
            <p className="text-2xl font-extrabold">{trackingCount}</p>
            <p className="mt-1 text-xs text-white/70">registros en seguimiento</p>
          </div>
        </div>
      </section>

      <div className="px-4 pt-5 sm:px-6">
        <div className="grid grid-cols-3 rounded-[18px] bg-white p-1 ring-1 ring-black/[0.05]">
          {([
            ['solicitar', 'Necesito ayuda'],
            ['aportar', 'Quiero sembrar'],
            ['seguimiento', 'Seguimiento'],
          ] as Array<[Tab, string]>).map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setTab(id); setMessage(null) }}
              className={`min-h-11 rounded-[14px] px-2 text-[12px] font-bold transition ${tab === id ? 'bg-[#5b3df5] text-white shadow-sm' : 'text-slate-500'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {message && (
          <div className={`mt-4 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ${message.type === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
            {message.type === 'ok' ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <X className="mt-0.5 h-5 w-5 shrink-0" />}
            <p className="leading-5">{message.text}</p>
          </div>
        )}

        {tab === 'solicitar' && (
          <section className="mt-5 overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.045]">
            <header className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-violet-50 text-violet-600"><ShoppingBasket className="h-5 w-5" /></span>
                <div>
                  <h2 className="font-extrabold text-[#171923]">Necesito ayuda</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Cuéntanos qué necesitas. La información solo será visible para el equipo pastoral autorizado.</p>
                </div>
              </div>
            </header>

            <div className="space-y-5 p-5">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600"><Users className="h-4 w-4" /> Personas en el hogar</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={requestForm.householdSize}
                  onChange={(event) => setRequestForm((current) => ({ ...current, householdSize: Number(event.target.value) }))}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold text-[#171923] outline-none focus:border-violet-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600"><Clock3 className="h-4 w-4" /> Nivel de necesidad</span>
                <select
                  value={requestForm.urgency}
                  onChange={(event) => setRequestForm((current) => ({ ...current, urgency: event.target.value as SolidarityUrgency }))}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-[#171923] outline-none focus:border-violet-400 focus:bg-white"
                >
                  <option value="normal">Necesidad actual</option>
                  <option value="prioritaria">Prioritaria</option>
                  <option value="urgente">Urgente</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-600">Explique brevemente la situación</span>
                <textarea
                  value={requestForm.need}
                  onChange={(event) => setRequestForm((current) => ({ ...current, need: event.target.value }))}
                  placeholder="Ej. Somos cuatro personas en casa y esta semana necesitamos apoyo con alimentos básicos."
                  rows={5}
                  maxLength={3000}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-[#171923] outline-none placeholder:text-slate-400 focus:border-violet-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-600">Forma de contacto</span>
                <select
                  value={requestForm.contactPreference}
                  onChange={(event) => setRequestForm((current) => ({ ...current, contactPreference: event.target.value as SolidarityContactPreference }))}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-[#171923] outline-none focus:border-violet-400 focus:bg-white"
                >
                  <option value="aplicacion">Respuesta dentro de VIDA</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telefono">Llamada telefónica</option>
                </select>
              </label>

              {requestForm.contactPreference !== 'aplicacion' && (
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600"><Phone className="h-4 w-4" /> Teléfono</span>
                  <input
                    type="tel"
                    value={requestForm.phone}
                    onChange={(event) => setRequestForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="Ej. 7000-0000"
                    maxLength={40}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-[#171923] outline-none placeholder:text-slate-400 focus:border-violet-400 focus:bg-white"
                  />
                </label>
              )}

              <button
                disabled={pending}
                onClick={submitRequest}
                className="min-h-12 w-full rounded-2xl bg-[#5b3df5] px-5 text-sm font-extrabold text-white shadow-sm disabled:opacity-60"
              >
                {pending ? 'Enviando…' : 'Enviar solicitud privada'}
              </button>
            </div>
          </section>
        )}

        {tab === 'aportar' && (
          <section className="mt-5 overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.045]">
            <header className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-50 text-emerald-600"><HandCoins className="h-5 w-5" /></span>
                <div>
                  <h2 className="font-extrabold text-[#171923]">Quiero sembrar</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Puedes responder a una necesidad real o decirnos cómo deseas ayudar. VIDA no realiza cobros.</p>
                </div>
              </div>
            </header>

            <div className="space-y-5 p-5">
              {pantryNeeds.length > 0 && (
                <div>
                  <div className="mb-3">
                    <p className="text-xs font-extrabold text-slate-700">Necesidades actuales de la despensa</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Las de menor existencia aparecen primero.</p>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {pantryNeeds.map((need) => {
                      const missing = Math.max(0, Number(need.minimo_necesario) - Number(need.existencia_actual))
                      const selected = contributionForm.pantryNeedId === need.id
                      return (
                        <button
                          key={need.id}
                          type="button"
                          onClick={() => setContributionForm((current) => ({ ...current, type: 'alimentos', pantryNeedId: selected ? '' : need.id }))}
                          className={`min-w-[150px] shrink-0 rounded-2xl border px-4 py-3 text-left ${selected ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}
                        >
                          <p className={`text-sm font-extrabold ${selected ? 'text-emerald-800' : 'text-[#171923]'}`}>{need.producto}</p>
                          <p className={`mt-1 text-xs ${selected ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {missing > 0 ? `Faltan ${missing} ${need.unidad}` : `${Number(need.existencia_actual)} ${need.unidad} disponibles`}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-600">¿Cómo deseas colaborar?</span>
                <select
                  value={contributionForm.type}
                  onChange={(event) => {
                    const type = event.target.value as SolidarityContributionType
                    setContributionForm((current) => ({ ...current, type, pantryNeedId: type === 'alimentos' ? current.pantryNeedId : '' }))
                  }}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-[#171923] outline-none focus:border-emerald-400 focus:bg-white"
                >
                  <option value="alimentos">Donar alimentos</option>
                  <option value="monetario">Sembrar económicamente</option>
                  <option value="voluntariado">Voluntariado</option>
                  <option value="tiempo">Dar de mi tiempo</option>
                  <option value="transporte">Apoyar con transporte</option>
                  <option value="herramientas">Prestar o donar herramientas</option>
                  <option value="objetos">Donar objetos</option>
                  <option value="conocimientos">Compartir conocimientos</option>
                  <option value="oficios">Ayudar con un oficio</option>
                  <option value="habilidades">Ayudar con una habilidad</option>
                  <option value="otro">No sé qué hace falta; quiero preguntar cómo ayudar</option>
                </select>
              </label>

              {contributionForm.type === 'monetario' && (
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-slate-600">Monto aproximado en USD</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={contributionForm.amount}
                    onChange={(event) => setContributionForm((current) => ({ ...current, amount: event.target.value }))}
                    placeholder="Ej. 25.00"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold text-[#171923] outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white"
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-600">Detalle de tu siembra</span>
                <textarea
                  value={contributionForm.detail}
                  onChange={(event) => setContributionForm((current) => ({ ...current, detail: event.target.value }))}
                  placeholder="Ej. Puedo donar arroz y aceite, apoyar con transporte el sábado o ayudar con mi oficio."
                  rows={4}
                  maxLength={2000}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-[#171923] outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600"><Phone className="h-4 w-4" /> Teléfono opcional</span>
                <input
                  type="tel"
                  value={contributionForm.phone}
                  onChange={(event) => setContributionForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="Ej. 7000-0000"
                  maxLength={40}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-[#171923] outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white"
                />
              </label>

              <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={contributionForm.anonymous}
                  onChange={(event) => setContributionForm((current) => ({ ...current, anonymous: event.target.checked }))}
                  className="mt-0.5 h-5 w-5 accent-[#5b3df5]"
                />
                <span>
                  <span className="block text-sm font-bold text-[#171923]">Mantener mi nombre en privado</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">El equipo autorizado podrá coordinar contigo, pero el beneficiario no verá tu nombre.</span>
                </span>
              </label>

              <button
                disabled={pending}
                onClick={submitContribution}
                className="min-h-12 w-full rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white shadow-sm disabled:opacity-60"
              >
                {pending ? 'Registrando…' : 'Registrar mi siembra'}
              </button>
            </div>
          </section>
        )}

        {tab === 'seguimiento' && (
          <div className="mt-5 space-y-6">
            <section>
              <div className="mb-3 flex items-end justify-between px-1">
                <div>
                  <h2 className="font-extrabold text-[#171923]">Mis solicitudes</h2>
                  <p className="mt-1 text-xs text-slate-500">Solo tú y el equipo autorizado pueden verlas.</p>
                </div>
                <span className="text-xs font-bold text-slate-400">{requests.length}</span>
              </div>
              <div className="overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.045]">
                {requests.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-slate-400">Todavía no has enviado solicitudes.</p>
                ) : requests.map((item, index) => (
                  <article key={item.id} className={`p-5 ${index < requests.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-[#171923]">Solicitud para {item.hogar_personas} persona{item.hogar_personas === 1 ? '' : 's'}</p>
                        <p className="mt-1 text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString('es-SV', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${requestTone[item.estado] || requestTone.enviada}`}>
                        {SOLIDARITY_REQUEST_STATUS_LABELS[item.estado]}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.necesidad}</p>
                    {item.respuesta && (
                      <div className="mt-3 rounded-2xl bg-violet-50 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-violet-500">Respuesta del equipo</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-violet-900">{item.respuesta}</p>
                      </div>
                    )}
                    {['enviada', 'revisando'].includes(item.estado) && (
                      <button
                        disabled={pending}
                        onClick={() => startTransition(async () => {
                          const result = await cancelarSolicitudAyudaSolidaria(item.id)
                          if (!result.success) setMessage({ type: 'error', text: result.error || 'No fue posible cancelar.' })
                        })}
                        className="mt-4 text-xs font-bold text-rose-600"
                      >
                        Cancelar solicitud
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-end justify-between px-1">
                <div>
                  <h2 className="font-extrabold text-[#171923]">Mis siembras</h2>
                  <p className="mt-1 text-xs text-slate-500">Seguimiento de alimentos, aportes, tiempo, transporte y otras formas de ayuda.</p>
                </div>
                <span className="text-xs font-bold text-slate-400">{contributions.length}</span>
              </div>
              <div className="overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.045]">
                {contributions.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-slate-400">Todavía no has registrado siembras.</p>
                ) : contributions.map((item, index) => (
                  <article key={item.id} className={`p-5 ${index < contributions.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600"><PackageCheck className="h-5 w-5" /></span>
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-[#171923]">{SOLIDARITY_CONTRIBUTION_TYPE_LABELS[item.tipo]}</p>
                          <p className="mt-1 text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString('es-SV', { day: 'numeric', month: 'long' })}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${contributionTone[item.estado] || contributionTone.ofrecido}`}>
                        {SOLIDARITY_CONTRIBUTION_STATUS_LABELS[item.estado]}
                      </span>
                    </div>
                    {item.monto && <p className="mt-3 text-xl font-extrabold text-emerald-700">${Number(item.monto).toFixed(2)}</p>}
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.detalle}</p>
                    {item.respuesta && (
                      <div className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">Respuesta del equipo</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-emerald-900">{item.respuesta}</p>
                      </div>
                    )}
                    {['ofrecido', 'contactando'].includes(item.estado) && (
                      <button
                        disabled={pending}
                        onClick={() => startTransition(async () => {
                          const result = await cancelarAporteSolidario(item.id)
                          if (!result.success) setMessage({ type: 'error', text: result.error || 'No fue posible cancelar.' })
                        })}
                        className="mt-4 text-xs font-bold text-rose-600"
                      >
                        Cancelar aporte
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        <div className="mt-6 flex items-start gap-3 rounded-[22px] bg-white p-4 text-slate-600 ring-1 ring-black/[0.045]">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
          <p className="text-xs leading-5">
            Las necesidades personales no se muestran públicamente ni aparecen con detalle en el Centro de Análisis. Solo se contabilizan totales generales.
          </p>
        </div>
      </div>
    </div>
  )
}
