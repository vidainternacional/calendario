export type HebrewUsefulPhraseGroup = 'greetings' | 'courtesy'

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
 * Fuente editorial del proyecto: Academy of the Hebrew Language.
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
] as const
