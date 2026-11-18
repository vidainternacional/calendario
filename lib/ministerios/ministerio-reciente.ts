'use client'

import { useSyncExternalStore } from 'react'

const EVENTO = 'vida-ministerio-reciente'
const memoria = new Map<string, string>()
export const claveMinisterioReciente = (usuarioId: string) => `vida-ministerio-reciente-v1:${usuarioId}`
export function leerMinisterioReciente(usuarioId: string): string | null {
  if (typeof window === 'undefined') return null
  if (memoria.has(usuarioId)) return memoria.get(usuarioId)!
  try { return localStorage.getItem(claveMinisterioReciente(usuarioId)) } catch { return null }
}
export function registrarMinisterioReciente(usuarioId: string, ministerioId: string) {
  if (typeof window === 'undefined' || !usuarioId || !ministerioId) return
  try { localStorage.setItem(claveMinisterioReciente(usuarioId), ministerioId); memoria.delete(usuarioId) } catch { memoria.set(usuarioId, ministerioId) }
  window.dispatchEvent(new Event(EVENTO))
}
function suscribir(callback: () => void) {
  window.addEventListener(EVENTO, callback)
  window.addEventListener('storage', callback)
  window.addEventListener('pageshow', callback)
  window.addEventListener('focus', callback)
  return () => {
    window.removeEventListener(EVENTO, callback)
    window.removeEventListener('storage', callback)
    window.removeEventListener('pageshow', callback)
    window.removeEventListener('focus', callback)
  }
}
export function useMinisterioReciente(usuarioId: string) {
  return useSyncExternalStore(suscribir, () => leerMinisterioReciente(usuarioId), () => null)
}
export function ordenarMinisteriosRecientes<T extends { ministerio_id: string }>(membresias: T[], reciente: string | null): T[] {
  const primero = membresias.find(m => m.ministerio_id === reciente)
  return primero ? [primero, ...membresias.filter(m => m !== primero)] : membresias
}
