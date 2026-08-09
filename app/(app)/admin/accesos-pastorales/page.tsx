import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { BookOpenCheck, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import AccesosPastoralesClient from './AccesosPastoralesClient'
import BackButton from '@/components/navigation/BackButton'

export const metadata: Metadata = { title: 'Accesos pastorales' }

export default async function AccesosPastoralesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await (supabase as any).from('profiles').select('rol, estado_cuenta').eq('id', user.id).single()
  if (perfil?.rol !== 'administrador' || perfil?.estado_cuenta !== 'activo') redirect('/inicio')

  const { data: usuarios, error } = await (supabase as any).from('profiles').select('id, nombre_completo, email, rol, estado_cuenta, acceso_centro_pastoral').order('nombre_completo', { ascending: true })
  if (error) console.error('[AccesosPastoralesPage]', error)

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-[calc(4.75rem+env(safe-area-inset-top))] sm:px-6 sm:pt-12">
      <div className="mb-7"><BackButton /></div>
      <header className="mb-6">
        <div className="flex items-center gap-2 text-indigo-600"><ShieldCheck className="h-4 w-4" /><p className="text-xs font-bold uppercase tracking-[0.16em]">Permisos especiales</p></div>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Acceso al Centro Pastoral</h1>
        <p className="mt-1.5 text-sm leading-6 text-slate-500">Autoriza a líderes u otras personas para preparar sus propios estudios sin cambiar su rol dentro de la aplicación.</p>
      </header>
      <section className="mb-5 flex items-start gap-3 rounded-[20px] border border-indigo-100 bg-indigo-50 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-sm"><BookOpenCheck className="h-5 w-5" /></span>
        <div><h2 className="text-sm font-bold text-indigo-950">Contenido privado por persona</h2><p className="mt-1 text-xs leading-5 text-indigo-800/80">Cada usuario autorizado verá únicamente sus propios bosquejos, colecciones, archivos y paquetes. Los pastores y administradores mantienen acceso automático por su rol.</p></div>
      </section>
      <AccesosPastoralesClient usuarios={(usuarios ?? []) as any} />
    </main>
  )
}
