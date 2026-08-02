'use server'

import { createClient } from '@/lib/supabase/server'
import { obtenerEstudioInterno, referenciasInternasDisponibles } from '@/lib/estudios/internal-study'
import type { EstudioResultadoValidado } from '@/lib/estudios/ai-config'

export { guardarNota, obtenerHistorial, obtenerNota } from '@/app/actions/estudio'

export type EstudioResultado = EstudioResultadoValidado

export type EstudioState =
  | { status: 'idle' }
  | { status: 'success'; pasaje: string; resultado: EstudioResultado }
  | { status: 'error'; error: string }

export async function analizarPasaje(
  _prev: EstudioState,
  formData: FormData
): Promise<EstudioState> {
  const pasaje = (formData.get('pasaje') as string)?.trim()

  if (!pasaje) {
    return { status: 'error', error: 'Por favor ingresa un pasaje bíblico.' }
  }

  if (pasaje.length > 500) {
    return { status: 'error', error: 'El pasaje ingresado es demasiado largo.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { status: 'error', error: 'Debes iniciar sesión para usar esta función.' }
  }

  const estudio = obtenerEstudioInterno(pasaje)
  if (estudio) {
    return {
      status: 'success',
      pasaje: estudio.pasaje,
      resultado: estudio.resultado,
    }
  }

  const disponibles = referenciasInternasDisponibles().join(' y ')
  return {
    status: 'error',
    error: `La biblioteca interna todavía no tiene un estudio completo y revisado para “${pasaje}”. Por ahora puedes probar ${disponibles}. No se utilizó IA ni se inventó contenido para completar la respuesta.`,
  }
}
