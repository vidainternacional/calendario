import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ContactosClient from '@/components/contactos/ContactosClient'
import BackButton from '@/components/navigation/BackButton'

export const metadata: Metadata = { title: 'Mis Contactos' }
export const dynamic = 'force-dynamic'

export default async function ContactosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: perfil } = await db
    .from('profiles')
    .select('id, nombre_completo, avatar_url, qr_token')
    .eq('id', user.id)
    .single()

  const { data: relaciones } = await db
    .from('contactos')
    .select(`
      id, estado, solicitante_id, destinatario_id, created_at,
      solicitante:profiles!contactos_solicitante_id_fkey ( id, nombre_completo, avatar_url, email ),
      destinatario:profiles!contactos_destinatario_id_fkey ( id, nombre_completo, avatar_url, email )
    `)
    .or(`solicitante_id.eq.${user.id},destinatario_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#f4f5f9]">
      <div className="mx-auto max-w-2xl px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
        <BackButton />
      </div>
      <ContactosClient
        miId={user.id}
        miNombre={perfil?.nombre_completo ?? ''}
        miAvatarUrl={perfil?.avatar_url ?? null}
        qrToken={perfil?.qr_token ?? ''}
        relaciones={relaciones ?? []}
      />
    </div>
  )
}
