import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageCircleQuestion, User, Shield } from 'lucide-react'
import ResponderPreguntaForm from './ResponderPreguntaForm'
import ArchivarPreguntaBoton from './ArchivarPreguntaBoton'

export default async function AdminPreguntasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('rol, es_pastor_general').eq('id', user.id).single()
  const p = profile as any
  const isAdminOrPastor = p?.rol === 'administrador' || p?.rol === 'pastor' || p?.es_pastor_general

  if (!isAdminOrPastor) {
    redirect('/inicio')
  }

  const { data: preguntas } = await supabase
    .from('preguntas_congregacion')
    .select(`
      id,
      texto,
      es_anonima,
      estado,
      created_at,
      profiles:profile_id (
        nombre_completo,
        telefono
      )
    `)
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: true })

  const preguntasList = (preguntas as any[]) || []

  return (
    <main className="min-h-screen bg-[#f4f5f9] px-4 pt-4 pb-32 sm:pt-6">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-5">
          <Link
            href="/admin"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Atrás
          </Link>
        </div>

        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold leading-tight text-[#171923] sm:text-3xl">Buzón de Congregación</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
            Gestiona las preguntas, dudas y motivos de oración de los miembros.
          </p>
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
                  <div className="mb-4 flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${p.es_anonima ? 'bg-slate-100' : 'bg-indigo-50'}`}>
                      {p.es_anonima ? <Shield className="h-5 w-5 text-slate-400" /> : <User className="h-5 w-5 text-indigo-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-base font-bold leading-tight text-[#171923]">
                        {p.es_anonima ? 'Usuario anónimo' : (p.profiles?.nombre_completo || 'Usuario desconocido')}
                      </h3>
                      <div className="mt-1 flex flex-col gap-0.5 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                        {!p.es_anonima && p.profiles?.telefono && <span className="break-all">{p.profiles.telefono}</span>}
                        {!p.es_anonima && p.profiles?.telefono && <span className="hidden sm:inline">•</span>}
                        <span>{new Date(p.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 break-words rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-[#171923]">
                    “{p.texto}”
                  </div>

                  <ArchivarPreguntaBoton preguntaId={p.id} />
                </div>

                <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5">
                  <ResponderPreguntaForm preguntaId={p.id} />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
