'use server'

import { createClient } from '@/lib/supabase/server'
import { obtenerEstudioInterno } from '@/lib/estudios/internal-study'
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
import { buscarTextoBiblico } from '@/lib/estudios/biblical-text-search'
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
import type { TraduccionEspanolaEstudio } from '@/app/actions/traduccion-espanola-estudio'
import { readStudyScripture } from '@/lib/estudios/study-scripture'
import { esPreguntaBiblica } from '@/lib/estudios/biblical-question-evidence'
import { responderPreguntaBiblica } from '@/lib/estudios/biblical-question'
import type { BiblicalQuestionAnswer } from '@/lib/estudios/biblical-question-types'
import { reuseSavedStudy, saveStudy } from '@/lib/estudios/study-history'
import type { StudyHistoryReceipt } from '@/lib/estudios/study-history-types'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { EstudioResultadoValidado } from '@/lib/estudios/ai-config'
import {
  guardarNota as guardarNotaBase,
  obtenerHistorial as obtenerHistorialBase,
  obtenerNota as obtenerNotaBase,
} from '@/app/actions/estudio'

export type EstudioResultado = EstudioResultadoValidado

export type EstudioState = (
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
      resultSource?: 'text'
      answer?: BiblicalQuestionAnswer
    }
  | { status: 'place'; query: string; place: LugarBiblicoBusqueda }
  | { status: 'suggestions'; query: string; suggestions: SugerenciaLugarBiblico[]; suggestionKind?: 'related' }
  | { status: 'error'; error: string }
) & { history?: StudyHistoryReceipt; historyWarning?: string }

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
  translation: TraduccionEspanolaEstudio | null
) {
  if (!translation) return ''
  const multiChapter = new Set(translation.verses.map(item => item.chapter)).size > 1
  const texto = translation.verses.map(item => `${multiChapter ? `${item.chapter}:` : ''}${item.verse}. ${item.text}`).join('\n')
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
  const contexts = bundle.rangeContexts ?? (sectionContext ? [sectionContext] : [])
  const apartadoSeccion = (key: keyof BiblicalContextUnit) => unirSecciones(...contexts.map(unit => {
    const text = apartado(unit, key)
    return text && contexts.length > 1 ? `${unit.title}\n${text}` : text
  }))
  const languages = reference.book.originalLanguages.map(nombreIdioma)
  const terms = Array.from(new Set([
    ...(bookProfile?.keyTerms ?? []),
    ...contexts.flatMap(unit => unit.keyTerms),
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
      apartadoSeccion('historicalContext'),
      'Contexto judío:',
      apartadoSeccion('jewishContext') || apartado(bookProfile, 'jewishContext')
    ),
    analisis_linguistico: unirSecciones(
      languages.length > 0 ? `Idioma(s) del libro: ${languages.join(', ')}.` : null,
      terms.length > 0 ? `Términos y temas clave de esta unidad: ${terms.join(', ')}.` : null
    ),
    que_quiso_comunicar: unirSecciones(
      apartadoSeccion('authorialIntent'),
      apartado(bookProfile, 'authorialIntent')
    ),
    que_no_quiso_decir: unirSecciones(
      apartadoSeccion('interpretiveCautions'),
      apartado(bookProfile, 'interpretiveCautions')
    ),
    explicacion: unirSecciones(
      apartadoSeccion('summary') || apartado(bookProfile, 'summary'),
      apartadoSeccion('literaryContext') || apartado(bookProfile, 'literaryContext')
    ),
    reflexion: apartadoSeccion('theologicalReflection') || apartado(bookProfile, 'theologicalReflection'),
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

async function resolverConsulta(
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

  const scripture = await readStudyScripture(query).catch(() => ({ status: 'unavailable' as const }))
  if (scripture.status === 'unavailable') {
    return { status: 'error', error: 'No pudimos consultar la biblioteca bíblica en este momento. Su consulta se conserva; vuelva a intentarlo.' }
  }
  if (scripture.status === 'missing') {
    return { status: 'error', error: `No encontramos ${scripture.reference.canonicalReference} en el texto aprobado Reina-Valera 1909. Revise el capítulo y los versículos.` }
  }
  const parsed = scripture.status === 'ready' ? scripture.reference : undefined
  const traduccionEspanolaData = scripture.status === 'ready' ? scripture.translation : null
  const [textualEvidence, contexto] = await Promise.all([
    parsed?.endChapter === undefined ? getVidaBiblicalTextualStudy(query, translationId) : Promise.resolve(null),
    getInternalBiblicalContext(query, parsed),
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
        verse: contexto.reference.endChapter === undefined ? contexto.reference.verse : null,
      }),
      buscarConcordanciasParaReferencia({
        bookCode: contexto.reference.book.code,
        chapter: contexto.reference.chapter,
        verse: contexto.reference.endChapter === undefined ? contexto.reference.verse : null,
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

  if (esPreguntaBiblica(query)) {
    const [answer, concordancias] = await Promise.all([
      responderPreguntaBiblica(query, user.id),
      buscarConcordanciasBiblicas(query, 80),
    ])
    return { status: 'success', kind: 'concordance', query, results: concordancias.results, answer }
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

  const texto = await buscarTextoBiblico(query)
  if (texto.length > 0) {
    return { status: 'success', kind: 'concordance', query, results: texto, resultSource: 'text' }
  }

  const assistedTopic = await asistirTemaBiblico(query)
  if (assistedTopic?.kind === 'resolved') {
    const corrected = await buscarConcordanciasBiblicas(assistedTopic.query, 80)
    if (corrected.results.length > 0) {
      return {
        status: 'success',
        kind: 'concordance',
        query,
        results: corrected.results,
        interpretedFrom: query,
        interpretedAs: assistedTopic.label,
      }
    }
  }
  if (assistedTopic?.kind === 'suggestions') {
    return { status: 'suggestions', query, suggestions: assistedTopic.suggestions, suggestionKind: 'related' }
  }

  return {
    status: 'error',
    error: `No encontramos un tema aprobado suficientemente relacionado con “${query}”. Pruebe con otra forma de expresarlo o use una referencia bíblica concreta.`,
  }
}

export async function analizarPasaje(prev: EstudioState, formData: FormData): Promise<EstudioState> {
  const raw = formData.get('pasaje')
  if (typeof raw !== 'string') return { status: 'error', error: 'Escriba una consulta de texto.' }
  const query = raw.trim()
  if (!query || query.length > 500) return resolverConsulta(prev, formData)
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { status: 'error', error: 'Debe iniciar sesión para usar esta función.' }
  const requested = String(formData.get('translation_id') ?? '').trim()
  const translation = /^[a-z0-9_-]{2,80}$/i.test(requested) ? requested : 'spa_r09'
  const session = db as unknown as SupabaseClient
  const saved = await reuseSavedStudy(session, user.id, query, translation).catch(() => ({ status: 'unavailable' as const }))
  if (saved.status === 'found') return saved.state
  if (saved.status === 'unavailable' && esPreguntaBiblica(query)) {
    return { status: 'error', error: 'No pudimos comprobar tus respuestas guardadas. Intenta de nuevo; no enviamos esta consulta a la IA.' }
  }
  const result = await resolverConsulta(prev, formData)
  return saveStudy(session, user.id, query, translation, result)
}

export async function obtenerHistorial() { return obtenerHistorialBase() }
export async function obtenerNota(pasaje: string) { return obtenerNotaBase(pasaje) }
export async function guardarNota(pasaje: string, nota: string) { return guardarNotaBase(pasaje, nota) }
