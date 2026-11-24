export type ReviewPerson = { id: string; label: string; sede: string; role: string; ministry: string }
export const REVIEW_PEOPLE: ReviewPerson[] = [
  { id: 'sa-pastor', label: 'Pastor de Santa Ana · ejemplo', sede: 'santa-ana', role: 'pastor', ministry: '' },
  { id: 'ch-pastor', label: 'Pastor de Chalchuapa · ejemplo', sede: 'chalchuapa', role: 'pastor', ministry: '' },
  { id: 'sa-lider', label: 'Líder de Alabanza · ejemplo', sede: 'santa-ana', role: 'lider', ministry: 'sa-alabanza' },
  { id: 'ch-musico', label: 'Músico de Chalchuapa · ejemplo', sede: 'chalchuapa', role: 'servidor', ministry: 'ch-alabanza' },
  { id: 'sa-miembro', label: 'Miembro sin ministerio · ejemplo', sede: 'santa-ana', role: 'miembro', ministry: '' },
]
export type ReviewAudience = { sedes: string[]; roles: string[]; ministries: string[]; people: string[]; all: boolean }
// El selector de sede siempre limita los grupos. Personas explícitas se unen, sin duplicados.
export function reviewRecipients(a: ReviewAudience, people = REVIEW_PEOPLE, allowedIds = people.map(p => p.id)) {
  return people.filter(p => allowedIds.includes(p.id) && (a.people.includes(p.id) || ((a.sedes.length === 0 || a.sedes.includes(p.sede)) && (a.all || a.roles.includes(p.role) || a.ministries.includes(p.ministry)))))
}
