import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import HebrewSupportMaterials from '@/components/hebreo/HebrewSupportMaterials'
import { createClient } from '@/lib/supabase/server'
import styles from '../hebreo.module.css'

export const metadata: Metadata = { title: 'Materiales | Hebreo Bíblico' }

export default async function HebrewMaterialsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/estudios/hebreo/materiales')

  return <div className={styles.centered}><HebrewSupportMaterials /></div>
}
