'use server'

import { createClient } from '@/lib/supabase/server'
import { obtenerEstudioInterno, referenciasInternasDisponibles } from '@/lib/estudios/internal-study'
import { buscarConcordanciasBiblicas, type ConcordanciaResultado } from '@/lib/estudios/biblical-concordance'
import {
  getInternalBiblicalContext,
  type BiblicalContextBundle,
  type BiblicalContextUnit,
} from '@/lib/estudios/biblical-context-corpus'
import { getVidaBiblicalTextualStudy } from '@/lib/estudios/multilingual-biblical-textual-study'
import type { ResolvedBiblicalTextualStudyBundle } from '@/lib/estudios/resolved-biblical-textual-study'
import {
  listarCronologiaBiblicaParaReferencia,
  type PaqueteCronologicoBiblico,
} from '@/lib/estudios/biblical-chronology-maps'
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
      chronology?: PaqueteCronologicoBiblico
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
  const { reference, bookProfile, sectionContext } = bundle
  const languages = reference.book.originalLanguages.map(nombreIdioma)
  const terms = Array.from(new Set([
    ...(bookProfile?.keyTerms ?? []),
    ...(sectionContext?.keyTerms ?? []),
  ]))

  return {
    texto_original: '',
    transliteracion: '',
    traduccion_literal: '',
    // Una síntesis contextual no es una traducción del texto. Esta capa permanece vacía
    // hasta que exista una traducción interpretativa aprobada con procedencia propia.
    traduccion_interpretativa: '',
    comparacion_versiones: '',
    contexto_historico: unirSecciones(
      'Contexto general del libro:',
      apartado(bookProfile, 'historicalContext'),
      'Contexto de la sección:',
      apartado(sectionContext, 'historicalContext'),
      'Contexto judío:',
      apartado(sectionContext, 'jewishContext') || apartado(bookProfile, 'jewishContext')
    ),
    analisis_linguistico: unirSecciones(
      languages.length > 0 ? `Idioma(s) del libro: ${languages.join(', ')}.` : null,
      terms.length > 0 ? `Términos y temas clave de esta unidad: ${terms.join(', ')}.` : null
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
      apartado(sectionContext, 'literaryContext') || apartado(bookProfile, 'literaryContext')
    ),
    reflexion: apartado(sectionContext, 'theologicalReflection')
      || apartado(bookProfile, 'theologicalReflection'),
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

  // Usa el mismo resolver multilingüe de Biblia → Estudio. Esto es esencial para
  // referencias mixtas como Daniel 2:4 (hebreo → arameo dentro del mismo versículo).
  const textualEvidence = await getVidaBiblicalTextualStudy(query, translationId)
  const contexto = await getInternalBiblicalContext(query)
  const chronology = contexto
    ? await listarCronologiaBiblicaParaReferencia({
        bookCode: contexto.reference.book.code,
        chapter: contexto.reference.chapter,
        verse: contexto.reference.verse,
      })
    : undefined
  const chronologyEvidence = chronology?.events.length ? chronology : undefined

  const estudio = obtenerEstudioInterno(query)
  if (estudio) {
    const resultado = textualEvidence
      ? estudio.resultado
      : {
          ...estudio.resultado,
          // El piloto histórico no debe actuar como respaldo textual sin la evidencia
          // aprobada. Ante una falla/ausencia de la capa textual, estos campos se ocultan.
          texto_original: '',
          transliteracion: '',
          traduccion_literal: '',
        }

    return {
      status: 'success',
      kind: 'study',
      query,
      pasaje: estudio.pasaje,
      resultado,
      textualEvidence: textualEvidence ?? undefined,
      chronology: chronologyEvidence,
    }
  }

  if (contexto?.status === 'covered') {
    return {
      status: 'success',
      kind: 'study',
      query,
      pasaje: contexto.reference.canonicalReference,
      resultado: ensamblarEstudioContextual(contexto),
      textualEvidence: textualEvidence ?? undefined,
      chronology: chronologyEvidence,
    }
  }

  if (contexto?.status === 'indexed') {
    return {
      status: 'error',
      error: `${contexto.reference.book.nameEs} está reconocido dentro del índice completo de 66 libros, pero no existe contenido contextual aprobado para ${contexto.reference.canonicalReference}.`,
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
