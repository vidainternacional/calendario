'use server'

import { createClient } from '@/lib/supabase/server'

export async function guardarPreferenciaVersiculoDiario(activo: boolean, horaLocal: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const hora = Number(horaLocal)
  if (!Number.isInteger(hora) || hora < 0 || hora > 23) {
    return { error: 'Hora inválida' }
  }

  const { error } = await (supabase as any)
    .from('versiculo_diario_preferencias')
    .upsert({
      profile_id: user.id,
      activo: Boolean(activo),
      hora_local: hora,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' })

  if (error) {
    console.error('[versiculo-diario] No se pudo guardar la preferencia', error)
    return { error: 'No se pudo guardar el recordatorio' }
  }

  return { success: true }
}
