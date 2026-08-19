export type HebrewSupportClass = {
  orden: number
  titulo: string
  tema: string
  url: string
}

/**
 * Material de apoyo externo para FASE H.
 *
 * Curso: "Hebreo para principiantes" — David Acevedo.
 * Los enlaces fueron proporcionados por el usuario y se conservan exactamente.
 * Este material complementa el Centro de Hebreo; no sustituye las fuentes
 * lingüísticas/editoriales versionadas de VIDA ni define por sí solo la
 * metodología oficial de la aplicación.
 */
export const HEBREW_SUPPORT_COURSE: readonly HebrewSupportClass[] = [
  {
    orden: 1,
    titulo: 'Alef-bet · Parte 1',
    tema: 'Primer contacto con el alfabeto hebreo.',
    url: 'https://www.youtube.com/watch?v=fvBD-rFlTfg',
  },
  {
    orden: 2,
    titulo: 'Alef-bet · Parte 2',
    tema: 'Continuación del alfabeto hebreo.',
    url: 'https://www.youtube.com/watch?v=SDXpqQEyJMQ',
  },
  {
    orden: 3,
    titulo: 'Empezando a leer',
    tema: 'Primeros pasos para combinar y reconocer lectura.',
    url: 'https://www.youtube.com/watch?v=FQNxp1sBhW4',
  },
  {
    orden: 4,
    titulo: 'Sofit',
    tema: 'Las cinco formas finales de ciertas letras.',
    url: 'https://www.youtube.com/watch?v=ThBVM5GHgN8',
  },
  {
    orden: 5,
    titulo: 'Daguesh',
    tema: 'El punto que puede modificar la lectura de algunas letras.',
    url: 'https://www.youtube.com/watch?v=yDL7kY-x5u8',
  },
  {
    orden: 6,
    titulo: 'Nekudot · Parte 1',
    tema: 'Introducción al sistema de vocalización.',
    url: 'https://www.youtube.com/watch?v=gxRYxrGZd7s',
  },
  {
    orden: 7,
    titulo: 'Nekudot · Parte 2',
    tema: 'Continuación del sistema de vocalización.',
    url: 'https://www.youtube.com/watch?v=hqN4n6q7vU8',
  },
  {
    orden: 8,
    titulo: 'Lectura',
    tema: 'Práctica de lectura con lo aprendido.',
    url: 'https://www.youtube.com/watch?v=9sNpPXd0ZjY',
  },
  {
    orden: 9,
    titulo: 'Shemá Yisrael',
    tema: 'Aplicación práctica sobre un texto hebreo conocido.',
    url: 'https://www.youtube.com/watch?v=U-pVctsaKdw',
  },
  {
    orden: 10,
    titulo: 'Reglas básicas · Parte 1',
    tema: 'Primer grupo de reglas para avanzar en la lectura.',
    url: 'https://www.youtube.com/watch?v=dFf_YESTZPA',
  },
  {
    orden: 11,
    titulo: 'Reglas básicas · Parte 2',
    tema: 'Continuación de las reglas básicas.',
    url: 'https://www.youtube.com/watch?v=UIdIzEtweOc',
  },
]
