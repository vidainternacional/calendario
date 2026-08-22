export const HEBREW_BIBLE_BOOKS = [
  { code: 'GEN', name: 'Génesis' }, { code: 'EXO', name: 'Éxodo' }, { code: 'LEV', name: 'Levítico' }, { code: 'NUM', name: 'Números' }, { code: 'DEU', name: 'Deuteronomio' },
  { code: 'JOS', name: 'Josué' }, { code: 'JDG', name: 'Jueces' }, { code: 'RUT', name: 'Rut' }, { code: '1SA', name: '1 Samuel' }, { code: '2SA', name: '2 Samuel' },
  { code: '1KI', name: '1 Reyes' }, { code: '2KI', name: '2 Reyes' }, { code: '1CH', name: '1 Crónicas' }, { code: '2CH', name: '2 Crónicas' }, { code: 'EZR', name: 'Esdras' },
  { code: 'NEH', name: 'Nehemías' }, { code: 'EST', name: 'Ester' }, { code: 'JOB', name: 'Job' }, { code: 'PSA', name: 'Salmos' }, { code: 'PRO', name: 'Proverbios' },
  { code: 'ECC', name: 'Eclesiastés' }, { code: 'SNG', name: 'Cantares' }, { code: 'ISA', name: 'Isaías' }, { code: 'JER', name: 'Jeremías' }, { code: 'LAM', name: 'Lamentaciones' },
  { code: 'EZK', name: 'Ezequiel' }, { code: 'DAN', name: 'Daniel' }, { code: 'HOS', name: 'Oseas' }, { code: 'JOL', name: 'Joel' }, { code: 'AMO', name: 'Amós' },
  { code: 'OBA', name: 'Abdías' }, { code: 'JON', name: 'Jonás' }, { code: 'MIC', name: 'Miqueas' }, { code: 'NAM', name: 'Nahúm' }, { code: 'HAB', name: 'Habacuc' },
  { code: 'ZEP', name: 'Sofonías' }, { code: 'HAG', name: 'Hageo' }, { code: 'ZEC', name: 'Zacarías' }, { code: 'MAL', name: 'Malaquías' },
] as const

export type HebrewBibleBookCode = typeof HEBREW_BIBLE_BOOKS[number]['code']

export function hebrewBibleBook(code: string) {
  return HEBREW_BIBLE_BOOKS.find(book => book.code === code) ?? HEBREW_BIBLE_BOOKS[0]
}
