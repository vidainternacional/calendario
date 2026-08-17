import {
  normalizeBiblicalSearchQuery,
  scoreBiblicalSearchCandidate,
} from '@/lib/estudios/biblical-search-ranking'

type ControlledRelation = {
  cues: string[]
  themes: string[]
}

const CONTROLLED_RELATED_TOPICS: ControlledRelation[] = [
  { cues: ['odio', 'odiar', 'enemistad', 'rencor', 'resentimiento', 'aborrecer', 'hostilidad'], themes: ['Amor', 'Perdón', 'Paz'] },
  { cues: ['tristeza', 'triste', 'melancolia', 'desconsuelo', 'desanimado', 'desanimada'], themes: ['Esperanza', 'Sufrimiento', 'Duelo y muerte'] },
  { cues: ['ira', 'enojo', 'enojado', 'enojada', 'rabia', 'furia'], themes: ['Paz', 'Perdón', 'Palabras y comunicación'] },
  { cues: ['soledad', 'solo', 'sola', 'abandonado', 'abandonada'], themes: ['Amistad', 'Iglesia y comunidad', 'Esperanza'] },
  { cues: ['envidia', 'celos', 'celoso', 'celosa'], themes: ['Gratitud', 'Amor', 'Pecado'] },
  { cues: ['verguenza', 'avergonzado', 'avergonzada'], themes: ['Identidad y propósito', 'Perdón', 'Esperanza'] },
  { cues: ['fracaso', 'fracasar', 'falle', 'fallar'], themes: ['Esperanza', 'Identidad y propósito', 'Perdón'] },
  { cues: ['confusion', 'confundido', 'confundida', 'no se que hacer'], themes: ['Sabiduría', 'Paz'] },
]

export function relatedApprovedThemeLabels(rawQuery: string) {
  const query = normalizeBiblicalSearchQuery(rawQuery)
  if (!query) return [] as string[]

  const ranked = CONTROLLED_RELATED_TOPICS
    .map(relation => ({
      relation,
      score: scoreBiblicalSearchCandidate(query, relation.cues),
    }))
    .filter(item => item.score >= 0.68)
    .sort((a, b) => b.score - a.score)

  return Array.from(new Set(ranked.flatMap(item => item.relation.themes))).slice(0, 5)
}
