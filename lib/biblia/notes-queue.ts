import type { NotaBiblicaLocal } from '@/lib/biblia/notes-local'

export const VIDA_BIBLE_NOTES_SYNC_QUEUE_KEY = 'vida-biblia-notas-sync-v1'
export const VIDA_BIBLE_NOTES_SYNC_EVENT = 'vida-biblia-notas-sync-pending'

export type OperacionNotaBiblicaPendiente =
  | { tipo: 'upsert'; id: string; token: string; nota: NotaBiblicaLocal; encoladaEn: string }
  | { tipo: 'delete'; id: string; token: string; encoladaEn: string }

function leerColaCruda(): OperacionNotaBiblicaPendiente[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(VIDA_BIBLE_NOTES_SYNC_QUEUE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function guardarCola(operaciones: OperacionNotaBiblicaPendiente[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(VIDA_BIBLE_NOTES_SYNC_QUEUE_KEY, JSON.stringify(operaciones))
    window.dispatchEvent(new Event(VIDA_BIBLE_NOTES_SYNC_EVENT))
  } catch {}
}

export function leerOperacionesNotasPendientes() {
  return leerColaCruda()
}

export function contarOperacionesNotasPendientes() {
  return leerColaCruda().length
}

export function encolarUpsertNotaBiblica(nota: NotaBiblicaLocal) {
  const operacion: OperacionNotaBiblicaPendiente = {
    tipo: 'upsert',
    id: nota.id,
    token: crypto.randomUUID(),
    nota,
    encoladaEn: new Date().toISOString(),
  }
  guardarCola([...leerColaCruda().filter((item) => item.id !== nota.id), operacion])
  return operacion
}

export function encolarDeleteNotaBiblica(id: string) {
  const operacion: OperacionNotaBiblicaPendiente = {
    tipo: 'delete',
    id,
    token: crypto.randomUUID(),
    encoladaEn: new Date().toISOString(),
  }
  guardarCola([...leerColaCruda().filter((item) => item.id !== id), operacion])
  return operacion
}

export function completarOperacionNotaBiblica(id: string, token: string) {
  const actuales = leerColaCruda()
  const siguientes = actuales.filter((item) => !(item.id === id && item.token === token))
  if (siguientes.length !== actuales.length) guardarCola(siguientes)
}
