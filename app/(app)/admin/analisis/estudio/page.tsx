import { redirect } from 'next/navigation'
import { BarChart3, BookOpen, Clock3, Layers, Repeat2, Search, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import BackButton from '@/components/navigation/BackButton'

export const dynamic = 'force-dynamic'

type AnalyticsRow = {
  session_id: string
  event_type: 'query' | 'section'
  query_kind: string | null
  query_text: string | null
  resolved_reference: string | null
  resolved_book: string | null
  resolved_topic: string | null
  result_status: string | null
  section_key: string | null
  duration_ms: number | null
  occurred_at: string
}

type RankedItem = { label: string; count: number }

function ranking(values: Array<string | null>, limit = 8): RankedItem[] {
  const map = new Map<string, number>()
  for (const value of values) {
    const label = value?.trim()
    if (!label) continue
    map.set(label, (map.get(label) ?? 0) + 1)
  }
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'))
    .slice(0, limit)
}

function RankingCard({ title, subtitle, items, icon: Icon }: {
  title: string
  subtitle: string
  items: RankedItem[]
  icon: typeof Search
}) {
  const max = Math.max(1, ...items.map(item => item.count))
  return (
    <article className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-sm font-extrabold text-[#171923]">{title}</p><p className="mt-1 text-[11px] leading-4 text-slate-400">{subtitle}</p></div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600"><Icon className="h-4 w-4" /></span>
      </div>
      <div className="mt-5 space-y-3">
        {items.length ? items.map(item => (
          <div key={item.label}>
            <div className="mb-1.5 flex items-center justify-between gap-3"><p className="min-w-0 truncate text-[11px] font-bold text-slate-600">{item.label}</p><span className="shrink-0 text-[10px] font-bold text-slate-400">{item.count}</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.max(6, (item.count / max) * 100)}%` }} /></div>
          </div>
        )) : <p className="py-5 text-center text-xs text-slate-400">Todavía no hay datos suficientes.</p>}
      </div>
    </article>
  )
}

export default async function StudyAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile } = await (supabase as any)
    .from('profiles')
    .select('rol, es_pastor_general')
    .eq('id', user.id)
    .single()

  const allowed = currentProfile?.rol === 'pastor' || currentProfile?.rol === 'administrador' || currentProfile?.es_pastor_general === true
  if (!allowed) redirect('/inicio')

  const service = createServiceClient()
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await (service as any)
    .from('estudio_analytics_events')
    .select('session_id,event_type,query_kind,query_text,resolved_reference,resolved_book,resolved_topic,result_status,section_key,duration_ms,occurred_at')
    .gte('occurred_at', since30)
    .order('occurred_at', { ascending: false })
    .limit(10000)

  const rows = error ? [] : ((data ?? []) as AnalyticsRow[])
  const queries = rows.filter(row => row.event_type === 'query')
  const sections = rows.filter(row => row.event_type === 'section')
  const sessions = new Set(rows.map(row => row.session_id)).size
  const errors = queries.filter(row => row.result_status === 'error').length
  const durations = queries.map(row => row.duration_ms).filter((value): value is number => typeof value === 'number')
  const avgDuration = durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 0

  const normalizedQueries = queries.map(row => row.query_text?.trim().toLowerCase() || null)
  const repeated = ranking(normalizedQueries, 12).filter(item => item.count > 1).slice(0, 8)

  const passageRanking = ranking(queries.map(row => row.resolved_reference))
  const bookRanking = ranking(queries.map(row => row.resolved_book))
  const topicRanking = ranking(queries.map(row => row.resolved_topic))
  const searchRanking = ranking(queries.map(row => row.query_text))
  const sectionRanking = ranking(sections.map(row => row.section_key))

  return (
    <main className="mx-auto min-h-screen max-w-4xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+5rem)] sm:px-6 sm:pt-12">
      <div className="mb-7"><BackButton /></div>

      <header className="mb-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500">Centro de Análisis</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em] text-[#171923]">Analíticas de Estudio</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Uso agregado de los últimos 30 días. No se muestran usuarios, perfiles ni notas personales.</p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <article className="rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"><Search className="h-4 w-4 text-violet-500"/><p className="mt-3 text-2xl font-extrabold text-[#171923]">{queries.length}</p><p className="text-[10px] font-bold text-slate-500">Búsquedas</p></article>
        <article className="rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"><BarChart3 className="h-4 w-4 text-indigo-500"/><p className="mt-3 text-2xl font-extrabold text-[#171923]">{sessions}</p><p className="text-[10px] font-bold text-slate-500">Sesiones anónimas</p></article>
        <article className="rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"><Sparkles className="h-4 w-4 text-amber-500"/><p className="mt-3 text-2xl font-extrabold text-[#171923]">{errors}</p><p className="text-[10px] font-bold text-slate-500">Sin resultado</p></article>
        <article className="rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"><Clock3 className="h-4 w-4 text-emerald-500"/><p className="mt-3 text-2xl font-extrabold text-[#171923]">{avgDuration ? `${(avgDuration / 1000).toFixed(1)}s` : '—'}</p><p className="text-[10px] font-bold text-slate-500">Tiempo medio</p></article>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2">
        <RankingCard title="Pasajes más estudiados" subtitle="Referencias resueltas por el Centro de Estudio" items={passageRanking} icon={BookOpen} />
        <RankingCard title="Libros más consultados" subtitle="Agrupación por libro de las referencias resueltas" items={bookRanking} icon={BookOpen} />
        <RankingCard title="Temas más buscados" subtitle="Temas y lugares resueltos por concordancias" items={topicRanking} icon={Sparkles} />
        <RankingCard title="Búsquedas frecuentes" subtitle="Consultas repetidas, sin asociarlas a una persona" items={searchRanking} icon={Search} />
        <RankingCard title="Secciones más utilizadas" subtitle="Capas que se abren dentro de cada estudio" items={sectionRanking} icon={Layers} />
        <RankingCard title="Recurrencia" subtitle="Consultas que se repiten durante el periodo" items={repeated} icon={Repeat2} />
      </section>
    </main>
  )
}
