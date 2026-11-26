import type { EstudioState } from '@/app/actions/estudio-interno'

export type SavedStudyState = Extract<EstudioState, { status: 'success' | 'place' }>
export type StudyHistoryItem = { id: string; consulta: string; created_at: string; tipo: 'study' | 'concordance' | 'place' }
export type StudyHistoryPage = { success: true; items: StudyHistoryItem[]; hasMore: boolean; total: number } | { success: false; error: string }
export type StudyHistoryReceipt = { id: string; createdAt: string; reused: boolean }
