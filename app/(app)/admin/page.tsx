import { createClient } from '@/lib/supabase/server'
import AdminClient from './AdminClient'
import Link from 'next/link'
import { Building2, MessageCircleQuestion, Megaphone, Users } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()

  // 1. Ministerios
  const { data: ministerios, error: e1 } = await supabase
    .from('ministerios')
    .select('*')
    .order('orden', { ascending: true })

  if (e1) console.error('[Admin] Error ministerios:', e1)

  // 2. Usuarios
  const { data: usuarios, error: e2 } = await supabase
    .from('profiles')
    .select(`
      id,
      nombre_completo,
      email,
      rol,
      activo,
      estado_cuenta,
      created_at,
      es_pastor_general,
      ministerio_miembros (
        ministerio_id,
        es_lider,
        ministerios (
          nombre,
          color_primario
        )
      )
    `)
    .order('nombre_completo', { ascending: true })

  if (e2) console.error('[Admin] Error usuarios:', e2)

  // 3. Ícono activo de la app
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: iconSetting } = await (supabase as any)
    .from('app_settings')
    .select('valor')
    .eq('clave', 'active_icon_variant')
    .maybeSingle()

  // Limpia comillas si se guardó como '"dorado"'
  const activeIconVariant: string =
    typeof iconSetting?.valor === 'string'
      ? iconSetting.valor.replace(/"/g, '')
      : 'dorado'

  // 4. Estudio Profundo System Prompt
  const { data: promptSetting } = await (supabase as any)
    .from('app_settings')
    .select('valor')
    .eq('clave', 'estudio_system_prompt')
    .maybeSingle()

  const estudioPrompt: string =
    typeof promptSetting?.valor === 'string'
      ? promptSetting.valor.replace(/^"|"$/g, '').replace(/\\n/g, '\n')
      : ''

  // 5. Contadores de elementos pendientes
  const { count: pendingPreguntas } = await (supabase as any)
    .from('preguntas_congregacion')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'pendiente')

  const { count: pendingAvisos } = await (supabase as any)
    .from('publicaciones')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'pendiente')

  // 6. Current User Role
  const { data: { user } } = await supabase.auth.getUser()
  let currentUserRol = 'servidor'
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
    if ((profile as any)?.rol) currentUserRol = (profile as any).rol
  }

  const estadisticas = [
    {
      label: 'Usuarios',
      value: usuarios?.length || 0,
      icon: Users,
      iconClass: 'bg-indigo-50 text-indigo-600',
      valueClass: 'text-[#171923]',
    },
    {
      label: 'Ministerios',
      value: ministerios?.length || 0,
      icon: Building2,
      iconClass: 'bg-emerald-50 text-emerald-600',
      valueClass: 'text-[#171923]',
    },
    {
      label: 'Avisos pendientes',
      value: pendingAvisos || 0,
      icon: Megaphone,
      iconClass: 'bg-amber-50 text-amber-600',
      valueClass: pendingAvisos ? 'text-amber-600' : 'text-[#171923]',
    },
    {
      label: 'Dudas / Buzón',
      value: pendingPreguntas || 0,
      icon: MessageCircleQuestion,
      iconClass: 'bg-rose-50 text-rose-600',
      valueClass: pendingPreguntas ? 'text-rose-600' : 'text-[#171923]',
    },
  ]

  return (
    <main className="min-h-screen bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8 max-w-2xl mx-auto">
      <header className="mb-6 sm:mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-500 mb-1.5">Panel general</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#171923] leading-tight">Administración</h1>
        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
          Gestiona ministerios, usuarios, accesos y contenido de la aplicación.
        </p>
      </header>

      {/* ── Estadísticas Generales ────────────────────────────────────────────── */}
      <section aria-label="Resumen administrativo" className="mb-6 sm:mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {estadisticas.map(({ label, value, icon: Icon, iconClass, valueClass }) => (
          <article
            key={label}
            className="min-w-0 bg-white rounded-[18px] p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col gap-3"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconClass}`}>
              <Icon className="w-4.5 h-4.5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wide leading-tight break-words">
                {label}
              </p>
              <p className={`mt-1 text-2xl sm:text-3xl font-bold leading-none ${valueClass}`}>{value}</p>
            </div>
          </article>
        ))}
      </section>

      {/* ── Accesos Rápidos ─────────────────────────────────────────────── */}
      <section className="mb-6 sm:mb-8" aria-labelledby="accesos-rapidos">
        <h2 id="accesos-rapidos" className="text-sm font-bold text-[#171923] mb-3">Accesos rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Link
            href="/admin/preguntas"
            className="bg-white rounded-[18px] p-4 sm:p-5 shadow-sm border border-slate-100 flex items-center justify-between gap-4 hover:shadow-md hover:border-indigo-100 active:scale-[0.99] transition-all group"
          >
            <div className="min-w-0">
              <h3 className="font-bold text-[#171923] leading-tight">Buzón de Congregación</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">Revisa preguntas, sugerencias y motivos de oración.</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors shrink-0">
              <MessageCircleQuestion className="w-5 h-5" aria-hidden="true" />
            </div>
          </Link>
        </div>
      </section>

      <AdminClient
        ministerios={ministerios || []}
        usuarios={usuarios || []}
        activeIconVariant={activeIconVariant}
        initialEstudioPrompt={estudioPrompt}
        currentUserRol={currentUserRol}
      />
    </main>
  )
}
