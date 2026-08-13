import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import InstallCTA from '@/components/pwa/InstallCTA'
import { Bell, CalendarDays, BookOpen, CheckCircle2, Users, ArrowRight, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Centro Cristiano Vida — Bienvenido',
  description: 'La app oficial de Centro Cristiano Vida Internacional. Avisos, calendario, Biblia, ministerios y comunidad en un solo lugar.',
}

const FEATURES = [
  {
    icon: Bell,
    title: 'Avisos',
    desc: 'Recibe información importante y notificaciones de tu comunidad.',
  },
  {
    icon: CalendarDays,
    title: 'Calendario',
    desc: 'Consulta servicios, actividades, asignaciones y eventos en un solo lugar.',
  },
  {
    icon: BookOpen,
    title: 'Biblia y estudio',
    desc: 'Lee la Biblia, guarda versículos y accede a herramientas de estudio.',
  },
  {
    icon: Users,
    title: 'Ministerios',
    desc: 'Mantente conectado con tus equipos, responsabilidades y solicitudes.',
  },
]

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/inicio')

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#f7f7f4] text-slate-950">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-20 h-[420px] w-[420px] rounded-full bg-[#C0392B]/10 blur-3xl" />
        <div className="absolute -right-48 top-[34rem] h-[460px] w-[460px] rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-white/85 to-transparent" />
      </div>

      <header className="relative z-20 mx-auto flex w-full max-w-5xl items-center justify-between px-5 pb-3 pt-[calc(1rem+env(safe-area-inset-top))] sm:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[14px] bg-white p-0.5 shadow-sm ring-1 ring-slate-200/80">
            <Image
              src="/icons/variant-dorado/icon-192.png"
              alt="Logo Centro Cristiano Vida"
              width={44}
              height={44}
              className="h-full w-full rounded-[12px] object-cover"
              priority
            />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-black text-slate-950">Centro Cristiano Vida</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#C0392B]">Vida Internacional</p>
          </div>
        </Link>

        <Link
          href="/login"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-white/85 px-3.5 text-xs font-black text-slate-700 shadow-sm backdrop-blur-xl transition active:scale-95"
        >
          Entrar
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <section className="relative z-10 mx-auto grid w-full max-w-5xl gap-8 px-5 pb-14 pt-8 sm:px-8 md:grid-cols-[1.04fr_.96fr] md:items-center md:pb-20 md:pt-14">
        <div className="text-center md:text-left">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white/80 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#C0392B] shadow-sm backdrop-blur-xl md:mx-0">
            <Sparkles className="h-3.5 w-3.5" />
            App oficial de tu comunidad
          </div>

          <div className="relative mx-auto mb-6 w-fit md:mx-0">
            <div className="h-24 w-24 overflow-hidden rounded-[27px] bg-white p-1 shadow-[0_22px_60px_rgba(15,23,42,0.16)] ring-1 ring-slate-200/80 md:h-28 md:w-28 md:rounded-[30px]">
              <Image
                src="/icons/variant-dorado/icon-512.png"
                alt="Vida Internacional"
                width={112}
                height={112}
                className="h-full w-full rounded-[23px] object-cover md:rounded-[26px]"
                priority
              />
            </div>
            <span className="absolute -bottom-1.5 -right-1.5 inline-flex items-center gap-1 rounded-full border-4 border-[#f7f7f4] bg-emerald-500 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-white" /> Activa
            </span>
          </div>

          <h1 className="text-[42px] font-black leading-[0.98] tracking-[-0.05em] text-slate-950 sm:text-5xl md:text-[58px]">
            Tu iglesia, más cerca.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[17px] leading-7 text-slate-500 md:mx-0 md:text-lg">
            Avisos, calendario, Biblia y coordinación de ministerios en una experiencia sencilla, rápida y creada para servir a la comunidad.
          </p>

          <div className="mx-auto mt-7 flex max-w-sm flex-col gap-3 md:mx-0 sm:max-w-none sm:flex-row sm:items-center">
            <InstallCTA />
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
            >
              Ya tengo cuenta
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500 md:justify-start">
            {['Sin costo', 'Instalable', 'Pensada para móvil'].map(label => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md md:max-w-none">
          <div className="absolute -inset-3 rounded-[38px] bg-gradient-to-br from-[#C0392B]/10 via-white/30 to-violet-500/10 blur-xl" />
          <div className="relative overflow-hidden rounded-[34px] border border-white/90 bg-white/88 p-4 shadow-[0_28px_80px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/60 backdrop-blur-2xl sm:p-5">
            <div className="flex items-center justify-between px-1 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Dentro de Vida</p>
                <p className="mt-1 text-lg font-black tracking-tight text-slate-950">Todo conectado</p>
              </div>
              <div className="h-11 w-11 overflow-hidden rounded-[14px] ring-1 ring-slate-200">
                <Image src="/icons/variant-rojo/icon-192.png" alt="Vida" width={44} height={44} className="h-full w-full object-cover" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map(({ icon: Icon, title, desc }, index) => (
                <article
                  key={title}
                  className={`min-h-[164px] rounded-[24px] border p-4 ${index === 0 ? 'border-rose-100 bg-rose-50/70' : index === 1 ? 'border-violet-100 bg-violet-50/70' : 'border-slate-100 bg-slate-50/80'}`}
                >
                  <div className={`grid h-10 w-10 place-items-center rounded-2xl ${index === 0 ? 'bg-[#C0392B] text-white' : index === 1 ? 'bg-violet-600 text-white' : 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-200'}`}>
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <h2 className="mt-4 text-sm font-black text-slate-900">{title}</h2>
                  <p className="mt-1.5 text-[11px] leading-[1.55] text-slate-500">{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-slate-200/70 bg-white/60 px-5 py-12 backdrop-blur-xl sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C0392B]">Una sola experiencia</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950">Menos mensajes perdidos. Más conexión.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Vida Internacional reúne las herramientas que la iglesia utiliza cada semana y las mantiene accesibles desde el teléfono.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <article key={title} className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <h3 className="mt-4 text-sm font-black text-slate-900">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-3xl overflow-hidden rounded-[32px] bg-slate-950 px-6 py-8 text-center text-white shadow-[0_22px_60px_rgba(15,23,42,0.20)] sm:px-10">
          <div className="mx-auto h-16 w-16 overflow-hidden rounded-[19px] ring-1 ring-white/15">
            <Image src="/icons/variant-dorado/icon-192.png" alt="Centro Cristiano Vida" width={64} height={64} className="h-full w-full object-cover" />
          </div>
          <h2 className="mt-5 text-2xl font-black tracking-[-0.03em]">Vida contigo, cada semana.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-300">
            Instálala en tu pantalla de inicio o entra con tu cuenta para comenzar.
          </p>
          <div className="mx-auto mt-6 max-w-sm">
            <InstallCTA />
          </div>
        </div>
      </section>

      <footer className="relative z-10 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center sm:px-8">
        <p className="text-[11px] text-slate-400">
          © {new Date().getFullYear()} Centro Cristiano Vida Internacional ·{' '}
          <Link href="/login" className="font-bold text-slate-500 transition hover:text-[#C0392B]">Acceso de miembros</Link>
        </p>
      </footer>
    </main>
  )
}
