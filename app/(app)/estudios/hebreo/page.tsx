import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import HebrewLearningHome from '@/components/hebreo/HebrewLearningHome'
import { createClient } from '@/lib/supabase/server'
import styles from './hebreo.module.css'

export const metadata: Metadata = {
  title: 'Hebreo Bíblico',
}

export default async function HebreoBiblicoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/estudios/hebreo')

  return (
    <div className={styles.centered}>
      <HebrewLearningHome />
    </div>
  )
}
