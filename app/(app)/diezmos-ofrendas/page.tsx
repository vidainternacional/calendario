import type { Metadata } from 'next'
import { HandCoins, Heart, ShieldCheck } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BackButton from '@/components/navigation/BackButton'
import BankAccountCards from '@/components/solidaridad/BankAccountCards'

export const metadata: Metadata = { title: 'Diezmos y ofrendas' }
export const dynamic = 'force-dynamic'

export default async function DiezmosOfrendasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: accounts } = await (supabase as any)
    .from('cuentas_bancarias_iglesia')
    .select('id, proposito, titulo, banco, titular, numero_cuenta, tipo_cuenta, instrucciones, activo')
    .eq('proposito', 'diezmos_ofrendas')
    .eq('activo', true)
    .order('created_at', { ascending: true })

  return (
    <main className="min-h-screen bg-[#f5f5f7] pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
      <section className="bg-[linear-gradient(145deg,#17132e,#302072_52%,#5b3df5)] px-4 pb-7 pt-4 text-white sm:px-6">
        <div className="mx-auto max-w-2xl">
          <BackButton />
          <div className="mt-6 flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/14 ring-1 ring-white/20"><HandCoins className="h-7 w-7" /></span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Vida Internacional</p>
              <h1 className="mt-1 text-[30px] font-extrabold leading-none tracking-[-0.04em]">Diezmos y ofrendas</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">Consulta aquí los datos oficiales de la iglesia para realizar tu transferencia.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-2xl space-y-5 px-4 pt-5 sm:px-6">
        <div className="flex items-start gap-3 rounded-[22px] bg-white p-4 ring-1 ring-black/[0.05]">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
          <p className="text-xs leading-5 text-slate-600">Esta herramienta es independiente de Ayuda Solidaria. VIDA no procesa cobros dentro de la app; únicamente muestra los datos oficiales configurados por Administración.</p>
        </div>

        <section className="overflow-hidden rounded-[24px] bg-white ring-1 ring-black/[0.05]">
          <header className="border-b border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-violet-50 text-violet-600"><Heart className="h-5 w-5" /></span>
              <div><h2 className="font-extrabold text-[#171923]">Datos para transferir</h2><p className="mt-1 text-xs leading-5 text-slate-500">Usa únicamente las cuentas que aparecen dentro de VIDA.</p></div>
            </div>
          </header>
          <div className="p-5"><BankAccountCards accounts={accounts || []} emptyText="Administración aún no ha publicado una cuenta para diezmos y ofrendas." /></div>
        </section>
      </div>
    </main>
  )
}
