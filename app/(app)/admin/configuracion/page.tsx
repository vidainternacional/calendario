import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BackButton from '@/components/navigation/BackButton'
import ConfiguracionAdminClient from '@/components/admin/ConfiguracionAdminClient'

export default async function AdminConfiguracionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
  if (!['pastor','administrador'].includes((profile as any)?.rol)) redirect('/inicio')

  const [{ data: iconSetting }, { data: promptSetting }] = await Promise.all([
    (supabase as any).from('app_settings').select('valor').eq('clave', 'active_icon_variant').maybeSingle(),
    (supabase as any).from('app_settings').select('valor').eq('clave', 'estudio_system_prompt').maybeSingle(),
  ])
  const activeIconVariant = typeof iconSetting?.valor === 'string' ? iconSetting.valor.replace(/"/g, '') : 'dorado'
  const estudioPrompt = typeof promptSetting?.valor === 'string' ? promptSetting.valor.replace(/^"|"$/g, '').replace(/\\n/g, '\n') : ''

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+1.5rem)] sm:px-6 sm:pt-8">
      <div className="mb-5"><BackButton fallbackHref="/admin" /></div>
      <header className="mb-6"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Administración</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.035em] text-[#171923]">Configuración</h1><p className="mt-2 text-sm leading-6 text-slate-500">Ajustes técnicos y de identidad que no necesitas usar todos los días.</p></header>
      <ConfiguracionAdminClient activeIconVariant={activeIconVariant} initialEstudioPrompt={estudioPrompt} />
    </main>
  )
}
