export type HebrewUsefulPhraseGroup = 'greetings' | 'courtesy' | 'conversation'

export type HebrewUsefulPhrase = {
  id: string
  group: HebrewUsefulPhraseGroup
  hebrew: string
  pronunciation: string
  spanish: string
}

/**
 * Frases de hebreo moderno para memorización cotidiana.
 * Se mantienen deliberadamente separadas del léxico bíblico autoritativo.
 * Jerarquía editorial del proyecto: Academy of the Hebrew Language para
 * hebreo moderno normativo; fuentes de consulta práctica solo como contraste.
 */
export const HEBREW_USEFUL_PHRASES: readonly HebrewUsefulPhrase[] = [
  { id: 'shalom', group: 'greetings', hebrew: 'שָׁלוֹם', pronunciation: 'shalóm', spanish: 'hola · paz' },
  { id: 'boker-tov', group: 'greetings', hebrew: 'בּוֹקֶר טוֹב', pronunciation: 'bóker tov', spanish: 'buenos días' },
  { id: 'tsohorayim-tovim', group: 'greetings', hebrew: 'צָהֳרַיִם טוֹבִים', pronunciation: 'tsohoráyim tovím', spanish: 'buenas tardes · mediodía' },
  { id: 'erev-tov', group: 'greetings', hebrew: 'עֶרֶב טוֹב', pronunciation: 'érev tov', spanish: 'buenas tardes · al anochecer' },
  { id: 'layla-tov', group: 'greetings', hebrew: 'לַיְלָה טוֹב', pronunciation: 'láyla tov', spanish: 'buenas noches' },
  { id: 'toda', group: 'courtesy', hebrew: 'תּוֹדָה', pronunciation: 'todá', spanish: 'gracias' },
  { id: 'toda-raba', group: 'courtesy', hebrew: 'תּוֹדָה רַבָּה', pronunciation: 'todá rabá', spanish: 'muchas gracias' },
  { id: 'bevakasha', group: 'courtesy', hebrew: 'בְּבַקָּשָׁה', pronunciation: 'bevakashá', spanish: 'por favor · de nada' },
  { id: 'sliha', group: 'courtesy', hebrew: 'סְלִיחָה', pronunciation: 'slijá', spanish: 'perdón · disculpe' },
  { id: 'ma-shlomkha', group: 'conversation', hebrew: 'מַה שְּׁלוֹמְךָ?', pronunciation: 'ma shlomjá', spanish: '¿cómo estás? · a un hombre' },
  { id: 'ma-shlomekh', group: 'conversation', hebrew: 'מַה שְּׁלוֹמֵךְ?', pronunciation: 'ma shloméj', spanish: '¿cómo estás? · a una mujer' },
  { id: 'toda-gam-lekha', group: 'conversation', hebrew: 'תּוֹדָה גַּם לְךָ', pronunciation: 'todá gam lejá', spanish: 'gracias a ti también' },
] as const
