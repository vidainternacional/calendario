import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import HebrewKeyboardDock from '@/components/hebreo/HebrewKeyboardDock'
import HebrewLearningHome from '@/components/hebreo/HebrewLearningHome'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Hebreo Bíblico',
}

export default async function HebreoBiblicoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/estudios/hebreo')

  return (
    <>
      <HebrewLearningHome />
      <HebrewKeyboardDock />
    </>
  )
}
