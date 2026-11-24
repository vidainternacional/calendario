function first(value: unknown): Record<string, unknown> | null {
  const item = Array.isArray(value) ? value[0] : value
  return item && typeof item === 'object' ? item as Record<string, unknown> : null
}
export function nombreSedeMinisterio(value: unknown): string {
  const ministerio = first(value), enlace = first(ministerio?.vida_ministerio_sedes), sede = first(enlace?.vida_sedes)
  return typeof sede?.nombre === 'string' ? sede.nombre : ''
}
export function nombreMinisterioConSede(value: unknown): string {
  const row = first(value), nombre = typeof row?.nombre === 'string' ? row.nombre : 'Ministerio'
  const sede = nombreSedeMinisterio(value)
  return sede ? `${nombre} · ${sede}` : nombre
}
