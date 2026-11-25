export type VisibleSedes = 'santa-ana' | 'chalchuapa' | 'ambas'
export const visibleSedesKey = (userId: string) => `vida:sedes-visibles:review:v1:${userId}`
export const normalizeVisibleSedes = (value: unknown): VisibleSedes => value === 'santa-ana' || value === 'chalchuapa' ? value : 'ambas'
export function toggleVisibleSede(current: VisibleSedes, sede: Exclude<VisibleSedes, 'ambas'>): VisibleSedes {
  if (current === 'ambas') return sede === 'santa-ana' ? 'chalchuapa' : 'santa-ana'
  return current === sede ? current : 'ambas'
}
