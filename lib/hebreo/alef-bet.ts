export type AlefBetLetter = {
  orden: number
  letra: string
  nombre: string
  transliteracion: string
  unicode: string
  formaFinal?: string
  unicodeFinal?: string
  grupo?: 'begadkefat'
  nota?: string
}

/**
 * FASE H — dataset pedagógico inicial del Alef-bet.
 *
 * Contrato:
 * - 22 letras consonánticas en orden tradicional;
 * - las cinco formas finales se modelan como variantes de su letra base;
 * - ש se mantiene como una sola letra con las lecturas Shin/Sin;
 * - la transliteración es una referencia académica breve, no una promesa de
 *   pronunciación histórica reconstruida;
 * - sonidos, niqqud y reglas begadkefat se desarrollan en lecciones separadas.
 */
export const ALEF_BET: readonly AlefBetLetter[] = [
  { orden: 1, letra: 'א', nombre: 'Alef', transliteracion: 'ʾ', unicode: 'U+05D0', nota: 'Puede representar un cierre glotal; su comportamiento se estudia con las vocales.' },
  { orden: 2, letra: 'ב', nombre: 'Bet', transliteracion: 'b', unicode: 'U+05D1', grupo: 'begadkefat', nota: 'Pertenece al grupo begadkefat. El efecto del dagesh se estudia más adelante.' },
  { orden: 3, letra: 'ג', nombre: 'Gimel', transliteracion: 'g', unicode: 'U+05D2', grupo: 'begadkefat', nota: 'Pertenece al grupo begadkefat; aquí aprendemos primero a reconocer su forma.' },
  { orden: 4, letra: 'ד', nombre: 'Dalet', transliteracion: 'd', unicode: 'U+05D3', grupo: 'begadkefat', nota: 'Pertenece al grupo begadkefat; la pronunciación contextual se introduce después.' },
  { orden: 5, letra: 'ה', nombre: 'He', transliteracion: 'h', unicode: 'U+05D4' },
  { orden: 6, letra: 'ו', nombre: 'Vav / Waw', transliteracion: 'w', unicode: 'U+05D5', nota: 'La escritura es estable; las convenciones de pronunciación se explicarán por separado.' },
  { orden: 7, letra: 'ז', nombre: 'Zayin', transliteracion: 'z', unicode: 'U+05D6' },
  { orden: 8, letra: 'ח', nombre: 'Het', transliteracion: 'ḥ', unicode: 'U+05D7' },
  { orden: 9, letra: 'ט', nombre: 'Tet', transliteracion: 'ṭ', unicode: 'U+05D8' },
  { orden: 10, letra: 'י', nombre: 'Yod', transliteracion: 'y', unicode: 'U+05D9' },
  { orden: 11, letra: 'כ', nombre: 'Kaf', transliteracion: 'k', unicode: 'U+05DB', formaFinal: 'ך', unicodeFinal: 'U+05DA', grupo: 'begadkefat', nota: 'Al final de palabra usa ך. La forma final no crea una letra nueva.' },
  { orden: 12, letra: 'ל', nombre: 'Lamed', transliteracion: 'l', unicode: 'U+05DC' },
  { orden: 13, letra: 'מ', nombre: 'Mem', transliteracion: 'm', unicode: 'U+05DE', formaFinal: 'ם', unicodeFinal: 'U+05DD', nota: 'Al final de palabra usa ם.' },
  { orden: 14, letra: 'נ', nombre: 'Nun', transliteracion: 'n', unicode: 'U+05E0', formaFinal: 'ן', unicodeFinal: 'U+05DF', nota: 'Al final de palabra usa ן.' },
  { orden: 15, letra: 'ס', nombre: 'Samekh', transliteracion: 's', unicode: 'U+05E1' },
  { orden: 16, letra: 'ע', nombre: 'Ayin', transliteracion: 'ʿ', unicode: 'U+05E2', nota: 'Es una consonante gutural; no debe tratarse simplemente como una vocal.' },
  { orden: 17, letra: 'פ', nombre: 'Pe', transliteracion: 'p', unicode: 'U+05E4', formaFinal: 'ף', unicodeFinal: 'U+05E3', grupo: 'begadkefat', nota: 'Al final de palabra usa ף. El efecto del dagesh se estudia en una lección posterior.' },
  { orden: 18, letra: 'צ', nombre: 'Tsadi', transliteracion: 'ṣ', unicode: 'U+05E6', formaFinal: 'ץ', unicodeFinal: 'U+05E5', nota: 'Al final de palabra usa ץ.' },
  { orden: 19, letra: 'ק', nombre: 'Qof', transliteracion: 'q', unicode: 'U+05E7' },
  { orden: 20, letra: 'ר', nombre: 'Resh', transliteracion: 'r', unicode: 'U+05E8' },
  { orden: 21, letra: 'ש', nombre: 'Shin / Sin', transliteracion: 'š / ś', unicode: 'U+05E9', nota: 'El punto distingue שׁ (Shin) de שׂ (Sin). Ambas pertenecen a la misma letra del Alef-bet.' },
  { orden: 22, letra: 'ת', nombre: 'Tav', transliteracion: 't', unicode: 'U+05EA', grupo: 'begadkefat', nota: 'Pertenece al grupo begadkefat; la pronunciación contextual se introduce después.' },
] as const

export const ALEF_BET_FINAL_FORMS = ALEF_BET.filter((letter) => Boolean(letter.formaFinal))
