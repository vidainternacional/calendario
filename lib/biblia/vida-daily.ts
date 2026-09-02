export type VidaReading = { book: string; bookName: string; chapter: number; verse?: number; label: string }
export type VidaReadingPlan = { id: string; title: string; description: string; readings: VidaReading[] }

export const DAILY_VERSES: VidaReading[] = [
  { book: 'JHN', bookName: 'Juan', chapter: 3, verse: 16, label: 'Juan 3:16' },
  { book: 'PSA', bookName: 'Salmos', chapter: 23, verse: 1, label: 'Salmos 23:1' },
  { book: 'PHP', bookName: 'Filipenses', chapter: 4, verse: 13, label: 'Filipenses 4:13' },
  { book: 'PRO', bookName: 'Proverbios', chapter: 3, verse: 5, label: 'Proverbios 3:5' },
  { book: 'ROM', bookName: 'Romanos', chapter: 8, verse: 28, label: 'Romanos 8:28' },
  { book: 'ISA', bookName: 'Isaías', chapter: 41, verse: 10, label: 'Isaías 41:10' },
  { book: 'MAT', bookName: 'Mateo', chapter: 11, verse: 28, label: 'Mateo 11:28' },
  { book: 'PSA', bookName: 'Salmos', chapter: 46, verse: 1, label: 'Salmos 46:1' },
  { book: 'JER', bookName: 'Jeremías', chapter: 29, verse: 11, label: 'Jeremías 29:11' },
  { book: 'JHN', bookName: 'Juan', chapter: 14, verse: 6, label: 'Juan 14:6' },
  { book: 'HEB', bookName: 'Hebreos', chapter: 11, verse: 1, label: 'Hebreos 11:1' },
  { book: 'PSA', bookName: 'Salmos', chapter: 119, verse: 105, label: 'Salmos 119:105' },
]

export const READING_PLANS: VidaReadingPlan[] = [
  {
    id: 'jesus-7', title: '7 días con Jesús', description: 'Una semana para conocer su mensaje, gracia y llamado.',
    readings: [
      ['JHN','Juan',1], ['JHN','Juan',3], ['LUK','Lucas',15], ['MAT','Mateo',5], ['MAT','Mateo',6], ['JHN','Juan',15], ['JHN','Juan',20],
    ].map(([book, bookName, chapter]) => ({ book: String(book), bookName: String(bookName), chapter: Number(chapter), label: `${bookName} ${chapter}` })),
  },
  {
    id: 'caminar-14', title: '14 días para caminar con Dios', description: 'Lecturas progresivas sobre confianza, oración, fe y vida diaria.',
    readings: [
      ['PSA','Salmos',1],['PSA','Salmos',23],['PSA','Salmos',27],['PSA','Salmos',46],['PRO','Proverbios',3],['MAT','Mateo',5],['MAT','Mateo',6],['MAT','Mateo',7],['JHN','Juan',14],['JHN','Juan',15],['ROM','Romanos',8],['PHP','Filipenses',4],['JAS','Santiago',1],['HEB','Hebreos',11],
    ].map(([book, bookName, chapter]) => ({ book: String(book), bookName: String(bookName), chapter: Number(chapter), label: `${bookName} ${chapter}` })),
  },
  {
    id: 'panorama-30', title: '30 días por la historia bíblica', description: 'Un recorrido inicial desde la creación hasta la iglesia del primer siglo.',
    readings: [
      ['GEN','Génesis',1],['GEN','Génesis',3],['GEN','Génesis',12],['GEN','Génesis',22],['EXO','Éxodo',3],['EXO','Éxodo',12],['EXO','Éxodo',20],['JOS','Josué',1],['1SA','1 Samuel',16],['2SA','2 Samuel',7],['1KI','1 Reyes',18],['PSA','Salmos',23],['ISA','Isaías',6],['ISA','Isaías',53],['JER','Jeremías',31],['DAN','Daniel',6],['JON','Jonás',1],['MAT','Mateo',1],['MAT','Mateo',5],['MAT','Mateo',26],['MAT','Mateo',28],['JHN','Juan',1],['JHN','Juan',3],['JHN','Juan',20],['ACT','Hechos',1],['ACT','Hechos',2],['ACT','Hechos',9],['ROM','Romanos',8],['1CO','1 Corintios',13],['REV','Apocalipsis',21],
    ].map(([book, bookName, chapter]) => ({ book: String(book), bookName: String(bookName), chapter: Number(chapter), label: `${bookName} ${chapter}` })),
  },
]

export function vidaDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/El_Salvador', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

export function dailyVerseForDate(date = new Date()) {
  const key = vidaDateKey(date)
  const numeric = Number(key.replaceAll('-', ''))
  return DAILY_VERSES[numeric % DAILY_VERSES.length]
}

export function vidaHour(date = new Date()) {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/El_Salvador', hour: '2-digit', hourCycle: 'h23' }).format(date))
}

export async function getRv1909TranslationId() {
  const response = await fetch('https://bible.helloao.org/api/available_translations.json', { cache: 'force-cache' })
  if (!response.ok) throw new Error('translations')
  const data = await response.json()
  const translations = Array.isArray(data?.translations) ? data.translations : []
  const found = translations.find((t: any) => /reina[ -]?valera.*1909|rv1909|rvr1909/i.test(`${t?.name ?? ''} ${t?.shortName ?? ''} ${t?.id ?? ''}`))
  if (!found?.id) throw new Error('rv1909')
  return String(found.id)
}

function contentText(content: unknown) {
  if (!Array.isArray(content)) return ''
  return content.map((part: any) => typeof part === 'string' ? part : typeof part?.text === 'string' ? part.text : '').join(' ').replace(/\s+/g, ' ').trim()
}

export async function fetchVerseText(reading: VidaReading) {
  const translation = await getRv1909TranslationId()
  const response = await fetch(`https://bible.helloao.org/api/${translation}/${reading.book}/${reading.chapter}.json`, { cache: 'no-store' })
  if (!response.ok) throw new Error('chapter')
  const data = await response.json()
  const verse = (data?.chapter?.content ?? []).find((item: any) => item?.type === 'verse' && Number(item?.number) === Number(reading.verse))
  return contentText(verse?.content)
}
