import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, PackageOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import PaquetesClient from '@/components/pastoral/PaquetesClient'
import { tieneAccesoPastoral } from '@/lib/pastoral/access'

export const metadata: Metadata = { title: 'Paquetes Pastorales' }

export default async function PaquetesPastoralesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('rol, estado_cuenta, acceso_centro_pastoral')
    .eq('id', user.id)
    .single()

  if (profileError) throw new Error('No fue posible verificar el acceso a los paquetes pastorales.')
  if (!tieneAccesoPastoral(profile as any)) redirect('/inicio')

  const [paquetesResult, bosquejosResult, coleccionesResult, recursosResult] = await Promise.all([
    (supabase as any).from('pastoral_paquetes').select('id, titulo, descripcion_publica, estado, updated_at').eq('profile_id', user.id).order('updated_at', { ascending: false }),
    (supabase as any).from('pastoral_bosquejos').select('id, titulo').eq('profile_id', user.id).order('updated_at', { ascending: false }),
    (supabase as any).from('pastoral_colecciones').select('id, nombre').eq('profile_id', user.id).order('updated_at', { ascending: false }),
    (supabase as any).from('pastoral_biblioteca').select('id, titulo, categoria, tipo').eq('profile_id', user.id).order('updated_at', { ascending: false }),
  ])

  if (paquetesResult.error || bosquejosResult.error || coleccionesResult.error || recursosResult.error) {
    throw new Error('No fue posible cargar el espacio integrado de paquetes pastorales.')
  }

  const paquetes = paquetesResult.data
  const bosquejos = bosquejosResult.data
  const colecciones = coleccionesResult.data
  const recursos = recursosResult.data

  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-[#f4f5f9] px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8 lg:px-8">
      <header className="mb-6">
        <Link href="/pastoral" className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200"><ArrowLeft className="h-4 w-4" /> Centro Pastoral</Link>
        <div className="flex items-center gap-2 text-indigo-600"><PackageOpen className="h-4 w-4" /><p className="text-xs font-bold uppercase tracking-[0.16em]">Flujo integrado</p></div>
        <h1 className="mt-2 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">Paquetes pastorales</h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-500">Reúne bosquejo, versículos, recursos y aplicación en una sola guía lista para preparar, imprimir y compartir con la iglesia.</p>
      </header>

      <PaquetesClient
        paquetes={(paquetes ?? []) as any}
        bosquejos={(bosquejos ?? []).map((item: any) => ({ id: item.id, titulo: item.titulo }))}
        colecciones={(colecciones ?? []).map((item: any) => ({ id: item.id, titulo: item.nombre }))}
        recursos={(recursos ?? []) as any}
      />
    </main>
  )
}
