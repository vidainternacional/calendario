'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Bell,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import PushToggle from '@/components/pwa/PushToggle'
import { guardarProgresoOnboarding } from '@/app/actions/piloto'
import { createClient } from '@/lib/supabase/client'
import type { PilotContext, PilotRole } from '@/lib/pilot/types'

type Step = {
  title: string
  description: string
  icon: typeof Sparkles
  example?: string
  notification?: boolean
}

function stepsFor(role: PilotRole): Step[] {
  const common: Step[] = [
    {
      title: 'Bienvenido a VIDA',
      description: 'Esta es una prueba privada. Queremos que uses la aplicación con normalidad y nos digas qué resulta claro, confuso o lento.',
      icon: Sparkles,
      example: 'Durante el piloto no compartas tu contraseña ni el enlace con otras personas.',
    },
  ]

  if (role === 'administrador' || role === 'pastor') {
    return [
      ...common,
      {
        title: 'Visión general',
        description: 'Puedes revisar ministerios, calendario, avisos y el Centro de Análisis del piloto. Comprueba que cada persona vea únicamente lo que le corresponde.',
        icon: ShieldCheck,
      },
      {
        title: 'Calendario y mensajes',
        description: 'Crea un evento general o ministerial y envía un mensaje pastoral o anuncio de prueba. Luego confirma que la notificación abra el contenido correcto.',
        icon: CalendarDays,
        example: 'PRUEBA — Reunión del equipo piloto, sábado 4:00 p. m.',
      },
      {
        title: 'Activa las notificaciones',
        description: 'Las alertas son necesarias para comprobar avisos, asignaciones e intercambios. Puedes cambiarlas después desde Perfil.',
        icon: Bell,
        notification: true,
      },
      {
        title: 'Tu primera tarea',
        description: 'Invita a un líder y un servidor al piloto, crea una actividad de prueba y revisa los resultados en Administración → Centro de Análisis.',
        icon: ClipboardCheck,
      },
    ]
  }

  if (role === 'lider') {
    return [
      ...common,
      {
        title: 'Tu ministerio',
        description: 'Desde el dashboard puedes consultar miembros, avisos, próximas actividades y las herramientas de liderazgo de tu propio ministerio.',
        icon: Users,
      },
      {
        title: 'Organiza al equipo',
        description: 'Crea un evento, asigna servidores y publica un aviso. No deberías poder administrar ministerios donde no eres líder.',
        icon: CalendarDays,
        example: 'PRUEBA — Ensayo general. Auditorio principal. Confirmar asistencia.',
      },
      {
        title: 'Activa las notificaciones',
        description: 'Así recibirás respuestas, solicitudes y cambios importantes del equipo.',
        icon: Bell,
        notification: true,
      },
      {
        title: 'Tu primera tarea',
        description: 'Publica un aviso de prueba y asigna un servidor a una actividad. Pídele que abra la notificación y revise el evento.',
        icon: Megaphone,
      },
    ]
  }

  return [
    ...common,
    {
      title: role === 'servidor' ? 'Tus asignaciones' : 'Tu información',
      description: role === 'servidor'
        ? 'En Calendario encontrarás las actividades donde fuiste asignado. Toca un evento para ver hora, lugar y detalles.'
        : 'En VIDA puedes consultar avisos, eventos y los ministerios a los que tienes acceso.',
      icon: CalendarDays,
    },
    {
      title: 'Ministerios y avisos',
      description: 'Abre tu ministerio, lee el aviso de prueba y confirma que no aparecen herramientas administrativas que no te correspondan.',
      icon: Megaphone,
    },
    {
      title: 'Activa las notificaciones',
      description: 'Las alertas te avisarán de nuevos eventos, mensajes y solicitudes relacionadas con tu servicio.',
      icon: Bell,
      notification: true,
    },
    {
      title: 'Tu primera tarea',
      description: role === 'servidor'
        ? 'Abre una asignación, revisa sus detalles y prueba la opción Intercambio cuando el líder te indique.'
        : 'Revisa un aviso, abre el calendario y reporta cualquier paso que no entiendas.',
      icon: ClipboardCheck,
    },
  ]
}

export default function PilotOnboarding({ context }: { context: PilotContext | null }) {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(Boolean(context?.active && !context.onboardingCompleted))
  const [step, setStep] = useState(context?.onboardingStep || 0)
  const [saving, setSaving] = useState(false)
  const steps = useMemo(() => stepsFor(context?.role || 'congregante'), [context?.role])
  const current = steps[Math.min(step, steps.length - 1)]
  const last = step >= steps.length - 1

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const openTour = () => {
      setStep(0)
      setOpen(true)
    }
    window.addEventListener('vida:open-onboarding', openTour)
    return () => window.removeEventListener('vida:open-onboarding', openTour)
  }, [])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (!mounted || !context?.active || !open || !current) return null

  const persist = async (nextStep: number, completed: boolean) => {
    const permission = typeof Notification === 'undefined' ? null : Notification.permission === 'granted'
    await guardarProgresoOnboarding({
      role: context.role,
      currentStep: nextStep,
      completed,
      notificationsPrompted: typeof Notification !== 'undefined' && Notification.permission !== 'default',
      notificationsEnabled: permission,
    })
  }

  const next = async () => {
    if (last) {
      setSaving(true)
      await persist(steps.length - 1, true)
      const supabase = createClient()
      void (supabase as any).from('pilot_usage_events').insert({
        profile_id: context.profileId,
        event_name: 'onboarding_completed',
        route: window.location.pathname,
        metadata: { role: context.role, version: 1 },
      })
      setSaving(false)
      setOpen(false)
      return
    }

    const nextStep = step + 1
    setStep(nextStep)
    void persist(nextStep, false)
  }

  const later = async () => {
    setSaving(true)
    await persist(step, false)
    setSaving(false)
    setOpen(false)
  }

  return createPortal(
    <div className="fixed inset-0 z-[180] flex items-end justify-center bg-slate-950/35 p-0 backdrop-blur-[3px] sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="pilot-onboarding-title">
      <section className="w-full overflow-hidden rounded-t-[30px] bg-white shadow-2xl sm:max-w-md sm:rounded-[30px]">
        <header className="flex items-center justify-between px-5 pb-2 pt-4">
          <button
            type="button"
            onClick={() => step > 0 ? setStep((value) => value - 1) : void later()}
            className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700"
            aria-label={step > 0 ? 'Paso anterior' : 'Cerrar recorrido'}
          >
            {step > 0 ? <ChevronLeft className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </button>
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Piloto VIDA</span>
          <span className="grid h-10 w-10 place-items-center text-xs font-bold text-slate-400">{step + 1}/{steps.length}</span>
        </header>

        <div className="px-6 pb-6 pt-3 sm:px-7 sm:pb-7">
          <div className="grid h-16 w-16 place-items-center rounded-[22px] bg-violet-100 text-violet-600">
            <current.icon className="h-8 w-8" aria-hidden="true" />
          </div>
          <h2 id="pilot-onboarding-title" className="mt-5 text-[28px] font-extrabold leading-tight tracking-[-0.035em] text-[#151923]">
            {current.title}
          </h2>
          <p className="mt-3 text-[15px] leading-6 text-slate-600">{current.description}</p>

          {current.example && (
            <div className="mt-5 rounded-[18px] bg-slate-50 px-4 py-3.5 ring-1 ring-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Ejemplo</p>
              <p className="mt-1.5 text-sm font-semibold leading-5 text-slate-700">{current.example}</p>
            </div>
          )}

          {current.notification && (
            <div className="mt-5 rounded-[18px] border border-violet-100 bg-violet-50/60 p-4">
              <PushToggle />
            </div>
          )}

          <div className="mt-6 flex gap-1.5" aria-hidden="true">
            {steps.map((_, index) => (
              <span key={index} className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-violet-600' : 'bg-slate-200'}`} />
            ))}
          </div>

          <button
            type="button"
            onClick={() => void next()}
            disabled={saving}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-bold text-white shadow-sm disabled:opacity-60"
          >
            {last ? <><Check className="h-5 w-5" /> Comenzar prueba</> : <>Continuar <ChevronRight className="h-5 w-5" /></>}
          </button>
          {!last && (
            <button type="button" onClick={() => void later()} disabled={saving} className="mt-2 min-h-11 w-full text-sm font-semibold text-slate-500 disabled:opacity-60">
              Continuar después
            </button>
          )}
        </div>
      </section>
    </div>,
    document.body,
  )
}
