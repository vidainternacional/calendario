export type AlefBetLetter = {
  orden: number
  letra: string
  nombre: string
  transliteracion: string
  unicode: string
  valor: number
  sonidoPedagogico: string
  pronunciacion: string
  fenicio: string
  unicodeFenicio: string
  origenNombre: string
  ideaHistorica: string
  certezaHistorica: 'bien atestiguado' | 'probable' | 'debatido'
  evolucion: string
  ejemplo: {
    palabra: string
    transliteracion: string
    significado: string
  }
  formaFinal?: string
  unicodeFinal?: string
  grupo?: 'begadkefat'
  variantes?: string[]
  nota?: string
}

/**
 * FASE H — dataset pedagógico ampliado del Alef-bet.
 *
 * Guardias editoriales:
 * - 22 letras consonánticas en orden tradicional;
 * - las cinco formas finales son variantes posicionales, no letras nuevas;
 * - ש sigue siendo una sola letra con lecturas Shin/Sin;
 * - gematría = valor estándar de la letra base; las finales conservan ese valor;
 * - el signo fenicio es una referencia comparativa de la familia alfabética,
 *   no una afirmación de evolución gráfica lineal directa hasta la escritura cuadrada;
 * - los campos de origen/idea histórica describen el nombre/signo antiguo y no
 *   son significados léxicos, secretos ni teológicos de la letra;
 * - cuando la identificación histórica es discutida se etiqueta como tal.
 */
export const ALEF_BET: readonly AlefBetLetter[] = [
  {
    orden: 1, letra: 'א', nombre: 'Alef', transliteracion: 'ʾ', unicode: 'U+05D0', valor: 1,
    sonidoPedagogico: 'Cierre glotal suave; en muchas lecturas modernas puede no oírse.',
    pronunciacion: 'Para un hispanohablante: piensa en una breve interrupción de la voz antes de una vocal.',
    fenicio: '𐤀', unicodeFenicio: 'U+10900',
    origenNombre: 'El nombre semítico se relaciona con “buey / ganado”.',
    ideaHistorica: 'Cabeza de buey o ganado como referente acrofónico tradicional.',
    certezaHistorica: 'bien atestiguado',
    evolucion: 'Signos alfabéticos tempranos → paleohebreo/fenicio → tradición aramea → forma cuadrada א.',
    ejemplo: { palabra: 'אָב', transliteracion: 'ʾav', significado: 'padre' },
    nota: 'No es simplemente una vocal: históricamente funciona como consonante y puede portar vocales mediante niqqud.',
  },
  {
    orden: 2, letra: 'ב', nombre: 'Bet', transliteracion: 'b / v', unicode: 'U+05D1', valor: 2,
    sonidoPedagogico: 'בּ = b; ב sin dagesh se lee v en pronunciación israelí y en muchas tradiciones pedagógicas.',
    pronunciacion: 'B como “barco”; la variante suave se aproxima a v.',
    fenicio: '𐤁', unicodeFenicio: 'U+10901',
    origenNombre: 'El nombre se relaciona con “casa”.',
    ideaHistorica: 'Planta o contorno de una casa en la explicación acrofónica tradicional.',
    certezaHistorica: 'bien atestiguado',
    evolucion: 'Signo de casa en alfabetos tempranos → bet paleohebreo/fenicio → arameo → ב.',
    ejemplo: { palabra: 'בַּיִת', transliteracion: 'bayit', significado: 'casa' },
    grupo: 'begadkefat', variantes: ['בּ con dagesh', 'ב sin dagesh'],
    nota: 'El dagesh cambia su realización consonántica; se estudiará de forma sistemática en la lección begadkefat.',
  },
  {
    orden: 3, letra: 'ג', nombre: 'Gimel', transliteracion: 'g', unicode: 'U+05D2', valor: 3,
    sonidoPedagogico: 'G fuerte como en “gato”; la tradición tiberiense conserva una variante fricativa sin dagesh.',
    pronunciacion: 'Usa una g dura; no como la g de “gente”.',
    fenicio: '𐤂', unicodeFenicio: 'U+10902',
    origenNombre: 'Tradicionalmente se vincula con “camello”, aunque la identificación pictográfica temprana no es unánime.',
    ideaHistorica: 'Camello o un objeto asociado; la identificación exacta del signo temprano es discutida.',
    certezaHistorica: 'debatido',
    evolucion: 'Signo alfabético temprano discutido → gaml fenicio/paleohebreo → arameo → ג.',
    ejemplo: { palabra: 'גָּדוֹל', transliteracion: 'gadol', significado: 'grande' },
    grupo: 'begadkefat', variantes: ['גּ con dagesh', 'ג sin dagesh'],
  },
  {
    orden: 4, letra: 'ד', nombre: 'Dalet', transliteracion: 'd', unicode: 'U+05D3', valor: 4,
    sonidoPedagogico: 'D; la tradición tiberiense distingue una variante fricativa sin dagesh.',
    pronunciacion: 'D como en “dado”; la variante histórica suave recuerda una d intervocálica.',
    fenicio: '𐤃', unicodeFenicio: 'U+10903',
    origenNombre: 'El nombre se relaciona tradicionalmente con “puerta”.',
    ideaHistorica: 'Puerta, hoja o acceso; la forma exacta del pictograma temprano se discute.',
    certezaHistorica: 'probable',
    evolucion: 'Signo temprano asociado a puerta → delt/dalet paleohebreo-fenicio → arameo → ד.',
    ejemplo: { palabra: 'דֶּרֶךְ', transliteracion: 'derekh', significado: 'camino / vía' },
    grupo: 'begadkefat', variantes: ['דּ con dagesh', 'ד sin dagesh'],
  },
  {
    orden: 5, letra: 'ה', nombre: 'He', transliteracion: 'h', unicode: 'U+05D4', valor: 5,
    sonidoPedagogico: 'H aspirada suave.',
    pronunciacion: 'Como una h inglesa suave; no es muda como la h española.',
    fenicio: '𐤄', unicodeFenicio: 'U+10904',
    origenNombre: 'La etimología y la imagen original del nombre son menos seguras que en letras como Alef o Bet.',
    ideaHistorica: 'Se han propuesto figura humana, ventana u otras lecturas; conviene tratarlas como hipótesis.',
    certezaHistorica: 'debatido',
    evolucion: 'Signo alfabético temprano → he paleohebreo/fenicio → arameo → ה.',
    ejemplo: { palabra: 'הַר', transliteracion: 'har', significado: 'monte / montaña' },
    nota: 'Al final de palabra puede intervenir en la representación de vocales; ese uso se verá con matres lectionis.',
  },
  {
    orden: 6, letra: 'ו', nombre: 'Vav / Waw', transliteracion: 'w / v', unicode: 'U+05D5', valor: 6,
    sonidoPedagogico: 'W en reconstrucciones y transliteraciones históricas; v en hebreo israelí moderno.',
    pronunciacion: 'Puedes comenzar con v; más adelante distinguiremos la convención w del hebreo bíblico.',
    fenicio: '𐤅', unicodeFenicio: 'U+10905',
    origenNombre: 'El nombre se relaciona con “gancho / clavija / estaca”.',
    ideaHistorica: 'Gancho o clavija como referente acrofónico tradicional.',
    certezaHistorica: 'probable',
    evolucion: 'Signo de gancho/clavija → wau fenicio/paleohebreo → arameo → ו.',
    ejemplo: { palabra: 'וְ', transliteracion: 'we-', significado: 'y (conjunción prefijada)' },
    variantes: ['ו consonántica', 'וֹ holam-vav', 'וּ shureq'],
    nota: 'También participa en la escritura de vocales. No toda ו representa exactamente el mismo sonido.',
  },
  {
    orden: 7, letra: 'ז', nombre: 'Zayin', transliteracion: 'z', unicode: 'U+05D6', valor: 7,
    sonidoPedagogico: 'Z sonora, equivalente a una s con vibración.',
    pronunciacion: 'Pronuncia una s sonora; coloca la mano en la garganta para notar la vibración.',
    fenicio: '𐤆', unicodeFenicio: 'U+10906',
    origenNombre: 'El nombre se ha relacionado con instrumento o herramienta; la identificación del objeto temprano no es totalmente segura.',
    ideaHistorica: 'Instrumento, herramienta o elemento cortante en explicaciones tradicionales.',
    certezaHistorica: 'debatido',
    evolucion: 'Signo alfabético temprano → zai/zayin fenicio-paleohebreo → arameo → ז.',
    ejemplo: { palabra: 'זָכַר', transliteracion: 'zakhar', significado: 'recordar' },
  },
  {
    orden: 8, letra: 'ח', nombre: 'Het', transliteracion: 'ḥ', unicode: 'U+05D7', valor: 8,
    sonidoPedagogico: 'Consonante gutural; históricamente más profunda que una h.',
    pronunciacion: 'No tiene equivalente exacto en español; evita convertirla simplemente en una h muda.',
    fenicio: '𐤇', unicodeFenicio: 'U+10907',
    origenNombre: 'Tradicionalmente relacionado con “cerca / recinto”.',
    ideaHistorica: 'Cerca o cerramiento como referente del nombre antiguo.',
    certezaHistorica: 'probable',
    evolucion: 'Signo de recinto/cerca → het paleohebreo-fenicio → arameo → ח.',
    ejemplo: { palabra: 'חֶסֶד', transliteracion: 'ḥesed', significado: 'amor leal / misericordia' },
    nota: 'Es una de las guturales importantes para las reglas vocálicas del hebreo bíblico.',
  },
  {
    orden: 9, letra: 'ט', nombre: 'Tet', transliteracion: 'ṭ', unicode: 'U+05D8', valor: 9,
    sonidoPedagogico: 'T enfática históricamente; muchas lecturas modernas la realizan como t.',
    pronunciacion: 'Para empezar, t como en “taza”; recuerda que su valor histórico no era idéntico a Tav.',
    fenicio: '𐤈', unicodeFenicio: 'U+10908',
    origenNombre: 'El origen pictográfico y la etimología exacta son discutidos.',
    ideaHistorica: 'Se han propuesto rueda, envoltura o serpiente, sin consenso suficiente para afirmarlo como hecho.',
    certezaHistorica: 'debatido',
    evolucion: 'Signo alfabético temprano de identificación incierta → tet fenicio/paleohebreo → arameo → ט.',
    ejemplo: { palabra: 'טוֹב', transliteracion: 'ṭov', significado: 'bueno' },
  },
  {
    orden: 10, letra: 'י', nombre: 'Yod', transliteracion: 'y', unicode: 'U+05D9', valor: 10,
    sonidoPedagogico: 'Y consonántica como en “ya”.',
    pronunciacion: 'Y como en “yo”.',
    fenicio: '𐤉', unicodeFenicio: 'U+10909',
    origenNombre: 'El nombre se relaciona con “mano”.',
    ideaHistorica: 'Mano o brazo/mano en el principio acrofónico.',
    certezaHistorica: 'bien atestiguado',
    evolucion: 'Signo de mano/brazo → yod paleohebreo-fenicio → arameo → י.',
    ejemplo: { palabra: 'יָד', transliteracion: 'yad', significado: 'mano' },
    nota: 'También puede participar en la escritura de vocales; es la letra cuadrada más pequeña.',
  },
  {
    orden: 11, letra: 'כ', nombre: 'Kaf', transliteracion: 'k / kh', unicode: 'U+05DB', valor: 20,
    sonidoPedagogico: 'כּ = k; כ sin dagesh = sonido áspero parecido a la j española.',
    pronunciacion: 'K como “kilo”; sin dagesh, una fricción gutural parecida a j.',
    fenicio: '𐤊', unicodeFenicio: 'U+1090A',
    origenNombre: 'El nombre se relaciona con la “palma de la mano”.',
    ideaHistorica: 'Palma o mano curvada como referente tradicional.',
    certezaHistorica: 'probable',
    evolucion: 'Signo de palma/mano → kaf paleohebreo-fenicio → arameo → כ/ך.',
    ejemplo: { palabra: 'כֹּהֵן', transliteracion: 'kohen', significado: 'sacerdote' },
    formaFinal: 'ך', unicodeFinal: 'U+05DA', grupo: 'begadkefat',
    variantes: ['כּ con dagesh', 'כ sin dagesh', 'ך forma final'],
    nota: 'Al final de palabra usa ך. La forma final conserva el mismo valor estándar de gematría: 20.',
  },
  {
    orden: 12, letra: 'ל', nombre: 'Lamed', transliteracion: 'l', unicode: 'U+05DC', valor: 30,
    sonidoPedagogico: 'L.', pronunciacion: 'L como en “luz”.',
    fenicio: '𐤋', unicodeFenicio: 'U+1090B',
    origenNombre: 'El nombre se relaciona con una aguijada o vara para guiar ganado.',
    ideaHistorica: 'Aguijada o vara de conducción de animales.',
    certezaHistorica: 'bien atestiguado',
    evolucion: 'Signo de aguijada → lamed paleohebreo-fenicio → arameo → ל.',
    ejemplo: { palabra: 'לֵב', transliteracion: 'lev', significado: 'corazón' },
    nota: 'Su forma cuadrada sobresale por encima de muchas otras letras.',
  },
  {
    orden: 13, letra: 'מ', nombre: 'Mem', transliteracion: 'm', unicode: 'U+05DE', valor: 40,
    sonidoPedagogico: 'M.', pronunciacion: 'M como en “mano”.',
    fenicio: '𐤌', unicodeFenicio: 'U+1090C',
    origenNombre: 'El nombre se relaciona con “agua”.',
    ideaHistorica: 'Ondas o agua como referente acrofónico tradicional.',
    certezaHistorica: 'bien atestiguado',
    evolucion: 'Signo de agua/ondas → mem paleohebreo-fenicio → arameo → מ/ם.',
    ejemplo: { palabra: 'מַיִם', transliteracion: 'mayim', significado: 'agua / aguas' },
    formaFinal: 'ם', unicodeFinal: 'U+05DD', variantes: ['מ forma medial/inicial', 'ם forma final'],
    nota: 'Al final de palabra usa ם; en gematría estándar ambas formas valen 40.',
  },
  {
    orden: 14, letra: 'נ', nombre: 'Nun', transliteracion: 'n', unicode: 'U+05E0', valor: 50,
    sonidoPedagogico: 'N.', pronunciacion: 'N como en “nube”.',
    fenicio: '𐤍', unicodeFenicio: 'U+1090D',
    origenNombre: 'La etimología suele vincularse con pez, aunque los detalles del pictograma temprano son discutidos.',
    ideaHistorica: 'Pez o criatura acuática en la explicación tradicional.',
    certezaHistorica: 'debatido',
    evolucion: 'Signo temprano discutido → nun fenicio/paleohebreo → arameo → נ/ן.',
    ejemplo: { palabra: 'נָבִיא', transliteracion: 'naviʾ', significado: 'profeta' },
    formaFinal: 'ן', unicodeFinal: 'U+05DF', variantes: ['נ forma medial/inicial', 'ן forma final'],
    nota: 'Al final de palabra usa ן; en gematría estándar ambas formas valen 50.',
  },
  {
    orden: 15, letra: 'ס', nombre: 'Samekh', transliteracion: 's', unicode: 'U+05E1', valor: 60,
    sonidoPedagogico: 'S sorda.', pronunciacion: 'S como en “sol”.',
    fenicio: '𐤎', unicodeFenicio: 'U+1090E',
    origenNombre: 'La etimología antigua no es completamente segura; tradicionalmente se asocia con “soporte”.',
    ideaHistorica: 'Soporte, apoyo u objeto estructural; identificación pictográfica discutida.',
    certezaHistorica: 'debatido',
    evolucion: 'Signo alfabético temprano → samekh fenicio/paleohebreo → arameo → ס.',
    ejemplo: { palabra: 'סֵפֶר', transliteracion: 'sefer', significado: 'libro / rollo' },
  },
  {
    orden: 16, letra: 'ע', nombre: 'Ayin', transliteracion: 'ʿ', unicode: 'U+05E2', valor: 70,
    sonidoPedagogico: 'Consonante faríngea sonora en su valor histórico; en varias pronunciaciones modernas se debilita o desaparece.',
    pronunciacion: 'No tiene equivalente exacto en español. Al principio aprende a reconocerla y no la confundas con Alef.',
    fenicio: '𐤏', unicodeFenicio: 'U+1090F',
    origenNombre: 'El nombre se relaciona con “ojo”.',
    ideaHistorica: 'Ojo; la relación entre el signo temprano y el ojo está bien documentada.',
    certezaHistorica: 'bien atestiguado',
    evolucion: 'Signo de ojo → ayin paleohebreo/fenicio → arameo → ע.',
    ejemplo: { palabra: 'עַם', transliteracion: 'ʿam', significado: 'pueblo / gente' },
    nota: 'Es gutural y afecta varias reglas vocálicas del hebreo bíblico.',
  },
  {
    orden: 17, letra: 'פ', nombre: 'Pe', transliteracion: 'p / f', unicode: 'U+05E4', valor: 80,
    sonidoPedagogico: 'פּ = p; פ sin dagesh = f.', pronunciacion: 'P como “pan”; sin dagesh, f como “familia”.',
    fenicio: '𐤐', unicodeFenicio: 'U+10910',
    origenNombre: 'El nombre se relaciona con “boca”.', ideaHistorica: 'Boca como referente acrofónico tradicional.',
    certezaHistorica: 'bien atestiguado',
    evolucion: 'Signo de boca → pe fenicio/paleohebreo → arameo → פ/ף.',
    ejemplo: { palabra: 'פֶּה', transliteracion: 'peh', significado: 'boca' },
    formaFinal: 'ף', unicodeFinal: 'U+05E3', grupo: 'begadkefat',
    variantes: ['פּ con dagesh', 'פ sin dagesh', 'ף forma final'],
    nota: 'Al final de palabra usa ף; en gematría estándar ambas formas valen 80.',
  },
  {
    orden: 18, letra: 'צ', nombre: 'Tsadi', transliteracion: 'ṣ', unicode: 'U+05E6', valor: 90,
    sonidoPedagogico: 'En hebreo israelí suele sonar ts; históricamente pertenece a las consonantes enfáticas.',
    pronunciacion: 'Para lectura inicial, usa “ts” como al final de “robots”.',
    fenicio: '𐤑', unicodeFenicio: 'U+10911',
    origenNombre: 'La etimología y el objeto pictográfico original son discutidos.',
    ideaHistorica: 'Se han propuesto planta, anzuelo u otros referentes; no hay consenso suficiente.',
    certezaHistorica: 'debatido',
    evolucion: 'Signo temprano de identificación incierta → tsadi fenicio/paleohebreo → arameo → צ/ץ.',
    ejemplo: { palabra: 'צֶדֶק', transliteracion: 'ṣedeq', significado: 'justicia / rectitud' },
    formaFinal: 'ץ', unicodeFinal: 'U+05E5', variantes: ['צ forma medial/inicial', 'ץ forma final'],
    nota: 'Al final de palabra usa ץ; en gematría estándar ambas formas valen 90.',
  },
  {
    orden: 19, letra: 'ק', nombre: 'Qof', transliteracion: 'q', unicode: 'U+05E7', valor: 100,
    sonidoPedagogico: 'Oclusiva posterior históricamente; muchas lecturas modernas la aproximan a k.',
    pronunciacion: 'Para empezar puede sonar como k, recordando que históricamente era más posterior.',
    fenicio: '𐤒', unicodeFenicio: 'U+10912',
    origenNombre: 'La etimología se ha explicado de varias maneras y permanece discutida.',
    ideaHistorica: 'Se han propuesto mono, nuca o abertura/aguja, entre otras hipótesis.',
    certezaHistorica: 'debatido',
    evolucion: 'Signo temprano discutido → qof fenicio/paleohebreo → arameo → ק.',
    ejemplo: { palabra: 'קוֹל', transliteracion: 'qol', significado: 'voz / sonido' },
  },
  {
    orden: 20, letra: 'ר', nombre: 'Resh', transliteracion: 'r', unicode: 'U+05E8', valor: 200,
    sonidoPedagogico: 'R; su articulación varía entre tradiciones de lectura.',
    pronunciacion: 'Puedes usar una r española suave; evita convertir diferencias tradicionales en una regla absoluta.',
    fenicio: '𐤓', unicodeFenicio: 'U+10913',
    origenNombre: 'El nombre se relaciona con “cabeza”.', ideaHistorica: 'Cabeza o perfil de cabeza como referente acrofónico.',
    certezaHistorica: 'bien atestiguado',
    evolucion: 'Signo de cabeza → resh fenicio/paleohebreo → arameo → ר.',
    ejemplo: { palabra: 'רוּחַ', transliteracion: 'ruaḥ', significado: 'viento / espíritu' },
  },
  {
    orden: 21, letra: 'ש', nombre: 'Shin / Sin', transliteracion: 'š / ś', unicode: 'U+05E9', valor: 300,
    sonidoPedagogico: 'שׁ = sh; שׂ = s.', pronunciacion: 'Sh como en inglés “show”; Sin suena s como en “sol”.',
    fenicio: '𐤔', unicodeFenicio: 'U+10914',
    origenNombre: 'El nombre se relaciona tradicionalmente con “diente”.',
    ideaHistorica: 'Dientes o dentadura como referente acrofónico.',
    certezaHistorica: 'probable',
    evolucion: 'Signo asociado a dientes → shin fenicio/paleohebreo → arameo → ש; los puntos masoréticos distinguen שׁ/שׂ.',
    ejemplo: { palabra: 'שָׁלוֹם', transliteracion: 'shalom', significado: 'paz / bienestar' },
    variantes: ['שׁ Shin: punto a la derecha', 'שׂ Sin: punto a la izquierda'],
    nota: 'Shin y Sin comparten la misma letra base del Alef-bet; el punto masorético distingue su lectura.',
  },
  {
    orden: 22, letra: 'ת', nombre: 'Tav', transliteracion: 't', unicode: 'U+05EA', valor: 400,
    sonidoPedagogico: 'T; la tradición tiberiense distingue una variante fricativa sin dagesh.',
    pronunciacion: 'T como en “tierra”; más adelante veremos la variante histórica de begadkefat.',
    fenicio: '𐤕', unicodeFenicio: 'U+10915',
    origenNombre: 'El nombre se relaciona con “marca / señal”.',
    ideaHistorica: 'Marca, señal o cruz simple como referente gráfico temprano.',
    certezaHistorica: 'bien atestiguado',
    evolucion: 'Signo de marca → taw/tav fenicio-paleohebreo → arameo → ת.',
    ejemplo: { palabra: 'תּוֹרָה', transliteracion: 'torah', significado: 'instrucción / ley' },
    grupo: 'begadkefat', variantes: ['תּ con dagesh', 'ת sin dagesh'],
  },
] as const

export const ALEF_BET_FINAL_FORMS = ALEF_BET.filter((letter) => Boolean(letter.formaFinal))
