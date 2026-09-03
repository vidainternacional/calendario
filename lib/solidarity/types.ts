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

export type SolidarityHelpType = 'general' | 'paquete_despensa'
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

export type ServiceNeed = {
  id: string
  categoria: string
  titulo: string
  detalle: string | null
  estado: PantryNeedStatus
  created_at?: string
  updated_at?: string
}

export type PantryPackage = {
  id: string
  nombre: string
  activo: boolean
  es_predeterminado: boolean
  created_at?: string
  updated_at?: string
}

export type PantryPackageItem = {
  id: string
  paquete_id: string
  necesidad_id: string
  cantidad: number
  despensa_necesidades?: Pick<PantryNeed, 'id' | 'producto' | 'unidad'> | null
}

export type SolidarityMessage = {
  id: string
  solicitud_id: string | null
  aporte_id: string | null
  autor_id: string
  mensaje: string
  created_at: string
}

export type ChurchBankAccountPurpose = 'ayuda_solidaria' | 'diezmos_ofrendas'

export type ChurchBankAccount = {
  id: string
  proposito: ChurchBankAccountPurpose
  titulo: string
  banco: string
  titular: string
  numero_cuenta: string
  tipo_cuenta: string | null
  instrucciones: string | null
  activo: boolean
  created_at?: string
  updated_at?: string
}

// Los valores internos históricos se conservan por compatibilidad; la interfaz usa lenguaje pastoral simplificado.
export const SOLIDARITY_REQUEST_STATUS_LABELS: Record<SolidarityRequestStatus, string> = {
  enviada: 'Recibida',
  revisando: 'Conversando',
  aprobada: 'Conversando',
  programada: 'En camino',
  entregada: 'Entregada',
  rechazada: 'No pudimos ayudar en esto',
  cancelada: 'Cancelada',
}

export const SOLIDARITY_CONTRIBUTION_STATUS_LABELS: Record<SolidarityContributionStatus, string> = {
  ofrecido: 'Ofrecido',
  contactando: 'Coordinando',
  recibido: 'Entregado',
  asignado: 'Coordinando',
  completado: 'Entregado',
  cancelado: 'Cancelado',
}

export const SOLIDARITY_CONTRIBUTION_TYPE_LABELS: Record<SolidarityContributionType, string> = {
  alimentos: 'Alimentos',
  monetario: 'Dinero',
  voluntariado: 'Voluntariado',
  tiempo: 'Tiempo',
  transporte: 'Transporte',
  herramientas: 'Herramientas',
  objetos: 'Objetos',
  conocimientos: 'Conocimientos',
  oficios: 'Un oficio',
  habilidades: 'Habilidades',
  otro: 'Otra forma de ayuda',
}
