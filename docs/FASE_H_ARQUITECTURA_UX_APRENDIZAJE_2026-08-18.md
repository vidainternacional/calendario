# FASE H — Arquitectura UX de aprendizaje de Hebreo Bíblico

Fecha inicial: 2026-08-18
Última alineación: 2026-08-19
Estado: contrato vivo de diseño para FASE H

Referencia pedagógica complementaria aprobada:

- `docs/FASE_H_REFERENCIA_PEDAGOGICA_HOSHIAH_NA_2026-08-19.md`.

## 1. Propósito del Centro de Hebreo Bíblico

El objetivo es que el usuario pueda **leer, pronunciar y comprender progresivamente el hebreo bíblico** hasta utilizar el texto original con mayor autonomía.

La progresión global es:

`RECONOZCO → DISTINGO → COMBINO → LEO → COMPRENDO → PRONUNCIO CON MAYOR AUTONOMÍA`

Este centro no mezcla hebreo moderno conversacional con hebreo bíblico. Una futura pista de conversación moderna, si alguna vez se aprueba, debe ser independiente.

El audio no se sustituye con `speechSynthesis`. Escuchar/repetir solo se habilitará cuando exista una fuente de pronunciación confiable y aprobada.

## 2. Estado de validación móvil — 2026-08-19

- **Alef-Bet:** base visual validada; sus fichas se conservan como herramienta principal de memoria.
- **Vocales / niqqud:** base visual validada; conserva fichas y comparación tabular.
- **Palabras:** diccionario/vocabulario separado de Lectura; validado como dirección pedagógica.
- **Lectura:** frases, oraciones y versículos reales separados de Palabras; validado como dirección pedagógica.
- **Reglas:** pedagogía mixta Tablas · Fichas · Detalle validada como dirección general.
- **Teclado hebreo VIDA:** aprobado como herramienta útil, apagado por defecto y activable/desactivable desde la parte superior del módulo.
- **Gate actual:** **Repaso + ajuste final del teclado opcional**, implementación técnica verde; pendiente validación visual móvil.
- CI temporal #2298: **SUCCESS** — regresiones, lint y build.
- Vercel Preview del head `6d3ef9ec591974ee722a27b94f1da9d19f4567dc`: **READY**.
- No activar todavía audio, progreso persistente, desbloqueos ni evaluación almacenada.

## 3. Arquitectura de información

Hebreo Bíblico debe sentirse como una app moderna de aprendizaje: calmada, editorial, accesible, móvil y progresiva.

Inicio:
1. Aprender.
2. Materiales y curso.
3. Prueba tu progreso.
4. Biblia en hebreo.

La portada conserva alta densidad útil: encabezado compacto + cuatro accesos 2×2. Ningún bloque se abre por defecto.

Herramienta transversal opcional:
- **Teclado hebreo** — apagado por defecto;
- Activar/Desactivar inmediatamente debajo de los cuatro accesos principales;
- al activarlo aparece un acceso flotante más alto que la navegación inferior;
- al desactivarlo desaparece completamente;
- conserva compatibilidad con el teclado hebreo nativo del teléfono.

## 4. Orden didáctico actual de Aprender

1. **Alef-Bet** — letras y diferencias visuales.
2. **Vocales** — niqqud y combinación consonante + signo.
3. **Palabras** — vocabulario/diccionario para memorizar términos.
4. **Lectura** — frases y oraciones reales para ganar continuidad.
5. **Reglas** — piezas, transformaciones y relaciones gramaticales que explican lo que se está leyendo.
6. **Repaso** — recuperación de errores y confusiones mediante sesiones locales breves.

Dentro de estas áreas se incorporan progresivamente Sofit, Dagesh, matres lectionis, sheva, qamats qatan, pataj furtivo, inseparables, género/número, posesivos, estado constructo, raíces verificadas, sistema verbal por capas y Qere/Ketiv.

## 5. Patrón pedagógico mixto

No todo contenido debe usar la misma vista. La interfaz se escoge según la tarea cognitiva:

- **Fichas:** memoria, reconocimiento y estudio de un elemento individual.
- **Tablas:** comparación de formas, prefijos, sufijos, terminaciones y transformaciones.
- **Detalle:** recorrido de un elemento por vez cuando hace falta profundizar.
- **Transformación visible:** `forma base → cambio → resultado` cuando una regla modifica una palabra.
- **Ejemplo real:** palabra, frase o versículo del corpus aprobado.
- **Práctica:** comprobar reconocimiento después de la explicación.
- **Lectura aplicada:** localizar después el mismo fenómeno dentro del texto bíblico.
- **Repaso:** recuperar contenido ya estudiado sin convertirlo en un segundo examen.

Reglas comunes:
- contenido hebreo protagonista;
- botones táctiles cómodos;
- nada abierto automáticamente si ocupa espacio considerable, salvo la primera tabla introductoria cuando ayuda a entender el bloque;
- explicaciones largas plegadas;
- superficies integradas y pocos contenedores anidados;
- tablas anchas con scroll horizontal natural en móvil;
- animaciones breves y compatibles con `prefers-reduced-motion`.

## 6. Alef-Bet — validado y preservado

Conserva:
- 22 letras y cinco formas finales;
- filtros Alef–Yod, Kaf–Tav, Dagesh, Sofit, Guturales, Matres y Shin/Sin;
- fichas expandibles y reversibles como superficie principal de aprendizaje;
- comparación tabular/lista: `Signo · Nombre · Valor · Sonido · Significado`;
- Detalle: una letra por vez;
- ficha ampliada con Libro · Cuadrada · Manuscrita;
- reverso desplazable como una sola pieza, sin encabezado `sticky`;
- explicación `¿Qué es el Alef-Bet?` con scroll limitado;
- historia/pictografía nunca presentada como significado léxico o teológico automático.

Tabla específica futura de Sofit:
`Forma normal · Forma final · Nombre · Sonido · Valor ordinario · Nota`.

Si se muestra una convención ampliada de gematría para finales, se etiqueta expresamente como convención y no reemplaza el valor ordinario de la letra.

## 7. Vocales / niqqud — validado y preservado

Base actual:
Pataj · Qamats · Segol · Tsere · Hiriq · Holam · Qubuts · Shuruq · Sheva · Hataf Pataj · Hataf Segol · Hataf Qamats.

Conserva:
- fichas para reconocimiento individual;
- comparación tabular/lista: `Signo · Nombre · Valor · Sonido · Función`;
- Detalle: un signo por vez;
- `Valor = —` porque el niqqud no tiene gematría propia;
- cautelas para qamats qatan, sheva y shuruq.

La tabla pedagógica deberá crecer por capas hacia:
`Signo · Nombre · Familia · Sonido · Combinación · Ejemplo · Regla/cautela`.

Incorporaciones progresivas: sheva vocal/silencioso, pataj furtivo, qamats qatan, shuruq y holam con mater cuando corresponda.

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

La lectura debe convertirse progresivamente en el lugar donde se aplican las letras, vocales, palabras y reglas aprendidas.

## 10. Reglas — validado como dirección pedagógica

Reglas explica **por qué una forma se ve como se ve** mediante comparación, transformación y ejemplos; no mediante una sola colección de fichas.

### Vista principal — Tablas

Actualmente incluye:
- **Inseparables y prefijos frecuentes**;
- **Género y número**;
- **Sufijos posesivos**;
- **Estado constructo**;
- **Qere / Ketiv**.

Cada tabla se abre de manera independiente y puede desplazarse horizontalmente en móvil sin comprimir columnas hasta volverlas ilegibles.

### Vista secundaria — Fichas

Se conserva para memorizar una regla individual:
- artículo definido `הַ`;
- conjunción `וְ`;
- preposiciones prefijadas `בְּ · לְ · כְּ` y `מִן`;
- combinación preposición + artículo;
- pistas de género y número con excepciones explícitas;
- concordancia sustantivo + adjetivo;
- cadena constructa.

La ficha sigue el patrón:
`forma → función → ejemplo → pronunciación → significado → explicación → cautela`.

### Detalle

Permite recorrer una regla por vez con Anterior/Siguiente.

### Guardias lingüísticas

- las terminaciones de género/número se presentan como pistas frecuentes, no universales;
- las preposiciones se traducen según contexto;
- el sustantivo puede cambiar al recibir sufijos;
- el estado constructo puede cambiar la forma del primer elemento;
- Qere/Ketiv se enseña como fenómeno textual/masorético, sin convertir una postura religiosa en regla lingüística;
- no deducir raíces automáticamente cuando la base no contiene una raíz verificada.

El sistema verbal y las raíces completas se incorporarán por capas posteriores dentro del mismo recorrido.

## 11. Repaso — gate actual

`ReviewExplorer` implementa una primera sesión real, pero no persistente.

Contrato actual:
- hasta 8 elementos por sesión;
- filtros Mixto · Letras · Vocales · Palabras · Lectura · Reglas;
- primero intentar responder;
- después `Mostrar respuesta`;
- autoevaluación explícita: `Lo sé · Necesito practicar · Repasar después`;
- ejercicios de escritura compatibles con teclado nativo y teclado VIDA;
- resumen final únicamente de la sesión actual;
- ninguna marca se presenta como progreso permanente.

Cuando exista persistencia real, Repaso podrá priorizar errores, confusiones y antigüedad del último estudio. Ese paso requerirá diseño de almacenamiento y permisos aprobado por separado.

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

Los 11 enlaces externos proporcionados por el usuario permanecen exactamente conservados y con estado `pendiente` hasta corroboración visual individual. El usuario confirmó que su línea de enseñanza coincide con la referencia pedagógica Hoshiah Na; aun así, cada recurso debe verificarse individualmente antes de declararlo validado.

No sustituyen el motor lingüístico ni las fuentes editoriales de VIDA.

## 16. Biblia en hebreo

Debe convertirse progresivamente en el destino final del aprendizaje: leer cualquier pasaje con ayudas graduables usando el motor bíblico existente.

Ayudas futuras:
`niqqud → pronunciación → palabra → glosa/morfología → comparación española aprobada`.

Nunca duplicar Estudio Profundo ni fabricar una traducción literal española del AT.

## 17. Uso de Hoshiah Na como referencia

El material indicado por el usuario se usa como **referencia pedagógica y de organización visual**, especialmente para identificar cuándo una tabla comparativa ayuda más que una ficha aislada.

No se copian páginas, tablas ni textos extensos. La redacción de VIDA es propia y los datos lingüísticos se contrastan con las fuentes bíblicas/académicas aprobadas.

## 18. Criterio visual

- estilo iOS, editorial y calmado;
- hebreo claramente mayor que el español;
- jerarquía por espaciado, tipografía y separadores;
- minimizar scroll vertical cuando la información puede agruparse;
- permitir scroll horizontal en tablas comparativas extensas;
- herramientas avanzadas opcionales apagadas por defecto cuando un principiante aún no las necesita;
- no mascotas, confeti, rachas obligatorias ni saturación de badges;
- no generar imágenes para este proyecto salvo petición explícita del usuario.
