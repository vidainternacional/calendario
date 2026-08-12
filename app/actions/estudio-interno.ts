'use server'

import { createClient } from '@/lib/supabase/server'
import { obtenerEstudioInterno, referenciasInternasDisponibles } from '@/lib/estudios/internal-study'
import {
  buscarConcordanciasBiblicas,
  buscarConcordanciasParaReferencia,
  type ConcordanciaResultado,
} from '@/lib/estudios/biblical-concordance'
import {
  buscarLugarBiblico,
  type LugarBiblicoBusqueda,
  type SugerenciaLugarBiblico,
} from '@/lib/estudios/biblical-place-search'
import { asistirTemaBiblico } from '@/lib/estudios/biblical-search-assist'
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
import { cargarTraduccionEspanolaEstudio } from '@/app/actions/traduccion-espanola-estudio'
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
      relatedConcordances?: ConcordanciaResultado[]
      relatedConcordanceScope?: 'verse' | 'chapter' | 'section'
    }
  | {
      status: 'success'
      kind: 'concordance'
      query: string
      results: ConcordanciaResultado[]
      interpretedFrom?: string
      interpretedAs?: string
    }
  | { status: 'place'; query: string; place: LugarBiblicoBusqueda }
  | { status: 'suggestions'; query: string; suggestions: SugerenciaLugarBiblico[] }
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

function formatearTraduccionEspanola(
  translation: Awaited<ReturnType<typeof cargarTraduccionEspanolaEstudio>>
) {
  if (!translation) return ''
  const texto = translation.verses.map(item => `${item.verse}. ${item.text}`).join('\n')
  return unirSecciones(
    `${translation.sourceName} — ${translation.canonicalReference}`,
    texto,
    'Traducción bíblica española aprobada para lectura del pasaje. Se mantiene separada de la traducción literal palabra por palabra del texto original.'
  )
}

function ensamblarEstudioContextual(
  bundle: BiblicalContextBundle,
  traduccionEspanola = ''
): EstudioResultado {
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
    traduccion_interpretativa: '',
    comparacion_versiones: traduccionEspanola,
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
    reflexion: apartado(sectionContext, 'theologicalReflection') || apartado(bookProfile, 'theologicalReflection'),
  }
}

async function buscarConcordanciasDesdeContexto(bundle: BiblicalContextBundle) {
  const terms = Array.from(new Set([
    ...(bundle.sectionContext?.keyTerms ?? []),
    ...(bundle.bookProfile?.keyTerms ?? []),
  ]))
    .map(term => term.trim())
    .filter(Boolean)
    .slice(0, 10)

  if (terms.length === 0) return [] as ConcordanciaResultado[]

  const searches = await Promise.all(terms.map(term => buscarConcordanciasBiblicas(term, 60)))
  const merged = new Map<string, ConcordanciaResultado>()

  for (const search of searches) {
    for (const result of search.results) {
      const previous = merged.get(result.termId)
      if (!previous) {
        merged.set(result.termId, result)
        continue
      }

      const seen = new Set(previous.matches.map(match => `${match.bookCode}:${match.chapter}:${match.verse}:${match.relationKind}`))
      for (const match of result.matches) {
        const key = `${match.bookCode}:${match.chapter}:${match.verse}:${match.relationKind}`
        if (!seen.has(key) && previous.matches.length < 12) {
          previous.matches.push(match)
          seen.add(key)
        }
      }
      previous.score = Math.max(previous.score, result.score)
    }
  }

  return Array.from(merged.values())
    .filter(result => result.matches.length > 0)
    .sort((a, b) => b.score - a.score || a.term.localeCompare(b.term, 'es'))
    .slice(0, 8)
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

  if (!query) return { status: 'error', error: 'Escriba un versículo, una palabra o una pregunta.' }
  if (query.length > 500) return { status: 'error', error: 'La consulta ingresada es demasiado larga.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'error', error: 'Debe iniciar sesión para usar esta función.' }

  const [textualEvidence, contexto, traduccionEspanolaData] = await Promise.all([
    getVidaBiblicalTextualStudy(query, translationId),
    getInternalBiblicalContext(query),
    cargarTraduccionEspanolaEstudio(query),
  ])
  const traduccionEspanola = formatearTraduccionEspanola(traduccionEspanolaData)

  let chronology: PaqueteCronologicoBiblico | undefined
  let concordanceEvidence: ConcordanciaResultado[] | undefined
  let concordanceScope: 'verse' | 'chapter' | 'section' | undefined

  if (contexto) {
    const [chronologyResult, referenceConcordances] = await Promise.all([
      listarCronologiaBiblicaParaReferencia({
        bookCode: contexto.reference.book.code,
        chapter: contexto.reference.chapter,
        verse: contexto.reference.verse,
      }),
      buscarConcordanciasParaReferencia({
        bookCode: contexto.reference.book.code,
        chapter: contexto.reference.chapter,
        verse: contexto.reference.verse,
        limit: 80,
      }),
    ])

    chronology = chronologyResult?.events.length ? chronologyResult : undefined

    if (referenceConcordances.results.length > 0) {
      concordanceEvidence = referenceConcordances.results
      concordanceScope = referenceConcordances.scope
    } else if (contexto.status === 'covered') {
      const thematic = await buscarConcordanciasDesdeContexto(contexto)
      if (thematic.length > 0) {
        concordanceEvidence = thematic
        concordanceScope = 'section'
      }
    }
  }

  const estudio = obtenerEstudioInterno(query)
  if (estudio) {
    const resultadoBase = textualEvidence
      ? estudio.resultado
      : { ...estudio.resultado, texto_original: '', transliteracion: '', traduccion_literal: '' }
    const resultado = {
      ...resultadoBase,
      comparacion_versiones: unirSecciones(traduccionEspanola, resultadoBase.comparacion_versiones),
    }

    return {
      status: 'success', kind: 'study', query, pasaje: estudio.pasaje, resultado,
      textualEvidence: textualEvidence ?? undefined,
      chronology,
      relatedConcordances: concordanceEvidence,
      relatedConcordanceScope: concordanceScope,
    }
  }

  if (contexto?.status === 'covered') {
    return {
      status: 'success', kind: 'study', query,
      pasaje: contexto.reference.canonicalReference,
      resultado: ensamblarEstudioContextual(contexto, traduccionEspanola),
      textualEvidence: textualEvidence ?? undefined,
      chronology,
      relatedConcordances: concordanceEvidence,
      relatedConcordanceScope: concordanceScope,
    }
  }

  if (contexto?.status === 'indexed') {
    return {
      status: 'error',
      error: `${contexto.reference.book.nameEs} está reconocido dentro del índice completo de 66 libros, pero no existe contenido contextual aprobado para ${contexto.reference.canonicalReference}.`,
    }
  }

  const placeSearch = await buscarLugarBiblico(query)
  if (placeSearch?.kind === 'place') {
    return { status: 'place', query, place: placeSearch.place }
  }
  if (placeSearch?.kind === 'suggestions') {
    return { status: 'suggestions', query, suggestions: placeSearch.suggestions }
  }

  const concordancias = await buscarConcordanciasBiblicas(query, 80)
  if (concordancias.results.length > 0) {
    return { status: 'success', kind: 'concordance', query, results: concordancias.results }
  }

  const assistedTopic = await asistirTemaBiblico(query)
  if (assistedTopic?.kind === 'resolved') {
    const corrected = await buscarConcordanciasBiblicas(assistedTopic.query, 80)
    if (corrected.results.length > 0) {
      return {
        status: 'success',
        kind: 'concordance',
        query: assistedTopic.query,
        results: corrected.results,
        interpretedFrom: query,
        interpretedAs: assistedTopic.label,
      }
    }
  }
  if (assistedTopic?.kind === 'suggestions') {
    return { status: 'suggestions', query, suggestions: assistedTopic.suggestions }
  }

  const disponibles = referenciasInternasDisponibles().join(' y ')
  return {
    status: 'error',
    error: `No pudimos relacionar “${query}” con una referencia, lugar o tema aprobado. Pruebe con otra forma de escribirlo o con ${disponibles}.`,
  }
}

export async function obtenerHistorial() { return obtenerHistorialBase() }
export async function obtenerNota(pasaje: string) { return obtenerNotaBase(pasaje) }
export async function guardarNota(pasaje: string, nota: string) { return guardarNotaBase(pasaje, nota) }
