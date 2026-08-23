export type HebrewProgressMode = 'adaptive' | 'difficulty'
export type HebrewDifficulty = 'initial' | 'intermediate' | 'advanced'
export type HebrewSkill = 'alef_bet' | 'visual_recognition' | 'sofit' | 'dagesh' | 'niqqud' | 'sheva' | 'vocabulary' | 'reading' | 'rules'
export type LearningState = 'Reforzar' | 'En progreso' | 'Dominado'

export type HebrewPracticeQuestion = {
  key: string
  version: number
  skill: HebrewSkill
  difficulty: HebrewDifficulty
  type: string
  prompt: string
  hebrew?: string
  options: readonly string[]
  correctIndex: number
  explanation: string
}

export type HebrewProgressSession = {
  id: string
  mode: HebrewProgressMode
  requested_difficulty: HebrewDifficulty | null
  focus_areas: HebrewSkill[]
  status: 'in_progress' | 'completed' | 'abandoned'
  started_at: string
  ended_at: string | null
}

export type HebrewProgressAnswer = {
  id: string
  session_id: string
  question_key: string
  skill: HebrewSkill
  difficulty: HebrewDifficulty
  response_text: string | null
  is_correct: boolean
  review_requested: boolean
  answered_at: string
}

export const SKILL_LABELS: Record<HebrewSkill, string> = {
  alef_bet: 'Alef-Bet',
  visual_recognition: 'Reconocimiento visual',
  sofit: 'Sofit',
  dagesh: 'Dagesh',
  niqqud: 'Vocales',
  sheva: 'Sheva',
  vocabulary: 'Palabras',
  reading: 'Lectura',
  rules: 'Reglas',
}

export const SKILL_ORDER: HebrewSkill[] = ['alef_bet', 'visual_recognition', 'sofit', 'dagesh', 'niqqud', 'sheva', 'vocabulary', 'reading', 'rules']

export const HEBREW_PRACTICE_QUESTIONS: readonly HebrewPracticeQuestion[] = [
  { key: 'letter-bet', version: 1, skill: 'alef_bet', difficulty: 'initial', type: 'Reconocer', prompt: '¿Cuál de estas letras es Bet?', options: ['ב', 'כ', 'פ'], correctIndex: 0, explanation: 'Bet se escribe ב.' },
  { key: 'letter-gimel', version: 1, skill: 'alef_bet', difficulty: 'initial', type: 'Reconocer', prompt: '¿Cuál de estas letras es Gimel?', options: ['נ', 'ג', 'ז'], correctIndex: 1, explanation: 'Gimel se escribe ג.' },
  { key: 'letter-lamed', version: 1, skill: 'alef_bet', difficulty: 'initial', type: 'Reconocer', prompt: 'Selecciona la letra Lamed.', options: ['ל', 'כ', 'מ'], correctIndex: 0, explanation: 'Lamed se escribe ל.' },
  { key: 'visual-dalet-resh', version: 1, skill: 'visual_recognition', difficulty: 'initial', type: 'Distinguir', prompt: 'Selecciona la letra diferente.', options: ['ד', 'ד', 'ר'], correctIndex: 2, explanation: 'ר es Resh; las otras dos opciones son Dalet.' },
  { key: 'visual-he-het', version: 1, skill: 'visual_recognition', difficulty: 'initial', type: 'Distinguir', prompt: '¿Cuál es He y no Jet?', options: ['ח', 'ה', 'ת'], correctIndex: 1, explanation: 'He se escribe ה; Jet se escribe ח.' },
  { key: 'sofit-mem', version: 1, skill: 'sofit', difficulty: 'initial', type: 'Sofit', prompt: '¿Cuál es una forma final?', options: ['מ', 'ם', 'ס'], correctIndex: 1, explanation: 'ם es Mem final.' },
  { key: 'sofit-kaf', version: 1, skill: 'sofit', difficulty: 'intermediate', type: 'Sofit', prompt: '¿Cuál es Kaf final?', options: ['ך', 'כ', 'ן'], correctIndex: 0, explanation: 'ך es Kaf final; כ es la forma normal.' },
  { key: 'dagesh-bet', version: 1, skill: 'dagesh', difficulty: 'initial', type: 'Dagesh', prompt: '¿Cuál opción contiene un punto dentro de la letra?', options: ['ב', 'בּ', 'כ'], correctIndex: 1, explanation: 'בּ contiene dagesh. En la pronunciación pedagógica usada, Bet con dagesh suele representar /b/.' },
  { key: 'niqqud-patah', version: 1, skill: 'niqqud', difficulty: 'initial', type: 'Vocales', prompt: '¿Qué signo vocálico aparece bajo la letra?', hebrew: 'לַ', options: ['Pataj', 'Tsere', 'Segol'], correctIndex: 0, explanation: 'El signo bajo ל es Pataj.' },
  { key: 'niqqud-tsere', version: 1, skill: 'niqqud', difficulty: 'intermediate', type: 'Vocales', prompt: 'Identifica el signo vocálico.', hebrew: 'לֵ', options: ['Segol', 'Tsere', 'Sheva'], correctIndex: 1, explanation: 'Tsere se reconoce aquí por dos puntos horizontales.' },
  { key: 'niqqud-segol', version: 1, skill: 'niqqud', difficulty: 'intermediate', type: 'Vocales', prompt: 'Identifica el signo vocálico.', hebrew: 'לֶ', options: ['Segol', 'Pataj', 'Holam'], correctIndex: 0, explanation: 'Segol se reconoce por sus tres puntos.' },
  { key: 'sheva-recognition', version: 1, skill: 'sheva', difficulty: 'initial', type: 'Sheva', prompt: '¿Qué signo aparece bajo la letra?', hebrew: 'לְ', options: ['Sheva', 'Pataj', 'Qamats'], correctIndex: 0, explanation: 'El signo mostrado es Sheva.' },
  { key: 'sheva-silent', version: 1, skill: 'sheva', difficulty: 'advanced', type: 'Sheva', prompt: 'En la lectura pedagógica de esta palabra, ¿el sheva bajo ל añade una vocal independiente?', hebrew: 'מַלְכָּה', options: ['Sí', 'No', 'Siempre depende solo de la grafía'], correctIndex: 1, explanation: 'Aquí se practica como sheva silencioso: mal-ká.' },
  { key: 'vocab-melekh', version: 1, skill: 'vocabulary', difficulty: 'initial', type: 'Palabras', prompt: '¿Qué significa esta palabra?', hebrew: 'מֶלֶךְ', options: ['Casa', 'Rey', 'Nombre'], correctIndex: 1, explanation: 'מֶלֶךְ · mélej · rey.' },
  { key: 'vocab-shalom', version: 1, skill: 'vocabulary', difficulty: 'initial', type: 'Palabras', prompt: '¿Qué significa esta palabra?', hebrew: 'שָׁלוֹם', options: ['Paz', 'Agua', 'Tierra'], correctIndex: 0, explanation: 'שָׁלוֹם · shalóm · paz.' },
  { key: 'vocab-bayit', version: 1, skill: 'vocabulary', difficulty: 'intermediate', type: 'Palabras', prompt: 'Selecciona la lectura que corresponde.', hebrew: 'בַּיִת', options: ['báyit', 'mélej', 'shalom'], correctIndex: 0, explanation: 'בַּיִת se practica aquí como báyit · casa.' },
  { key: 'reading-bereshit-bara', version: 1, skill: 'reading', difficulty: 'intermediate', type: 'Lectura', prompt: '¿Cuál lectura corresponde a la secuencia?', hebrew: 'בְּרֵאשִׁית בָּרָא', options: ['be-reshít bará', 'mélej shalóm', 'báyit tov'], correctIndex: 0, explanation: 'La lectura pedagógica usada es be-reshít bará.' },
  { key: 'reading-ha-davar-tov', version: 1, skill: 'reading', difficulty: 'advanced', type: 'Lectura', prompt: '¿Cuál lectura corresponde a la frase?', hebrew: 'הַדָּבָר הַטּוֹב', options: ['ha-davár ha-tóv', 'et ha-shamáyim', 'be-reshít bará'], correctIndex: 0, explanation: 'La lectura practicada es ha-davár ha-tóv.' },
  { key: 'rule-article', version: 1, skill: 'rules', difficulty: 'intermediate', type: 'Reglas', prompt: '¿Qué función cumple הַ al inicio de una palabra en esta práctica?', hebrew: 'הַ', options: ['Artículo definido', 'Forma final', 'Sufijo posesivo'], correctIndex: 0, explanation: 'הַ se estudia aquí como artículo definido, con variaciones fonológicas según la palabra.' },
  { key: 'rule-conjunction', version: 1, skill: 'rules', difficulty: 'intermediate', type: 'Reglas', prompt: '¿Qué función suele cumplir וְ?', hebrew: 'וְ', options: ['Conjunción', 'Artículo definido', 'Forma final'], correctIndex: 0, explanation: 'וְ suele funcionar como conjunción, normalmente «y», y su vocal puede variar.' },
  { key: 'rule-construct', version: 1, skill: 'rules', difficulty: 'advanced', type: 'Reglas', prompt: '¿Qué relación muestra esta expresión?', hebrew: 'בֵּית הַמֶּלֶךְ', options: ['Estado constructo', 'Plural absoluto', 'Forma final'], correctIndex: 0, explanation: 'La expresión practica el estado constructo: «la casa del rey».' },
  { key: 'rule-plural-im', version: 1, skill: 'rules', difficulty: 'advanced', type: 'Reglas', prompt: '¿Qué pista gramatical reconoces en טוֹבִים?', hebrew: 'טוֹבִים', options: ['Terminación plural frecuente ־ִים', 'Artículo definido', 'Sofit'], correctIndex: 0, explanation: '־ִים es una terminación plural frecuente, aunque no determina por sí sola todas las propiedades gramaticales.' },
  { key: 'niqqud-qamats-qatan', version: 1, skill: 'niqqud', difficulty: 'advanced', type: 'Vocales', prompt: '¿Cómo se practica el qamats de esta palabra?', hebrew: 'כָּל', options: ['kol, con qamats qatan', 'kal, como regla universal', 'sin vocal'], correctIndex: 0, explanation: 'En כָּל se reconoce qamats qatan con valor orientativo o; no todo qamats se decide igual.' },
  { key: 'reading-furtive-patah', version: 1, skill: 'reading', difficulty: 'advanced', type: 'Lectura', prompt: '¿Dónde se oye la a del pataj final en esta práctica?', hebrew: 'רוּחַ', options: ['Antes de la consonante final ח', 'Después de ח', 'No se pronuncia'], correctIndex: 0, explanation: 'En el pataj furtivo, la vocal se anticipa antes de la consonante final.' },
] as const

export type AreaMetric = { skill: HebrewSkill; attempts: number; correct: number; accuracy: number | null; state: LearningState }
export type ProgressMetrics = {
  totalAttempts: number
  accuracy: number | null
  areas: AreaMetric[]
  evolution: number | null
  retention: number | null
  trend: 'Mejorando' | 'Estable' | 'Necesita refuerzo' | 'Sin suficiente historial'
  recurringErrors: { questionKey: string; errors: number; skill: HebrewSkill }[]
  recommendation: string
}

function pct(correct: number, total: number) { return total ? Math.round((correct / total) * 100) : null }

export function deriveProgressMetrics(sessions: HebrewProgressSession[], answers: HebrewProgressAnswer[]): ProgressMetrics {
  const objective = answers.filter(answer => !answer.question_key.startsWith('review:'))
  const areas = SKILL_ORDER.map(skill => {
    const own = objective.filter(answer => answer.skill === skill)
    const accuracy = pct(own.filter(answer => answer.is_correct).length, own.length)
    let state: LearningState = 'En progreso'
    if (own.length >= 4 && (accuracy ?? 0) >= 85) state = 'Dominado'
    else if (own.length >= 3 && (accuracy ?? 100) < 65) state = 'Reforzar'
    return { skill, attempts: own.length, correct: own.filter(answer => answer.is_correct).length, accuracy, state }
  })

  const completed = sessions.filter(session => session.status === 'completed').sort((a, b) => Date.parse(a.started_at) - Date.parse(b.started_at))
  const sessionAccuracy = completed.map(session => {
    const own = objective.filter(answer => answer.session_id === session.id)
    return { id: session.id, accuracy: pct(own.filter(answer => answer.is_correct).length, own.length) }
  }).filter((item): item is { id: string; accuracy: number } => item.accuracy !== null)
  const evolution = sessionAccuracy.length >= 2 ? sessionAccuracy.at(-1)!.accuracy - sessionAccuracy.at(-2)!.accuracy : null

  const byQuestion = new Map<string, HebrewProgressAnswer[]>()
  for (const answer of objective) byQuestion.set(answer.question_key, [...(byQuestion.get(answer.question_key) ?? []), answer])
  const retentionCandidates: boolean[] = []
  const recurringErrors: { questionKey: string; errors: number; skill: HebrewSkill }[] = []
  for (const [questionKey, rows] of byQuestion) {
    const sorted = [...rows].sort((a, b) => Date.parse(a.answered_at) - Date.parse(b.answered_at))
    const errors = sorted.filter(row => !row.is_correct).length
    if (errors >= 2) recurringErrors.push({ questionKey, errors, skill: sorted.at(-1)!.skill })
    const last = sorted.at(-1)!
    if (sorted.slice(0, -1).some(row => row.is_correct)) retentionCandidates.push(last.is_correct)
  }
  recurringErrors.sort((a, b) => b.errors - a.errors)
  const retention = pct(retentionCandidates.filter(Boolean).length, retentionCandidates.length)

  let trend: ProgressMetrics['trend'] = 'Sin suficiente historial'
  if (sessionAccuracy.length >= 2) {
    const delta = evolution ?? 0
    trend = delta >= 8 ? 'Mejorando' : delta <= -8 ? 'Necesita refuerzo' : 'Estable'
  }

  const latestByQuestion = new Map<string, HebrewProgressAnswer>()
  for (const answer of [...answers].sort((a, b) => Date.parse(a.answered_at) - Date.parse(b.answered_at))) latestByQuestion.set(answer.question_key.replace(/^review:/, ''), answer)
  const reviewSkills = new Set([...latestByQuestion.values()].filter(answer => answer.review_requested).map(answer => answer.skill))
  const weakest = areas.filter(area => area.attempts > 0).sort((a, b) => (a.accuracy ?? 101) - (b.accuracy ?? 101))[0]
  let recommendation = 'Comienza con Alef-Bet y reconocimiento visual para crear tu primera línea base.'
  if (reviewSkills.size) recommendation = `Repasa ${SKILL_LABELS[[...reviewSkills][0]]}: tienes contenido marcado para volver a estudiar.`
  else if (recurringErrors.length) recommendation = `Refuerza ${SKILL_LABELS[recurringErrors[0].skill]}: allí aparece tu error recurrente más claro.`
  else if (weakest && weakest.state !== 'Dominado') recommendation = `Practica ${SKILL_LABELS[weakest.skill]}: es el área con menor precisión acumulada disponible.`
  else if (objective.length) {
    const next = areas.find(area => area.state !== 'Dominado')
    recommendation = next ? `Continúa con ${SKILL_LABELS[next.skill]} para ampliar el dominio.` : 'Mantén sesiones mixtas para conservar lo ya dominado.'
  }

  return { totalAttempts: objective.length, accuracy: pct(objective.filter(answer => answer.is_correct).length, objective.length), areas, evolution, retention, trend, recurringErrors: recurringErrors.slice(0, 5), recommendation }
}

export function selectAdaptiveQuestions(answers: HebrewProgressAnswer[], focusAreas: HebrewSkill[] = [], limit = 10) {
  const pool = HEBREW_PRACTICE_QUESTIONS.filter(question => !focusAreas.length || focusAreas.includes(question.skill))
  const rowsByKey = new Map<string, HebrewProgressAnswer[]>()
  for (const answer of answers) rowsByKey.set(answer.question_key.replace(/^review:/, ''), [...(rowsByKey.get(answer.question_key.replace(/^review:/, '')) ?? []), answer])
  return [...pool].sort((a, b) => score(b) - score(a)).slice(0, limit)

  function score(question: HebrewPracticeQuestion) {
    const rows = rowsByKey.get(question.key) ?? []
    if (!rows.length) return 35 - SKILL_ORDER.indexOf(question.skill) * 2 - (question.difficulty === 'initial' ? 0 : question.difficulty === 'intermediate' ? 5 : 10)
    const latest = [...rows].sort((x, y) => Date.parse(y.answered_at) - Date.parse(x.answered_at))[0]
    const errors = rows.filter(row => !row.is_correct && !row.question_key.startsWith('review:')).length
    const review = latest.review_requested ? 50 : 0
    const recentWrong = !latest.question_key.startsWith('review:') && !latest.is_correct ? 30 : 0
    return review + recentWrong + errors * 12 - Math.min(rows.length, 5)
  }
}

export function selectDifficultyQuestions(difficulty: HebrewDifficulty, focusAreas: HebrewSkill[] = [], limit = 10) {
  return HEBREW_PRACTICE_QUESTIONS.filter(question => question.difficulty === difficulty && (!focusAreas.length || focusAreas.includes(question.skill))).slice(0, limit)
}
