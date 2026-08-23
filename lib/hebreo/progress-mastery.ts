import {
  HEBREW_PRACTICE_QUESTIONS,
  SKILL_ORDER,
  type HebrewDifficulty,
  type HebrewPracticeQuestion,
  type HebrewProgressAnswer,
  type HebrewProgressSession,
  type HebrewSkill,
} from '@/lib/hebreo/progress'

const EXTRA_QUESTIONS: readonly HebrewPracticeQuestion[] = [
  { key: 'letter-he', version: 1, skill: 'alef_bet', difficulty: 'initial', type: 'Reconocer', prompt: '¿Cuál de estas letras es He?', options: ['ה', 'ח', 'ת'], correctIndex: 0, explanation: 'He se escribe ה.' },
  { key: 'letter-vav', version: 1, skill: 'alef_bet', difficulty: 'initial', type: 'Reconocer', prompt: '¿Cuál de estas letras es Vav?', options: ['ז', 'ו', 'י'], correctIndex: 1, explanation: 'Vav se escribe ו.' },
  { key: 'letter-zayin', version: 1, skill: 'alef_bet', difficulty: 'initial', type: 'Reconocer', prompt: '¿Cuál de estas letras es Zayin?', options: ['ז', 'ו', 'ן'], correctIndex: 0, explanation: 'Zayin se escribe ז.' },
  { key: 'letter-het', version: 1, skill: 'alef_bet', difficulty: 'initial', type: 'Reconocer', prompt: '¿Cuál de estas letras es Jet?', options: ['ה', 'ח', 'ת'], correctIndex: 1, explanation: 'Jet se escribe ח.' },
  { key: 'letter-tet', version: 1, skill: 'alef_bet', difficulty: 'initial', type: 'Reconocer', prompt: '¿Cuál de estas letras es Tet?', options: ['ט', 'ת', 'ס'], correctIndex: 0, explanation: 'Tet se escribe ט.' },
  { key: 'letter-kaf', version: 1, skill: 'alef_bet', difficulty: 'initial', type: 'Reconocer', prompt: '¿Cuál de estas letras es Kaf?', options: ['כ', 'ב', 'פ'], correctIndex: 0, explanation: 'Kaf se escribe כ.' },
  { key: 'letter-nun', version: 1, skill: 'alef_bet', difficulty: 'initial', type: 'Reconocer', prompt: '¿Cuál de estas letras es Nun?', options: ['נ', 'ג', 'ז'], correctIndex: 0, explanation: 'Nun se escribe נ.' },
  { key: 'letter-samekh', version: 1, skill: 'alef_bet', difficulty: 'initial', type: 'Reconocer', prompt: '¿Cuál de estas letras es Samej?', options: ['ס', 'ם', 'ע'], correctIndex: 0, explanation: 'Samej se escribe ס.' },
  { key: 'letter-ayin', version: 1, skill: 'alef_bet', difficulty: 'initial', type: 'Reconocer', prompt: '¿Cuál de estas letras es Ayin?', options: ['א', 'ע', 'צ'], correctIndex: 1, explanation: 'Ayin se escribe ע.' },
  { key: 'letter-pe', version: 1, skill: 'alef_bet', difficulty: 'initial', type: 'Reconocer', prompt: '¿Cuál de estas letras es Pe?', options: ['פ', 'כ', 'ב'], correctIndex: 0, explanation: 'Pe se escribe פ.' },
  { key: 'letter-tsadi', version: 1, skill: 'alef_bet', difficulty: 'initial', type: 'Reconocer', prompt: '¿Cuál de estas letras es Tsadi?', options: ['צ', 'ע', 'ץ'], correctIndex: 0, explanation: 'Tsadi en forma normal se escribe צ.' },
  { key: 'letter-qof', version: 1, skill: 'alef_bet', difficulty: 'initial', type: 'Reconocer', prompt: '¿Cuál de estas letras es Qof?', options: ['ק', 'ר', 'כ'], correctIndex: 0, explanation: 'Qof se escribe ק.' },
  { key: 'letter-shin', version: 1, skill: 'alef_bet', difficulty: 'initial', type: 'Reconocer', prompt: '¿Cuál de estas letras es Shin?', options: ['ש', 'ס', 'צ'], correctIndex: 0, explanation: 'Shin se escribe ש.' },
  { key: 'visual-vav-zayin', version: 1, skill: 'visual_recognition', difficulty: 'initial', type: 'Distinguir', prompt: 'Selecciona Zayin y no Vav.', options: ['ו', 'ז', 'י'], correctIndex: 1, explanation: 'ז es Zayin; ו es Vav.' },
  { key: 'visual-kaf-bet', version: 1, skill: 'visual_recognition', difficulty: 'initial', type: 'Distinguir', prompt: 'Selecciona Kaf y no Bet.', options: ['ב', 'כ', 'פ'], correctIndex: 1, explanation: 'כ es Kaf.' },
  { key: 'sofit-nun-initial', version: 1, skill: 'sofit', difficulty: 'initial', type: 'Sofit', prompt: '¿Cuál es Nun final?', options: ['ן', 'נ', 'ז'], correctIndex: 0, explanation: 'ן es Nun final.' },
  { key: 'sofit-pe-initial', version: 1, skill: 'sofit', difficulty: 'initial', type: 'Sofit', prompt: '¿Cuál es Pe final?', options: ['ף', 'פ', 'ץ'], correctIndex: 0, explanation: 'ף es Pe final.' },
  { key: 'sofit-tsadi-initial', version: 1, skill: 'sofit', difficulty: 'initial', type: 'Sofit', prompt: '¿Cuál es Tsadi final?', options: ['ץ', 'צ', 'ן'], correctIndex: 0, explanation: 'ץ es Tsadi final.' },
  { key: 'dagesh-kaf-initial', version: 1, skill: 'dagesh', difficulty: 'initial', type: 'Dagesh', prompt: '¿Cuál forma muestra Kaf con dagesh?', options: ['כּ', 'כ', 'ך'], correctIndex: 0, explanation: 'כּ contiene dagesh.' },
  { key: 'niqqud-hiriq-initial', version: 1, skill: 'niqqud', difficulty: 'initial', type: 'Vocales', prompt: '¿Qué signo vocálico aparece?', hebrew: 'לִ', options: ['Hiriq', 'Pataj', 'Segol'], correctIndex: 0, explanation: 'El punto bajo la letra es Hiriq.' },
  { key: 'niqqud-segol-initial', version: 1, skill: 'niqqud', difficulty: 'initial', type: 'Vocales', prompt: '¿Qué signo vocálico aparece?', hebrew: 'לֶ', options: ['Segol', 'Tsere', 'Qamats'], correctIndex: 0, explanation: 'Segol se reconoce por tres puntos.' },
  { key: 'niqqud-tsere-initial', version: 1, skill: 'niqqud', difficulty: 'initial', type: 'Vocales', prompt: '¿Qué signo vocálico aparece?', hebrew: 'לֵ', options: ['Tsere', 'Segol', 'Sheva'], correctIndex: 0, explanation: 'Tsere se reconoce por dos puntos horizontales.' },
  { key: 'niqqud-qamats-initial', version: 1, skill: 'niqqud', difficulty: 'initial', type: 'Vocales', prompt: '¿Qué signo vocálico aparece?', hebrew: 'לָ', options: ['Qamats', 'Pataj', 'Hiriq'], correctIndex: 0, explanation: 'El signo mostrado es Qamats.' },
  { key: 'sheva-vs-hiriq', version: 1, skill: 'sheva', difficulty: 'initial', type: 'Sheva', prompt: '¿Cuál opción muestra Sheva?', options: ['לְ', 'לִ', 'לַ'], correctIndex: 0, explanation: 'לְ muestra Sheva bajo la letra.' },
  { key: 'vocab-bayit-basic', version: 1, skill: 'vocabulary', difficulty: 'initial', type: 'Palabras', prompt: '¿Qué significa esta palabra?', hebrew: 'בַּיִת', options: ['Casa', 'Rey', 'Paz'], correctIndex: 0, explanation: 'בַּיִת · báyit · casa.' },
  { key: 'vocab-tov-basic', version: 1, skill: 'vocabulary', difficulty: 'initial', type: 'Palabras', prompt: '¿Qué significa טוֹב en esta práctica?', hebrew: 'טוֹב', options: ['Bueno', 'Casa', 'Rey'], correctIndex: 0, explanation: 'טוֹב · tov · bueno.' },

  { key: 'intermediate-sofit-map', version: 1, skill: 'sofit', difficulty: 'intermediate', type: 'Sofit', prompt: '¿Qué par muestra forma normal y final de Mem?', options: ['מ · ם', 'נ · ן', 'כ · ך'], correctIndex: 0, explanation: 'Mem normal מ pasa a ם al final.' },
  { key: 'intermediate-dagesh-bet-sound', version: 1, skill: 'dagesh', difficulty: 'intermediate', type: 'Dagesh', prompt: 'En la pronunciación pedagógica utilizada, ¿qué forma suele representar /b/?', options: ['בּ', 'ב', 'ו'], correctIndex: 0, explanation: 'Bet con dagesh בּ suele representar /b/ en la pronunciación pedagógica utilizada.' },
  { key: 'intermediate-dagesh-bet-vet', version: 1, skill: 'dagesh', difficulty: 'intermediate', type: 'Dagesh', prompt: 'En la pronunciación pedagógica utilizada, ¿qué forma se practica como /v/?', options: ['ב', 'בּ', 'פּ'], correctIndex: 0, explanation: 'Bet sin dagesh ב se practica aquí como /v/.' },
  { key: 'intermediate-vowels-ae', version: 1, skill: 'niqqud', difficulty: 'intermediate', type: 'Vocales', prompt: '¿Cuál secuencia muestra Pataj y luego Tsere?', options: ['לַ · לֵ', 'לֵ · לַ', 'לֶ · לִ'], correctIndex: 0, explanation: 'לַ contiene Pataj y לֵ contiene Tsere.' },
  { key: 'intermediate-vowels-ei', version: 1, skill: 'niqqud', difficulty: 'intermediate', type: 'Vocales', prompt: '¿Cuál secuencia muestra Segol y luego Hiriq?', options: ['לֶ · לִ', 'לִ · לֶ', 'לֵ · לָ'], correctIndex: 0, explanation: 'לֶ contiene Segol y לִ contiene Hiriq.' },
  { key: 'intermediate-vocab-shalom-reading', version: 1, skill: 'vocabulary', difficulty: 'intermediate', type: 'Palabras', prompt: 'Selecciona la lectura practicada.', hebrew: 'שָׁלוֹם', options: ['shalóm', 'báyit', 'mélej'], correctIndex: 0, explanation: 'שָׁלוֹם se practica como shalóm.' },
  { key: 'intermediate-vocab-melekh-reading', version: 1, skill: 'vocabulary', difficulty: 'intermediate', type: 'Palabras', prompt: 'Selecciona la lectura practicada.', hebrew: 'מֶלֶךְ', options: ['mélej', 'shalóm', 'tov'], correctIndex: 0, explanation: 'מֶלֶךְ se practica como mélej.' },
  { key: 'intermediate-reading-bayit', version: 1, skill: 'reading', difficulty: 'intermediate', type: 'Lectura', prompt: '¿Cuál lectura corresponde?', hebrew: 'בַּיִת', options: ['báyit', 'bará', 'mélej'], correctIndex: 0, explanation: 'בַּיִת se practica como báyit.' },
  { key: 'intermediate-rule-preposition-b', version: 1, skill: 'rules', difficulty: 'intermediate', type: 'Reglas', prompt: '¿Qué tipo de elemento se estudia con בְּ al inicio de palabra?', hebrew: 'בְּ', options: ['Preposición inseparable', 'Forma final', 'Artículo definido'], correctIndex: 0, explanation: 'בְּ se estudia entre las preposiciones inseparables.' },
  { key: 'intermediate-rule-preposition-l', version: 1, skill: 'rules', difficulty: 'intermediate', type: 'Reglas', prompt: '¿Qué tipo de elemento se estudia con לְ al inicio de palabra?', hebrew: 'לְ', options: ['Preposición inseparable', 'Sofit', 'Dagesh'], correctIndex: 0, explanation: 'לְ se estudia entre las preposiciones inseparables.' },
  { key: 'intermediate-rule-preposition-k', version: 1, skill: 'rules', difficulty: 'intermediate', type: 'Reglas', prompt: '¿Qué tipo de elemento se estudia con כְּ al inicio de palabra?', hebrew: 'כְּ', options: ['Preposición inseparable', 'Artículo definido', 'Forma final'], correctIndex: 0, explanation: 'כְּ se estudia entre las preposiciones inseparables.' },

  { key: 'advanced-contrast-bet', version: 1, skill: 'dagesh', difficulty: 'advanced', type: 'Dagesh', prompt: 'Selecciona la pareja que contrasta Bet con y sin dagesh.', options: ['בּ · ב', 'כּ · כ', 'פּ · פ'], correctIndex: 0, explanation: 'בּ y ב contrastan la misma letra con y sin dagesh.' },
  { key: 'advanced-construct-order', version: 1, skill: 'rules', difficulty: 'advanced', type: 'Reglas', prompt: '¿Cuál expresión corresponde a «la casa del rey» en la práctica?', hebrew: 'בֵּית הַמֶּלֶךְ', options: ['בֵּית הַמֶּלֶךְ', 'הַמֶּלֶךְ בֵּית', 'בַּיִת מֶלֶךְ'], correctIndex: 0, explanation: 'בֵּית הַמֶּלֶךְ practica el estado constructo «la casa del rey».' },
  { key: 'advanced-unpointed-melekh', version: 1, skill: 'reading', difficulty: 'advanced', type: 'Lectura sin niqqud', prompt: '¿Cuál forma conserva las consonantes de מֶלֶךְ?', hebrew: 'מֶלֶךְ', options: ['מלך', 'מלאך', 'מלכה'], correctIndex: 0, explanation: 'Sin niqqud se conserva מלך.' },
  { key: 'advanced-unpointed-tov', version: 1, skill: 'reading', difficulty: 'advanced', type: 'Lectura sin niqqud', prompt: '¿Cuál forma conserva טוֹב sin signos vocálicos?', hebrew: 'טוֹב', options: ['טוב', 'טב', 'תוב'], correctIndex: 0, explanation: 'Sin niqqud se conserva טוב.' },
  { key: 'advanced-unpointed-house-king', version: 1, skill: 'reading', difficulty: 'advanced', type: 'Lectura sin niqqud', prompt: '¿Cuál opción conserva la expresión completa sin niqqud?', hebrew: 'בֵּית הַמֶּלֶךְ', options: ['בית המלך', 'בית מלך', 'בת המלך'], correctIndex: 0, explanation: 'Al retirar los signos se conserva בית המלך.' },
] as const

export const ALL_HEBREW_PRACTICE_QUESTIONS: readonly HebrewPracticeQuestion[] = [...HEBREW_PRACTICE_QUESTIONS, ...EXTRA_QUESTIONS]

const RETENTION_AFTER_MS = 7 * 24 * 60 * 60 * 1000

function objectiveAnswers(answers: HebrewProgressAnswer[]) {
  return answers.filter(answer => !answer.question_key.startsWith('review:'))
}

function latestByQuestion(answers: HebrewProgressAnswer[]) {
  const latest = new Map<string, HebrewProgressAnswer>()
  for (const answer of [...objectiveAnswers(answers)].sort((a, b) => Date.parse(a.answered_at) - Date.parse(b.answered_at))) latest.set(answer.question_key, answer)
  return latest
}

function historyByQuestion(answers: HebrewProgressAnswer[]) {
  const rows = new Map<string, HebrewProgressAnswer[]>()
  for (const answer of objectiveAnswers(answers)) rows.set(answer.question_key, [...(rows.get(answer.question_key) ?? []), answer])
  return rows
}

export type LevelMastery = {
  difficulty: HebrewDifficulty
  total: number
  mastered: number
  coverage: number
  accuracy: number
  unresolved: number
  retentionDue: number
  passed: boolean
}

export function deriveLevelMastery(answers: HebrewProgressAnswer[], difficulty: HebrewDifficulty): LevelMastery {
  const pool = ALL_HEBREW_PRACTICE_QUESTIONS.filter(question => question.difficulty === difficulty)
  const latest = latestByQuestion(answers)
  const ownAnswers = objectiveAnswers(answers).filter(answer => answer.difficulty === difficulty)
  const mastered = pool.filter(question => latest.get(question.key)?.is_correct).length
  const coverage = pool.length ? Math.round((mastered / pool.length) * 100) : 0
  const accuracy = ownAnswers.length ? Math.round((ownAnswers.filter(answer => answer.is_correct).length / ownAnswers.length) * 100) : 0
  const now = Date.now()
  const retentionDue = pool.filter(question => {
    const row = latest.get(question.key)
    return Boolean(row?.is_correct && now - Date.parse(row.answered_at) >= RETENTION_AFTER_MS)
  }).length
  const unresolved = pool.length - mastered
  return { difficulty, total: pool.length, mastered, coverage, accuracy, unresolved, retentionDue, passed: pool.length > 0 && mastered === pool.length && accuracy >= 85 }
}

export function deriveStrictAdaptiveLevel(answers: HebrewProgressAnswer[]) {
  const initial = deriveLevelMastery(answers, 'initial')
  const intermediate = deriveLevelMastery(answers, 'intermediate')
  const advanced = deriveLevelMastery(answers, 'advanced')
  if (initial.passed && intermediate.passed) return { level: 3, label: 'Avanzado', progress: advanced.coverage, mastery: advanced }
  if (initial.passed) return { level: 2, label: 'Intermedio', progress: intermediate.coverage, mastery: intermediate }
  return { level: 1, label: 'Básico', progress: initial.coverage, mastery: initial }
}

function candidateScore(question: HebrewPracticeQuestion, answers: HebrewProgressAnswer[]) {
  const rows = historyByQuestion(answers).get(question.key) ?? []
  if (!rows.length) return 1000 - SKILL_ORDER.indexOf(question.skill) * 4
  const latest = [...rows].sort((a, b) => Date.parse(b.answered_at) - Date.parse(a.answered_at))[0]
  if (!latest.is_correct) return 900 + rows.filter(row => !row.is_correct).length * 20
  if (latest.review_requested) return 850
  if (Date.now() - Date.parse(latest.answered_at) >= RETENTION_AFTER_MS) return 300
  return -1000
}

function rotate<T>(rows: readonly T[], limit: number) {
  return [...rows].slice(0, Math.max(1, limit))
}

export function selectMasteryQuestions(answers: HebrewProgressAnswer[], difficulty: HebrewDifficulty, focusAreas: HebrewSkill[] = [], limit = 15) {
  const pool = ALL_HEBREW_PRACTICE_QUESTIONS.filter(question => question.difficulty === difficulty && (!focusAreas.length || focusAreas.includes(question.skill)))
  const eligible = pool.filter(question => candidateScore(question, answers) > 0).sort((a, b) => candidateScore(b, answers) - candidateScore(a, answers))
  if (eligible.length) return rotate(eligible, limit)
  const due = pool.filter(question => candidateScore(question, answers) >= 300).sort((a, b) => candidateScore(b, answers) - candidateScore(a, answers))
  return rotate(due.length ? due : pool, limit)
}

export function selectStrictAdaptiveQuestions(answers: HebrewProgressAnswer[], focusAreas: HebrewSkill[] = [], limit = 15) {
  const level = deriveStrictAdaptiveLevel(answers)
  const difficulty: HebrewDifficulty = level.level === 1 ? 'initial' : level.level === 2 ? 'intermediate' : 'advanced'
  return selectMasteryQuestions(answers, difficulty, focusAreas, limit)
}

export type SessionGrade = {
  id: string
  status: HebrewProgressSession['status']
  startedAt: string
  difficulty: HebrewDifficulty | null
  mode: HebrewProgressSession['mode']
  answers: number
  correct: number
  score: number
}

export function deriveSessionGrades(sessions: HebrewProgressSession[], answers: HebrewProgressAnswer[]) {
  const objective = objectiveAnswers(answers)
  return sessions.map(session => {
    const own = objective.filter(answer => answer.session_id === session.id)
    return {
      id: session.id,
      status: session.status,
      startedAt: session.started_at,
      difficulty: session.requested_difficulty,
      mode: session.mode,
      answers: own.length,
      correct: own.filter(answer => answer.is_correct).length,
      score: own.length ? Math.round((own.filter(answer => answer.is_correct).length / own.length) * 100) : 0,
    }
  }).filter(row => row.answers > 0).sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
}
