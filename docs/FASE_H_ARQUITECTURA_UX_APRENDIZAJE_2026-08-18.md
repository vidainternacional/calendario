# FASE H — Arquitectura UX de aprendizaje de Hebreo Bíblico

Fecha inicial: 2026-08-18
Última alineación: 2026-08-19
Estado: contrato vivo de diseño para FASE H

## 1. Propósito del Centro de Hebreo Bíblico

El objetivo es que el usuario pueda **leer, pronunciar y comprender progresivamente el hebreo bíblico** hasta utilizar el texto original con mayor autonomía.

La progresión global es:

`RECONOZCO → DISTINGO → COMBINO → LEO → COMPRENDO → PRONUNCIO CON MAYOR AUTONOMÍA`

Este centro no mezcla hebreo moderno conversacional con hebreo bíblico. Una futura pista de conversación moderna, si alguna vez se aprueba, debe ser independiente.

El audio no se sustituye con `speechSynthesis`. Escuchar/repetir solo se habilitará cuando exista una fuente de pronunciación confiable y aprobada.

## 2. Estado de validación móvil — 2026-08-19

- **Alef-Bet:** base visual validada.
- **Vocales / niqqud:** base visual validada.
- **Palabras:** diccionario/vocabulario separado de Lectura; validado como dirección pedagógica.
- **Lectura:** frases, oraciones y versículos reales separados de Palabras; validado como dirección pedagógica.
- **Gate actual:** **Reglas esenciales**, implementación técnica verde en CI y Vercel; pendiente validación visual móvil.
- **Repaso:** permanece como siguiente área después de validar Reglas.
- No activar todavía audio, progreso persistente, desbloqueos ni evaluación almacenada.

## 3. Arquitectura de información

Hebreo Bíblico debe sentirse como una app moderna de aprendizaje: calmada, editorial, accesible, móvil y progresiva.

Inicio:
1. Aprender.
2. Materiales y curso.
3. Prueba tu progreso.
4. Biblia en hebreo.

La portada conserva alta densidad útil: encabezado compacto + cuatro accesos 2×2. Ningún bloque se abre por defecto.

## 4. Orden didáctico actual de Aprender

1. **Alef-Bet** — letras y diferencias visuales.
2. **Vocales** — niqqud y combinación consonante + signo.
3. **Palabras** — vocabulario/diccionario para memorizar términos.
4. **Lectura** — frases y oraciones reales para ganar continuidad.
5. **Reglas** — piezas y relaciones gramaticales que explican lo que se está leyendo.
6. **Repaso** — recuperación de errores y confusiones.

Después podrán crecer por capas: raíces, sistema verbal, construcciones avanzadas y lectura guiada más profunda.

## 5. Patrón visual compartido

Cuando una colección lo permita, usar:

- **Tarjetas:** selección visual; tocar abre/retrae bajo la misma fila.
- **Lista:** consulta rápida y compacta.
- **Detalle:** un elemento por vez con Anterior/Siguiente.

Reglas comunes:
- contenido hebreo protagonista;
- botones táctiles cómodos;
- nada abierto automáticamente si ocupa espacio considerable;
- explicaciones largas cerradas por defecto;
- superficies integradas y pocos contenedores anidados;
- animaciones breves y compatibles con `prefers-reduced-motion`.

## 6. Alef-Bet — validado

Conserva:
- 22 letras y cinco formas finales;
- filtros Alef–Yod, Kaf–Tav, Dagesh, Sofit, Guturales, Matres y Shin/Sin;
- Tarjetas · Lista · Detalle;
- Lista: Signo · Nombre · Valor · Sonido · Significado;
- ficha ampliada con Libro · Cuadrada · Manuscrita;
- reverso desplazable como una sola pieza, sin encabezado `sticky`;
- explicación `¿Qué es el Alef-Bet?` con scroll limitado;
- historia/pictografía nunca presentada como significado léxico o teológico automático.

## 7. Vocales / niqqud — validado

Base actual:
Pataj · Qamats · Segol · Tsere · Hiriq · Holam · Qubuts · Shuruq · Sheva · Hataf Pataj · Hataf Segol · Hataf Qamats.

Conserva:
- Tarjetas · Lista · Detalle;
- Tarjetas cerradas al entrar y expansión bajo su fila;
- Lista: Signo · Nombre · Valor · Sonido · Función;
- `Valor = —` porque el niqqud no tiene gematría propia;
- cautelas para qamats qatan, sheva y shuruq.

## 8. Palabras — diccionario de aprendizaje

`ReadingWordsExplorer` es vocabulario, no Lectura.

Conserva:
- Con niqqud · Sin niqqud;
- Tarjetas · Lista · Detalle;
- tarjeta: hebreo · pronunciación · español;
- Lista: hebreo/pronunciación a la izquierda y español a la derecha;
- Detalle: escritura · pronunciación · formación visible · significado;
- sin Strong, fuente ni metadatos técnicos visibles;
- grupos semánticos y gramaticales;
- catálogo hebreo real paginado, 24 entradas por página;
- navegación de páginas arriba y abajo;
- búsqueda hebrea con o sin niqqud;
- búsqueda española primero editorial y, cuando falta equivalencia, recuperación contextual con RV1909 claramente marcada como relación y no como traducción uno-a-uno.

## 9. Lectura — frases y oraciones reales

`ReadingSentencesExplorer` trabaja continuidad textual y no memoriza términos aislados.

Conserva:
- Con niqqud · Sin niqqud;
- Tarjetas · Lista · Detalle;
- Iniciales · Cortas · Medias · Largas · Todas;
- búsqueda por español o hebreo;
- RV1909 como comparación española aprobada;
- acceso paginado al corpus hebreo aprobado del AT;
- reutilización de `biblical_verse_texts`, sin crear un segundo motor bíblico.

## 10. Reglas — gate actual

Reglas debe explicar **por qué una forma se ve como se ve**, sin convertirse en una tabla académica extensa.

Primera capa:
- artículo definido `הַ`;
- conjunción `וְ`;
- preposiciones prefijadas `בְּ · לְ · כְּ` y `מִן`;
- combinación preposición + artículo;
- pistas de género y número con excepciones explícitas;
- concordancia sustantivo + adjetivo;
- cadena constructa.

UX:
- Tarjetas · Lista · Detalle;
- filtros Básicas · Prefijos · Nombres · Frase · Todas;
- una regla → ejemplo → pronunciación → significado → explicación → cautela;
- no deducir raíces automáticamente cuando la base no contiene una raíz verificada.

El sistema verbal y raíces completas se incorporarán en capas posteriores de Reglas.

## 11. Repaso — siguiente después de Reglas

Sesiones breves de 5–10 elementos que combinen lo ya estudiado.

Estados futuros:
- Lo sé.
- Necesito practicar.
- Repasar después.

Cuando exista persistencia real, Repaso priorizará errores, confusiones y antigüedad del último estudio; no porcentajes ficticios.

## 12. Prueba tu progreso

Contrato aprobado:
- mínimo 10–15 preguntas por evaluación;
- una pregunta por pantalla;
- tipos variados según contenido ya estudiado;
- feedback y puntuación deben basarse en respuestas reales;
- resultado final como ficha de maestro: fortalezas, refuerzo y consejo;
- historial futuro de fichas para comparar evolución.

La UI actual sigue siendo prototipo hasta implementar cálculo real e historial.

## 13. Progreso persistente

No simular progreso.

Cuando se implemente deberá ser privado por usuario y almacenar únicamente información necesaria para aprendizaje. Si requiere Supabase nuevo o cambios de RLS, antes se presentarán alcance, impacto, políticas y reversión para aprobación explícita.

## 14. Pronunciación y audio

Objetivo oral de FASE H: **pronunciar y leer en voz alta hebreo bíblico**, no conversación moderna.

Futuro:
- escuchar letra/signo/palabra/frase;
- repetir;
- práctica de lectura en voz alta;
- posteriormente evaluación de pronunciación solo si existe una metodología fiable.

No mostrar botones falsos de audio mientras la fuente no esté aprobada.

## 15. Material de apoyo

Los 11 enlaces externos proporcionados por el usuario permanecen exactamente conservados y con estado `pendiente` hasta corroboración visual individual. No sustituyen el motor lingüístico ni las fuentes editoriales de VIDA.

## 16. Biblia en hebreo

Debe convertirse progresivamente en el destino final del aprendizaje: leer cualquier pasaje con ayudas graduables usando el motor bíblico existente.

Ayudas futuras:
`niqqud → pronunciación → palabra → glosa/morfología → comparación española aprobada`.

Nunca duplicar Estudio Profundo ni fabricar una traducción literal española del AT.

## 17. Criterio visual

- estilo iOS, editorial y calmado;
- hebreo claramente mayor que el español;
- jerarquía por espaciado, tipografía y separadores;
- minimizar scroll cuando la información puede agruparse;
- no mascotas, confeti, rachas obligatorias ni saturación de badges;
- no generar imágenes para este proyecto salvo petición explícita del usuario.
