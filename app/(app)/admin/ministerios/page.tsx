import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BackButton from '@/components/navigation/BackButton'
import MinisteriosAdminClient from '@/components/admin/MinisteriosAdminClient'

export default async function AdminMinisteriosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  if (!['pastor', 'administrador'].includes((profile as any)?.rol)) redirect('/inicio')

  const { data: ministerios } = await supabase.from('ministerios').select('*').order('orden', { ascending: true })

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+4.75rem)] sm:px-6 sm:pt-12">
      <div className="mb-7"><BackButton /></div>
      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-500">Administración</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.035em] text-[#171923]">Ministerios</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Crea, edita, activa, desactiva o elimina ministerios desde su propia ficha.</p>
      </header>
      <MinisteriosAdminClient ministerios={(ministerios || []) as any[]} />
    </main>
  )
}