'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { HebrewDifficulty, HebrewProgressAnswer, HebrewProgressMode, HebrewProgressSession, HebrewSkill } from '@/lib/hebreo/progress'

const REVIEW_TO_PRACTICE_KEY: Record<string, string> = {
  bet: 'letter-bet',
  pataj: 'niqqud-patah',
  melekh: 'vocab-melekh',
  'bereshit-bara': 'reading-bereshit-bara',
  article: 'rule-article',
  'kaf-final': 'sofit-kaf',
  tsere: 'niqqud-tsere',
  construct: 'rule-construct',
  shalom: 'vocab-shalom',
  segol: 'niqqud-segol',
  sheva: 'sheva-recognition',
  'qamats-qatan': 'niqqud-qamats-qatan',
  'furtive-pataj': 'reading-furtive-patah',
  'ha-davar-tov': 'reading-ha-davar-tov',
}

function client() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

async function profileId() {
  const supabase = client()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Necesitas una sesión activa para guardar tu progreso.')
  return { supabase, profileId: data.user.id }
}

export async function loadHebrewProgress(): Promise<{ sessions: HebrewProgressSession[]; answers: HebrewProgressAnswer[] }> {
  const { supabase } = await profileId()
  const [sessionsResult, answersResult] = await Promise.all([
    supabase.from('biblical_hebrew_progress_sessions').select('id,mode,requested_difficulty,focus_areas,status,started_at,ended_at').order('started_at', { ascending: false }).limit(60),
    supabase.from('biblical_hebrew_progress_answers').select('id,session_id,question_key,skill,difficulty,response_text,is_correct,review_requested,response_time_ms,answered_at').order('answered_at', { ascending: false }).limit(800),
  ])
  if (sessionsResult.error) throw sessionsResult.error
  if (answersResult.error) throw answersResult.error
  return {
    sessions: (sessionsResult.data ?? []) as HebrewProgressSession[],
    answers: (answersResult.data ?? []) as HebrewProgressAnswer[],
  }
}

export async function startHebrewProgressSession(mode: HebrewProgressMode, difficulty: HebrewDifficulty | null, focusAreas: HebrewSkill[]) {
  const { supabase, profileId: owner } = await profileId()
  const { data, error } = await supabase.from('biblical_hebrew_progress_sessions').insert({ profile_id: owner, mode, requested_difficulty: mode === 'difficulty' ? difficulty : null, focus_areas: focusAreas }).select('id').single()
  if (error) throw error
  return data.id as string
}

export async function saveHebrewProgressAnswer(input: { sessionId: string; questionKey: string; questionVersion?: number; skill: HebrewSkill; difficulty: HebrewDifficulty; responseText: string; isCorrect: boolean; reviewRequested?: boolean; responseTimeMs?: number | null }) {
  const { supabase, profileId: owner } = await profileId()
  const { data: prior, error: priorError } = await supabase.from('biblical_hebrew_progress_answers').select('attempt_number').eq('session_id', input.sessionId).eq('question_key', input.questionKey).order('attempt_number', { ascending: false }).limit(1)
  if (priorError) throw priorError
  const attemptNumber = Math.min(((prior?.[0]?.attempt_number as number | undefined) ?? 0) + 1, 20)
  const responseTimeMs = input.responseTimeMs == null
    ? null
    : Math.max(0, Math.min(300000, Math.round(input.responseTimeMs)))
  const { data, error } = await supabase.from('biblical_hebrew_progress_answers').insert({
    session_id: input.sessionId,
    profile_id: owner,
    question_key: input.questionKey,
    question_version: input.questionVersion ?? 1,
    attempt_number: attemptNumber,
    skill: input.skill,
    difficulty: input.difficulty,
    response_text: input.responseText.slice(0, 500),
    is_correct: input.isCorrect,
    review_requested: input.reviewRequested ?? false,
    response_time_ms: responseTimeMs,
  }).select('id,session_id,question_key,skill,difficulty,response_text,is_correct,review_requested,response_time_ms,answered_at').single()
  if (error) throw error
  return data as HebrewProgressAnswer
}

export async function setHebrewReviewRequested(answerId: string, requested: boolean) {
  const { supabase } = await profileId()
  const { error } = await supabase.from('biblical_hebrew_progress_answers').update({ review_requested: requested }).eq('id', answerId)
  if (error) throw error
}

export async function finishHebrewProgressSession(sessionId: string, status: 'completed' | 'abandoned' = 'completed') {
  const { supabase } = await profileId()
  const now = new Date().toISOString()
  const { error } = await supabase.from('biblical_hebrew_progress_sessions').update({ status, ended_at: now, updated_at: now }).eq('id', sessionId)
  if (error) throw error
}

export async function saveHebrewReviewRating(input: { sessionId: string; itemId: string; skill: HebrewSkill; rating: 'know' | 'practice' | 'later'; responseText?: string }) {
  const practiceKey = REVIEW_TO_PRACTICE_KEY[input.itemId] ?? input.itemId
  return saveHebrewProgressAnswer({
    sessionId: input.sessionId,
    questionKey: `review:${practiceKey}`,
    skill: input.skill,
    difficulty: 'intermediate',
    responseText: input.responseText || input.rating,
    isCorrect: input.rating === 'know',
    reviewRequested: input.rating !== 'know',
    responseTimeMs: null,
  })
}
