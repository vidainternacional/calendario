export type BiblicalQuestionSource = {
  id: string
  reference: string
  bookCode: string
  chapter: number
  verse: number
  text: string
  sourceName: string
  context: Array<{ chapter: number; verse: number; text: string }>
}

export type BiblicalAnswerParagraph = { text: string; citations: string[] }

export type BiblicalQuestionAnswer =
  | { status: 'answered'; paragraphs: BiblicalAnswerParagraph[]; sources: BiblicalQuestionSource[] }
  | { status: 'clarify'; question: string; sources: BiblicalQuestionSource[] }
  | { status: 'unconfigured' | 'unavailable' | 'insufficient'; sources: BiblicalQuestionSource[] }
