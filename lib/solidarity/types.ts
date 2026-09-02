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
export type SolidarityContributionType =
  | 'alimentos'
  | 'monetario'
  | 'voluntariado'
  | 'tiempo'
  | 'transporte'
  | 'herramientas'
  | 'objetos'
  | 'conocimientos'
  | 'oficios'
  | 'habilidades'
  | 'otro'

export type PantryNeedStatus = 'activa' | 'cubierta' | 'pausada'

export type PantryNeed = {
  id: string
  producto: string
  unidad: string
  existencia_actual: number
  minimo_necesario: number
  estado: PantryNeedStatus
  created_at?: string
  updated_at?: string
}

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

export const SOLIDARITY_CONTRIBUTION_TYPE_LABELS: Record<SolidarityContributionType, string> = {
  alimentos: 'Alimentos',
  monetario: 'Siembra económica',
  voluntariado: 'Voluntariado',
  tiempo: 'Tiempo',
  transporte: 'Transporte',
  herramientas: 'Herramientas',
  objetos: 'Objetos',
  conocimientos: 'Conocimientos',
  oficios: 'Oficios',
  habilidades: 'Habilidades',
  otro: 'Otra forma de ayuda',
}
