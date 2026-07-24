import { Metadata } from 'next'
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
      <BibliaClient fromPastoral={from === 'pastoral'} />
      <BibliaVoiceControl />
      <BibliaFavoritesEmptyEnhancer />
      <BibliaErrorRetryEnhancer />
    </>
  )
}
