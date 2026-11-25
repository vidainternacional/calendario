import type { PushPayload } from '@/lib/webpush'
// El enlace vuelve a comprobar acceso. El push privado no conserva contenido sensible en la pantalla bloqueada.
export function notificacionSedes(audiencia: unknown, payload: PushPayload): PushPayload {
  if (audiencia && typeof audiencia === 'object' && (audiencia as { todos?: boolean }).todos === false) {
    return { ...payload, title: 'Nuevo contenido en VIDA', body: 'Tienes información nueva para ti. Abre VIDA para verla.' }
  }
  return payload
}
