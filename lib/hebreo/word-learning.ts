export type HebrewLearningGroupId =
  | 'essentials'
  | 'connectors'
  | 'prepositions'
  | 'pronouns'
  | 'family'
  | 'daily'
  | 'nature'
  | 'body'
  | 'faith'
  | 'actions'
  | 'nouns'
  | 'verbs'
  | 'adjectives'
  | 'all'

export type HebrewLearningGroup = {
  id: HebrewLearningGroupId
  label: string
  description: string
}

export const HEBREW_LEARNING_GROUPS: readonly HebrewLearningGroup[] = [
  { id: 'essentials', label: 'Más comunes', description: 'Las palabras de mayor utilidad para empezar a reconocer el hebreo de la Biblia.' },
  { id: 'connectors', label: 'Conectores', description: 'Conjunciones y partículas que unen ideas y ayudan a entender cómo se construye una frase.' },
  { id: 'prepositions', label: 'Preposiciones', description: 'Palabras y partículas que expresan relaciones como en, a, de, con o sobre.' },
  { id: 'pronouns', label: 'Sujetos y pronombres', description: 'Pronombres y formas que ayudan a reconocer quién habla, actúa o recibe una acción.' },
  { id: 'family', label: 'Personas y familia', description: 'Personas, relaciones familiares y vocabulario humano básico.' },
  { id: 'daily', label: 'Cosas y vida diaria', description: 'Casa, comida, agua, tiempo y objetos o conceptos cotidianos.' },
  { id: 'nature', label: 'Naturaleza', description: 'Tierra, luz, cielo, mar, montaña y otras palabras del mundo creado.' },
  { id: 'body', label: 'Cuerpo y vida', description: 'Partes del cuerpo y palabras relacionadas con vida, corazón y persona.' },
  { id: 'faith', label: 'Biblia y fe', description: 'Palabras centrales para comprender textos bíblicos: Dios, paz, verdad, instrucción y santidad.' },
  { id: 'actions', label: 'Acciones', description: 'Verbos frecuentes para reconocer lo que alguien dice, hace, ve, oye o realiza.' },
  { id: 'nouns', label: 'Sustantivos', description: 'Sustantivos del léxico hebreo aprobado.' },
  { id: 'verbs', label: 'Verbos', description: 'Verbos del léxico hebreo aprobado.' },
  { id: 'adjectives', label: 'Adjetivos', description: 'Adjetivos del léxico hebreo aprobado.' },
  { id: 'all', label: 'Diccionario completo', description: 'Catálogo hebreo aprobado completo. La búsqueda sigue disponible para llegar directamente a una palabra.' },
] as const

type PedagogicalWord = {
  lexicalId: string
  spanish: string
  pronunciation: string
  topics: readonly Exclude<HebrewLearningGroupId, 'connectors' | 'prepositions' | 'pronouns' | 'nouns' | 'verbs' | 'adjectives' | 'all'>[]
  meaning?: string
}

export const PEDAGOGICAL_HEBREW_WORDS: readonly PedagogicalWord[] = [
  { lexicalId: 'H0001G', spanish: 'padre', pronunciation: 'av', topics: ['essentials', 'family'] },
  { lexicalId: 'H0517', spanish: 'madre', pronunciation: 'em', topics: ['essentials', 'family'] },
  { lexicalId: 'H0251G', spanish: 'hermano', pronunciation: 'aj', topics: ['family'] },
  { lexicalId: 'H0269', spanish: 'hermana', pronunciation: 'ajót', topics: ['family'] },
  { lexicalId: 'H0376G', spanish: 'hombre', pronunciation: 'ish', topics: ['family'] },
  { lexicalId: 'H0802G', spanish: 'mujer', pronunciation: 'ishá', topics: ['family'] },
  { lexicalId: 'H1121A', spanish: 'hijo', pronunciation: 'ben', topics: ['essentials', 'family'] },
  { lexicalId: 'H1323G', spanish: 'hija', pronunciation: 'bat', topics: ['family'] },
  { lexicalId: 'H1004A', spanish: 'casa', pronunciation: 'báyit', topics: ['essentials', 'daily'] },
  { lexicalId: 'H3117G', spanish: 'día', pronunciation: 'yom', topics: ['essentials', 'daily'] },
  { lexicalId: 'H4325G', spanish: 'agua', pronunciation: 'máyim', topics: ['essentials', 'daily', 'nature'] },
  { lexicalId: 'H0398', spanish: 'comer', pronunciation: 'ajál', topics: ['daily', 'actions'] },
  { lexicalId: 'H8354', spanish: 'beber', pronunciation: 'shatá', topics: ['daily', 'actions'] },
  { lexicalId: 'H8034', spanish: 'nombre', pronunciation: 'shem', topics: ['essentials', 'daily'] },
  { lexicalId: 'H1870H', spanish: 'camino', pronunciation: 'dérej', topics: ['essentials', 'daily'] },
  { lexicalId: 'H5892B', spanish: 'ciudad', pronunciation: 'ir', topics: ['daily'] },
  { lexicalId: 'H0776G', spanish: 'tierra', pronunciation: 'érets', topics: ['essentials', 'nature'] },
  { lexicalId: 'H0216', spanish: 'luz', pronunciation: 'or', topics: ['essentials', 'nature'] },
  { lexicalId: 'H2822', spanish: 'oscuridad', pronunciation: 'jóshej', topics: ['nature'] },
  { lexicalId: 'H8064', spanish: 'cielos', pronunciation: 'shamáyim', topics: ['essentials', 'nature'] },
  { lexicalId: 'H3220G', spanish: 'mar', pronunciation: 'yam', topics: ['nature'] },
  { lexicalId: 'H2022G', spanish: 'montaña', pronunciation: 'har', topics: ['nature'] },
  { lexicalId: 'H3027G', spanish: 'mano', pronunciation: 'yad', topics: ['body'] },
  { lexicalId: 'H7218A', spanish: 'cabeza', pronunciation: 'rosh', topics: ['body'] },
  { lexicalId: 'H5869A', spanish: 'ojo', pronunciation: 'áyin', topics: ['body'] },
  { lexicalId: 'H6310G', spanish: 'boca', pronunciation: 'pe', topics: ['body'] },
  { lexicalId: 'H3820A', spanish: 'corazón', pronunciation: 'lev', topics: ['essentials', 'body', 'faith'] },
  { lexicalId: 'H5315G', spanish: 'alma', pronunciation: 'néfesh', topics: ['body', 'faith'], meaning: 'Persona, vida o alma según el contexto.' },
  { lexicalId: 'H2416E', spanish: 'vida', pronunciation: 'jayím', topics: ['essentials', 'body'] },
  { lexicalId: 'H0430G', spanish: 'Dios', pronunciation: 'Elohím', topics: ['essentials', 'faith'] },
  { lexicalId: 'H4428G', spanish: 'rey', pronunciation: 'mélej', topics: ['essentials', 'faith'] },
  { lexicalId: 'H7965G', spanish: 'paz', pronunciation: 'shalóm', topics: ['essentials', 'faith'], meaning: 'Paz, bienestar o integridad según el contexto.' },
  { lexicalId: 'H8451', spanish: 'instrucción / Torá', pronunciation: 'torá', topics: ['essentials', 'faith'], meaning: 'Instrucción; en contextos bíblicos también se usa para la Torá.' },
  { lexicalId: 'H1697G', spanish: 'palabra', pronunciation: 'davár', topics: ['essentials', 'faith'] },
  { lexicalId: 'H0571G', spanish: 'verdad / fidelidad', pronunciation: 'emét', topics: ['faith'] },
  { lexicalId: 'H2617A', spanish: 'bondad / lealtad', pronunciation: 'jésed', topics: ['faith'], meaning: 'Bondad o lealtad fiel según el contexto.' },
  { lexicalId: 'H6918G', spanish: 'santo', pronunciation: 'kadósh', topics: ['faith'] },
  { lexicalId: 'H0559', spanish: 'decir', pronunciation: 'amár', topics: ['essentials', 'actions'] },
  { lexicalId: 'H1980I', spanish: 'caminar / ir', pronunciation: 'haláj', topics: ['actions'] },
  { lexicalId: 'H3045', spanish: 'conocer / saber', pronunciation: 'yadá', topics: ['essentials', 'actions'] },
  { lexicalId: 'H5414G', spanish: 'dar', pronunciation: 'natán', topics: ['essentials', 'actions'] },
  { lexicalId: 'H6213A', spanish: 'hacer', pronunciation: 'asá', topics: ['essentials', 'actions'] },
  { lexicalId: 'H7200G', spanish: 'ver', pronunciation: 'raá', topics: ['essentials', 'actions'] },
  { lexicalId: 'H8085G', spanish: 'oír / escuchar', pronunciation: 'shamá', topics: ['essentials', 'actions'] },
  { lexicalId: 'H7121G', spanish: 'llamar', pronunciation: 'kará', topics: ['actions'] },
  { lexicalId: 'H1288', spanish: 'bendecir', pronunciation: 'baráj', topics: ['actions', 'faith'] },
  { lexicalId: 'H3789', spanish: 'escribir', pronunciation: 'katáv', topics: ['actions'] },
  { lexicalId: 'H3427', spanish: 'habitar / sentarse', pronunciation: 'yasháv', topics: ['actions'] },
  { lexicalId: 'H5975G', spanish: 'estar de pie', pronunciation: 'amád', topics: ['actions'] },
  { lexicalId: 'H3318G', spanish: 'salir', pronunciation: 'yatsá', topics: ['actions'] },
  { lexicalId: 'H0935G', spanish: 'venir / entrar', pronunciation: 'bo', topics: ['actions'] },
] as const

const PEDAGOGICAL_BY_ID = new Map(PEDAGOGICAL_HEBREW_WORDS.map(word => [word.lexicalId, word]))

function normalizeSpanish(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9ñ\s/]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function normalizeLearningGroup(value: string | null | undefined): HebrewLearningGroupId {
  return HEBREW_LEARNING_GROUPS.some(group => group.id === value) ? value as HebrewLearningGroupId : 'essentials'
}

export function lexicalIdsForLearningGroup(group: HebrewLearningGroupId) {
  if (group === 'connectors' || group === 'prepositions' || group === 'pronouns' || group === 'nouns' || group === 'verbs' || group === 'adjectives' || group === 'all') return null
  return PEDAGOGICAL_HEBREW_WORDS.filter(word => word.topics.includes(group)).map(word => word.lexicalId)
}

export function pedagogicalWordForId(lexicalId: string) { return PEDAGOGICAL_BY_ID.get(lexicalId) ?? null }

export function lexicalIdsForSpanishSearch(search: string) {
  const normalized = normalizeSpanish(search)
  if (!normalized) return []
  return PEDAGOGICAL_HEBREW_WORDS.filter(word => normalizeSpanish(word.spanish).includes(normalized) || normalizeSpanish(word.meaning ?? '').includes(normalized)).map(word => word.lexicalId)
}

export function groupDescription(group: HebrewLearningGroupId) {
  return HEBREW_LEARNING_GROUPS.find(item => item.id === group)?.description ?? HEBREW_LEARNING_GROUPS[0].description
}
