export type ReferenciaLexicaBiblica = {
  bookCode: 'PSA' | 'JHN'
  bookLabel: 'Salmos' | 'Juan'
  chapter: number
  verse: number | null
}

const BOOK_ALIASES = [
  {
    aliases: ['salmos', 'salmo', 'psalms', 'psalm', 'ps'],
    bookCode: 'PSA',
    bookLabel: 'Salmos',
  },
  {
    aliases: ['juan', 'john', 'jn', 'jhn'],
    bookCode: 'JHN',
    bookLabel: 'Juan',
  },
] as const

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function parsearReferenciaLexicaBiblica(
  value: string | null | undefined
): ReferenciaLexicaBiblica | null {
  if (!value) return null

  const normalized = normalize(value)
  const book = BOOK_ALIASES.find(({ aliases }) =>
    aliases.some((alias) => normalized === alias || normalized.startsWith(`${alias} `))
  )

  if (!book) return null

  const alias = book.aliases.find((candidate) =>
    normalized === candidate || normalized.startsWith(`${candidate} `)
  )
  if (!alias) return null

  const referencePart = normalized.slice(alias.length).trim()
  const match = referencePart.match(/^(\d{1,3})(?:\s*:\s*(\d{1,3}))?/)
  if (!match) return null

  const chapter = Number(match[1])
  const verse = match[2] ? Number(match[2]) : null
  if (!Number.isInteger(chapter) || chapter <= 0) return null
  if (verse !== null && (!Number.isInteger(verse) || verse <= 0)) return null

  return {
    bookCode: book.bookCode,
    bookLabel: book.bookLabel,
    chapter,
    verse,
  }
}
