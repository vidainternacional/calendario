import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import InstallCTA from '@/components/pwa/InstallCTA'
import { Bell, CalendarDays, BookOpen, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Centro Cristiano Vida — Bienvenido',
  description: 'La app oficial de ministerios y servidores del Centro Cristiano Vida Internacional. Accede a avisos, calendario de eventos y más.',
}

const FEATURES = [
  {
    icon: Bell,
    title: 'Avisos en tiempo real',
    desc: 'Recibe notificaciones push de tu ministerio al instante, incluso con la app cerrada.',
  },
  {
    icon: CalendarDays,
    title: 'Calendario de eventos',
    desc: 'Consulta tus turnos, ensayos y servicios. Solicita intercambios con un toque.',
  },
  {
    icon: BookOpen,
    title: 'Estudio bíblico (próximamente)',
    desc: 'Materiales, devocionales y guías de estudio directamente en tu dispositivo.',
  },
]

export default async function LandingPage() {
  // Redirect authenticated users straight to /inicio
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/inicio')

  return (
    <main className="min-h-screen bg-white text-[#171923] flex flex-col overflow-x-hidden">

      {/* ── Noise texture overlay ───────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }}
      />

      {/* ────────────────────────────────────────────────── */}
      {/* HEADER                                            */}
      {/* ────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm shrink-0">
            <Image
              src="/icons/variant-dorado/icon-192.png"
              alt="Logo Centro Cristiano Vida"
              width={40}
              height={40}
              className="object-cover"
              priority
            />
          </div>
          <span className="font-bold text-[#171923] text-[15px] leading-tight">
            Centro Cristiano<br />
            <span className="text-[#C0392B]">Vida</span>
          </span>
        </div>

        <Link
          href="/login"
          className="text-sm font-semibold text-[#C0392B] hover:underline underline-offset-2 transition"
        >
          Iniciar sesión →
        </Link>
      </header>

      {/* ────────────────────────────────────────────────── */}
      {/* HERO                                              */}
      {/* ────────────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-10 pb-16 max-w-2xl mx-auto w-full">

        {/* Red ambient glow */}
        <div
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #C0392B 0%, transparent 70%)' }}
        />

        {/* App icon — large */}
        <div className="relative mb-6">
          <div className="w-28 h-28 rounded-[28px] overflow-hidden shadow-2xl shadow-red-900/20 ring-4 ring-white">
            <Image
              src="/icons/variant-dorado/icon-512.png"
              alt="App Vida"
              width={112}
              height={112}
              className="object-cover"
              priority
            />
          </div>
          {/* Live badge */}
          <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
            LIVE
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#171923] leading-tight">
          La app de tu<br />
          <span className="text-[#C0392B]">comunidad</span>
        </h1>

        <p className="mt-4 text-slate-500 text-lg max-w-sm leading-relaxed">
          Avisos, calendario y coordinación de ministerios — todo en tu bolsillo.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {['Avisos push', 'Calendario', 'Intercambios', 'Sin costo'].map(label => (
            <span
              key={label}
              className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs font-medium px-3 py-1 rounded-full"
            >
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              {label}
            </span>
          ))}
        </div>

        {/* Primary CTA */}
        <div className="mt-8">
          <InstallCTA />
        </div>

        <p className="mt-4 text-xs text-slate-400">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="text-[#C0392B] font-semibold hover:underline">
            Inicia sesión
          </Link>
        </p>
      </section>

      {/* ────────────────────────────────────────────────── */}
      {/* FEATURES                                          */}
      {/* ────────────────────────────────────────────────── */}
      <section className="relative z-10 bg-[#f4f5f9] px-6 py-14">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-center text-[#171923] mb-8">
            Todo lo que necesitas
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-5 flex items-start gap-4 shadow-sm border border-slate-100"
              >
                <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#C0392B]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#171923] text-sm">{title}</h3>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────── */}
      {/* SOCIAL PROOF / TRUST                              */}
      {/* ────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 py-12 max-w-2xl mx-auto w-full text-center">
        <div className="bg-gradient-to-br from-[#C0392B] to-[#96281B] rounded-3xl p-8 text-white shadow-xl shadow-red-900/20">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4 shadow-lg">
            <Image
              src="/icons/variant-rojo/icon-512.png"
              alt="Vida app"
              width={64}
              height={64}
              className="object-cover"
            />
          </div>
          <h2 className="text-2xl font-extrabold">
            Únete a la comunidad
          </h2>
          <p className="text-red-100 mt-2 text-sm leading-relaxed max-w-xs mx-auto">
            Servidores y líderes del Centro Cristiano Vida ya coordinan con la app cada semana.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <InstallCTA />
          </div>
          <p className="mt-4 text-xs text-red-200">
            Disponible como PWA — sin descargar nada de tiendas
          </p>
        </div>
      </section>

      {/* ────────────────────────────────────────────────── */}
      {/* FOOTER                                            */}
      {/* ────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-slate-100 px-6 py-6 text-center">
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} Centro Cristiano Vida Internacional ·{' '}
          <Link href="/login" className="hover:text-[#C0392B] transition-colors">
            Acceso para servidores
          </Link>
        </p>
      </footer>

    </main>
  )
}
