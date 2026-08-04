'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PilotIssueReporter from './PilotIssueReporter'
import PilotOnboardingReplayButton from './PilotOnboardingReplayButton'
import type { PilotContext, PilotRole } from '@/lib/pilot/types'

export default function PilotProfileTools() {
  const [context, setContext] = useState<PilotContext | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profileResult, leaderResult, participantResult, onboardingResult] = await Promise.all([
        (supabase as any).from('profiles').select('nombre_completo, rol, es_pastor_general').eq('id', user.id).single(),
        (supabase as any).from('ministerio_miembros').select('id').eq('profile_id', user.id).eq('es_lider', true).limit(1).maybeSingle(),
        (supabase as any).from('pilot_participants').select('active').eq('profile_id', user.id).maybeSingle(),
        (supabase as any).from('pilot_onboarding_progress').select('completed, current_step').eq('profile_id', user.id).maybeSingle(),
      ])

      if (!participantResult.data?.active || cancelled) return

      const profile = profileResult.data
      let role: PilotRole = leaderResult.data ? 'lider' : 'congregante'
      if (profile?.rol === 'administrador') role = 'administrador'
      else if (profile?.rol === 'pastor' || profile?.es_pastor_general) role = 'pastor'
      else if (leaderResult.data) role = 'lider'
      else if (profile?.rol === 'servidor') role = 'servidor'

      setContext({
        active: true,
        profileId: user.id,
        name: profile?.nombre_completo || 'Usuario',
        role,
        onboardingCompleted: Boolean(onboardingResult.data?.completed),
        onboardingStep: Number(onboardingResult.data?.current_step || 0),
      })
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (!context) return null

  return (
    <section className="space-y-3" aria-label="Herramientas del piloto">
      <PilotOnboardingReplayButton />
      <PilotIssueReporter context={context} />
    </section>
  )
}
