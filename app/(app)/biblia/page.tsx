import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BibliaClient from '@/components/biblia/BibliaClient'
import BibliaVoiceControl from '@/components/biblia/BibliaVoiceControl'
import BibliaFavoritesEmptyEnhancer from '@/components/biblia/BibliaFavoritesEmptyEnhancer'
import './biblia.css'

export const metadata: Metadata = { title: 'Biblia' }

export default async function BibliaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <>
      <BibliaClient />
      <BibliaVoiceControl />
      <BibliaFavoritesEmptyEnhancer />
    </>
  )
}
