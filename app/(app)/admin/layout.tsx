import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Administración',
  description: 'Panel de control para pastores y administradores',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  const prof = profile as any
  if (prof?.rol !== 'pastor' && prof?.rol !== 'administrador') {
    redirect('/inicio')
  }

  return (
    <div className="min-h-screen bg-[#f4f5f9]">
      {children}
    </div>
  )
}
