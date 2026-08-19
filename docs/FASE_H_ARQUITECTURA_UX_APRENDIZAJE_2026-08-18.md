# FASE H — Arquitectura UX de aprendizaje de Hebreo Bíblico

Fecha: 2026-08-18
Estado: contrato de diseño para FASE H · Bloque 1

## 1. Arquitectura de información

Hebreo Bíblico debe sentirse como una biblioteca de estudio y una app moderna de aprendizaje: calmada, editorial, accesible y progresiva. La entrada del módulo muestra solo encabezado, siguiente paso y áreas de aprendizaje. El contenido avanzado permanece plegado.

Jerarquía:
1. Inicio de Hebreo Bíblico.
2. Lecciones.
3. Repaso.
4. Diccionario.
5. Lectura guiada.
6. Conoce el hebreo, como contexto opcional.

La barra global de VIDA no cambia: Inicio · Calendario · Avisos · Estudios · Perfil.

## 2. Orden didáctico recomendado

1. Alef-bet.
2. Vocales y sílabas.
3. Lectura de palabras.
4. Vocabulario básico.
5. Letras finales.
6. Dagesh y shewa.
7. Raíces hebreas.
8. Gramática esencial.
9. Frases cortas.
10. Lectura guiada.

La ruta completa debe aparecer de forma compacta o plegable; no como diez tarjetas abiertas simultáneamente.

## 3. Pantallas

### Inicio
Acción principal: `Continuar`.
Visible: Hebreo Bíblico / עברית מקראית, subtítulo `Aprende a leer paso a paso`, siguiente lección real y acceso a áreas. No mostrar porcentajes ni minutos ficticios.

### Lección
Una instrucción principal por pantalla. El contenido hebreo domina visualmente. Acciones posibles según la actividad: `Escuchar`, `Repetir`, `Comprobar`, `Continuar`. Audio solo cuando exista una fuente aprobada.

### Repaso
Sesiones futuras de 5–10 elementos. Estados: `Lo sé`, `Necesito practicar`, `Repasar después`.

### Diccionario
Búsqueda futura por hebreo, español o transliteración. Resultado inicial: palabra, pronunciación disponible, significado y ejemplo. Datos avanzados en acordeón.

### Lectura guiada
Texto original RTL protagonista. Ayudas graduadas: nikud → palabra → transliteración opcional → glosa/morfología → traducción aprobada. Reutiliza el motor textual existente; no duplica Estudio Profundo.

## 4. Componentes reutilizables

- `HebrewModuleHeader`: título, subtítulo, progreso real cuando exista y acceso de lectura/accesibilidad.
- `ContinueCard`: siguiente paso y CTA principal.
- `LearningRouteAccordion`: ruta curricular compacta.
- `LearningSectionAccordion`: área de aprendizaje; una sola abierta a la vez.
- `PillGroup`: filtros horizontales.
- `MoreFiltersDisclosure`: filtros especializados fuera de la primera vista.
- `HebrewLetterTile`: selector de letra.
- `HebrewLetterCard`: ficha principal del Alef-bet.
- `HebrewVowelCard`: Ficha de vocal.
- `HebrewSyllableCard`: Ficha de sílaba.
- `VocabularyCard`: Ficha de vocabulario.
- `GrammarRuleCard`: Ficha gramatical.
- `AudioControl`: escuchar/pausar/repetir cuando exista audio aprobado.
- `SimpleModeToggle`: reduce detalle visible.
- estados reutilizables: carga, vacío, Sin conexión, Error de audio y contenido bloqueado.

## 5. Sistema de botones píldora

Altura táctil mínima: 44 px. Objetivo general de control: al menos 44×44 px.

Reglas:
- selección clara por fondo, peso tipográfico y `aria-pressed`, no solo color;
- padding horizontal generoso;
- scroll horizontal si no caben;
- no reducir tipografía para forzar todos los filtros en una línea.

Alef-bet, cuando exista progreso real: `Todas` · `En progreso` · `Repaso` · `Más filtros`.
Dentro de `Más filtros`: `Dagesh` · `Sofit` · `Guturales` · `Matres` · `Shin / Sin`.
Mientras no exista progreso persistente, no se muestran filtros ficticios `En progreso` o `Repaso`.

Explicaciones sencillas:
- Dagesh: un punto que puede cambiar el sonido de algunas letras.
- Sofit: forma especial que cinco letras usan al final de una palabra.
- Guturales: letras producidas más hacia la garganta.
- Mater lectionis: letra que en ciertos contextos ayuda a indicar una vocal.
- Shewa: marca vocálica breve que puede sonar o quedar silenciosa según el contexto.
- Nikud: puntos y marcas que ayudan a leer las vocales.

## 6. Sistema de acordeones

Solo un acordeón principal de aprendizaje abierto a la vez. El encabezado completo es táctil y mantiene una altura cómoda. El estado bloqueado utiliza texto + icono, nunca color aislado. Las animaciones son breves y respetan `prefers-reduced-motion`.

Áreas: Alef-bet · Vocales y sílabas · Vocabulario · Gramática · Lecturas · Repaso.

## 7. Diseño de la ficha del Alef-bet

Primera cara:
- posición `1 de 22`;
- nombre de la letra;
- valor numérico cuando sea útil;
- letra hebrea muy grande, idealmente 128–176 px según dispositivo;
- sonido básico;
- explicación sencilla de una frase cuando haga falta;
- ejemplo breve en hebreo con nikud y traducción española;
- acción clara para ver la segunda cara.

Segunda cara:
- forma cuadrada;
- forma manuscrita cuando la plataforma disponga de una fuente adecuada;
- forma histórica comparativa cuando exista evidencia;
- significado/origen histórico del nombre o signo con cautela editorial.

La transliteración, Unicode y referencias académicas no dominan la primera ficha. La pictografía nunca se presenta como significado automático de una palabra bíblica.

## 8. Ficha de vocal

Ficha de vocal:
- nombre, por ejemplo `Pataj`;
- símbolo grande;
- sonido aproximado;
- combinación con consonante, por ejemplo `בַּ = ba`;
- audio cuando exista;
- explicación de una frase.

Cautela: `El sonido puede variar ligeramente según la tradición de pronunciación.`

## 9. Ficha de sílaba

Ficha de sílaba:
- consonante + vocal = sílaba;
- ejemplo visual `ב + ַ = בַּ`;
- lectura `ba`;
- secuencia progresiva futura: escuchar → identificar → elegir → leer sin límite de tiempo → combinar dos sílabas.

Microcopy: `Una sílaba hebrea contiene una consonante y una vocal.`

## 10. Ficha de vocabulario

Ficha de vocabulario:
- palabra hebrea grande;
- nikud cuando corresponda;
- transliteración opcional;
- traducción española claramente visible;
- categoría;
- audio y ejemplo corto cuando existan.

Filtros futuros: Personas · Familia · Naturaleza · Casa · Verbos · Números · Tiempo · Frecuentes.

## 11. Ficha gramatical

Ficha gramatical, nivel esencial:
- masculino/femenino;
- singular/plural;
- pronombres básicos;
- artículo definido הַ;
- preposiciones frecuentes;
- orden básico;
- raíces de tres consonantes.

Nivel de lectura bíblica:
- sufijos pronominales;
- prefijos;
- constructo;
- formas verbales frecuentes;
- partículas;
- variaciones de vocalización.

Cada regla: título corto, explicación de 1–2 frases, ejemplo hebreo, traducción y `Ver más`. Las tablas extensas aparecen solo bajo demanda.

## 12. Accesibilidad y personas mayores

- cuerpo español objetivo: 16–17 px;
- indicadores importantes: evitar menos de 12 px;
- letra hebrea significativamente mayor que el español;
- controles: al menos 44×44 px;
- contraste alto;
- no comunicar estados solo por color;
- iconos acompañados por texto cuando la acción no sea universalmente inequívoca;
- lenguaje directo;
- una instrucción principal por pantalla;
- no usar límites de tiempo;
- permitir repetir y pausar audio;
- respetar `prefers-reduced-motion`;
- `Modo sencillo` oculta detalle avanzado y conserva lo esencial;
- futuro control de tamaño de texto debe ser una preferencia real por usuario, no una simulación;
- `Necesito ayuda` debe estar disponible dentro de lecciones cuando se implemente la ayuda contextual;
- volver atrás no debe borrar progreso real.

## 13. Estados de interfaz

Primera visita: `Empieza por reconocer las letras. No necesitas saber nada de hebreo todavía.`

En progreso: `Continúa desde donde quedaste.`

Completado: `Buen trabajo. Ya puedes seguir con el siguiente paso.`

Sin conexión: `Estás sin conexión. Puedes continuar con el contenido disponible en este dispositivo.`

Audio cargando: `Preparando audio…`

Error de audio: `El audio no está disponible. Puedes continuar leyendo.`

Bloqueado: `Completa el paso anterior para abrir esta lección.`

Repaso pendiente: `Tienes un repaso corto listo.`

Búsqueda vacía: `No encontramos esa palabra. Revisa la escritura o prueba en español.`

## 14. Tipografía, color y espaciado

Tipografía española: stack del sistema Apple/SF Pro ya usado por VIDA. Hebreo: fuentes hebreas del sistema verificadas por plataforma; no distribuir archivos de fuentes.

Escala recomendada:
- título de pantalla: 26–30 px;
- subtítulo/cuerpo destacado: 15–17 px;
- cuerpo: 16–17 px cuando contiene instrucciones importantes;
- ficha: nombre 22–28 px;
- hebreo protagonista: 128–176 px;
- etiquetas auxiliares: 12–13 px.

Paleta:
- fondo cálido muy claro aproximado `#F8F7F3`;
- superficie blanca;
- texto slate/negro suave;
- índigo VIDA como acción/progreso;
- hebreo usa el mismo índigo como acento secundario, no otro arcoíris.

Espaciado:
- margen móvil 16 px;
- secciones 24–32 px;
- superficies principales 20–24 px;
- filas compactas 12–16 px verticales;
- sombras mínimas o inexistentes cuando borde/espaciado basten.

## 15. Textos exactos recomendados

Encabezado:
- `עברית מקראית`
- `Hebreo Bíblico`
- `Aprende a leer paso a paso`

Tarjeta principal:
- `Continúa tu camino`
- `Reconoce las primeras letras`
- `Empieza por su forma, nombre y sonido. Lo demás aparecerá cuando lo necesites.`
- `Continuar`

Alef-bet:
- `Toca una letra para estudiarla.`
- `Sonido`
- `Ejemplo`
- `Ver formas`
- `Volver`

## 16. Progresión y repetición espaciada — contrato futuro

El progreso no se simula con porcentajes estáticos. Cuando se implemente debe registrar dominio por unidad didáctica y priorizar errores, confusiones y antigüedad del último repaso. Repaso y repetición espaciada utilizarán sesiones de 5–10 elementos y estados simples: `Lo sé`, `Necesito practicar`, `Repasar después`. La cuenta y el dispositivo no deben mezclar progreso entre usuarios.

Si la persistencia futura exige estructuras nuevas de Supabase, antes se presentarán alcance, impacto, RLS y reversión para aprobación explícita.

## 17. Audio — contrato futuro

No usar `speechSynthesis` como sustituto automático de pronunciación aprobada. El audio debe distinguir nombre de letra, sonido pedagógico y ejemplo; documentar tradición/metodología y marcar aproximaciones. Hasta que exista una fuente aprobada, la UI no muestra controles de audio falsos.

## 18. Criterio de modernidad

No usar mascotas, confeti, rachas obligatorias, gradientes intensos ni saturación de badges. Mantener superficies amplias, animaciones discretas, una acción dominante, hebreo grande y detalle avanzado opcional. El resultado debe ser serio, amable y comprensible para principiantes, lectores intermedios y estudiantes bíblicos.