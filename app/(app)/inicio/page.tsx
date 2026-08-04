import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InicioClient from '@/components/inicio/InicioClient'
import SolidarityProfileShortcut from '@/components/solidaridad/SolidarityProfileShortcut'

export const metadata: Metadata = {
  title: 'Inicio',
}

export default async function InicioPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-[#f4f5f9]">
      <div className="mx-auto max-w-3xl px-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-6">
        <SolidarityProfileShortcut />
      </div>
      <InicioClient userId={user.id} email={user.email} />
    </div>
  )
}
