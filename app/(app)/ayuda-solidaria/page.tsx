import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BackButton from '@/components/navigation/BackButton'
import SolidarityHub from '@/components/solidaridad/SolidarityHub'

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

  const params = await searchParams
  const initialTab: Tab = params.tab === 'aportar' || params.tab === 'seguimiento' ? params.tab : 'solicitar'

  const [{ data: requests }, { data: contributions }, { data: pantryNeeds }, { data: bankAccounts }] = await Promise.all([
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
      .from('cuentas_bancarias_iglesia')
      .select('id, proposito, titulo, banco, titular, numero_cuenta, tipo_cuenta, instrucciones, activo')
      .eq('proposito', 'ayuda_solidaria')
      .eq('activo', true)
      .order('created_at', { ascending: true }),
  ])

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="bg-[#302072] px-4 pb-1 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-6">
        <div className="mx-auto max-w-2xl"><BackButton /></div>
      </div>
      <SolidarityHub
        userId={user.id}
        requests={requests || []}
        contributions={contributions || []}
        pantryNeeds={pantryNeeds || []}
        bankAccounts={bankAccounts || []}
        initialTab={initialTab}
      />
    </div>
  )
}
