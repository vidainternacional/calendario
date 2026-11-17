import { redirect } from 'next/navigation'
import BibleNotesWorkspace from '@/components/biblia/BibleNotesWorkspace'
import OfflineNotesOwnerMarker from '@/components/biblia/OfflineNotesOwnerMarker'
import { studyReturnHref } from '@/lib/estudios/study-navigation'
import { createClient } from '@/lib/supabase/server'

export default async function NotasBibliaPage({ searchParams }: {
  searchParams: Promise<{ returnTo?: string; origen?: string }>
}) {
  const params = await searchParams
  const returnHref = studyReturnHref(params.returnTo)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <>
      <OfflineNotesOwnerMarker userId={user.id} />
      <BibleNotesWorkspace userId={user.id} modo="claro" returnHref={returnHref ?? undefined} initialOrigin={params.origen === 'estudio_profundo' ? 'estudio_profundo' : undefined} />
    </>
  )
}
