import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import CourseRoadmap from '@/components/hebreo/CourseRoadmap'
import HebrewLearningHome from '@/components/hebreo/HebrewLearningHome'
import HebrewTranslator from '@/components/hebreo/HebrewTranslator'
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
      <CourseRoadmap />
      <HebrewTranslator />
      <HebrewLearningHome />
    </div>
  )
}
