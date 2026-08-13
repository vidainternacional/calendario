import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BibliaClient from '@/components/biblia/BibliaClient'
import BibliaVoiceControl from '@/components/biblia/BibliaVoiceControl'
import BibliaFavoritesEmptyEnhancer from '@/components/biblia/BibliaFavoritesEmptyEnhancer'
import BibliaErrorRetryEnhancer from '@/components/biblia/BibliaErrorRetryEnhancer'
import BibliaPastoralCollectionEnhancer from '@/components/biblia/BibliaPastoralCollectionEnhancer'
import BibliaProyectoEnhancer from '@/components/biblia/BibliaProyectoEnhancer'
import BibliaDeepStudyEnhancer from '@/components/biblia/BibliaDeepStudyEnhancer'
import BibliaQuickReferenceSearch from '@/components/biblia/BibliaQuickReferenceSearch'
import BibliaReadingFooterEnhancer from '@/components/biblia/BibliaReadingFooterEnhancer'
import BibliaThemeStateBridge from '@/components/biblia/BibliaThemeStateBridge'
import { tieneAccesoPastoral } from '@/lib/pastoral/access'
import './biblia.css'
import './biblia-first-paint.css'
import './biblia-stability.css'
import './biblia-verse-actions-theme.css'

export const metadata: Metadata = { title: 'Biblia' }

export default async function BibliaPage({ searchParams }: { searchParams: Promise<{ from?: string; embed?: string; paqueteId?: string }> }) {
  const { from, embed, paqueteId } = await searchParams
  const estaEmbebida = embed === '1'
  const esProyectoPastoral = from === 'pastoral' && estaEmbebida
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let coleccionesPastorales: Array<{ id: string; nombre: string; color: string }> = []

  if (from === 'pastoral' && !esProyectoPastoral) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol, estado_cuenta, acceso_centro_pastoral')
      .eq('id', user.id)
      .single()

    if (tieneAccesoPastoral(profile as any)) {
      const { data } = await (supabase as any)
        .from('pastoral_colecciones')
        .select('id, nombre, color')
        .eq('profile_id', user.id)
        .order('updated_at', { ascending: false })

      coleccionesPastorales = (data ?? []).map((coleccion: any) => ({
        id: coleccion.id,
        nombre: coleccion.nombre,
        color: coleccion.color ?? 'indigo',
      }))
    }
  }

  return (
    <>
      {from === 'pastoral' && !estaEmbebida && (
        <Link
          href="/pastoral"
          className="fixed left-3 top-[calc(env(safe-area-inset-top)+0.65rem)] z-[90] inline-flex min-h-10 items-center gap-1.5 rounded-full border border-indigo-200 bg-white/95 px-3 text-xs font-bold text-indigo-700 shadow-lg backdrop-blur-md"
        >
          <ArrowLeft className="h-4 w-4" />
          Centro Pastoral
        </Link>
      )}

      {esProyectoPastoral && <BibliaProyectoEnhancer paqueteId={paqueteId} />}
      <BibliaClient />
      {from !== 'pastoral' && <BibliaThemeStateBridge />}
      {from !== 'pastoral' && <BibliaQuickReferenceSearch />}
      {from !== 'pastoral' && <BibliaReadingFooterEnhancer />}
      {from !== 'pastoral' && <BibliaDeepStudyEnhancer />}
      <BibliaVoiceControl />
      <BibliaFavoritesEmptyEnhancer />
      <BibliaErrorRetryEnhancer />
      {from === 'pastoral' && !esProyectoPastoral && <BibliaPastoralCollectionEnhancer colecciones={coleccionesPastorales} />}

      {estaEmbebida && (
        <style>{`
          .app-bottom-nav { display: none !important; }
        `}</style>
      )}
    </>
  )
}
