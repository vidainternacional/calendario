const HEBREW_MARKS = /[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g
const HEBREW_LETTER = /[\u05D0-\u05EA]/

export function withoutHebrewMarks(value: string) {
  return value.normalize('NFD').replace(HEBREW_MARKS, '').normalize('NFC')
}

function pronounceWord(value: string) {
  const clusters: { letter: string; marks: string[] }[] = []
  for (const char of Array.from(value.normalize('NFD'))) {
    if (HEBREW_LETTER.test(char)) clusters.push({ letter: char, marks: [] })
    else if (clusters.length && /[\u0591-\u05C7]/.test(char)) clusters[clusters.length - 1].marks.push(char)
  }

  return clusters.map((cluster, index) => {
    const { letter, marks } = cluster
    const has = (mark: string) => marks.includes(mark)
    const first = index === 0
    const last = index === clusters.length - 1

    if (letter === 'ו' && has('\u05BC') && !marks.some(mark => ['\u05B0','\u05B1','\u05B2','\u05B3','\u05B4','\u05B5','\u05B6','\u05B7','\u05B8','\u05B9','\u05BB','\u05C7'].includes(mark))) return 'u'
    if (letter === 'ו' && has('\u05B9')) return 'o'

    let consonant = ''
    switch (letter) {
      case 'א': case 'ע': consonant = ''; break
      case 'ב': consonant = has('\u05BC') ? 'b' : 'v'; break
      case 'ג': consonant = 'g'; break
      case 'ד': consonant = 'd'; break
      case 'ה': consonant = last && marks.length === 0 ? '' : 'h'; break
      case 'ו': consonant = 'v'; break
      case 'ז': consonant = 'z'; break
      case 'ח': consonant = 'j'; break
      case 'ט': consonant = 't'; break
      case 'י': consonant = 'y'; break
      case 'כ': case 'ך': consonant = has('\u05BC') ? 'k' : 'j'; break
      case 'ל': consonant = 'l'; break
      case 'מ': case 'ם': consonant = 'm'; break
      case 'נ': case 'ן': consonant = 'n'; break
      case 'ס': consonant = 's'; break
      case 'פ': case 'ף': consonant = has('\u05BC') ? 'p' : 'f'; break
      case 'צ': case 'ץ': consonant = 'ts'; break
      case 'ק': consonant = 'k'; break
      case 'ר': consonant = 'r'; break
      case 'ש': consonant = has('\u05C2') ? 's' : 'sh'; break
      case 'ת': consonant = 't'; break
    }

    let vowel = ''
    if (has('\u05B4')) vowel = 'i'
    else if (has('\u05B5') || has('\u05B6') || has('\u05B1')) vowel = 'e'
    else if (has('\u05B7') || has('\u05B8') || has('\u05B2')) vowel = 'a'
    else if (has('\u05C7') || has('\u05B3') || has('\u05B9')) vowel = 'o'
    else if (has('\u05BB')) vowel = 'u'
    else if (has('\u05B0') && first) vowel = 'e'

    return consonant + vowel
  }).join('').replace(/yy/g, 'y')
}

export function pronounceHebrewForSpanish(value: string) {
  return value
    .split(/(\s+)/)
    .map(part => /[\u05D0-\u05EA]/.test(part) ? pronounceWord(part) : part)
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}
