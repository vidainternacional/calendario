export type PerfilAccesoPastoral = {
  rol?: string | null
  estado_cuenta?: string | null
  acceso_centro_pastoral?: boolean | null
}

const ROLES_PASTORALES = new Set(['pastor', 'administrador'])

export function tieneAccesoPastoral(perfil: PerfilAccesoPastoral | null | undefined) {
  if (!perfil) return false
  const cuentaActiva = (perfil.estado_cuenta ?? 'pendiente') === 'activo'
  const accesoPorRol = ROLES_PASTORALES.has(perfil.rol ?? '')
  return cuentaActiva && (accesoPorRol || Boolean(perfil.acceso_centro_pastoral))
}

export function accesoPastoralIncluidoPorRol(rol: string | null | undefined) {
  return ROLES_PASTORALES.has(rol ?? '')
}
