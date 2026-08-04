export type PilotRole = 'administrador' | 'pastor' | 'lider' | 'servidor' | 'congregante'

export type PilotContext = {
  active: boolean
  profileId: string
  name: string
  role: PilotRole
  onboardingCompleted: boolean
  onboardingStep: number
}

export type PilotIssueStatus = 'nuevo' | 'revisando' | 'resuelto'

export function pilotRoleLabel(role: PilotRole) {
  return {
    administrador: 'Administrador',
    pastor: 'Pastor',
    lider: 'Líder',
    servidor: 'Servidor',
    congregante: 'Congregante',
  }[role]
}
