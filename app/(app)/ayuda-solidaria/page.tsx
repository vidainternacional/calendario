import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SolidarityHub from '@/components/solidaridad/SolidarityHub'

export const metadata: Metadata = {
  title: 'Ayuda Solidaria',
}

export const dynamic = 'force-dynamic'

export default async function AyudaSolidariaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: requests }, { data: contributions }] = await Promise.all([
    (supabase as any)
      .from('solicitudes_ayuda_solidaria')
      .select('id, hogar_personas, urgencia, necesidad, telefono, contacto_preferido, estado, respuesta, created_at')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('aportes_ayuda_solidaria')
      .select('id, tipo, monto, moneda, detalle, telefono, anonimo, estado, respuesta, created_at')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  return <SolidarityHub requests={requests || []} contributions={contributions || []} />
}
