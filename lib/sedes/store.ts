import type { Sede, MisSedes } from './modelo'

export type SedesSnapshot = { sedes: Sede[]; seleccion: MisSedes; loaded: boolean; saving: boolean; error: string }
type LoadResult = { sedes?: Sede[]; seleccion?: MisSedes; error?: string }
type Result = { success?: boolean; error?: string }
export type SedesAdapter = {
  load: (owner: string) => Promise<LoadResult>
  save: (tipo: 'congregacion' | 'visibles', ids: string[], owner: string) => Promise<Result>
}
export const SEDES_INITIAL: SedesSnapshot = { sedes: [], seleccion: { definida: false, congregacion: [], visibles: [] }, loaded: false, saving: false, error: '' }

// Cada instancia pertenece a un UUID. Un resultado antiguo no pisa un guardado nuevo.
export function crearSedesStore(owner: string, adapter: SedesAdapter) {
  let snapshot = SEDES_INITIAL
  let version = 0
  let loading: Promise<void> | null = null
  const listeners = new Set<() => void>()
  const publish = (next: SedesSnapshot) => { snapshot = next; listeners.forEach(fn => fn()) }
  const refresh = (): Promise<void> => {
    if (loading || snapshot.saving) return loading || Promise.resolve()
    const current = ++version
    loading = (async () => {
      try {
        const result = await adapter.load(owner)
        if (current !== version) return
        if (!result.sedes || !result.seleccion || result.error) { publish({ ...snapshot, error: result.error || 'No se pudieron consultar tus sedes.' }); return }
        publish({ sedes: result.sedes, seleccion: result.seleccion, loaded: true, saving: false, error: '' })
      } catch { if (current === version) publish({ ...snapshot, error: 'No se pudieron consultar tus sedes. Revisa tu conexión.' }) }
      finally { loading = null }
    })()
    return loading
  }
  const guardar = async (tipo: 'congregacion' | 'visibles', ids: string[]): Promise<Result> => {
    if (!snapshot.loaded || snapshot.saving) return { error: 'Espera a que termine la operación anterior.' }
    ++version
    publish({ ...snapshot, saving: true, error: '' })
    try {
      const result = await adapter.save(tipo, ids, owner)
      if (result.error || !result.success) { const error = result.error || 'No se pudo guardar.'; publish({ ...snapshot, saving: false, error }); return { error } }
      const seleccion = tipo === 'congregacion'
        ? { ...snapshot.seleccion, definida: true, congregacion: [...ids] }
        : { ...snapshot.seleccion, visibles: [...ids] }
      publish({ ...snapshot, seleccion, saving: false, error: '' })
      return { success: true }
    } catch { const error = 'No se pudo confirmar el guardado. Revisa tu conexión y vuelve a consultar.'; publish({ ...snapshot, saving: false, error }); return { error } }
  }
  return { getSnapshot: () => snapshot, subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } }, refresh, guardar }
}
