'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, ChevronLeft, ChevronRight, GraduationCap, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Tema = { id: string; titulo: string; descripcion: string }
type Asignacion = { curso_id: string; estado: string }

export default function DiscipuladoTemasClient({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient() as any, [])
  const [temas, setTemas] = useState<Tema[]>([])
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    void Promise.all([
      supabase.rpc('discipulado_catalogo_temas'),
      supabase.from('discipulado_asignaciones').select('curso_id,estado').eq('profile_id', userId),
    ]).then(([catalogo, inscripciones]: any[]) => {
      if (!mounted) return
      if (catalogo.error || inscripciones.error) setError(catalogo.error?.message || inscripciones.error?.message || 'No se pudo abrir el catálogo')
      else { setTemas(catalogo.data || []); setAsignaciones(inscripciones.data || []) }
      setCargando(false)
    })
    return () => { mounted = false }
  }, [supabase, userId])

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f5f9] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-6 sm:pt-8">
      <Link href="/discipulado" className="inline-flex min-h-11 items-center gap-1 text-xs font-bold text-slate-500"><ChevronLeft className="h-4 w-4" /> Discipulado</Link>
      <header className="mt-4 flex items-start gap-3"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700"><BookOpen className="h-6 w-6" /></div><div><p className="text-[10px] font-extrabold uppercase tracking-widest text-violet-600">Biblioteca</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Otros cursos</h1><p className="mt-1 text-sm leading-5 text-slate-500">Aprendé a tu ritmo con cursos organizados por tema. Estos cursos no sustituyen tu Discipulado principal.</p></div></header>
      {cargando ? <div className="mt-10 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-violet-600" /></div> : error ? <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : temas.length === 0 ? <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-center"><GraduationCap className="mx-auto h-9 w-9 text-slate-300" /><h2 className="mt-3 font-bold text-slate-900">Todavía no hay cursos temáticos publicados</h2><p className="mt-2 text-sm text-slate-500">Aquí aparecerán cuando el gestor los publique.</p></section> : <div className="mt-6 space-y-3">
        {temas.map(curso => {
          const inscripcion = asignaciones.find(a => a.curso_id === curso.id)
          return <Link key={curso.id} href={`/discipulado/cursos/${curso.id}`} className="flex min-h-24 items-center gap-3 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700"><BookOpen className="h-6 w-6" /></div>
            <div className="min-w-0 flex-1"><h2 className="text-sm font-bold text-slate-900">{curso.titulo}</h2>{curso.descripcion && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{curso.descripcion}</p>}<p className="mt-2 text-[11px] font-bold text-violet-600">{inscripcion ? inscripcion.estado === 'aprobado' ? 'Completado' : inscripcion.estado === 'revision' ? 'Pendiente de revisión' : 'Continuar curso' : 'Comenzar curso'}</p></div>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
          </Link>
        })}
      </div>}
    </main>
  )
}
