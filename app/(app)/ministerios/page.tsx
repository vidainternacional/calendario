import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mis Ministerios',
}

export default async function MinisteriosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener los ministerios a los que pertenece el usuario
  const { data: membresias } = await supabase
    .from('ministerio_miembros')
    .select(`
      es_lider,
      ministerios (
        id,
        nombre,
        emoji,
        color_primario,
        color_secundario,
        descripcion
      )
    `)
    .eq('profile_id', user.id)

  const misMinisterios = membresias?.map((m: any) => ({
    ...m.ministerios,
    es_lider: m.es_lider
  })) || []

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 max-w-lg mx-auto">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">Mis Ministerios</h1>
        <p className="text-sm text-slate-400 mt-1">
          Ministerios en los que sirves
        </p>
      </header>

      {misMinisterios.length === 0 ? (
        <div className="text-center py-12 px-4 border border-slate-800 rounded-2xl bg-slate-900/50">
          <p className="text-slate-400">Aún no perteneces a ningún ministerio.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {misMinisterios.map((min: any) => (
            <Link
              key={min.id}
              href={`/ministerios/${min.id}/avisos`}
              className="group relative overflow-hidden rounded-2xl border border-slate-800 hover:border-slate-700 transition-all p-5 bg-slate-900/80 backdrop-blur-sm"
              style={{
                boxShadow: `0 4px 20px -10px ${min.color_primario}40`
              }}
            >
              {/* Degradado sutil de fondo */}
              <div 
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 transition-opacity group-hover:opacity-30"
                style={{ background: `linear-gradient(to bottom right, ${min.color_primario}, ${min.color_secundario})` }}
              />

              <div className="relative z-10 flex items-start gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-white/10"
                  style={{ background: `linear-gradient(135deg, ${min.color_primario}20, ${min.color_secundario}20)` }}
                >
                  {min.emoji}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white group-hover:text-transparent group-hover:bg-clip-text transition-colors"
                        style={{ backgroundImage: `linear-gradient(to right, ${min.color_primario}, ${min.color_secundario})` }}>
                      {min.nombre}
                    </h2>
                    {min.es_lider && (
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        Líder
                      </span>
                    )}
                  </div>
                  {min.descripcion && (
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                      {min.descripcion}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
