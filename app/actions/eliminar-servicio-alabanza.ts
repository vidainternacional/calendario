'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient, createClient } from '@/lib/supabase/server'

function fail(message: string): never {
  throw new Error(message)
}

export async function eliminarServicioAlabanza(
  ministerioId: string,
  eventoId: string,
  mes: string,
  dia: string,
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) fail('Tu sesión ha vencido.')

  const admin = createAdminClient() as any
  const [{ data: profile }, { data: membership }, { data: evento }, { data: ministryCalendars = [] }, { data: links = [] }] = await Promise.all([
    admin.from('profiles').select('rol,activo,estado_cuenta').eq('id', user.id).maybeSingle(),
    admin.from('ministerio_miembros').select('es_lider').eq('ministerio_id', ministerioId).eq('profile_id', user.id).maybeSingle(),
    admin.from('eventos').select('id,ministerio_id,calendar_id').eq('id', eventoId).maybeSingle(),
    admin.from('calendars').select('id').eq('ministerio_id', ministerioId),
    admin.from('evento_calendarios').select('calendar_id').eq('evento_id', eventoId),
  ])

  const puedeProgramar = profile?.activo === true
    && profile?.estado_cuenta === 'activo'
    && (profile.rol === 'administrador' || membership?.es_lider === true)
  if (!puedeProgramar) fail('No tienes permiso para eliminar este servicio.')
  if (!evento) fail('El servicio ya no está disponible.')

  const ministryCalendarIds = new Set((ministryCalendars || []).map((row: any) => String(row.id)))
  const pertenece = String(evento.ministerio_id || '') === ministerioId
    || ministryCalendarIds.has(String(evento.calendar_id || ''))
    || (links || []).some((row: any) => ministryCalendarIds.has(String(row.calendar_id)))
  if (!pertenece) fail('Este servicio no pertenece a este ministerio.')

  const { error } = await admin.from('eventos').delete().eq('id', eventoId)
  if (error) fail('No fue posible eliminar el servicio.')

  revalidatePath('/calendario')
  revalidatePath('/inicio')
  revalidatePath(`/ministerios/${ministerioId}`)
  revalidatePath(`/ministerios/${ministerioId}/programacion`)
  revalidatePath(`/ministerios/${ministerioId}/programacion/equipo`)
  revalidatePath(`/ministerios/${ministerioId}/setlist`)

  redirect(`/ministerios/${ministerioId}/programacion?mes=${mes}&dia=${dia}#dia-seleccionado`)
}
