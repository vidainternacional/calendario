import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BibliaClient from '@/components/biblia/BibliaClient'
import BibliaVoiceControl from '@/components/biblia/BibliaVoiceControl'
import BibliaFavoritesEmptyEnhancer from '@/components/biblia/BibliaFavoritesEmptyEnhancer'
import BibliaErrorRetryEnhancer from '@/components/biblia/BibliaErrorRetryEnhancer'
import './biblia.css'

export const metadata: Metadata = { title: 'Biblia' }

export default async function BibliaPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <>
      {from === 'pastoral' && (
        <Link
          href="/pastoral"
          className="fixed left-3 top-[calc(env(safe-area-inset-top)+0.65rem)] z-[90] inline-flex min-h-10 items-center gap-1.5 rounded-full border border-indigo-200 bg-white/95 px-3 text-xs font-bold text-indigo-700 shadow-lg backdrop-blur-md"
        >
          <ArrowLeft className="h-4 w-4" />
          Panel Pastoral
        </Link>
      )}
      <BibliaClient />
      <BibliaVoiceControl />
      <BibliaFavoritesEmptyEnhancer />
      <BibliaErrorRetryEnhancer />
    </>
  )
}
