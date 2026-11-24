export type Sede = { id: string; slug: string; nombre: string; pais: string; zona_horaria: string; central: boolean; activa: boolean }
export type MisSedes = { definida: boolean; congregacion: string[]; visibles: string[] }

export function validarSeleccionSedes(valor: unknown, permiteVacio: boolean): string[] {
  if (!Array.isArray(valor) || valor.length > 100 || valor.some(id => typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
    throw new Error('Selecciona sedes válidas.')
  }
  const ids = [...new Set<string>(valor.map(id => id.toLowerCase()))]
  if (!permiteVacio && ids.length === 0) throw new Error('Mantén al menos una sede visible.')
  return ids
}

// Elegir congregación expresa pertenencia; nunca concede una responsabilidad.
export function esGestorGlobalSedes(perfil: { activo?: boolean; estado_cuenta?: string; rol?: string; es_pastor_general?: boolean } | null) {
  return Boolean(perfil?.activo && perfil.estado_cuenta === 'activo' && (perfil.rol === 'administrador' || perfil.es_pastor_general === true))
}
