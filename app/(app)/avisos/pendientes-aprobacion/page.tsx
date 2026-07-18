import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, CheckCircle, XCircle } from 'lucide-react'
import BotonesAprobacionAviso from './BotonesAprobacionAviso'

export default async function AvisosPendientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar permisos (solo pastor o administrador puede ver esto)
  const { data: profile } = await supabase.from('profiles').select('rol, es_pastor_general').eq('id', user.id).single()
  const p = profile as any
  const isAdminOrPastor = p?.rol === 'administrador' || p?.rol === 'pastor' || p?.es_pastor_general

  if (!isAdminOrPastor) {
    redirect('/avisos')
  }

  // Obtener avisos pendientes (globales o de cualquier ministerio que requiera, aunque la regla es globales)
  const { data: avisos } = await (supabase as any)
    .from('publicaciones')
    .select(`
      id,
      titulo,
      cuerpo,
      created_at,
      tipo,
      autor_id,
      profiles:autor_id (
        nombre_completo
      )
    `)
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-[#f4f5f9] px-4 py-8 max-w-lg mx-auto pb-28">
      <div className="mb-6">
        <Link 
          href="/avisos"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver a Avisos
        </Link>
      </div>

      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#171923]">Avisos Pendientes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Avisos globales pendientes de aprobación
        </p>
      </header>

      {!avisos || avisos.length === 0 ? (
        <div className="text-center py-12 px-4 border border-slate-100 rounded-[18px] bg-white">
          <p className="text-gray-500">No hay avisos pendientes de aprobación.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {avisos.map((aviso: any) => (
            <div key={aviso.id} className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-bold text-[#171923] text-sm">{(aviso.profiles as any)?.nombre_completo || 'Usuario Desconocido'}</h3>
                  <p className="text-xs text-slate-500">
                    {new Date(aviso.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="mb-5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-[#171923] mb-1">{aviso.titulo}</h4>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{aviso.cuerpo}</p>
              </div>

              <BotonesAprobacionAviso avisoId={aviso.id} />
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
