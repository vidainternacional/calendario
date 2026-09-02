import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BackButton from '@/components/navigation/BackButton'
import SolidarityHub from '@/components/solidaridad/SolidarityHub'

export const metadata: Metadata = {
  title: 'Ayuda Solidaria',
}

export const dynamic = 'force-dynamic'

export default async function AyudaSolidariaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: requests }, { data: contributions }, { data: pantryNeeds }] = await Promise.all([
    (supabase as any)
      .from('solicitudes_ayuda_solidaria')
      .select('id, hogar_personas, necesidad, detalle_adicional, telefono, contacto_preferido, estado, respuesta, created_at')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('aportes_ayuda_solidaria')
      .select('id, tipo, monto, moneda, detalle, telefono, anonimo, estado, respuesta, created_at')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('despensa_necesidades')
      .select('id, producto, unidad, existencia_actual, minimo_necesario, estado')
      .eq('estado', 'activa')
      .limit(50),
  ])

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="bg-[#302072] px-4 pb-1 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-6">
        <div className="mx-auto max-w-2xl">
          <BackButton />
        </div>
      </div>
      <SolidarityHub requests={requests || []} contributions={contributions || []} pantryNeeds={pantryNeeds || []} />
    </div>
  )
}
