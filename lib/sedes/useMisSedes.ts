'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { obtenerMisSedes, guardarMisSedes } from '@/app/actions/sedes'
import { crearSedesStore, SEDES_INITIAL } from './store'
import { requestUnreadPublicationsRefresh } from '@/components/avisos/usePublicationReads'

const stores = new Map<string, ReturnType<typeof crearSedesStore>>()
export function useMisSedes(userId: string) {
  let store = stores.get(userId)
  if (!store) { store = crearSedesStore(userId, { load: obtenerMisSedes, save: guardarMisSedes }); stores.set(userId, store) }
  const current = store
  const snapshot = useSyncExternalStore(current.subscribe, current.getSnapshot, () => SEDES_INITIAL)
  useEffect(() => {
    void current.refresh()
    const refresh = () => { if (document.visibilityState === 'visible') void current.refresh() }
    window.addEventListener('online', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => { window.removeEventListener('online', refresh); document.removeEventListener('visibilitychange', refresh) }
  }, [current])
  const guardar: typeof current.guardar = async (tipo, ids) => {
    const result = await current.guardar(tipo, ids)
    if (result.success && tipo === 'visibles') requestUnreadPublicationsRefresh()
    return result
  }
  return { ...snapshot, guardar, refresh: current.refresh }
}
