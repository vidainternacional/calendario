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
import {
  SOLIDARITY_CONTRIBUTION_STATUS_LABELS,
  SOLIDARITY_CONTRIBUTION_TYPE_LABELS,
  SOLIDARITY_REQUEST_STATUS_LABELS,
  type PantryNeed,
  type SolidarityContactPreference,
  type SolidarityContributionType,
} from '@/lib/solidarity/types'

type RequestItem = {
  id: string
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
  created_at: string
}

type Tab = 'solicitar' | 'aportar' | 'seguimiento'

const contributionTypes: SolidarityContributionType[] = [
  'alimentos',
  'monetario',
  'tiempo',
  'transporte',
  'herramientas',
  'objetos',
  'oficios',
  'habilidades',
  'conocimientos',
  'voluntariado',
  'otro',
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
  const [showExtra, setShowExtra] = useState(false)
  const [requestForm, setRequestForm] = useState({
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

  const trackingCount = requests.length + contributions.length
  const activeRequests = useMemo(
    () => requests.filter((item) => !['entregada', 'rechazada', 'cancelada'].includes(item.estado)).length,
    [requests],
  )

  const selectedNeed = sortedPantry.find((item) => item.id === contributionForm.pantryNeedId) || null

  const submitRequest = () => {
    setMessage(null)
    startTransition(async () => {
      const result = await crearSolicitudAyudaSolidaria({
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
      setRequestForm({ need: '', additionalDetail: '', householdSize: '', phone: '', contactPreference: 'aplicacion' })
      setShowExtra(false)
      setMessage({ type: 'ok', text: 'Listo, recibimos tu mensaje. Alguien del equipo se pondrá en contacto contigo pronto.' })
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
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/14 ring-1 ring-white/20 backdrop-blur">
            <HeartHandshake className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/65">Vida Internacional</p>
            <h1 className="mt-1 text-[31px] font-extrabold leading-none tracking-[-0.04em]">Ayuda Solidaria</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/78">Pide ayuda con confianza o descubre una manera concreta de sembrar.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
            <p className="text-2xl font-extrabold">{activeRequests}</p>
            <p className="mt-1 text-xs text-white/70">mensajes tuyos activos</p>
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
            <button key={id} onClick={() => { setTab(id); setMessage(null) }} className={`min-h-11 rounded-[14px] px-2 text-[12px] font-bold transition ${tab === id ? 'bg-[#5b3df5] text-white shadow-sm' : 'text-slate-500'}`}>
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
              <h2 className="text-xl font-extrabold text-[#171923]">¿Cómo podemos ayudarte?</h2>
              <p className="mt-1 text-sm leading-5 text-slate-500">Cuéntanos qué necesitas. Esto lo ve únicamente el equipo pastoral.</p>
            </header>

            <div className="space-y-5 p-5">
              <div className="flex items-start gap-3 rounded-2xl bg-violet-50 px-4 py-3 text-violet-900">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                <p className="text-xs leading-5"><strong>Lo que compartas aquí es privado.</strong> Solo lo ve el equipo pastoral, nunca se publica.</p>
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-600">¿Qué necesitas?</span>
                <textarea
                  value={requestForm.need}
                  onChange={(event) => setRequestForm((current) => ({ ...current, need: event.target.value }))}
                  placeholder="Por ejemplo: necesito ayuda con alimentos esta semana"
                  rows={4}
                  maxLength={3000}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-[#171923] outline-none placeholder:text-slate-400 focus:border-violet-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-600">¿Cómo prefieres que te contactemos?</span>
                <select
                  value={requestForm.contactPreference}
                  onChange={(event) => setRequestForm((current) => ({ ...current, contactPreference: event.target.value as SolidarityContactPreference }))}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-[#171923] outline-none focus:border-violet-400 focus:bg-white"
                >
                  <option value="aplicacion">Dentro de VIDA</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telefono">Llamada</option>
                </select>
              </label>

              {requestForm.contactPreference !== 'aplicacion' && (
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600"><Phone className="h-4 w-4" /> Teléfono</span>
                  <input type="tel" value={requestForm.phone} onChange={(event) => setRequestForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Ej. 7000-0000" maxLength={40} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-[#171923] outline-none placeholder:text-slate-400 focus:border-violet-400 focus:bg-white" />
                </label>
              )}

              <button type="button" onClick={() => setShowExtra((value) => !value)} className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-left text-sm font-bold text-slate-600">
                ¿Algo más que quieras contarnos? <ChevronDown className={`h-4 w-4 transition ${showExtra ? 'rotate-180' : ''}`} />
              </button>

              {showExtra && (
                <div className="space-y-4 border-l-2 border-violet-100 pl-4">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-slate-600">Algo más que quieras contarnos <span className="font-medium text-slate-400">(opcional)</span></span>
                    <textarea value={requestForm.additionalDetail} onChange={(event) => setRequestForm((current) => ({ ...current, additionalDetail: event.target.value }))} placeholder="No es necesario explicar tu situación, pero si quieres compartir algo más, aquí puedes hacerlo." rows={3} maxLength={3000} className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:bg-white" />
                  </label>
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600"><Users className="h-4 w-4" /> ¿Cuántas personas viven en tu hogar? <span className="font-medium text-slate-400">(opcional)</span></span>
                    <p className="mb-2 text-xs leading-5 text-slate-400">Solo nos ayuda a coordinar cuánto llevar si aplica.</p>
                    <input type="number" min={1} max={30} value={requestForm.householdSize} onChange={(event) => setRequestForm((current) => ({ ...current, householdSize: event.target.value }))} placeholder="Ej. 4" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-violet-400 focus:bg-white" />
                  </label>
                </div>
              )}

              <button disabled={pending} onClick={submitRequest} className="min-h-12 w-full rounded-2xl bg-[#5b3df5] px-5 text-sm font-extrabold text-white shadow-sm disabled:opacity-60">
                {pending ? 'Enviando…' : 'Enviar'}
              </button>
            </div>
          </section>
        )}

        {tab === 'aportar' && (
          <div className="mt-5 space-y-5">
            <section className="overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.045]">
              <header className="border-b border-slate-100 p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Sparkles className="h-5 w-5" /></span>
                  <div>
                    <h2 className="font-extrabold text-[#171923]">Quiero sembrar</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Sembrar puede ser comida, tiempo, un oficio, transporte o lo que tengas para dar.</p>
                  </div>
                </div>
              </header>

              <div className="p-5">
                <h3 className="text-sm font-extrabold text-[#171923]">Hoy hace falta</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">Estas son necesidades generales de la despensa. Nunca mostramos quién pidió ayuda.</p>

                {sortedPantry.length === 0 ? (
                  <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">Por ahora no hay necesidades activas de despensa.</p>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {sortedPantry.map((need) => {
                      const minimum = Number(need.minimo_necesario)
                      const current = Number(need.existencia_actual)
                      const progress = minimum > 0 ? Math.min(100, Math.round((current / minimum) * 100)) : 100
                      const selected = contributionForm.pantryNeedId === need.id
                      return (
                        <button
                          key={need.id}
                          type="button"
                          onClick={() => setContributionForm((currentForm) => ({ ...currentForm, type: 'alimentos', pantryNeedId: selected ? '' : need.id }))}
                          className={`rounded-2xl p-4 text-left ring-1 transition ${selected ? 'bg-emerald-50 ring-emerald-300' : 'bg-white ring-slate-200'}`}
                        >
                          <p className="text-sm font-extrabold text-[#171923]">{need.producto}</p>
                          <p className="mt-1 text-[11px] font-semibold text-emerald-700">{pantryMessage(need)}</p>
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
                          </div>
                          <p className="mt-2 text-[10px] font-bold text-slate-400">{selected ? 'Seleccionado' : 'Puedo ayudar con esto'}</p>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.045]">
              <div className="space-y-5 p-5">
                <div>
                  <h3 className="text-sm font-extrabold text-[#171923]">Otras formas de ayudar</h3>
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {contributionTypes.map((type) => (
                      <button key={type} type="button" onClick={() => setContributionForm((current) => ({ ...current, type, pantryNeedId: type === 'alimentos' ? current.pantryNeedId : '' }))} className={`min-h-10 shrink-0 rounded-full px-4 text-xs font-bold ${contributionForm.type === type ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {SOLIDARITY_CONTRIBUTION_TYPE_LABELS[type]}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedNeed && (
                  <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    <strong>{selectedNeed.producto}</strong> está seleccionado. Cuéntanos cuánto o cómo puedes ayudar.
                  </div>
                )}

                {contributionForm.type === 'monetario' && (
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-slate-600">Monto aproximado en USD</span>
                    <input type="number" min="0.01" step="0.01" value={contributionForm.amount} onChange={(event) => setContributionForm((current) => ({ ...current, amount: event.target.value }))} placeholder="Ej. 25.00" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white" />
                  </label>
                )}

                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-slate-600">Cuéntanos cómo te gustaría ayudar</span>
                  <textarea value={contributionForm.detail} onChange={(event) => setContributionForm((current) => ({ ...current, detail: event.target.value }))} placeholder={selectedNeed ? `Ej. Puedo aportar 10 ${selectedNeed.unidad} de ${selectedNeed.producto}.` : 'Ej. Puedo ayudar con transporte el sábado.'} rows={4} maxLength={2000} className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white" />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600"><Phone className="h-4 w-4" /> Teléfono opcional</span>
                  <input type="tel" value={contributionForm.phone} onChange={(event) => setContributionForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Ej. 7000-0000" maxLength={40} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white" />
                </label>

                <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                  <input type="checkbox" checked={contributionForm.anonymous} onChange={(event) => setContributionForm((current) => ({ ...current, anonymous: event.target.checked }))} className="mt-0.5 h-5 w-5 accent-[#5b3df5]" />
                  <span>
                    <span className="block text-sm font-bold text-[#171923]">Prefiero mantener mi nombre en privado ante la persona ayudada</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">El equipo pastoral sí sabrá quién eres para poder coordinar contigo.</span>
                  </span>
                </label>

                <button disabled={pending} onClick={submitContribution} className="min-h-12 w-full rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white shadow-sm disabled:opacity-60">
                  {pending ? 'Registrando…' : 'Sembrar'}
                </button>
              </div>
            </section>
          </div>
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
                  <p className="px-5 py-10 text-center text-sm text-slate-400">Aún no has pedido ayuda. Si la necesitas, aquí estamos.</p>
                ) : requests.map((item, index) => (
                  <article key={item.id} className={`p-5 ${index < requests.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-extrabold text-[#171923]">{item.necesidad}</p>
                        <p className="mt-1 text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString('es-SV', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${requestTone[item.estado] || requestTone.enviada}`}>{SOLIDARITY_REQUEST_STATUS_LABELS[item.estado]}</span>
                    </div>
                    {item.detalle_adicional && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.detalle_adicional}</p>}
                    {item.hogar_personas ? <p className="mt-3 text-xs text-slate-400">Hogar: {item.hogar_personas} persona{item.hogar_personas === 1 ? '' : 's'}</p> : null}
                    {item.respuesta && (
                      <div className="mt-3 rounded-2xl bg-violet-50 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-violet-500">Respuesta del equipo</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-violet-900">{item.respuesta}</p>
                      </div>
                    )}
                    {['enviada', 'revisando', 'aprobada'].includes(item.estado) && (
                      <button disabled={pending} onClick={() => startTransition(async () => { const result = await cancelarSolicitudAyudaSolidaria(item.id); if (!result.success) setMessage({ type: 'error', text: result.error || 'No fue posible cancelar.' }) })} className="mt-4 text-xs font-bold text-rose-600">Cancelar</button>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-end justify-between px-1">
                <div>
                  <h2 className="font-extrabold text-[#171923]">Mis aportes</h2>
                  <p className="mt-1 text-xs text-slate-500">Seguimiento de tus siembras y formas de servir.</p>
                </div>
                <span className="text-xs font-bold text-slate-400">{contributions.length}</span>
              </div>
              <div className="overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.045]">
                {contributions.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-slate-400">Aún no has sembrado nada. Mira qué hace falta hoy.</p>
                ) : contributions.map((item, index) => (
                  <article key={item.id} className={`p-5 ${index < contributions.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600"><PackageCheck className="h-5 w-5" /></span>
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-[#171923]">{SOLIDARITY_CONTRIBUTION_TYPE_LABELS[item.tipo] || item.tipo}</p>
                          <p className="mt-1 text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString('es-SV', { day: 'numeric', month: 'long' })}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${contributionTone[item.estado] || contributionTone.ofrecido}`}>{SOLIDARITY_CONTRIBUTION_STATUS_LABELS[item.estado]}</span>
                    </div>
                    {item.monto ? <p className="mt-3 text-xl font-extrabold text-emerald-700">${Number(item.monto).toFixed(2)}</p> : null}
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.detalle}</p>
                    {item.respuesta && (
                      <div className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">Respuesta del equipo</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-emerald-900">{item.respuesta}</p>
                      </div>
                    )}
                    {['ofrecido', 'contactando', 'asignado'].includes(item.estado) && (
                      <button disabled={pending} onClick={() => startTransition(async () => { const result = await cancelarAporteSolidario(item.id); if (!result.success) setMessage({ type: 'error', text: result.error || 'No fue posible cancelar.' }) })} className="mt-4 text-xs font-bold text-rose-600">Cancelar aporte</button>
                    )}
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        <div className="mt-6 flex items-start gap-3 rounded-[22px] bg-white p-4 text-slate-600 ring-1 ring-black/[0.045]">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
          <p className="text-xs leading-5">Las necesidades personales nunca se muestran públicamente. Solo compartimos necesidades generales de la despensa para facilitar que otros puedan sembrar.</p>
        </div>
      </div>
    </div>
  )
}
