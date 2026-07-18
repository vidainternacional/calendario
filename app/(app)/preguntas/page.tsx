import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PreguntaForm from './PreguntaForm'
import { MessageCircleQuestion, MailCheck } from 'lucide-react'

export default async function PreguntasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Obtener historial del usuario (siempre y cuando no la haya marcado como anónima, 
  // aunque por la RLS solo ve las suyas. Es decir, las anónimas sí las ve el que las creó si usamos su auth.uid en RLS)
  // Sin embargo, RLS solo permite ver si profile_id = auth.uid(), lo cual incluye las anónimas si insertamos su profile_id y en la DB pusimos es_anonima=true.
  // En nuestro esquema pusimos profile_id = user.id, así que el usuario sí ve sus propias preguntas anónimas, pero el Admin no verá quién fue porque se filtra.
  // Wait, if Admin looks at it, profile_id is visible to admin!
  // To be truly anonymous for admins, we shouldn't show the profile to admins. In the Admin view we will mask the name if es_anonima=true.
  
  const { data: preguntas } = await supabase
    .from('preguntas_congregacion')
    .select('id, texto, respuesta, estado, created_at, es_anonima')
    .order('created_at', { ascending: false })

  const preguntasList = (preguntas as any[]) || []

  return (
    <main className="min-h-screen bg-[#f4f5f9] px-4 py-8 max-w-lg mx-auto pb-28">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#171923]">Buzón de Preguntas</h1>
        <p className="text-sm text-gray-500 mt-1">
          Escribe tus dudas, sugerencias o motivos de oración. Los pastores te responderán en privado.
        </p>
      </header>

      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <MessageCircleQuestion className="w-24 h-24" />
        </div>
        <PreguntaForm />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#171923]">Tus Preguntas</h2>
        {preguntasList.length === 0 ? (
          <div className="text-center py-10 px-4 border border-slate-100 rounded-[18px] bg-white">
            <p className="text-gray-500 text-sm">No has enviado ninguna pregunta todavía.</p>
          </div>
        ) : (
          preguntasList.map((p) => (
            <div key={p.id} className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  p.estado === 'respondida' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                  p.estado === 'archivada' ? 'bg-gray-100 text-gray-600 border border-gray-200' :
                  'bg-amber-50 text-amber-600 border border-amber-100'
                }`}>
                  {p.estado}
                </span>
                <span className="text-[11px] text-gray-400">
                  {new Date(p.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </span>
              </div>
              <p className="text-[#171923] text-sm font-medium mb-1">
                "{p.texto}"
              </p>
              {p.es_anonima && (
                <p className="text-[10px] text-indigo-400 font-medium mb-3">
                  Enviada como anónima
                </p>
              )}
              {p.respuesta && (
                <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-3">
                  <MailCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide mb-1">Respuesta</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{p.respuesta}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  )
}
