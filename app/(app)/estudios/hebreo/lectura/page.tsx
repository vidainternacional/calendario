import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import HebrewBibleReader from '@/components/hebreo/HebrewBibleReader'
import { createClient } from '@/lib/supabase/server'
import styles from '../hebreo.module.css'

export const metadata: Metadata = { title: 'Lectura | Hebreo Bíblico' }

export default async function HebrewReadingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/estudios/hebreo/lectura')

  return (
    <div className={styles.centered}>
      <main className="min-h-screen bg-[#f9f9fb] text-slate-950">
        <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-3 sm:px-6">
          <header className="mb-3">
            <Link href="/estudios/hebreo" className="inline-flex min-h-10 items-center gap-1.5 text-[13px] font-black text-slate-600"><ArrowLeft className="h-4 w-4" /> Hebreo Bíblico</Link>
          </header>
          <HebrewBibleReader />
        </div>
      </main>
    </div>
  )
}
