import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PreguntaForm from './PreguntaForm'
import { MessageCircleQuestion, MailCheck } from 'lucide-react'

export default async function PreguntasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: preguntas } = await supabase
    .from('preguntas_congregacion')
    .select('id, texto, respuesta, estado, created_at, es_anonima')
    .order('created_at', { ascending: false })

  const preguntasList = (preguntas as any[]) || []

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-28 pt-5 sm:pt-8">
      <header className="mb-6 sm:mb-8">
        <h1 className="break-words text-2xl font-bold text-[#171923]">Buzón de preguntas</h1>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-gray-500">
          Escribe tus dudas, sugerencias o motivos de oración. Los pastores te responderán en privado.
        </p>
      </header>

      <div className="relative mb-7 overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:mb-8 sm:p-6">
        <div className="pointer-events-none absolute right-0 top-0 p-3 opacity-[0.07] sm:p-4">
          <MessageCircleQuestion className="h-20 w-20 sm:h-24 sm:w-24" />
        </div>
        <PreguntaForm />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#171923]">Tus preguntas</h2>
        {preguntasList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
            <p className="text-sm text-gray-500">No has enviado ninguna pregunta todavía.</p>
          </div>
        ) : (
          preguntasList.map((p) => (
            <article key={p.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  p.estado === 'respondida' ? 'border-emerald-100 bg-emerald-50 text-emerald-600' :
                  p.estado === 'archivada' ? 'border-gray-200 bg-gray-100 text-gray-600' :
                  'border-amber-100 bg-amber-50 text-amber-600'
                }`}>
                  {p.estado}
                </span>
                <span className="shrink-0 text-[11px] text-gray-400">
                  {new Date(p.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </span>
              </div>

              <p className="break-words whitespace-pre-wrap text-sm font-medium leading-relaxed text-[#171923]">
                “{p.texto}”
              </p>

              {p.es_anonima && (
                <p className="mt-2 text-[10px] font-medium text-indigo-500">
                  Enviada como anónima
                </p>
              )}

              {p.respuesta && (
                <div className="mt-4 flex min-w-0 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:p-4">
                  <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
                  <div className="min-w-0">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-indigo-600">Respuesta</p>
                    <p className="break-words whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{p.respuesta}</p>
                  </div>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </main>
  )
}
