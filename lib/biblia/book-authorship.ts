export type BookAuthorship = {
  book: string
  attribution: string
  note: string
  certainty: 'identified' | 'traditional' | 'multiple' | 'anonymous' | 'debated'
}

const normalize = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '')

const books: BookAuthorship[] = [
  { book: 'Génesis', attribution: 'Tradicionalmente atribuido a Moisés', note: 'El libro no identifica directamente a un autor; su composición y edición son discutidas en los estudios bíblicos.', certainty: 'traditional' },
  { book: 'Éxodo', attribution: 'Tradicionalmente atribuido a Moisés', note: 'La tradición mosaica es antigua, aunque el proceso de composición y edición se considera complejo.', certainty: 'traditional' },
  { book: 'Levítico', attribution: 'Tradicionalmente atribuido a Moisés', note: 'Reúne legislación y tradición sacerdotal; el texto no ofrece una firma de autor moderna.', certainty: 'traditional' },
  { book: 'Números', attribution: 'Tradicionalmente atribuido a Moisés', note: 'La tradición lo vincula con Moisés, con posibles etapas posteriores de organización editorial.', certainty: 'traditional' },
  { book: 'Deuteronomio', attribution: 'Tradicionalmente atribuido a Moisés', note: 'Presenta discursos de Moisés; su forma final y edición son objeto de debate académico.', certainty: 'traditional' },
  { book: 'Josué', attribution: 'Tradicionalmente asociado con Josué', note: 'La forma final parece incluir materiales y edición posteriores a los acontecimientos narrados.', certainty: 'traditional' },
  { book: 'Jueces', attribution: 'Autor o compiladores no identificados', note: 'La tradición judía lo relacionó con Samuel, pero el libro no nombra a su autor.', certainty: 'anonymous' },
  { book: 'Rut', attribution: 'Autor no identificado', note: 'La tradición lo relacionó con Samuel; el texto permanece anónimo.', certainty: 'anonymous' },
  { book: '1 Samuel', attribution: 'Compilación de fuentes proféticas e históricas', note: 'Samuel aparece como figura central al inicio, pero no pudo escribir la totalidad del libro.', certainty: 'multiple' },
  { book: '2 Samuel', attribution: 'Compilación de fuentes proféticas e históricas', note: 'El autor o editor final no está identificado.', certainty: 'multiple' },
  { book: '1 Reyes', attribution: 'Autor o escuela editorial no identificada', note: 'La tradición lo vinculó con Jeremías; la atribución no es explícita en el texto.', certainty: 'anonymous' },
  { book: '2 Reyes', attribution: 'Autor o escuela editorial no identificada', note: 'Forma una obra histórica continua con 1 Reyes y refleja edición durante o después del exilio.', certainty: 'anonymous' },
  { book: '1 Crónicas', attribution: 'Cronista anónimo; tradicionalmente relacionado con Esdras', note: 'La identidad exacta del cronista no está confirmada.', certainty: 'traditional' },
  { book: '2 Crónicas', attribution: 'Cronista anónimo; tradicionalmente relacionado con Esdras', note: 'Comparte autoría o escuela editorial con 1 Crónicas.', certainty: 'traditional' },
  { book: 'Esdras', attribution: 'Tradicionalmente asociado con Esdras', note: 'Incluye memorias, documentos y trabajo editorial; no todo el contenido procede necesariamente de una sola mano.', certainty: 'traditional' },
  { book: 'Nehemías', attribution: 'Memorias de Nehemías con edición posterior', note: 'Contiene secciones en primera persona y materiales organizados por un editor.', certainty: 'multiple' },
  { book: 'Ester', attribution: 'Autor no identificado', note: 'El libro no identifica a su autor; se han propuesto diversos contextos de composición.', certainty: 'anonymous' },
  { book: 'Job', attribution: 'Autor no identificado', note: 'La historia y los discursos pudieron atravesar varias etapas de composición.', certainty: 'anonymous' },
  { book: 'Salmos', attribution: 'Colección de varios autores', note: 'Muchos salmos se atribuyen a David; otros a Asaf, los hijos de Coré, Salomón, Moisés, Hemán y Etán, y varios son anónimos.', certainty: 'multiple' },
  { book: 'Proverbios', attribution: 'Colección asociada con Salomón y otros sabios', note: 'Incluye materiales atribuidos a Salomón, Agur, Lemuel y colecciones de sabios.', certainty: 'multiple' },
  { book: 'Eclesiastés', attribution: '“Qohelet”; tradicionalmente identificado con Salomón', note: 'La identidad exacta de Qohelet y la relación con Salomón son discutidas.', certainty: 'debated' },
  { book: 'Cantares', attribution: 'Tradicionalmente asociado con Salomón', note: 'Puede entenderse como una colección poética; la autoría individual no está confirmada.', certainty: 'debated' },
  { book: 'Isaías', attribution: 'Isaías y una tradición profética posterior', note: 'El libro se vincula con Isaías hijo de Amoz; muchos estudios distinguen etapas y voces editoriales, especialmente en los capítulos 40–66.', certainty: 'multiple' },
  { book: 'Jeremías', attribution: 'Jeremías, con participación de Baruc y editores', note: 'El libro menciona a Baruc como escriba y conserva diversas formas del material profético.', certainty: 'multiple' },
  { book: 'Lamentaciones', attribution: 'Autor no identificado; tradicionalmente Jeremías', note: 'La atribución a Jeremías es tradicional, pero el libro no lo nombra como autor.', certainty: 'traditional' },
  { book: 'Ezequiel', attribution: 'Ezequiel y su círculo editorial', note: 'La mayor parte se presenta en voz del profeta, con señales de organización editorial.', certainty: 'multiple' },
  { book: 'Daniel', attribution: 'Atribuido a Daniel; forma final discutida', note: 'El libro combina relatos y visiones; la fecha y el proceso de composición son debatidos.', certainty: 'debated' },
  { book: 'Oseas', attribution: 'Oseas, con edición profética posterior', note: 'El núcleo se atribuye al profeta Oseas.', certainty: 'identified' },
  { book: 'Joel', attribution: 'Joel hijo de Petuel', note: 'El texto identifica al profeta, aunque la fecha exacta es discutida.', certainty: 'identified' },
  { book: 'Amós', attribution: 'Amós de Tecoa', note: 'El libro identifica al profeta y conserva edición posterior de sus mensajes.', certainty: 'identified' },
  { book: 'Abdías', attribution: 'Abdías', note: 'El texto atribuye la visión a Abdías; no se conocen más datos seguros sobre su identidad.', certainty: 'identified' },
  { book: 'Jonás', attribution: 'Autor no identificado', note: 'Jonás es el personaje principal, pero el relato no afirma que él lo escribiera.', certainty: 'anonymous' },
  { book: 'Miqueas', attribution: 'Miqueas de Moreset', note: 'El núcleo se relaciona con el profeta, con posible edición posterior.', certainty: 'identified' },
  { book: 'Nahúm', attribution: 'Nahúm de Elcos', note: 'El texto atribuye el oráculo a Nahúm.', certainty: 'identified' },
  { book: 'Habacuc', attribution: 'Habacuc', note: 'El texto identifica al profeta, aunque se conocen pocos datos biográficos.', certainty: 'identified' },
  { book: 'Sofonías', attribution: 'Sofonías', note: 'El encabezado ofrece una genealogía del profeta.', certainty: 'identified' },
  { book: 'Hageo', attribution: 'Hageo', note: 'Los mensajes están fechados y atribuidos explícitamente al profeta.', certainty: 'identified' },
  { book: 'Zacarías', attribution: 'Zacarías y materiales proféticos posteriores', note: 'Los capítulos 1–8 se relacionan claramente con Zacarías; la autoría de 9–14 es discutida.', certainty: 'multiple' },
  { book: 'Malaquías', attribution: 'Autor no identificado o profeta llamado Malaquías', note: '“Malaquías” puede funcionar como nombre propio o como título: “mi mensajero”.', certainty: 'debated' },
  { book: 'Mateo', attribution: 'Tradicionalmente atribuido a Mateo', note: 'El evangelio no nombra a su autor dentro del texto; la atribución procede de la tradición cristiana antigua.', certainty: 'traditional' },
  { book: 'Marcos', attribution: 'Tradicionalmente atribuido a Juan Marcos', note: 'El evangelio es anónimo en su texto; la tradición lo relaciona con Marcos y la predicación de Pedro.', certainty: 'traditional' },
  { book: 'Lucas', attribution: 'Tradicionalmente atribuido a Lucas', note: 'El autor no se nombra, pero se presenta como investigador y también escribió Hechos.', certainty: 'traditional' },
  { book: 'Juan', attribution: 'Tradición joánica; autor exacto discutido', note: 'El evangelio se vincula con el “discípulo amado”, pero no lo identifica explícitamente por nombre.', certainty: 'debated' },
  { book: 'Hechos', attribution: 'Mismo autor de Lucas; tradicionalmente Lucas', note: 'Lucas y Hechos forman una obra en dos volúmenes dirigida a Teófilo.', certainty: 'traditional' },
  { book: 'Romanos', attribution: 'Pablo; escrito por medio de Tercio', note: 'Romanos 16:22 identifica a Tercio como escriba de la carta.', certainty: 'identified' },
  { book: '1 Corintios', attribution: 'Pablo, con Sóstenes', note: 'La carta identifica a Pablo y menciona a Sóstenes en el saludo.', certainty: 'identified' },
  { book: '2 Corintios', attribution: 'Pablo, con Timoteo', note: 'La carta identifica a Pablo y menciona a Timoteo en el saludo.', certainty: 'identified' },
  { book: 'Gálatas', attribution: 'Pablo', note: 'La carta se identifica explícitamente como escrita por Pablo.', certainty: 'identified' },
  { book: 'Efesios', attribution: 'Tradicionalmente Pablo; autoría discutida', note: 'La carta se presenta como paulina, aunque parte de la investigación moderna propone un discípulo posterior.', certainty: 'debated' },
  { book: 'Filipenses', attribution: 'Pablo, con Timoteo', note: 'El saludo identifica a Pablo y Timoteo.', certainty: 'identified' },
  { book: 'Colosenses', attribution: 'Tradicionalmente Pablo, con Timoteo; autoría discutida', note: 'La carta se presenta como paulina, aunque su autoría es debatida por algunos especialistas.', certainty: 'debated' },
  { book: '1 Tesalonicenses', attribution: 'Pablo, Silvano y Timoteo', note: 'Los tres aparecen en el saludo de la carta.', certainty: 'identified' },
  { book: '2 Tesalonicenses', attribution: 'Tradicionalmente Pablo, Silvano y Timoteo; autoría discutida', note: 'La carta se presenta como paulina; algunos estudios discuten su relación con 1 Tesalonicenses.', certainty: 'debated' },
  { book: '1 Timoteo', attribution: 'Tradicionalmente Pablo; autoría discutida', note: 'Forma parte de las cartas pastorales, cuya autoría paulina es debatida.', certainty: 'debated' },
  { book: '2 Timoteo', attribution: 'Tradicionalmente Pablo; autoría discutida', note: 'Se presenta como carta de Pablo a Timoteo; su autoría es debatida en la investigación moderna.', certainty: 'debated' },
  { book: 'Tito', attribution: 'Tradicionalmente Pablo; autoría discutida', note: 'Se presenta como carta de Pablo a Tito y forma parte de las cartas pastorales.', certainty: 'debated' },
  { book: 'Filemón', attribution: 'Pablo, con Timoteo', note: 'La carta identifica a Pablo y menciona a Timoteo.', certainty: 'identified' },
  { book: 'Hebreos', attribution: 'Autor no identificado', note: 'La carta no nombra a su autor; la atribución a Pablo es una tradición posterior y no es aceptada de manera general.', certainty: 'anonymous' },
  { book: 'Santiago', attribution: 'Tradicionalmente Santiago, hermano de Jesús', note: 'El saludo identifica a “Santiago”, pero cuál Santiago y la forma final de la carta son discutidos.', certainty: 'traditional' },
  { book: '1 Pedro', attribution: 'Tradicionalmente Pedro, con ayuda de Silvano', note: 'La carta se presenta como de Pedro y menciona a Silvano; su proceso de redacción es discutido.', certainty: 'traditional' },
  { book: '2 Pedro', attribution: 'Tradicionalmente Pedro; autoría muy discutida', note: 'Aunque se presenta como de Pedro, muchos especialistas consideran posible una composición posterior en su nombre.', certainty: 'debated' },
  { book: '1 Juan', attribution: 'Tradición joánica; autor no identificado', note: 'No incluye saludo con nombre y comparte lenguaje con el Evangelio de Juan.', certainty: 'debated' },
  { book: '2 Juan', attribution: '“El anciano”; tradición joánica', note: 'El autor se identifica únicamente como “el anciano”.', certainty: 'debated' },
  { book: '3 Juan', attribution: '“El anciano”; tradición joánica', note: 'El autor se identifica únicamente como “el anciano”.', certainty: 'debated' },
  { book: 'Judas', attribution: 'Judas, hermano de Santiago; tradicionalmente hermano de Jesús', note: 'La carta identifica a Judas como siervo de Jesucristo y hermano de Santiago.', certainty: 'traditional' },
  { book: 'Apocalipsis', attribution: 'Juan de Patmos', note: 'El autor se llama Juan y escribe desde Patmos; su identificación exacta con el apóstol Juan es discutida.', certainty: 'identified' },
]

const aliases: Record<string, string> = {
  salmo: 'Salmos', salmos: 'Salmos', cantar: 'Cantares', cantardeloscantares: 'Cantares',
  '1samuel': '1 Samuel', '2samuel': '2 Samuel', '1reyes': '1 Reyes', '2reyes': '2 Reyes',
  '1cronicas': '1 Crónicas', '2cronicas': '2 Crónicas', '1corintios': '1 Corintios', '2corintios': '2 Corintios',
  '1tesalonicenses': '1 Tesalonicenses', '2tesalonicenses': '2 Tesalonicenses', '1timoteo': '1 Timoteo', '2timoteo': '2 Timoteo',
  '1pedro': '1 Pedro', '2pedro': '2 Pedro', '1juan': '1 Juan', '2juan': '2 Juan', '3juan': '3 Juan',
  revelacion: 'Apocalipsis', revelation: 'Apocalipsis', acts: 'Hechos', psalms: 'Salmos', psalm: 'Salmos',
}

const byKey = new Map(books.map(item => [normalize(item.book), item]))

export function getBookAuthorship(bookName: string | null | undefined): BookAuthorship | null {
  if (!bookName) return null
  const key = normalize(bookName)
  const alias = aliases[key]
  return byKey.get(normalize(alias ?? bookName)) ?? null
}

export const authorshipCatalogVersion = 'vida-authorship-2026-08-01-v1'
