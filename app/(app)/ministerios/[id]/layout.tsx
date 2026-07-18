import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Bell, Calendar, FileText } from 'lucide-react'

export default async function MinisterioLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Obtener usuario
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Obtener datos del ministerio y verificar membresía (RLS debería filtrar, pero aseguramos)
  const [minReq, rolReq] = await Promise.all([
    supabase.from('ministerios').select('*').eq('id', id).single(),
    supabase.from('ministerio_miembros').select('es_lider').eq('ministerio_id', id).eq('profile_id', user.id).maybeSingle()
  ])

  const ministerio = minReq.data as any

  if (!ministerio) {
    notFound()
  }

  // Si no es miembro y no tiene membresía, no debería entrar a menos que sea admin
  const { data: profile } = await supabase.from('profiles').select('rol, es_pastor_general').eq('id', user.id).single()
  const p = profile as any
  const isAdminOrPastor = p?.rol === 'pastor' || p?.rol === 'administrador' || p?.es_pastor_general
  const esLider = (rolReq.data as any)?.es_lider

  if (!rolReq.data && !isAdminOrPastor) {
    redirect('/ministerios')
  }

  const navItems = [
    { href: `/ministerios/${id}/avisos`, label: 'Avisos', icon: Bell },
    { href: `/ministerios/${id}/eventos`, label: 'Eventos', icon: Calendar },
    { href: `/ministerios/${id}/solicitudes`, label: 'Solicitudes', icon: FileText },
  ]

  if (esLider || isAdminOrPastor) {
    navItems.push({ href: `/ministerios/${id}/miembros`, label: 'Miembros', icon: FileText as any })
    navItems.push({ href: `/ministerios/${id}/solicitudes-ingreso`, label: 'Ingresos', icon: FileText as any })
  }

  return (
    <div className="min-h-screen bg-[#f4f5f9] flex flex-col">
      {/* Header dinámico con colores del ministerio */}
      <header 
        className="relative pt-12 pb-6 px-4"
        style={{
          background: `linear-gradient(to bottom, ${ministerio.color_primario}40, transparent)`,
          borderBottom: `1px solid ${ministerio.color_secundario}20`
        }}
      >
        <div className="max-w-lg mx-auto relative z-10">
          <Link 
            href="/ministerios" 
            className="inline-flex items-center gap-2 text-sm text-white hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="text-4xl">{ministerio.emoji}</div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {ministerio.nombre}
              </h1>
              {ministerio.descripcion && (
                <p className="text-sm text-white mt-0.5 line-clamp-1">{ministerio.descripcion}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs de navegación internas */}
      <div className="border-b border-slate-100 bg-white sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-lg mx-auto px-4 flex gap-6 overflow-x-auto no-scrollbar">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 py-4 text-sm font-medium text-white/80 hover:text-white border-b-2 border-transparent hover:border-slate-600 whitespace-nowrap transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Contenido principal */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  )
}
