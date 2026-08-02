'use server'

import { createClient } from '@/lib/supabase/server'
import { obtenerEstudioInterno, referenciasInternasDisponibles } from '@/lib/estudios/internal-study'
import { buscarConcordanciasBiblicas, type ConcordanciaResultado } from '@/lib/estudios/biblical-concordance'
import type { EstudioResultadoValidado } from '@/lib/estudios/ai-config'
import {
  guardarNota as guardarNotaBase,
  obtenerHistorial as obtenerHistorialBase,
  obtenerNota as obtenerNotaBase,
} from '@/app/actions/estudio'

export type EstudioResultado = EstudioResultadoValidado

export type EstudioState =
  | { status: 'idle' }
  | { status: 'success'; kind: 'study'; query: string; pasaje: string; resultado: EstudioResultado }
  | { status: 'success'; kind: 'concordance'; query: string; results: ConcordanciaResultado[] }
  | { status: 'error'; error: string }

export async function analizarPasaje(
  _prev: EstudioState,
  formData: FormData
): Promise<EstudioState> {
  const query = (formData.get('pasaje') as string)?.trim()

  if (!query) {
    return { status: 'error', error: 'Escriba un versículo, una palabra o una pregunta.' }
  }

  if (query.length > 500) {
    return { status: 'error', error: 'La consulta ingresada es demasiado larga.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { status: 'error', error: 'Debe iniciar sesión para usar esta función.' }
  }

  const estudio = obtenerEstudioInterno(query)
  if (estudio) {
    return {
      status: 'success',
      kind: 'study',
      query,
      pasaje: estudio.pasaje,
      resultado: estudio.resultado,
    }
  }

  const concordancias = await buscarConcordanciasBiblicas(query, 80)
  if (concordancias.results.length > 0) {
    return {
      status: 'success',
      kind: 'concordance',
      query,
      results: concordancias.results,
    }
  }

  const disponibles = referenciasInternasDisponibles().join(' y ')
  return {
    status: 'error',
    error: `No encontramos contenido interno aprobado para “${query}”. Puede probar otra palabra o pregunta, o consultar ${disponibles}. No se utilizó IA ni se inventó información.`,
  }
}

export async function obtenerHistorial() {
  return obtenerHistorialBase()
}

export async function obtenerNota(pasaje: string) {
  return obtenerNotaBase(pasaje)
}

export async function guardarNota(pasaje: string, nota: string) {
  return guardarNotaBase(pasaje, nota)
}
