# FASE H — Arquitectura UX de aprendizaje de Hebreo Bíblico

Fecha: 2026-08-18
Estado: contrato de diseño para FASE H

## Estado de validación móvil — 2026-08-19

- **Alef-Bet:** base visual validada por el usuario después de corregir nomenclatura, desplegables, scroll, retracción de fichas y desbordes móviles.
- **Vocales y sílabas / niqqud:** base visual validada por el usuario; continúa como módulo real dentro de Aprender.
- **Gate actual:** Lectura de palabras.
- Implementación técnica del gate actual: CI #2124 SUCCESS + Vercel SUCCESS en `d551586240aa6a9f9f4d0c971a984f6a9308255f`.
- No avanzar a Vocabulario, Gramática, audio ni progreso persistente hasta validar visualmente la base de Lectura.

## 1. Arquitectura de información

Hebreo Bíblico debe sentirse como una biblioteca de estudio y una app moderna de aprendizaje: calmada, editorial, accesible y progresiva. La entrada del módulo muestra solo encabezado y accesos principales. El contenido avanzado permanece plegado.

Jerarquía actual:
1. Inicio de Hebreo Bíblico.
2. Aprender.
3. Materiales y curso.
4. Prueba tu progreso.
5. Biblia en hebreo / lectura guiada.
6. Conoce el hebreo, como contexto opcional futuro.

La barra global de VIDA no cambia: Inicio · Calendario · Avisos · Estudios · Perfil.

## 2. Orden didáctico recomendado

1. Alef-bet.
2. Vocales y sílabas.
3. Lectura de palabras.
4. Vocabulario básico.
5. Letras finales dentro de repaso contextual.
6. Dagesh y shewa.
7. Raíces hebreas.
8. Gramática esencial.
9. Frases cortas.
10. Lectura guiada.

La ruta completa debe aparecer de forma compacta o plegable; no como diez tarjetas abiertas simultáneamente.

## 3. Pantallas

### Inicio
Visible: Hebreo Bíblico / עברית מקראית, subtítulo `Aprende a leer paso a paso` y cuatro accesos compactos bilingües: Aprender · Materiales y curso · Prueba tu progreso · Biblia en hebreo. No mostrar porcentajes ni minutos ficticios.

### Aprender
Seis áreas compactas y desplegables: Alef-Bet · Vocales · Lectura · Palabras · Reglas · Repaso. Solo una se abre a la vez. La información secundaria usa desplegables integrados con scroll limitado, siguiendo el patrón aprobado de Biblia → Favoritos.

### Lección
Una instrucción principal por pantalla. El contenido hebreo domina visualmente. Acciones posibles según la actividad: `Comprobar`, `Continuar` y ayudas graduadas. Audio solo cuando exista una fuente aprobada.

### Repaso
Sesiones futuras de 5–10 elementos. Estados: `Lo sé`, `Necesito practicar`, `Repasar después`.

### Diccionario
Búsqueda futura por hebreo, español o transliteración. Resultado inicial: palabra, pronunciación disponible, significado y ejemplo. Datos avanzados en acordeón.

### Lectura guiada
Texto original RTL protagonista. Ayudas graduadas: nikud → palabra → transliteración opcional → glosa/morfología → traducción aprobada. Reutiliza el motor textual existente; no duplica Estudio Profundo.

## 4. Componentes reutilizables

- `HebrewModuleHeader`: título, subtítulo y progreso real cuando exista.
- `LearningSectionAccordion`: área de aprendizaje; una sola abierta a la vez.
- `PillGroup`: filtros horizontales.
- `HebrewLetterTile`: selector de letra.
- `HebrewLetterCard`: ficha principal del Alef-bet.
- `NiqqudExplorer`: explorador aprobado de vocales y sílabas.
- `ReadingWordsExplorer`: lectura progresiva por palabra con ayudas graduadas.
- `HebrewVowelCard`: ficha de vocal.
- `HebrewSyllableCard`: ficha de sílaba.
- `VocabularyCard`: ficha de vocabulario.
- `GrammarRuleCard`: ficha gramatical.
- `AudioControl`: escuchar/pausar/repetir solo cuando exista audio aprobado.
- estados reutilizables: carga, vacío, sin conexión y contenido no disponible.

## 5. Sistema de botones píldora

Altura táctil mínima: 44 px. Objetivo general de control: al menos 44×44 px.

Reglas:
- selección clara por fondo, peso tipográfico y `aria-pressed`, no solo color;
- padding horizontal suficiente;
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

Solo un acordeón principal de aprendizaje abierto a la vez. El encabezado completo es táctil y mantiene una altura cómoda. Las animaciones son breves y respetan `prefers-reduced-motion`.

Áreas: Alef-Bet · Vocales · Lectura · Palabras · Reglas · Repaso.

Las explicaciones largas deben permanecer cerradas por defecto y abrir dentro de una superficie integrada con altura limitada y scroll interno cuando sea necesario.

## 7. Diseño de la ficha del Alef-bet — validado

Mini-ficha:
- número;
- letra cuadrada protagonista;
- nombre completo sin truncamiento.

Ficha ampliada:
- nombre español + hebreo;
- valor;
- Libro · Cuadrada · Manuscrita;
- sonido y significado histórico breve;
- reverso con contenido editorial detallado.

Comportamiento aprobado:
- no hay ficha abierta al entrar;
- tocar una letra abre la ficha debajo de su fila con zoom suave;
- tocar la misma letra la retrae con el efecto inverso;
- todo el reverso se desplaza como una sola pieza, sin encabezado `sticky`;
- pictografía/historia nunca se presenta como significado automático de una palabra bíblica.

## 8. Vocales y sílabas / niqqud — validado

Base inicial: Pataj · Qamats · Segol · Tsere · Hiriq · Holam · Qubuts · Shuruq · Sheva · Hataf Pataj · Hataf Segol · Hataf Qamats.

Agrupación: Básicas · Reducidas · Sheva · Todas.

Cada ficha muestra:
- signo y nombre;
- sonido orientativo para hispanohablantes;
- combinación consonante + vocal;
- lectura resultante;
- explicación breve;
- cautela contextual cuando corresponde.

Cautelas preservadas: qamats qatan, sheva vocal/silencioso y uso del punto de shuruq. No se presenta pronunciación pedagógica como reconstrucción histórica infalible.

## 9. Lectura de palabras — gate actual

La primera práctica usa diez palabras breves para pasar de signos aislados a lectura completa.

Ayudas graduadas:
1. `Con niqqud`: palabra vocalizada + transliteración temporal.
2. `Con ayuda`: palabra vocalizada + división pedagógica en pequeñas unidades.
3. `Sin ayuda`: grafía consonántica sin transliteración.

Agrupación inicial: Cortas · Frecuentes · Distinguir · Todas.

La transliteración es una ayuda temporal; el objetivo es retirarla. La ficha incluye significado sencillo y un punto concreto en el que fijarse. Esta práctica no registra dominio ni califica resultados todavía.

## 10. Ficha de vocabulario — futuro

Ficha de vocabulario:
- palabra hebrea grande;
- nikud cuando corresponda;
- transliteración opcional;
- traducción española claramente visible;
- categoría;
- audio y ejemplo corto cuando existan.

Filtros futuros: Personas · Familia · Naturaleza · Casa · Verbos · Números · Tiempo · Frecuentes.

## 11. Ficha gramatical — futuro

Nivel esencial:
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

- cuerpo español objetivo: 16–17 px cuando sea instrucción principal;
- indicadores importantes: evitar menos de 12 px;
- letra hebrea significativamente mayor que el español;
- controles: al menos 44×44 px;
- contraste alto;
- no comunicar estados solo por color;
- lenguaje directo;
- una instrucción principal por pantalla;
- no usar límites de tiempo;
- respetar `prefers-reduced-motion`;
- volver atrás no debe borrar progreso real cuando se implemente.

## 13. Tipografía, color y espaciado

Tipografía española: stack del sistema Apple/SF Pro ya usado por VIDA. Hebreo: fuentes hebreas del sistema verificadas por plataforma; no distribuir archivos de fuentes.

Paleta:
- fondo cálido/muy claro;
- superficie blanca;
- texto slate/negro suave;
- índigo VIDA como acción/progreso;
- hebreo usa el mismo índigo como acento secundario.

Espaciado:
- margen móvil 16 px;
- secciones 24–32 px cuando el contenido lo necesite;
- filas compactas 12–16 px;
- sombras mínimas o inexistentes cuando borde/espaciado basten.

## 14. Progresión y repetición espaciada — contrato futuro

El progreso no se simula con porcentajes estáticos. Cuando se implemente debe registrar dominio por unidad didáctica y priorizar errores, confusiones y antigüedad del último repaso. La cuenta y el dispositivo no deben mezclar progreso entre usuarios.

Si la persistencia futura exige estructuras nuevas de Supabase, antes se presentarán alcance, impacto, RLS y reversión para aprobación explícita.

## 15. Audio — contrato futuro

No usar `speechSynthesis` como sustituto automático de pronunciación aprobada. El audio debe distinguir nombre de letra, sonido pedagógico y ejemplo; documentar tradición/metodología y marcar aproximaciones. Hasta que exista una fuente aprobada, la UI no muestra controles de audio falsos.

## 16. Criterio de modernidad

No usar mascotas, confeti, rachas obligatorias, gradientes intensos ni saturación de badges. Mantener superficies amplias, animaciones discretas, una acción dominante, hebreo grande y detalle avanzado opcional. El resultado debe ser serio, amable y comprensible para principiantes, lectores intermedios y estudiantes bíblicos.
