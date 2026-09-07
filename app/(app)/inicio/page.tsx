import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InicioOnlineRefresh from '@/components/inicio/InicioOnlineRefresh'
import InicioDynamicHeader from '@/components/inicio/InicioDynamicHeader'

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
    <div className="relative min-h-screen bg-transparent">
      <InicioDynamicHeader userId={user.id} email={user.email} />
      <div className="relative z-10 [&>main]:!bg-transparent [&>main>header]:hidden">
        <InicioOnlineRefresh userId={user.id} email={user.email} />
      </div>
    </div>
  )
}
