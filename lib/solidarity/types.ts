export type SolidarityRequestStatus =
  | 'enviada'
  | 'revisando'
  | 'aprobada'
  | 'programada'
  | 'entregada'
  | 'rechazada'
  | 'cancelada'

export type SolidarityContributionStatus =
  | 'ofrecido'
  | 'contactando'
  | 'recibido'
  | 'asignado'
  | 'completado'
  | 'cancelado'

export type SolidarityUrgency = 'normal' | 'prioritaria' | 'urgente'
export type SolidarityContactPreference = 'aplicacion' | 'telefono' | 'whatsapp'
export type SolidarityContributionType = 'alimentos' | 'monetario' | 'voluntariado' | 'otro'

export const SOLIDARITY_REQUEST_STATUS_LABELS: Record<SolidarityRequestStatus, string> = {
  enviada: 'Enviada',
  revisando: 'En revisión',
  aprobada: 'Aprobada',
  programada: 'Entrega programada',
  entregada: 'Entregada',
  rechazada: 'No aprobada',
  cancelada: 'Cancelada',
}

export const SOLIDARITY_CONTRIBUTION_STATUS_LABELS: Record<SolidarityContributionStatus, string> = {
  ofrecido: 'Ofrecido',
  contactando: 'En contacto',
  recibido: 'Recibido',
  asignado: 'Asignado',
  completado: 'Completado',
  cancelado: 'Cancelado',
}
