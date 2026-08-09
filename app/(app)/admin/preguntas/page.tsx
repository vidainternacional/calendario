import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessageCircleQuestion, User, Shield } from 'lucide-react'
import ResponderPreguntaForm from './ResponderPreguntaForm'
import ArchivarPreguntaBoton from './ArchivarPreguntaBoton'
import BackButton from '@/components/navigation/BackButton'

export default async function AdminPreguntasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('rol, es_pastor_general').eq('id', user.id).single()
  const p = profile as any
  const isAdminOrPastor = p?.rol === 'administrador' || p?.rol === 'pastor' || p?.es_pastor_general
  if (!isAdminOrPastor) redirect('/inicio')

  const { data: preguntas } = await supabase.from('preguntas_congregacion').select(`id,texto,es_anonima,estado,created_at,profiles:profile_id (nombre_completo,telefono)`).eq('estado', 'pendiente').order('created_at', { ascending: true })
  const preguntasList = (preguntas as any[]) || []

  return (
    <main className="min-h-screen bg-[#f4f5f9] px-4 pb-32 pt-[calc(4.75rem+env(safe-area-inset-top))] sm:pt-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-7"><BackButton /></div>
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold leading-tight text-[#171923] sm:text-3xl">Buzón de Congregación</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">Gestiona las preguntas, dudas y motivos de oración de los miembros.</p>
        </header>

        {preguntasList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center">
            <MessageCircleQuestion className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-semibold text-slate-600">Bandeja limpia</p>
            <p className="mt-1 text-sm text-slate-400">No hay mensajes pendientes de responder.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {preguntasList.map((p) => (
              <article key={p.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100"><User className="h-5 w-5 text-slate-400" /></div>
                    <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{p.es_anonima ? 'Pregunta anónima' : p.profiles?.nombre_completo || 'Miembro'}</p>{!p.es_anonima && p.profiles?.telefono && <p className="text-xs text-slate-400">{p.profiles.telefono}</p>}</div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{p.texto}</p>
                  <div className="mt-5 border-t border-slate-100 pt-4"><ResponderPreguntaForm preguntaId={p.id} /></div>
                  <div className="mt-3 flex items-center justify-between gap-3"><span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400"><Shield className="h-3.5 w-3.5" />Gestión privada</span><ArchivarPreguntaBoton preguntaId={p.id} /></div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
