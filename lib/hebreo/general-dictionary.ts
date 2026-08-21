import 'server-only'

export type GeneralDictionaryEntry = {
  id: string
  hebrew: string
  pronunciation: string | null
  spanish: string
  source: 'kaikki-core' | 'wikidict-cc0'
}

const CORE: readonly GeneralDictionaryEntry[] = [
  { id: 'core-cat', hebrew: 'חָתוּל', pronunciation: 'jatúl', spanish: 'gato', source: 'kaikki-core' },
  { id: 'core-dog', hebrew: 'כֶּלֶב', pronunciation: 'kélev', spanish: 'perro', source: 'kaikki-core' },
  { id: 'core-house', hebrew: 'בַּיִת', pronunciation: 'báyit', spanish: 'casa', source: 'kaikki-core' },
  { id: 'core-water', hebrew: 'מַיִם', pronunciation: 'máyim', spanish: 'agua', source: 'kaikki-core' },
  { id: 'core-stone', hebrew: 'אֶבֶן', pronunciation: 'éven', spanish: 'piedra', source: 'kaikki-core' },
  { id: 'core-king', hebrew: 'מֶלֶךְ', pronunciation: 'mélej', spanish: 'rey', source: 'kaikki-core' },
  { id: 'core-peace', hebrew: 'שָׁלוֹם', pronunciation: 'shalóm', spanish: 'paz', source: 'kaikki-core' },
  { id: 'core-tree', hebrew: 'עֵץ', pronunciation: 'ets', spanish: 'árbol', source: 'kaikki-core' },
  { id: 'core-food', hebrew: 'אֹכֶל', pronunciation: 'ójel', spanish: 'comida', source: 'kaikki-core' },
  { id: 'core-love', hebrew: 'אַהֲבָה', pronunciation: 'ahavá', spanish: 'amor', source: 'kaikki-core' },
  { id: 'core-book', hebrew: 'סֵפֶר', pronunciation: 'séfer', spanish: 'libro', source: 'kaikki-core' },
  { id: 'core-table', hebrew: 'שֻׁלְחָן', pronunciation: 'shulján', spanish: 'mesa', source: 'kaikki-core' },
  { id: 'core-chair', hebrew: 'כִּסֵּא', pronunciation: 'kisé', spanish: 'silla', source: 'kaikki-core' },
  { id: 'core-bread', hebrew: 'לֶחֶם', pronunciation: 'léjem', spanish: 'pan', source: 'kaikki-core' },
  { id: 'core-milk', hebrew: 'חָלָב', pronunciation: 'jaláv', spanish: 'leche', source: 'kaikki-core' },
  { id: 'core-sun', hebrew: 'שֶׁמֶשׁ', pronunciation: 'shémesh', spanish: 'sol', source: 'kaikki-core' },
  { id: 'core-moon', hebrew: 'יָרֵחַ', pronunciation: 'yaréaj', spanish: 'luna', source: 'kaikki-core' },
  { id: 'core-day', hebrew: 'יוֹם', pronunciation: 'yom', spanish: 'día', source: 'kaikki-core' },
  { id: 'core-night', hebrew: 'לַיְלָה', pronunciation: 'láyla', spanish: 'noche', source: 'kaikki-core' },
  { id: 'core-man', hebrew: 'אִישׁ', pronunciation: 'ish', spanish: 'hombre', source: 'kaikki-core' },
  { id: 'core-woman', hebrew: 'אִשָּׁה', pronunciation: 'ishá', spanish: 'mujer', source: 'kaikki-core' },
  { id: 'core-boy', hebrew: 'יֶלֶד', pronunciation: 'yéled', spanish: 'niño', source: 'kaikki-core' },
  { id: 'core-girl', hebrew: 'יַלְדָּה', pronunciation: 'yaldá', spanish: 'niña', source: 'kaikki-core' },
  { id: 'core-father', hebrew: 'אַבָּא', pronunciation: 'ába', spanish: 'papá', source: 'kaikki-core' },
  { id: 'core-mother', hebrew: 'אִמָּא', pronunciation: 'íma', spanish: 'mamá', source: 'kaikki-core' },
]

const SOURCE_URL = 'https://raw.githubusercontent.com/open-dict-data/wikidict-es/master/data/he-es_wiki.txt'
let cached: GeneralDictionaryEntry[] | null = null
let cachedAt = 0
const CACHE_MS = 1000 * 60 * 60 * 12

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ')
}

function stripNiqqud(value: string) {
  return value.normalize('NFD').replace(/[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g, '').normalize('NFC')
}

function usablePair(hebrew: string, spanish: string) {
  if (!/[\u05D0-\u05EA]/u.test(hebrew)) return false
  if (hebrew.length > 64 || spanish.length > 80) return false
  if (/https?:|\t|\n/.test(hebrew + spanish)) return false
  return true
}

async function loadWikiDict() {
  const now = Date.now()
  if (cached && now - cachedAt < CACHE_MS) return cached
  try {
    const response = await fetch(SOURCE_URL, { next: { revalidate: 43200 } })
    if (!response.ok) throw new Error(`wikidict ${response.status}`)
    const text = await response.text()
    const parsed: GeneralDictionaryEntry[] = []
    const seen = new Set<string>()
    for (const line of text.split('\n')) {
      if (!line) continue
      const tab = line.indexOf('\t')
      if (tab < 1) continue
      const hebrew = line.slice(0, tab).trim()
      const spanish = line.slice(tab + 1).trim()
      if (!usablePair(hebrew, spanish)) continue
      const key = `${stripNiqqud(hebrew)}\u0000${normalize(spanish)}`
      if (seen.has(key)) continue
      seen.add(key)
      parsed.push({ id: `wiki-${parsed.length}`, hebrew, pronunciation: null, spanish, source: 'wikidict-cc0' })
    }
    cached = parsed
    cachedAt = now
    return parsed
  } catch (error) {
    console.error('[general-hebrew-dictionary] No se pudo cargar WikiDict:', error)
    return cached ?? []
  }
}

export async function searchGeneralDictionary(query: string, limit = 24) {
  const needle = normalize(query)
  const hebrewNeedle = stripNiqqud(query)
  if (!needle && !hebrewNeedle) return []

  const coreMatches = CORE.filter(entry =>
    normalize(entry.spanish) === needle || stripNiqqud(entry.hebrew) === hebrewNeedle,
  )

  const wiki = await loadWikiDict()
  const broad = wiki.filter(entry =>
    normalize(entry.spanish) === needle || stripNiqqud(entry.hebrew) === hebrewNeedle,
  )

  const merged = [...coreMatches, ...broad]
  const seen = new Set<string>()
  return merged.filter(entry => {
    const key = `${stripNiqqud(entry.hebrew)}\u0000${normalize(entry.spanish)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, limit)
}

export const GENERAL_DICTIONARY_PILOT_CORE_SIZE = CORE.length
