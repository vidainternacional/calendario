import type { Metadata } from 'next'
import { HeartHandshake } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import BackButton from '@/components/navigation/BackButton'
import SolidarityHub from '@/components/solidaridad/SolidarityHub'
import SolidarityAdminBoard from '@/components/solidaridad/SolidarityAdminBoard'

export const metadata: Metadata = { title: 'Ayuda Solidaria' }
export const dynamic = 'force-dynamic'

type Tab = 'solicitar' | 'aportar' | 'seguimiento'

export default async function AyudaSolidariaPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('rol, activo, estado_cuenta, es_pastor_general')
    .eq('id', user.id)
    .single()

  const puedeAtender = profile?.activo === true
    && profile?.estado_cuenta === 'activo'
    && (profile?.rol === 'pastor' || profile?.rol === 'administrador' || profile?.es_pastor_general === true)

  if (puedeAtender) {
    const service = createServiceClient()
    const [
      { data: requestRows },
      { data: contributionRows },
      { data: pantryRows },
      { data: serviceRows },
      { data: packageRows },
      { data: packageItemRows },
    ] = await Promise.all([
      (service as any)
        .from('solicitudes_ayuda_solidaria')
        .select('id, profile_id, tipo_ayuda, hogar_personas, necesidad, detalle_adicional, telefono, contacto_preferido, estado, respuesta, created_at, solicitante:profiles!solicitudes_ayuda_solidaria_profile_id_fkey(nombre_completo, email, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(200),
      (service as any)
        .from('aportes_ayuda_solidaria')
        .select('id, profile_id, tipo, monto, moneda, detalle, telefono, anonimo, estado, respuesta, agradecido_at, created_at, aportante:profiles!aportes_ayuda_solidaria_profile_id_fkey(nombre_completo, email, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(200),
      (service as any)
        .from('despensa_necesidades')
        .select('id, producto, unidad, existencia_actual, minimo_necesario, estado, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(200),
      (service as any)
        .from('ayuda_necesidades_servicio')
        .select('id, categoria, titulo, detalle, estado, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(200),
      (service as any)
        .from('despensa_paquetes')
        .select('id, nombre, activo, es_predeterminado, created_at, updated_at')
        .order('created_at', { ascending: true }),
      (service as any)
        .from('despensa_paquete_items')
        .select('id, paquete_id, necesidad_id, cantidad, despensa_necesidades(id, producto, unidad)')
        .order('created_at', { ascending: true }),
    ])

    const requests = (requestRows || []).map((item: any) => ({ ...item, profiles: item.solicitante || null }))
    const contributions = (contributionRows || []).map((item: any) => ({ ...item, profiles: item.aportante || null }))

    return (
      <main className="min-h-screen bg-[#f4f5f9] pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] text-slate-900">
        <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <BackButton />
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600"><HeartHandshake className="h-5 w-5" /></span>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold tracking-[-0.02em] text-[#171923]">Centro de Ayuda</h1>
              <p className="text-[11px] text-slate-600">Conversaciones, siembras y despensa en un solo lugar.</p>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-3xl pt-2 sm:px-6 sm:pt-4">
          <SolidarityAdminBoard
            currentUserId={user.id}
            requests={requests}
            contributions={contributions}
            pantryNeeds={pantryRows || []}
            serviceNeeds={serviceRows || []}
            packages={packageRows || []}
            packageItems={packageItemRows || []}
          />
        </div>
      </main>
    )
  }

  const params = await searchParams
  const initialTab: Tab = params.tab === 'aportar' || params.tab === 'seguimiento' ? params.tab : 'solicitar'

  const [
    { data: requests },
    { data: contributions },
    { data: pantryNeeds },
    { data: serviceNeeds },
    { data: bankAccounts },
  ] = await Promise.all([
    (supabase as any)
      .from('solicitudes_ayuda_solidaria')
      .select('id, tipo_ayuda, hogar_personas, necesidad, detalle_adicional, telefono, contacto_preferido, estado, respuesta, created_at')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('aportes_ayuda_solidaria')
      .select('id, tipo, monto, moneda, detalle, telefono, anonimo, estado, respuesta, agradecido_at, created_at')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('despensa_necesidades')
      .select('id, producto, unidad, existencia_actual, minimo_necesario, estado')
      .eq('estado', 'activa')
      .limit(50),
    (supabase as any)
      .from('ayuda_necesidades_servicio')
      .select('id, categoria, titulo, detalle, estado')
      .eq('estado', 'activa')
      .order('updated_at', { ascending: false })
      .limit(50),
    (supabase as any)
      .from('cuentas_bancarias_iglesia')
      .select('id, proposito, titulo, banco, titular, numero_cuenta, tipo_cuenta, instrucciones, activo')
      .eq('proposito', 'ayuda_solidaria')
      .eq('activo', true)
      .order('created_at', { ascending: true }),
  ])

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-slate-900">
      <div className="bg-[#302072] px-4 pb-1 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-6">
        <div className="mx-auto max-w-2xl"><BackButton /></div>
      </div>
      <SolidarityHub
        userId={user.id}
        requests={requests || []}
        contributions={contributions || []}
        pantryNeeds={pantryNeeds || []}
        serviceNeeds={serviceNeeds || []}
        bankAccounts={bankAccounts || []}
        initialTab={initialTab}
      />
    </div>
  )
}
