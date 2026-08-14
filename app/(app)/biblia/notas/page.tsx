import { redirect } from 'next/navigation'
import BibleNotesWorkspace from '@/components/biblia/BibleNotesWorkspace'
import { createClient } from '@/lib/supabase/server'

export default async function NotasBibliaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <BibleNotesWorkspace userId={user.id} />
}
