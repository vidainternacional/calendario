// Un pendiente se retira por su estado real, nunca por visitar una sección.
export function conteoAtencion(valor: unknown) {
  const n = Number(valor)
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
}
export function sumarAtencion(conteos: Record<string, number>) {
  return Object.values(conteos).reduce((suma, n) => suma + conteoAtencion(n), 0)
}
