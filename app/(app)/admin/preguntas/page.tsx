import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageCircleQuestion, User, Shield, CheckCircle, Archive } from 'lucide-react'
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

  // Obtener todas las preguntas pendientes
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
    <main className="min-h-screen bg-[#f4f5f9] px-4 py-8 max-w-lg mx-auto pb-28">
      <div className="mb-6">
        <Link 
          href="/admin"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver a Administración
        </Link>
      </div>

      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#171923]">Buzón de Congregación</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestiona las preguntas, dudas y motivos de oración de los miembros.
        </p>
      </header>

      {preguntasList.length === 0 ? (
        <div className="text-center py-16 px-4 border border-slate-100 rounded-[18px] bg-white">
          <MessageCircleQuestion className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Bandeja limpia</p>
          <p className="text-sm text-gray-400 mt-1">No hay mensajes pendientes de responder.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {preguntasList.map(p => (
            <div key={p.id} className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${p.es_anonima ? 'bg-slate-100' : 'bg-indigo-50'}`}>
                    {p.es_anonima ? <Shield className="w-5 h-5 text-slate-400" /> : <User className="w-5 h-5 text-indigo-400" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#171923]">
                      {p.es_anonima ? 'Usuario Anónimo' : (p.profiles?.nombre_completo || 'Usuario Desconocido')}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      {!p.es_anonima && p.profiles?.telefono && <span>{p.profiles.telefono}</span>}
                      {!p.es_anonima && p.profiles?.telefono && <span>•</span>}
                      {new Date(p.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-[#171923] text-sm leading-relaxed mb-4">
                  "{p.texto}"
                </div>

                <div className="flex items-center justify-between gap-3">
                  <ArchivarPreguntaBoton preguntaId={p.id} />
                </div>
              </div>
              
              <div className="bg-slate-50/50 p-5">
                <ResponderPreguntaForm preguntaId={p.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
