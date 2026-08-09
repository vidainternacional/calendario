import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, HeartHandshake, ShieldCheck } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import SolidarityAdminBoard from '@/components/solidaridad/SolidarityAdminBoard'

export const metadata: Metadata = {
  title: 'Gestión de Ayuda Solidaria',
}

export const dynamic = 'force-dynamic'

export default async function AdminAyudaSolidariaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('rol, activo, estado_cuenta, es_pastor_general')
    .eq('id', user.id)
    .single()

  const allowed = profile?.activo === true
    && profile?.estado_cuenta === 'activo'
    && (profile?.rol === 'pastor' || profile?.rol === 'administrador' || profile?.es_pastor_general === true)
  if (!allowed) redirect('/inicio')

  const service = createServiceClient()
  const [{ data: requestRows }, { data: contributionRows }] = await Promise.all([
    (service as any)
      .from('solicitudes_ayuda_solidaria')
      .select('id, hogar_personas, urgencia, necesidad, telefono, contacto_preferido, estado, respuesta, created_at, solicitante:profiles!solicitudes_ayuda_solidaria_profile_id_fkey(nombre_completo, email)')
      .order('created_at', { ascending: false })
      .limit(200),
    (service as any)
      .from('aportes_ayuda_solidaria')
      .select('id, tipo, monto, moneda, detalle, telefono, anonimo, estado, respuesta, created_at, aportante:profiles!aportes_ayuda_solidaria_profile_id_fkey(nombre_completo, email)')
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  const requests = (requestRows || []).map((item: any) => ({
    ...item,
    profiles: item.solicitante || null,
  }))
  const contributions = (contributionRows || []).map((item: any) => ({
    ...item,
    profiles: item.aportante || null,
  }))

  const openRequests = requests.filter((item: any) => !['entregada', 'rechazada', 'cancelada'].includes(item.estado)).length
  const availableContributions = contributions.filter((item: any) => !['completado', 'cancelado'].includes(item.estado)).length

  return (
    <main className="min-h-screen bg-[#f5f5f7] pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
      <section className="bg-[linear-gradient(145deg,#17132e,#302072_48%,#5b3df5)] px-4 pb-7 pt-4 text-white sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/12 px-4 text-sm font-bold text-white ring-1 ring-white/15 backdrop-blur">
            <ArrowLeft className="h-4 w-4" /> Administración
          </Link>
          <div className="mt-6 flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-rose-600 text-white shadow-[0_8px_20px_rgba(225,29,72,0.25)]"><HeartHandshake className="h-7 w-7" /></span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Gestión privada</p>
              <h1 className="mt-1 text-[30px] font-extrabold leading-none tracking-[-0.04em]">Ayuda Solidaria</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/72">Revisa solicitudes, coordina entregas y da seguimiento a las personas que desean aportar.</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15"><p className="text-3xl font-extrabold">{openRequests}</p><p className="mt-1 text-xs text-white/65">solicitudes activas</p></div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15"><p className="text-3xl font-extrabold">{availableContributions}</p><p className="mt-1 text-xs text-white/65">aportes disponibles</p></div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 pt-5 sm:px-6">
        <div className="mb-5 flex items-start gap-3 rounded-[22px] bg-white p-4 ring-1 ring-black/[0.05]">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
          <p className="text-xs leading-5 text-slate-600">Los motivos, teléfonos y nombres solo están disponibles para pastores y administradores autorizados. El Centro de Análisis muestra únicamente cantidades agregadas.</p>
        </div>
        <SolidarityAdminBoard requests={requests} contributions={contributions} />
      </div>
    </main>
  )
}
