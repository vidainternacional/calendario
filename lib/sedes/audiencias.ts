export type AudienciaSedes = {
  version: 1; sedes: string[]; todos: boolean; roles: string[]; ministerios: string[]; personas: string[]; lideres: boolean
}
export const ROLES_SEDES = ['administrador', 'pastor', 'lider', 'servidor'] as const
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function normalizarAudiencia(valor: unknown): AudienciaSedes {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) throw new Error('Revisa los destinatarios.')
  const a = valor as Record<string, unknown>
  if (a.version !== 1 || typeof a.todos !== 'boolean' || typeof a.lideres !== 'boolean') throw new Error('Revisa los destinatarios.')
  function lista(key: string, max: number, uuid = true) {
    const value = a[key]
    if (!Array.isArray(value) || value.length > max || value.some(x => typeof x !== 'string' || (uuid && !UUID.test(x)))) throw new Error('La selección de destinatarios no es válida.')
    return [...new Set<string>(value.map(x => uuid ? x.toLowerCase() : x))]
  }
  const sedes = lista('sedes', 100), ministerios = lista('ministerios', 100), personas = lista('personas', 500), roles = lista('roles', 4, false)
  if (!sedes.length || roles.some(r => !ROLES_SEDES.includes(r as typeof ROLES_SEDES[number]))) throw new Error('Selecciona sedes y responsabilidades válidas.')
  if (!a.todos && !a.lideres && !roles.length && !ministerios.length && !personas.length) throw new Error('Selecciona quiénes recibirán el mensaje.')
  return { version: 1, sedes, todos: a.todos, roles, ministerios, personas, lideres: a.lideres }
}
export function audienciaDesdeForm(form: FormData): AudienciaSedes | null {
  const value = form.get('vida_audiencia')
  if (value === null || value === '') return null // Conserva contenido histórico que todavía no se reclasificó.
  if (typeof value !== 'string' || value.length > 60000) throw new Error('La selección es demasiado grande.')
  try { return normalizarAudiencia(JSON.parse(value)) } catch (e) { throw new Error(e instanceof Error ? e.message : 'Revisa los destinatarios.') }
}

export type PerfilDestinatario = {
  id: string; activo: boolean; rol: string; general: boolean; sedesDeclaradas: string[]; visibles: string[]
  responsabilidades: { sede: string; rol: string }[]
  ministerios: { id: string; sede: string; lider: boolean }[]
}
// Contrato verificable del predicado SQL. Los permisos vienen del servidor, nunca del cliente.
export function coincideAudiencia(a: AudienciaSedes, p: PerfilDestinatario) {
  if (!p.activo) return false
  if (a.todos || a.personas.includes(p.id)) return true
  const responsables = p.responsabilidades.filter(r => a.sedes.includes(r.sede) && r.rol === p.rol)
  const miembros = p.ministerios.filter(m => a.sedes.includes(m.sede))
  return miembros.some(m => a.ministerios.includes(m.id) || (a.lideres && m.lider) || a.roles.includes('servidor') || (a.roles.includes('lider') && m.lider)) ||
    responsables.some(r => a.roles.includes(r.rol)) || (p.general && a.roles.includes(p.rol))
}
export function puedeEnviarAudiencia(a: AudienciaSedes, scope: { global: boolean; pastoral: boolean; sedes: string[]; ministerios: string[]; personas: string[] }) {
  return a.sedes.every(id => scope.sedes.includes(id)) && a.ministerios.every(id => scope.ministerios.includes(id)) && a.personas.every(id => scope.personas.includes(id)) &&
    (scope.global || scope.pastoral || (!a.todos && !a.roles.length && !a.lideres && a.personas.length === 0 && a.ministerios.length > 0))
}
export function visibleEnInicio(a: AudienciaSedes | null, p: PerfilDestinatario) {
  return !a || !a.todos || !p.visibles.length || a.sedes.some(id => p.visibles.includes(id))
}
