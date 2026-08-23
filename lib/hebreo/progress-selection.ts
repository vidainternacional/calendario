import type { HebrewDifficulty, HebrewProgressAnswer, HebrewSkill } from '@/lib/hebreo/progress'
import { selectMasteryQuestions, selectStrictAdaptiveQuestions } from '@/lib/hebreo/progress-mastery'

const RETENTION_AFTER_MS = 7 * 24 * 60 * 60 * 1000

function latestObjectiveByKey(answers: HebrewProgressAnswer[]) {
  const latest = new Map<string, HebrewProgressAnswer>()
  for (const answer of [...answers]
    .filter(row => !row.question_key.startsWith('review:'))
    .sort((a, b) => Date.parse(a.answered_at) - Date.parse(b.answered_at))) {
    latest.set(answer.question_key, answer)
  }
  return latest
}

function removeRecentlyMastered<T extends { key: string }>(questions: readonly T[], answers: HebrewProgressAnswer[]) {
  const latest = latestObjectiveByKey(answers)
  const now = Date.now()
  return questions.filter(question => {
    const row = latest.get(question.key)
    if (!row) return true
    if (!row.is_correct || row.review_requested) return true
    return now - Date.parse(row.answered_at) >= RETENTION_AFTER_MS
  })
}

export function selectNonRepeatingDifficultyQuestions(answers: HebrewProgressAnswer[], difficulty: HebrewDifficulty, focusAreas: HebrewSkill[] = [], limit = 15) {
  return removeRecentlyMastered(selectMasteryQuestions(answers, difficulty, focusAreas, Math.max(limit, 100)), answers).slice(0, limit)
}

export function selectNonRepeatingAdaptiveQuestions(answers: HebrewProgressAnswer[], focusAreas: HebrewSkill[] = [], limit = 15) {
  return removeRecentlyMastered(selectStrictAdaptiveQuestions(answers, focusAreas, Math.max(limit, 100)), answers).slice(0, limit)
}
