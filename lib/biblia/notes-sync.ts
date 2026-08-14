'use client'

import { createClient } from '@/lib/supabase/client'
import {
  completarOperacionNotaBiblica,
  leerOperacionesNotasPendientes,
  type OperacionNotaBiblicaPendiente,
} from '@/lib/biblia/notes-queue'

let sincronizacionEnCurso: Promise<{ sincronizadas: number; pendientes: number }> | null = null
let usuarioActualNotas: string | null = null

function uuidONull(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null
}

export function obtenerUsuarioActualNotas() {
  return usuarioActualNotas
}

export async function resolverUsuarioActualNotas() {
  if (usuarioActualNotas) return usuarioActualNotas

  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  usuarioActualNotas = session?.user?.id ?? null
  return usuarioActualNotas
}

async function ejecutarOperacionPendiente(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  operacion: OperacionNotaBiblicaPendiente
) {
  if (operacion.tipo === 'upsert') {
    const nota = operacion.nota
    return (supabase as any)
      .from('notas_estudio')
      .upsert({
        id: nota.id,
        profile_id: userId,
        pasaje_normalizado: null,
        nota: nota.contenido.slice(0, 50_000),
        titulo: nota.titulo.slice(0, 300),
        tipo: nota.tipo,
        referencia: nota.referencia.slice(0, 300),
        origen: 'biblia_notas',
        origen_key: `biblia-notas:${nota.id}`,
        paquete_id: uuidONull(nota.paqueteId),
        estado: 'activo',
        contexto: nota.paquete ? { paquete: nota.paquete } : {},
        created_at: nota.creadaEn,
        updated_at: nota.actualizadaEn,
      }, { onConflict: 'id' })
  }

  return (supabase as any)
    .from('notas_estudio')
    .delete()
    .eq('id', operacion.id)
    .eq('profile_id', userId)
}

export async function sincronizarNotasBiblicasPendientes() {
  if (sincronizacionEnCurso) return sincronizacionEnCurso

  sincronizacionEnCurso = (async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    usuarioActualNotas = user?.id ?? null

    const pendientesDelUsuario = user
      ? leerOperacionesNotasPendientes().filter((operacion) => operacion.ownerId === user.id).length
      : leerOperacionesNotasPendientes().length

    if (!user) return { sincronizadas: 0, pendientes: pendientesDelUsuario }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { sincronizadas: 0, pendientes: pendientesDelUsuario }
    }

    let sincronizadas = 0

    while (true) {
      const operaciones = leerOperacionesNotasPendientes().filter((operacion) => operacion.ownerId === user.id)
      if (operaciones.length === 0) break

      let huboError = false
      let huboProgreso = false

      for (const operacion of operaciones) {
        const resultado = await ejecutarOperacionPendiente(supabase, user.id, operacion)

        if (resultado.error) {
          console.error('[notas-sync] operación pendiente:', resultado.error)
          huboError = true
          continue
        }

        completarOperacionNotaBiblica(operacion.id, operacion.token, operacion.ownerId)
        sincronizadas += 1
        huboProgreso = true
      }

      const pendientesActuales = leerOperacionesNotasPendientes()
        .filter((operacion) => operacion.ownerId === user.id)

      if (pendientesActuales.length === 0) break
      if (huboError || !huboProgreso) break
    }

    return {
      sincronizadas,
      pendientes: leerOperacionesNotasPendientes().filter((operacion) => operacion.ownerId === user.id).length,
    }
  })().finally(() => {
    sincronizacionEnCurso = null
  })

  return sincronizacionEnCurso
}
