'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { crearAviso, type AvisoState } from '@/app/actions/avisos'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Megaphone,
  Send,
  Users,
  X,
} from 'lucide-react'

interface Ministerio {
  id: string
  nombre: string
}

interface NuevoAvisoModalProps {
  ministeriosLider: Ministerio[]
  esPastorAdmin: boolean
}

export default function NuevoAvisoModal({
  ministeriosLider,
  esPastorAdmin,
}: NuevoAvisoModalProps) {
  const [open, setOpen] = useState(false)
  const [paso, setPaso] = useState<'redactar' | 'revisar' | 'resultado'>('redactar')
  const [ministerioId, setMinisterioId] = useState(esPastorAdmin ? '' : ministeriosLider[0]?.id || '')
  const [titulo, setTitulo] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)

  const boundAction = crearAviso.bind(null, '')
  const [state, action, pending] = useActionState<AvisoState, FormData>(boundAction, undefined)

  const ministerioNombre = ministerioId
    ? ministeriosLider.find((ministerio) => ministerio.id === ministerioId)?.nombre || 'Ministerio'
    : 'Todos los ministerios'

  const limpiar = () => {
    setPaso('redactar')
    setMinisterioId(esPastorAdmin ? '' : ministeriosLider[0]?.id || '')
    setTitulo('')
    setCuerpo('')
  }

  const cerrar = () => {
    setOpen(false)
    window.setTimeout(limpiar, 200)
  }

  useEffect(() => {
    if (state?.success) setPaso('resultado')
  }, [state])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cerrar()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    if (open) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [open])

  const puedeRevisar = titulo.trim().length > 0 && cuerpo.trim().length > 0 && (esPastorAdmin || ministerioId)

  return (
    <>
      <button
        id="btn-nuevo-aviso"
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-500 active:scale-95 min-[430px]:flex-none"
      >
        <Megaphone className="h-4 w-4 shrink-0" />
        Nuevo aviso
      </button>

      {open && (
        <div className="modal-overlay-safe bg-black/45 backdrop-blur-sm" onClick={cerrar}>
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Nuevo aviso"
            className="modal-panel-safe flex max-w-lg flex-col overflow-hidden rounded-[26px] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="shrink-0 border-b border-slate-100 bg-white px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-500">Comunicación</p>
                  <h2 className="mt-0.5 break-words text-lg font-bold text-[#171923]">
                    {paso === 'redactar' && 'Redactar nuevo aviso'}
                    {paso === 'revisar' && 'Revisar antes de publicar'}
                    {paso === 'resultado' && (state?.pendiente ? 'Aviso enviado a revisión' : 'Aviso publicado')}
                  </h2>
                </div>
                <button type="button" onClick={cerrar} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-gray-500 transition-colors hover:bg-slate-200" aria-label="Cerrar">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {paso !== 'resultado' && (
                <div className="mt-4 grid grid-cols-2 gap-2" aria-label="Progreso del aviso">
                  <div className={`h-1.5 rounded-full ${paso === 'redactar' || paso === 'revisar' ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                  <div className={`h-1.5 rounded-full ${paso === 'revisar' ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                </div>
              )}
            </header>

            {paso === 'resultado' ? (
              <div className="modal-body-safe flex flex-col items-center px-5 py-10 text-center sm:px-7 sm:py-12">
                <div className={`mb-5 flex h-20 w-20 items-center justify-center rounded-full ${state?.pendiente ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {state?.pendiente ? <span className="text-3xl">⏳</span> : <CheckCircle2 className="h-10 w-10" />}
                </div>
                <h3 className="text-xl font-bold text-[#171923]">
                  {state?.pendiente ? 'Quedó pendiente de aprobación' : 'Publicación completada'}
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
                  {state?.mensaje || (state?.pendiente
                    ? 'Un administrador o pastor general revisará el aviso antes de publicarlo.'
                    : 'El aviso ya está disponible para sus destinatarios.')}
                </p>
                {!state?.pendiente && typeof state?.notificados === 'number' && (
                  <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700">
                    <Send className="h-4 w-4" />
                    {state.notificados} dispositivo{state.notificados === 1 ? '' : 's'} notificado{state.notificados === 1 ? '' : 's'}
                  </div>
                )}
                <button type="button" onClick={cerrar} className="mt-7 min-h-11 w-full rounded-xl bg-[#171923] px-6 py-3 text-sm font-semibold text-white sm:w-auto">
                  Terminar
                </button>
              </div>
            ) : (
              <form action={action} className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <input type="hidden" name="ministerio_id" value={ministerioId} />
                <input type="hidden" name="titulo" value={titulo} />
                <input type="hidden" name="cuerpo" value={cuerpo} />

                <div className="modal-body-safe flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                  {state?.error && (
                    <div role="alert" className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                      {state.error}
                    </div>
                  )}

                  {paso === 'redactar' ? (
                    <div className="space-y-5">
                      <section className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4 text-indigo-500" />
                          <h3 className="text-sm font-bold text-[#171923]">Destinatarios</h3>
                        </div>
                        <label htmlFor="aviso-ministerio" className="sr-only">Publicar en</label>
                        <div className="relative">
                          <select
                            id="aviso-ministerio"
                            value={ministerioId}
                            onChange={(event) => setMinisterioId(event.target.value)}
                            required={!esPastorAdmin}
                            className="min-h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-base font-semibold text-[#171923] outline-none focus:ring-2 focus:ring-indigo-400 sm:text-sm"
                          >
                            {esPastorAdmin && <option value="">🌐 Todos los ministerios</option>}
                            {ministeriosLider.map((ministerio) => <option key={ministerio.id} value={ministerio.id}>{ministerio.nombre}</option>)}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-slate-500">
                          {ministerioId ? 'Recibirán el aviso los miembros activos de este ministerio.' : 'Se publicará como aviso general para toda la congregación.'}
                        </p>
                      </section>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <label htmlFor="aviso-titulo" className="text-xs font-bold uppercase tracking-wide text-gray-500">Título</label>
                          <span className="text-[11px] text-slate-400">{titulo.length}/120</span>
                        </div>
                        <input id="aviso-titulo" value={titulo} onChange={(event) => setTitulo(event.target.value)} type="text" placeholder="Ej: Reunión de líderes este sábado" required maxLength={120} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-[#171923] outline-none focus:ring-2 focus:ring-indigo-400 sm:text-sm" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <label htmlFor="aviso-cuerpo" className="text-xs font-bold uppercase tracking-wide text-gray-500">Mensaje</label>
                          <span className="text-[11px] text-slate-400">{cuerpo.length} caracteres</span>
                        </div>
                        <textarea id="aviso-cuerpo" value={cuerpo} onChange={(event) => setCuerpo(event.target.value)} rows={7} placeholder="Escribe el mensaje con la información que las personas necesitan conocer..." required className="min-h-44 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-base leading-relaxed text-[#171923] outline-none focus:ring-2 focus:ring-indigo-400 sm:text-sm" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <section className="overflow-hidden rounded-[22px] border border-slate-100 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-indigo-50 px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-500">Se publicará en</p>
                          <p className="mt-1 font-bold text-[#171923]">{ministerioNombre}</p>
                        </div>
                        <div className="p-5">
                          <h3 className="break-words text-xl font-bold leading-tight text-[#171923]">{titulo}</h3>
                          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">{cuerpo}</p>
                        </div>
                      </section>
                      <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
                        Revisa nombres, fechas, horarios y destinatarios. Después de publicar, el aviso podrá generar notificaciones push inmediatamente.
                      </div>
                    </div>
                  )}
                </div>

                <footer className="shrink-0 border-t border-slate-100 bg-white px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
                  {paso === 'redactar' ? (
                    <button type="button" onClick={() => setPaso('revisar')} disabled={!puedeRevisar} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition-all hover:bg-indigo-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45">
                      Revisar aviso
                      <Send className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="grid grid-cols-[auto_1fr] gap-3">
                      <button type="button" onClick={() => setPaso('redactar')} disabled={pending} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50">
                        <ArrowLeft className="h-4 w-4" />
                        Editar
                      </button>
                      <button id="btn-publicar-aviso" type="submit" disabled={pending} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition-all hover:bg-indigo-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60">
                        {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Publicando…</> : <><Megaphone className="h-4 w-4" /> Publicar y notificar</>}
                      </button>
                    </div>
                  )}
                </footer>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
