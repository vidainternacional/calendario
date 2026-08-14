import { redirect } from 'next/navigation'
import BibleNotesWorkspace from '@/components/biblia/BibleNotesWorkspace'
import OfflineNotesOwnerMarker from '@/components/biblia/OfflineNotesOwnerMarker'
import { createClient } from '@/lib/supabase/server'

export default async function NotasBibliaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <>
      <OfflineNotesOwnerMarker userId={user.id} />
      <BibleNotesWorkspace userId={user.id} />
    </>
  )
}
