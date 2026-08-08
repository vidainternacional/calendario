import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InicioClient from '@/components/inicio/InicioClient'

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
      <InicioClient userId={user.id} email={user.email} />
    </div>
  )
}
