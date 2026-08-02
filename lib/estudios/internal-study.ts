import 'server-only'

import type { EstudioResultadoValidado } from '@/lib/estudios/ai-config'

type EstudioInterno = {
  canonicalReference: string
  aliases: string[]
  resultado: EstudioResultadoValidado
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim()
}

const ESTUDIOS: EstudioInterno[] = [
  {
    canonicalReference: 'Salmos 23:1',
    aliases: ['Salmos 23:1', 'Salmo 23:1', 'Psalm 23:1', 'Psalms 23:1', 'Ps 23:1'],
    resultado: {
      texto_original: 'יְהוָה רֹעִי לֹא אֶחְסָר',
      transliteracion: 'YHWH ro‘í, lo ’eḥsár.',
      traduccion_literal: '“YHWH es mi pastor; no careceré.” El hebreo expresa una relación personal mediante “mi pastor” y emplea el verbo ḥaser para indicar carecer o faltar.',
      traduccion_interpretativa: '“El Señor cuida de mí como un pastor; por eso no me faltará lo necesario.” Esta formulación comunica el sentido pastoral sin convertir el verso en una promesa de riqueza o ausencia total de sufrimiento.',
      comparacion_versiones: 'Las traducciones suelen coincidir en “El Señor es mi pastor; nada me faltará”. Algunas conservan el nombre divino como “YHWH” o “Yahvé”; otras usan “Señor” siguiendo la tradición judía de lectura. “Nada me faltará” puede sonar absoluto en español, pero el poema desarrolla la idea como cuidado, guía, sustento y presencia incluso en situaciones de peligro.',
      contexto_historico: 'El salmo pertenece a la poesía hebrea de la antigua Israel. La imagen del pastor era cotidiana en una sociedad agraria y también funcionaba como metáfora de liderazgo: reyes y gobernantes podían ser descritos como pastores de un pueblo. El poema aplica esa imagen a Dios y presenta su cuidado mediante alimento, descanso, guía, protección y hospitalidad. La fecha exacta de composición se debate y no puede establecerse solo a partir del verso.',
      analisis_linguistico: 'יְהוָה (YHWH) es el nombre divino representado por cuatro consonantes. רֹעִי (ro‘í) significa “mi pastor” y deriva del verbo רעה, “pastorear, cuidar”. אֶחְסָר (’eḥsár) procede de חסר, “carecer, faltar”. El verso no contiene una lista de posesiones; expresa confianza relacional. El paralelismo del salmo amplía después esa confianza mediante imágenes de agua, senderos, valle, mesa y casa.',
      que_quiso_comunicar: 'En su contexto literario, el verso introduce una confesión de confianza: el orante entiende a Dios como quien guía, sostiene y protege. Desde la fe bíblica, el texto invita a reconocer que la seguridad principal no depende del control humano, sino de la presencia fiel de Dios en todas las etapas del camino.',
      que_no_quiso_decir: 'No afirma que una persona fiel nunca sufrirá, nunca perderá algo ni recibirá automáticamente prosperidad material. El mismo salmo contempla un valle oscuro y la presencia de enemigos. Tampoco presenta a Dios como una técnica para obtener deseos; describe una relación de dependencia, guía y compañía.',
      explicacion: 'La lógica del verso es relacional: si Dios es comparado con un pastor fiel, el creyente puede confiar en su cuidado. La frase “no careceré” se comprende mejor dentro de todo el salmo: hay provisión, dirección y compañía, pero también peligro. La confianza no elimina la dificultad; cambia la manera de atravesarla.',
      reflexion: 'Este verso permite descansar sin negar la realidad. La confianza bíblica no consiste en fingir que todo está bien, sino en reconocer que Dios sigue presente cuando el camino es claro y cuando atraviesa un valle. Puede convertirse en una oración sencilla: “Guíame, cuídame y enséñame a confiar en lo que verdaderamente necesito”.',
    },
  },
  {
    canonicalReference: 'Juan 3:16',
    aliases: ['Juan 3:16', 'John 3:16', 'Jn 3:16', 'Jhn 3:16'],
    resultado: {
      texto_original: 'Οὕτως γὰρ ἠγάπησεν ὁ θεὸς τὸν κόσμον, ὥστε τὸν υἱὸν τὸν μονογενῆ ἔδωκεν, ἵνα πᾶς ὁ πιστεύων εἰς αὐτὸν μὴ ἀπόληται ἀλλ’ ἔχῃ ζωὴν αἰώνιον.',
      transliteracion: 'Hoútōs gar ēgápēsen ho theòs tòn kósmon, hṓste tòn huiòn tòn monogenē édōken, hína pâs ho pisteúōn eis autón mē apólētai all’ échē zōḕn aiṓnion.',
      traduccion_literal: '“Porque de esta manera amó Dios al mundo: dio al Hijo único, para que todo el que confía en él no perezca, sino que tenga vida eterna.” El adverbio hoútōs puede señalar tanto la intensidad como, especialmente aquí, la manera en que el amor fue demostrado.',
      traduccion_interpretativa: '“Dios mostró su amor por la humanidad entregando a su Hijo, para que quien deposita su confianza en él no termine en perdición, sino que participe de la vida eterna.”',
      comparacion_versiones: 'Las versiones varían entre “de tal manera amó” y “así amó”, diferencia que afecta el énfasis: intensidad del amor o modo concreto de demostrarlo. Monogenēs se traduce como “unigénito”, “único” o “Hijo único”. Pisteúōn puede expresarse como “cree”, aunque en el uso del pasaje implica confianza y adhesión, no solo aceptar una idea.',
      contexto_historico: 'El evangelio de Juan refleja un ambiente judío del siglo I y dialoga con las Escrituras de Israel. El contexto inmediato incluye la conversación con Nicodemo, un maestro judío, el tema del nuevo nacimiento y la referencia a la serpiente levantada por Moisés en el desierto. La fecha exacta de composición del evangelio es debatida, pero normalmente se sitúa hacia finales del siglo I. El verso debe leerse dentro de este marco narrativo y no como una frase aislada.',
      analisis_linguistico: 'ἠγάπησεν es aoristo activo de ἀγαπάω, “amar”, y presenta el amor demostrado en una acción. κόσμος puede referirse al mundo humano en su condición de alejamiento de Dios; no significa necesariamente aprobación de todo sistema humano. πιστεύων es participio presente de πιστεύω, “creer, confiar”. μονογενής destaca la singularidad del Hijo. ζωὴ αἰώνιος es “vida eterna”, una vida vinculada al conocimiento y comunión con Dios, no solo duración ilimitada.',
      que_quiso_comunicar: 'El texto presenta la iniciativa de Dios: el amor precede a la respuesta humana y se hace visible en la entrega del Hijo. La finalidad es rescatar y dar vida. Dentro de la teología de Juan, creer significa venir a la luz, confiar en Jesús y recibir la vida que él revela del Padre.',
      que_no_quiso_decir: 'No enseña que repetir la frase garantice salvación de manera mecánica ni que creer sea solo aceptar información sin transformación. Tampoco autoriza a despreciar al mundo: precisamente afirma que el amor de Dios se dirige hacia él. El verso no debe separarse de los versículos siguientes, donde se explica que la misión del Hijo es salvar y que la respuesta humana a la luz tiene consecuencias.',
      explicacion: 'La secuencia es coherente: Dios ama, Dios da, la persona confía y recibe vida. La salvación no nace del mérito humano, sino de la iniciativa divina; sin embargo, la confianza descrita por Juan es una respuesta real y continua. El texto une amor, revelación, decisión y vida.',
      reflexion: 'Juan 3:16 invita a contemplar un amor que actúa. No presenta a Dios como distante, sino como quien se acerca y entrega. La respuesta espiritual no consiste únicamente en admirar la frase, sino en aprender a confiar en Jesús, caminar hacia la luz y reflejar ese amor en la manera de tratar a otras personas.',
    },
  },
]

export function obtenerEstudioInterno(pasaje: string) {
  const normalized = normalize(pasaje)
  const study = ESTUDIOS.find((candidate) =>
    candidate.aliases.some((alias) => normalize(alias) === normalized)
  )

  if (!study) return null
  return {
    pasaje: study.canonicalReference,
    resultado: study.resultado,
  }
}

export function referenciasInternasDisponibles() {
  return ESTUDIOS.map((study) => study.canonicalReference)
}
