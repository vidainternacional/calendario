import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User } from 'lucide-react'
import BotonesAprobacionAviso from './BotonesAprobacionAviso'
import BackButton from '@/components/navigation/BackButton'

export default async function AvisosPendientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('rol, es_pastor_general').eq('id', user.id).single()
  const p = profile as any
  const puedeRevisar = p?.rol === 'administrador' || p?.es_pastor_general === true
  if (!puedeRevisar) redirect('/avisos')

  const { data: avisos } = await (supabase as any)
    .from('publicaciones')
    .select(`id,titulo,cuerpo,created_at,tipo,autor_id,profiles:autor_id (nombre_completo)`)
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: false })

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+4.75rem)] sm:px-6 sm:pt-12">
      <div className="mb-7"><BackButton /></div>
      <header className="mb-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-500">Gestión de avisos</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.035em] text-[#171923]">Avisos pendientes</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Revisa publicaciones que todavía requieren aprobación.</p>
      </header>

      {!avisos || avisos.length === 0 ? (
        <div className="rounded-[20px] border border-slate-100 bg-white px-4 py-12 text-center shadow-sm">
          <p className="font-semibold text-slate-600">No hay avisos pendientes</p>
          <p className="mt-1 text-xs text-slate-400">Las nuevas publicaciones pendientes aparecerán aquí.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {avisos.map((aviso: any) => (
            <article key={aviso.id} className="rounded-[20px] border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100"><User className="h-5 w-5 text-slate-400" /></div>
                <div className="min-w-0"><h2 className="truncate text-sm font-bold text-[#171923]">{(aviso.profiles as any)?.nombre_completo || 'Usuario desconocido'}</h2><p className="text-xs text-slate-500">{new Date(aviso.created_at).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p></div>
              </div>
              <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50 p-4"><h3 className="mb-1 font-bold text-[#171923]">{aviso.titulo}</h3><p className="whitespace-pre-wrap text-sm text-slate-600">{aviso.cuerpo}</p></div>
              <BotonesAprobacionAviso avisoId={aviso.id} />
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
