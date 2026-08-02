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
  getResolvedBiblicalTextualStudy,
  type ResolvedBiblicalTextualStudyBundle,
} from '@/lib/estudios/resolved-biblical-textual-study'
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
      textualEvidence?: ResolvedBiblicalTextualStudyBundle
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
      'El contexto general de este pasaje está disponible. El texto original exacto se adjunta por separado cuando existe un paquete textual aprobado para la referencia.'
    ),
    transliteracion: 'La transliteración exacta aparece en la evidencia textual aprobada cuando está disponible para esta referencia.',
    traduccion_literal: 'La secuencia literal palabra por palabra aparece en la evidencia textual aprobada. No debe confundirse con una traducción española pulida.',
    traduccion_interpretativa: unirSecciones(
      `Síntesis contextual de la unidad «${alcance}»:`,
      apartado(sectionContext, 'summary') || apartado(bookProfile, 'summary'),
      `Versión interna del paquete: ${version}.`
    ),
    comparacion_versiones: 'La comparación de traducciones permanece en Biblia → Comparar. Las diferencias de versificación se resuelven según la traducción seleccionada.',
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
      'Las palabras, lemas, números Strong y códigos morfológicos se muestran únicamente desde ocurrencias textuales aprobadas.'
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
  const requestedTranslation = (formData.get('translation_id') as string | null)?.trim()
  const translationId = requestedTranslation && /^[a-z0-9_-]{2,80}$/i.test(requestedTranslation)
    ? requestedTranslation
    : 'spa_r09'

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

  const textualEvidence = await getResolvedBiblicalTextualStudy(query, translationId)

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
      error: `${contexto.reference.book.nameEs} está reconocido dentro del índice completo de 66 libros, pero su lote contextual todavía no ha sido incorporado. La aplicación no inventó un estudio para ${contexto.reference.canonicalReference}.`,
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
    error: `No encontramos contenido interno aprobado para “${query}”. Puede probar otra palabra, pregunta o referencia bíblica válida, o consultar ${disponibles}. No se utilizó IA ni se inventó información.`,
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
