import BibleThemeRouteSync from '@/components/biblia/BibleThemeRouteSync'
import BibleVerseActionsNoFlash from '@/components/biblia/BibleVerseActionsNoFlash'
import BibleVerseActionsPersistent from '@/components/biblia/BibleVerseActionsPersistent'
import BottomNav from '@/components/layout/BottomNav'
import PushSubscriptionSync from '@/components/pwa/PushSubscriptionSync'
import PilotTelemetry from '@/components/pilot/PilotTelemetry'
import PilotOnboarding from '@/components/pilot/PilotOnboarding'
import { createClient } from '@/lib/supabase/server'
import type { PilotContext, PilotRole } from '@/lib/pilot/types'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let pilotContext: PilotContext | null = null

  if (user) {
    const [profileResult, leaderResult, participantResult, onboardingResult] = await Promise.all([
      (supabase as any)
        .from('profiles')
        .select('nombre_completo, rol, es_pastor_general')
        .eq('id', user.id)
        .single(),
      (supabase as any)
        .from('ministerio_miembros')
        .select('id')
        .eq('profile_id', user.id)
        .eq('es_lider', true)
        .limit(1)
        .maybeSingle(),
      (supabase as any)
        .from('pilot_participants')
        .select('active')
        .eq('profile_id', user.id)
        .maybeSingle(),
      (supabase as any)
        .from('pilot_onboarding_progress')
        .select('completed, current_step')
        .eq('profile_id', user.id)
        .maybeSingle(),
    ])

    if (participantResult.data?.active) {
      const profile = profileResult.data
      let role: PilotRole = leaderResult.data ? 'lider' : 'congregante'

      if (profile?.rol === 'administrador') role = 'administrador'
      else if (profile?.rol === 'pastor' || profile?.es_pastor_general) role = 'pastor'
      else if (leaderResult.data) role = 'lider'
      else if (profile?.rol === 'servidor') role = 'servidor'

      pilotContext = {
        active: true,
        profileId: user.id,
        name: profile?.nombre_completo || 'Usuario',
        role,
        onboardingCompleted: Boolean(onboardingResult.data?.completed),
        onboardingStep: Number(onboardingResult.data?.current_step || 0),
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PushSubscriptionSync />
      <PilotTelemetry context={pilotContext} />
      <PilotOnboarding context={pilotContext} />
      <BibleThemeRouteSync />
      <BibleVerseActionsNoFlash />
      <BibleVerseActionsPersistent />
      <div className="flex-1 pb-16">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
