'use server'

import { createClient } from '@/lib/supabase/server'
import { obtenerEstudioInterno, referenciasInternasDisponibles } from '@/lib/estudios/internal-study'
import { buscarConcordanciasBiblicas, type ConcordanciaResultado } from '@/lib/estudios/biblical-concordance'
import {
  getInternalBiblicalContext,
  type BiblicalContextBundle,
  type BiblicalContextUnit,
} from '@/lib/estudios/biblical-context-corpus'
import {
  getInternalBiblicalTextualStudy,
  type BiblicalTextualStudyBundle,
} from '@/lib/estudios/biblical-textual-study'
import type { EstudioResultadoValidado } from '@/lib/estudios/ai-config'
import {
  guardarNota as guardarNotaBase,
  obtenerHistorial as obtenerHistorialBase,
  obtenerNota as obtenerNotaBase,
} from '@/app/actions/estudio'

export type EstudioResultado = EstudioResultadoValidado

export type EstudioState =
  | { status: 'idle' }
  | {
      status: 'success'
      kind: 'study'
      query: string
      pasaje: string
      resultado: EstudioResultado
      textualEvidence?: BiblicalTextualStudyBundle
    }
  | { status: 'success'; kind: 'concordance'; query: string; results: ConcordanciaResultado[] }
  | { status: 'error'; error: string }

function unirSecciones(...values: Array<string | null | undefined>) {
  return values.map(value => value?.trim()).filter(Boolean).join('\n\n')
}

function nombreIdioma(value: string) {
  if (value === 'hebrew') return 'hebreo bíblico'
  if (value === 'aramaic') return 'arameo bíblico'
  if (value === 'greek') return 'griego koiné'
  return value
}

function apartado(unit: BiblicalContextUnit | null, key: keyof BiblicalContextUnit) {
  if (!unit) return ''
  const value = unit[key]
  return typeof value === 'string' ? value : ''
}

function ensamblarEstudioContextual(bundle: BiblicalContextBundle): EstudioResultado {
  const { reference, bookProfile, sectionContext, version } = bundle
  const languages = reference.book.originalLanguages.map(nombreIdioma)
  const terms = Array.from(new Set([
    ...(bookProfile?.keyTerms ?? []),
    ...(sectionContext?.keyTerms ?? []),
  ]))

  const alcance = sectionContext
    ? `${sectionContext.title} (${reference.book.nameEs} ${sectionContext.chapterStart}–${sectionContext.chapterEnd})`
    : `${reference.book.nameEs}, panorama general del libro`

  return {
    texto_original: unirSecciones(
      `Idioma original principal: ${languages.join(' y ') || 'pendiente de clasificación'}.`,
      'Este lote incorpora el contexto verificable del pasaje, pero todavía no almacena el texto original exacto versículo por versículo. Para evitar errores, la aplicación no reconstruye ni inventa palabras hebreas o arameas que aún no estén en el corpus léxico aprobado.'
    ),
    transliteracion: 'La transliteración exacta del versículo todavía no está disponible en este lote. Se mostrará cuando las ocurrencias del texto original hayan sido importadas y revisadas para esta referencia.',
    traduccion_literal: 'La biblioteca interna todavía no contiene una traducción literal palabra por palabra aprobada para esta referencia. El texto bíblico puede leerse en la pestaña Biblia; esta sección no sustituye el trabajo textual pendiente.',
    traduccion_interpretativa: unirSecciones(
      `Síntesis contextual de la unidad «${alcance}»:`,
      apartado(sectionContext, 'summary') || apartado(bookProfile, 'summary'),
      `Versión interna del paquete: ${version}.`
    ),
    comparacion_versiones: 'La comparación textual debe realizarse desde Biblia → Comparar. Este estudio contextual no declara una diferencia entre traducciones sin haber recuperado y cotejado sus textos exactos.',
    contexto_historico: unirSecciones(
      'Contexto general del libro:',
      apartado(bookProfile, 'historicalContext'),
      'Contexto de la sección:',
      apartado(sectionContext, 'historicalContext'),
      'Contexto judío:',
      apartado(sectionContext, 'jewishContext') || apartado(bookProfile, 'jewishContext')
    ),
    analisis_linguistico: unirSecciones(
      `Idioma(s) del libro: ${languages.join(', ') || 'no especificado'}.`,
      terms.length > 0 ? `Términos y temas clave de esta unidad: ${terms.join(', ')}.` : null,
      'Estos términos orientan la lectura de la sección; no equivalen a definiciones léxicas de cada palabra del versículo. El análisis morfológico y la transliteración detallada aparecerán únicamente cuando exista evidencia léxica aprobada.'
    ),
    que_quiso_comunicar: unirSecciones(
      apartado(sectionContext, 'authorialIntent'),
      apartado(bookProfile, 'authorialIntent')
    ),
    que_no_quiso_decir: unirSecciones(
      apartado(sectionContext, 'interpretiveCautions'),
      apartado(bookProfile, 'interpretiveCautions')
    ),
    explicacion: unirSecciones(
      apartado(sectionContext, 'summary') || apartado(bookProfile, 'summary'),
      'Estructura y función literaria:',
      apartado(sectionContext, 'literaryContext') || apartado(bookProfile, 'literaryContext')
    ),
    reflexion: apartado(sectionContext, 'theologicalReflection')
      || apartado(bookProfile, 'theologicalReflection')
      || 'La reflexión espiritual se añadirá cuando exista una unidad editorial aprobada para este pasaje.',
  }
}

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

  const textualEvidence = await getInternalBiblicalTextualStudy(query)

  const estudio = obtenerEstudioInterno(query)
  if (estudio) {
    return {
      status: 'success',
      kind: 'study',
      query,
      pasaje: estudio.pasaje,
      resultado: estudio.resultado,
      textualEvidence: textualEvidence ?? undefined,
    }
  }

  const contexto = await getInternalBiblicalContext(query)
  if (contexto?.status === 'covered') {
    return {
      status: 'success',
      kind: 'study',
      query,
      pasaje: contexto.reference.canonicalReference,
      resultado: ensamblarEstudioContextual(contexto),
      textualEvidence: textualEvidence ?? undefined,
    }
  }

  if (contexto?.status === 'indexed') {
    return {
      status: 'error',
      error: `${contexto.reference.book.nameEs} ya está reconocido dentro del índice completo de 66 libros, pero su lote contextual todavía no ha sido incorporado. La aplicación no inventó un estudio para ${contexto.reference.canonicalReference}.`,
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
    error: `No encontramos contenido interno aprobado para “${query}”. Puede probar otra palabra o pregunta, una referencia de Génesis a Deuteronomio, o consultar ${disponibles}. No se utilizó IA ni se inventó información.`,
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
