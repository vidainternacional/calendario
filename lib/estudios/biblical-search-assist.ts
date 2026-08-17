import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { VidaAiError, vidaAI } from '@/lib/ai/vida-ai'
import {
  normalizeBiblicalSearchQuery,
  scoreBiblicalSearchCandidate,
  tokenizeBiblicalSearchQuery,
} from '@/lib/estudios/biblical-search-ranking'
import { relatedApprovedThemeLabels } from '@/lib/estudios/biblical-search-relations'

export type AsistenciaTemaBiblico =
  | { kind: 'resolved'; label: string; query: string; score: number }
  | { kind: 'suggestions'; suggestions: Array<{ label: string; query: string; detail: string; score: number }> }
  | null

function extractJsonObject(value: string) {
  const trimmed = value.trim()
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  const start = withoutFence.indexOf('{')
  const end = withoutFence.lastIndexOf('}')
  if (start < 0 || end <= start) return null

  try {
    return JSON.parse(withoutFence.slice(start, end + 1)) as unknown
  } catch {
    return null
  }
}

function normalizeLabelMap(terms: Array<{ canonical_term: string }>) {
  const labels = new Map<string, string>()
  for (const term of terms) labels.set(normalizeBiblicalSearchQuery(term.canonical_term), term.canonical_term)
  return labels
}

async function interpretarConIaEconomica({
  query,
  ownerId,
  approvedLabels,
}: {
  query: string
  ownerId: string
  approvedLabels: string[]
}): Promise<AsistenciaTemaBiblico> {
  if (!approvedLabels.length) return null

  try {
    const generated = await vidaAI({
      task: 'interpretar_busqueda_biblica',
      ownerId,
      input: JSON.stringify({
        consulta: query,
        temas_aprobados: approvedLabels.slice(0, 80),
      }),
      instructions: [
        'Interpreta una consulta de búsqueda bíblica en español.',
        'No cites ni inventes versículos, referencias, concordancias o doctrinas.',
        'Solo puedes seleccionar etiquetas que aparezcan exactamente en temas_aprobados.',
        'Responde únicamente JSON válido con esta forma:',
        '{"primary": string|null, "alternatives": string[]}.',
        'Usa primary solo cuando exista un tema aprobado razonablemente equivalente o claramente pertinente.',
        'Si solo hay temas relacionados, colócalos en alternatives. Si no hay relación suficiente, devuelve primary null y alternatives [].',
      ].join(' '),
    })

    const parsed = extractJsonObject(generated.text)
    if (!parsed || typeof parsed !== 'object') return null

    const typed = parsed as { primary?: unknown; alternatives?: unknown }
    const allowed = new Map(approvedLabels.map(label => [normalizeBiblicalSearchQuery(label), label]))
    const primary = typeof typed.primary === 'string'
      ? allowed.get(normalizeBiblicalSearchQuery(typed.primary)) ?? null
      : null

    const alternatives = Array.isArray(typed.alternatives)
      ? Array.from(new Set(
          typed.alternatives
            .filter((item): item is string => typeof item === 'string')
            .map(item => allowed.get(normalizeBiblicalSearchQuery(item)))
            .filter((item): item is string => Boolean(item))
        )).filter(label => label !== primary).slice(0, 4)
      : []

    if (primary) return { kind: 'resolved', label: primary, query: primary, score: 0.76 }
    if (alternatives.length > 0) {
      return {
        kind: 'suggestions',
        suggestions: alternatives.map((label, index) => ({
          label,
          query: label,
          detail: 'Tema aprobado relacionado con su consulta',
          score: 0.72 - index * 0.03,
        })),
      }
    }
  } catch (error) {
    if (error instanceof VidaAiError) return null
    return null
  }

  return null
}

export async function asistirTemaBiblico(rawQuery: string): Promise<AsistenciaTemaBiblico> {
  const query = rawQuery.trim()
  const normalizedQuery = normalizeBiblicalSearchQuery(query)
  if (!normalizedQuery || normalizedQuery.length < 3 || normalizedQuery.length > 180) return null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: terms, error: termError }, { data: aliases, error: aliasError }] = await Promise.all([
    (supabase as any)
      .from('biblical_concordance_terms')
      .select('id, canonical_term, normalized_term, description')
      .eq('enabled', true)
      .eq('review_status', 'approved')
      .limit(500),
    (supabase as any)
      .from('biblical_concordance_aliases')
      .select('term_id, alias, normalized_alias, alias_kind')
      .eq('enabled', true)
      .eq('review_status', 'approved')
      .limit(2500),
  ])

  if (termError || aliasError) {
    console.error('[biblical-search-assist] No se pudo cargar el índice:', termError ?? aliasError)
    return null
  }

  const typedTerms = (terms ?? []) as Array<{
    id: string
    canonical_term: string
    normalized_term: string
    description: string | null
  }>
  const aliasesByTerm = new Map<string, string[]>()
  for (const alias of aliases ?? []) {
    const values = aliasesByTerm.get(alias.term_id) ?? []
    values.push(alias.alias, alias.normalized_alias)
    aliasesByTerm.set(alias.term_id, values)
  }

  const ranked = typedTerms
    .map(term => ({
      id: term.id,
      label: term.canonical_term,
      query: term.canonical_term,
      score: scoreBiblicalSearchCandidate(query, [
        { value: term.canonical_term, weight: 1 },
        { value: term.normalized_term, weight: 1 },
        ...(aliasesByTerm.get(term.id) ?? []).map(value => ({ value, weight: 0.98 })),
        ...(term.description ? [{ value: term.description, weight: 0.55 }] : []),
      ]),
    }))
    .filter(candidate => candidate.score >= 0.62)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, 'es'))
    .slice(0, 5)

  if (ranked.length > 0) {
    const best = ranked[0]
    const runnerUp = ranked[1]
    const meaningfulTokens = tokenizeBiblicalSearchQuery(query)
    const confident = meaningfulTokens.length <= 4
      && best.score >= 0.82
      && (best.score >= 0.94 || !runnerUp || best.score - runnerUp.score >= 0.08)

    if (confident) {
      return { kind: 'resolved', label: best.label, query: best.query, score: best.score }
    }

    return {
      kind: 'suggestions',
      suggestions: ranked.slice(0, 4).map(candidate => ({
        label: candidate.label,
        query: candidate.query,
        detail: 'Tema bíblico relacionado',
        score: candidate.score,
      })),
    }
  }

  const labelMap = normalizeLabelMap(typedTerms)
  const controlledSuggestions = relatedApprovedThemeLabels(query)
    .map(label => labelMap.get(normalizeBiblicalSearchQuery(label)))
    .filter((label): label is string => Boolean(label))
    .slice(0, 4)

  if (controlledSuggestions.length > 0) {
    return {
      kind: 'suggestions',
      suggestions: controlledSuggestions.map((label, index) => ({
        label,
        query: label,
        detail: 'Tema aprobado relacionado con su búsqueda',
        score: 0.74 - index * 0.03,
      })),
    }
  }

  return interpretarConIaEconomica({
    query,
    ownerId: user.id,
    approvedLabels: typedTerms.map(term => term.canonical_term),
  })
}
