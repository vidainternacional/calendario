import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import HebrewCourseCenter from '@/components/hebreo/HebrewCourseCenter'
import { createClient } from '@/lib/supabase/server'
import styles from '../hebreo.module.css'

export const metadata: Metadata = { title: 'Aprender | Hebreo Bíblico' }

export default async function HebrewLearnPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/estudios/hebreo/aprender')

  return <div className={styles.centered}><HebrewCourseCenter /></div>
}
