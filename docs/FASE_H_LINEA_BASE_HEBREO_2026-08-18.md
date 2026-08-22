# FASE H — Línea base de Hebreo Bíblico

Fecha: 2026-08-18  
Rama: `agent/fase-h-hebreo-biblico`  
Fase activa: **FASE H — Centro de Hebreo Bíblico**  
Bloque activo: **Bloque 1 — Línea base de fuentes y arquitectura didáctica**

## 1. Objetivo de este documento

Fijar, antes de implementar interfaz o persistencia nueva, qué datos hebreos/arameos ya existen y están aprobados, qué superficies actuales deben reutilizarse, qué contenido didáctico falta y cuál será la arquitectura inicial del Centro de Hebreo Bíblico.

Este incremento es deliberadamente conservador:

- no crea tablas;
- no modifica RLS, grants ni funciones sensibles;
- no importa datos nuevos;
- no modifica producción;
- no duplica el lector bíblico general;
- no altera Estudio Profundo;
- no reabre FASE G;
- no inicia FASE I.

## 2. Fuente textual principal aprobada

La fuente principal ya aprobada por FASE D es:

- proveedor: **STEPBible**;
- registro interno: `stepbible-lexical-pilot`;
- nombre interno actual: `STEPBible Data — corpus textual y léxico`;
- referencia del proveedor: `STEPBible-Data/textual-corpus`;
- versión fijada: `STEPBible-Data@b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`;
- licencia: **CC BY 4.0**;
- atribución registrada: `STEP Bible (STEPBible.org), datos adaptados del repositorio STEPBible-Data bajo CC BY 4.0.`;
- estado de licencia: `verified`.

La documentación de STEPBible describe TAHOT como un texto del AT basado en el Códice de Leningrado, con correcciones, morfología, etiquetas semánticas y tratamiento de prefijos/sufijos y Ketiv/Qere. La licencia del repositorio de datos permite reutilización con atribución bajo CC BY 4.0.

FASE H debe conservar siempre esa procedencia y no presentar los datos como producción editorial propia de VIDA.

## 3. Evidencia TAHOT ya fijada en FASE D

Los cuatro archivos TAHOT aprobados permanecen fijados al mismo commit y a hashes SHA-256 auditados:

| Paquete | Libros | Referencias fuente | SHA-256 |
|---|---:|---:|---|
| Génesis–Deuteronomio | 5 | 5,852 | `e9b8546ee48fe0bfc57c3b70f5f40e98d96580e803526d19026224e31753368b` |
| Josué–Ester | 12 | 7,018 | `195fee1dc3653bab33701f170734eb894ed647c10cd08cc61749375fe8b73775` |
| Job–Cantares | 5 | 4,901 | `84e118a97e5725e3847cdfdd593873513021c790c63cc91a0d41fca2b5db2ed5` |
| Isaías–Malaquías | 17 | 5,490 | `f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5` |

Totales de fuente auditados:

- 39 libros;
- 23,261 referencias distintas de la fuente hebrea;
- 305,652 filas bíblicas con referencia explícita;
- 300,811 filas hebreas y 4,827 filas arameas en la inspección original de TAHOT;
- referencias hebreas alternativas preservadas cuando la versificación difiere;
- Ketiv/Qere, restauraciones y adiciones reconstruidas de la LXX conservadas con procedencia explícita.

La cantidad de referencias TAHOT **no** debe confundirse con el conteo de versículos de RV1909 u otra traducción española. El Centro de Hebreo debe respetar la referencia fuente y la correspondencia de versificación ya modelada.

## 4. Estado real actual en Supabase

La inspección de solo lectura del proyecto `calendar-vida` confirma que FASE H puede reutilizar el modelo bíblico existente.

Tablas principales relevantes:

- `public.biblical_sources`;
- `public.biblical_verse_texts`;
- `public.biblical_word_occurrences`;
- `public.biblical_lexical_entries`;
- `public.biblical_books`.

### 4.1 Texto original por segmento

Para la fuente STEPBible aprobada y habilitada:

| Idioma | Segmentos | Con transliteración | RTL | Traducción literal ES aprobada |
|---|---:|---:|---:|---:|
| Hebreo | 22,878 | 22,878 | 22,878 | 0 |
| Arameo | 268 | 268 | 268 | 0 |

Consecuencias para FASE H:

1. Ya existe cobertura suficiente para un lector hebreo/arameo real del AT.
2. Ya existe transliteración del texto completo a nivel de segmento.
3. La dirección de texto ya está modelada como `rtl`.
4. **No existe una traducción literal española aprobada del AT en esta capa.** No debe fabricarse a partir de glosas, traducciones publicadas ni síntesis automática.
5. La comparación accesible en español debe reutilizar una traducción aprobada, principalmente RV1909 cuando corresponda, manteniendo separado el texto original de la traducción bíblica.

### 4.2 Léxico

Cobertura aprobada de `biblical_lexical_entries` para la fuente STEPBible:

| Idioma | Entradas | Con lema | Con transliteración léxica | Con glosa fuente | Con glosa ES editorial |
|---|---:|---:|---:|---:|---:|
| Hebreo | 10,737 | 10,737 | 5 | 10,737 | 5 |
| Arameo | 750 | 750 | 0 | 750 | 0 |

Consecuencias:

- el lema y la glosa de fuente son amplios;
- **no existe actualmente una transliteración léxica completa ni una glosa española editorial universal para hebreo/arameo**;
- el Centro de Hebreo no debe hacer creer que cada lema ya tiene una traducción española aprobada;
- cuando exista glosa española aprobada se puede mostrar como tal;
- cuando no exista, la interfaz debe distinguir la glosa de fuente y evitar una traducción inventada.

### 4.3 Palabra por palabra y morfología

La fuente combinada STEPBible contiene 610,657 ocurrencias aprobadas. Para el ámbito hebreo/arameo de FASE H, el prefijo del código morfológico permite separar la lengua por ocurrencia:

| Grupo | Ocurrencias | Con transliteración | Con morfología |
|---|---:|---:|---:|
| Hebreo (`H...`) | 300,333 | 300,333 | 300,333 |
| Arameo (`A...`) | 20,309 | 20,309 | 20,309 |
| Conectores maqaf | 8 | 8 | 0 |

Los 8 conectores sin morfología son casos ya auditados de maqaf (`־`, Strong `H9014`, `token_kind=connector`). No deben recibir una categoría morfológica inventada.

La capa palabra por palabra es suficiente para enseñar progresivamente:

- separación de componentes;
- prefijos, raíz y sufijos;
- lema;
- transliteración;
- Strong como identificador auxiliar, no como definición exhaustiva;
- código y resumen morfológico;
- idioma hebreo/arameo por ocurrencia;
- procedencia textual y variantes cuando existan.

## 5. Contrato lingüístico TAHOT que debe preservarse

FASE D ya verificó que TAHOT conserva dentro de cada palabra visible elementos separados por `/` y puntuación por `\`.

Columnas relevantes para enseñanza:

- texto hebreo vocalizado y con cantilación;
- transliteración alineada;
- secuencia de traducción fuente en inglés como evidencia interna de la fuente, no como traducción española de VIDA;
- etiquetas dStrong por componente;
- morfología adaptada de ETCBC/OpenScriptures;
- variantes de significado;
- variantes ortográficas;
- raíz dStrong + instancia;
- etiquetas Strong alternativas;
- lema y glosa incluidos en etiquetas expandidas.

Reglas ya aprobadas:

- `H...` = hebreo;
- `A...` = arameo;
- Qere es la lectura principal cuando la fuente lo marca así;
- Ketiv se conserva como variante estructurada, no mezclado silenciosamente en la forma principal;
- texto restaurado y adiciones reconstruidas de la LXX deben conservar aviso explícito de procedencia;
- numeración hebrea alternativa se conserva sin convertirla automáticamente a la versificación de una traducción española.

## 6. Estándares de escritura y renderizado

### 6.1 Unicode y dirección

El Centro de Hebreo debe utilizar caracteres Unicode reales, no imágenes de letras.

El estándar Unicode trata el hebreo como escritura con flujo derecha→izquierda y su algoritmo bidireccional define el comportamiento de texto mixto RTL/LTR.

El bloque Hebrew de Unicode codifica las letras básicas y las cinco formas finales como caracteres separados:

- Kaf final `ך`;
- Mem final `ם`;
- Nun final `ן`;
- Pe final `ף`;
- Tsadi final `ץ`.

Las formas finales no deben generarse por sustitución automática ciega; son caracteres propios y la ortografía determina su uso.

Los puntos vocálicos/niqqud y marcas como shin-dot/sin-dot son marcas Unicode combinables. El renderizado pedagógico debe conservar la secuencia Unicode y evitar convertir vocales o puntos en imágenes superpuestas manualmente.

### 6.2 Tipografía y transliteración

La Society of Biblical Literature mantiene recursos específicos para tipografía hebrea y transliteración académica. FASE H los toma como referencia de interoperabilidad editorial, **no** como requisito para distribuir una fuente propietaria dentro de VIDA.

La aplicación debe priorizar:

1. Unicode correcto;
2. una pila de fuentes del sistema/web compatible con hebreo y niqqud;
3. transliteración STEPBible ya aprobada para el texto importado;
4. consistencia pedagógica antes que multiplicar esquemas de transliteración.

No se distribuirán archivos de fuentes de terceros sin revisar primero su licencia de uso y redistribución.

## 7. Pronunciación: contrato inicial

FASE H necesita pronunciación como ayuda de aprendizaje, pero no debe declarar una reconstrucción única como “la pronunciación original bíblica”.

Decisión inicial:

- etiquetar cualquier audio/guía como **pronunciación pedagógica**;
- documentar qué convención se está usando;
- mantener separada la representación escrita Tiberiense/masorética de una afirmación histórica absoluta sobre cómo sonaba cada periodo bíblico;
- no generar audio de todas las palabras hasta seleccionar una metodología y fuente suficientemente confiables;
- no usar `SpeechSynthesis` del navegador como autoridad lingüística de hebreo bíblico.

Durante Bloque 1 no se añade audio nuevo.

## 8. Historia del alfabeto y pictogramas: guardia editorial

FASE H puede explicar, con fuentes académicas verificables, la historia de la escritura alfabética y mostrar formas antiguas como contexto visual.

Sin embargo:

- una forma pictográfica histórica no determina automáticamente el significado de una palabra bíblica;
- no se compondrán “significados secretos” sumando dibujos atribuidos a cada letra;
- etimología, semántica contextual, raíz, morfología y uso bíblico permanecen separados;
- cualquier capa de paleohebreo/historia del signo será contexto histórico opcional, no herramienta automática de exégesis.

Esta regla preserva la decisión del documento maestro y la metodología de Estudio Profundo de separar evidencia, inferencia e interpretación.

## 9. Arquitectura actual que debe reutilizarse

### 9.1 Estudios

`/estudios` ya es el hub de formación y actualmente expone:

- Biblia;
- Estudio Profundo;
- Cuaderno.

**Hebreo Bíblico debe incorporarse aquí como una herramienta de formación de primer nivel**, no esconderse dentro de Configuración ni crear un hub paralelo.

### 9.2 Biblia

`/biblia` es el lector bíblico general. Su responsabilidad actual incluye:

- seleccionar traducción;
- navegar libro/capítulo/versículo;
- lectura y comparación;
- favoritos;
- audio de traducciones;
- acceso a estudio textual/histórico;
- acceso a Estudio Profundo;
- Cuaderno.

La Biblia general consume su catálogo de traducciones para lectura y ya puede abrir paneles de evidencia textual. FASE H **no debe reemplazar ni duplicar este lector**.

### 9.3 Estudio Profundo

El motor textual actual ya resuelve desde servidor:

- `biblical_verse_texts`;
- `biblical_word_occurrences`;
- `biblical_lexical_entries`;
- variantes y procedencia;
- dirección RTL;
- transliteración;
- morfología;
- versificación;
- fuente, licencia y atribución.

La UI de Estudio Profundo ya presenta la evidencia original mediante componentes especializados, incluido `TextualEvidencePanel`.

**Decisión:** FASE H reutilizará ese resolver/motor lingüístico. No se construirá un segundo sistema de resolución de hebreo.

## 10. Arquitectura objetivo — un motor, tres experiencias

### A. `Hebreo Bíblico` — experiencia didáctica

Nueva herramienta dentro de Estudios.

Responsabilidad:

- enseñar el sistema de escritura;
- guiar una progresión de lectura;
- practicar reconocimiento;
- abrir textos reales de manera pedagógica;
- explicar morfología en niveles adecuados al progreso.

No debe intentar reemplazar Estudio Profundo.

### B. `Lector guiado` — lectura original orientada al aprendizaje

Debe usar el mismo resolver textual del proyecto, pero con una presentación distinta:

- texto hebreo/arameo grande y RTL;
- posibilidad de mostrar/ocultar niqqud;
- transliteración como ayuda opcional;
- traducción española aprobada separada;
- toque sobre palabra para abrir una ficha didáctica breve;
- modo de componentes para visualizar prefijo/raíz/sufijo;
- enlace a Estudio Profundo cuando se necesite la evidencia completa.

No es una copia de `/biblia`; es una vista pedagógica del corpus original.

### C. `Estudio Profundo` — análisis avanzado existente

Permanece como autoridad de detalle dentro de la app para:

- evidencia textual completa;
- variantes;
- morfología detallada;
- léxico disponible;
- contexto;
- comparaciones y demás capas de estudio.

Hebreo Bíblico enlaza hacia Estudio Profundo y reutiliza sus datos, pero no lo replica.

## 11. Contrato didáctico inicial

La progresión propuesta para FASE H es incremental y evita descargar toda la gramática sobre el usuario desde el inicio.

### Nivel 0 — Orientación RTL

Objetivos:

- entender que se lee de derecha a izquierda;
- identificar principio/final de una palabra y de una línea;
- distinguir hebreo de transliteración y español;
- aprender a tocar una palabra sin invertir el orden visual.

### Nivel 1 — Alef-bet

Objetivos:

- 22 letras básicas;
- nombres;
- orden;
- formas finales de Kaf, Mem, Nun, Pe y Tsadi;
- letras visualmente parecidas;
- transliteración pedagógica consistente;
- reconocimiento sin niqqud primero y con niqqud después.

La cuadrícula puede inspirarse en una tabla periódica por su capacidad de mostrar orden, símbolo y metadatos de manera compacta, pero no debe parecer una tabla química ni implicar categorías inexistentes.

### Nivel 2 — Niqqud básico

Objetivos:

- identificar las marcas vocálicas principales;
- distinguir letra base y marcas combinantes;
- comenzar a leer sílabas simples;
- introducir shin/sin y dagesh solo cuando el usuario ya reconoce las consonantes.

### Nivel 3 — Shevá, dagesh y lectura silábica

Objetivos:

- shevá dentro de una progresión práctica;
- dagesh como señal gráfica y su efecto según contexto;
- agrupación silábica orientada a lectura;
- práctica con palabras reales de baja complejidad.

### Nivel 4 — Estructura de palabra

Objetivos:

- raíz como herramienta lingüística, no como “significado secreto”;
- prefijos;
- sufijos;
- artículos, preposiciones y conjunciones frecuentes;
- reconocer que una palabra visible puede contener varios componentes morfológicos.

### Nivel 5 — Lectura guiada de versículos reales

Objetivos:

- usar TAHOT real desde el inicio de la lectura contextual;
- alternar ayudas: niqqud, transliteración, componentes y traducción española;
- identificar vocabulario recurrente;
- no sustituir la lectura por una traducción palabra‑por‑palabra fabricada.

### Nivel 6 — Morfología en contexto

Objetivos:

- interpretar las categorías morfológicas ya importadas;
- conectar forma visible, lema y función;
- distinguir hebreo y segmentos arameos;
- abrir Estudio Profundo para variantes, debates y evidencia avanzada.

### Arameo

El arameo no se presenta como si fuera simplemente “otro tipo de hebreo”.

Se introduce explícitamente cuando el lector llegue a una sección aramea y se etiqueta como idioma distinto, reutilizando las 268 unidades textuales y la morfología `A...` ya existentes.

## 12. Arquitectura visual mobile-first

### Entrada desde Estudios

Añadir, cuando empiece el bloque visual, una herramienta `Hebreo Bíblico` dentro de la lista principal de Estudios, con subtítulo orientativo:

> Aprende y lee los textos originales

### Home de Hebreo Bíblico

La pantalla inicial debe priorizar tres acciones, sin un dashboard pesado:

1. **Aprender** — ruta progresiva.
2. **Alef-bet** — referencia interactiva.
3. **Leer** — lector guiado del AT.

Debajo puede existir una continuación contextual del progreso solo cuando exista un modelo de progreso aprobado.

### Alef-bet

- cuadrícula compacta de 2–4 columnas según ancho;
- cada ficha muestra número/orden, letra y nombre;
- forma final integrada cuando exista;
- toque abre una hoja inferior o panel integrado, no una cadena de tarjetas anidadas;
- la letra debe tener gran superficie visual y táctil;
- navegación RTL donde corresponda, pero los controles globales de la app conservan el patrón actual.

### Lector guiado

- referencia y selector en la parte superior;
- texto RTL como protagonista;
- controles de ayuda discretos: `Niqqud`, `Transliteración`, `Componentes`, `Español`;
- palabra seleccionada abre una ficha única en la misma superficie;
- no llenar la pantalla de cajas por cada palabra;
- ofrecer `Ver en Estudio Profundo` para detalle completo.

## 13. Qué se reutiliza ahora

Puede reutilizarse inmediatamente sin cambios de esquema:

- fuente STEPBible aprobada/licenciada;
- texto hebreo y arameo;
- dirección RTL;
- transliteración de segmentos;
- palabra por palabra;
- morfología;
- lemas;
- glosas fuente;
- Strong como identificador auxiliar;
- variantes/procedencia;
- versificación modelada;
- resolver textual de Estudio Profundo;
- RV1909 como traducción española aprobada donde el lector necesite comparación.

## 14. Qué falta y no debe confundirse con el corpus bíblico

El corpus actual **no** contiene todavía un currículo didáctico completo.

Faltantes reales:

1. metadatos pedagógicos de las 22 letras y 5 formas finales;
2. ejemplos didácticos seleccionados por nivel;
3. explicación progresiva de niqqud, shevá, dagesh y lectura silábica;
4. convención de pronunciación pedagógica documentada;
5. audio aprobado/licenciado o generado bajo un contrato lingüístico claro;
6. ejercicios;
7. lecciones;
8. estado de progreso del usuario;
9. materiales administrables de FASE H.

Estos faltantes **no justifican todavía nuevas tablas**.

## 15. Decisión de persistencia para Bloque 1

**No crear nuevas tablas de Supabase durante Bloque 1.**

Razones:

- los datos bíblicos de lectura ya existen;
- el Alef-bet y las primeras lecciones pueden definirse como contenido estático/versionado y auditable;
- aún no existe un contrato aprobado de progreso del usuario;
- aún no existe un contrato aprobado de materiales administrables;
- crear tablas antes de diseñar esos flujos produciría esquema especulativo.

Cuando FASE H llegue al punto de progreso personal o materiales administrables, se deberá presentar por separado:

- tablas/campos exactos;
- propietario y visibilidad;
- RLS y grants;
- impacto sobre cuentas activas;
- migración;
- reversión;
- política de borrado/privacidad;
- aprobación explícita antes de aplicar.

## 16. Primer contrato técnico recomendado

Sin implementar todavía, la dirección propuesta es:

1. crear una ruta dedicada bajo Estudios, por ejemplo `/estudios/hebreo`;
2. mantener Alef-bet/lecciones iniciales en módulos TypeScript versionados y revisables;
3. extraer del resolver textual existente una API interna de servidor reutilizable para el lector guiado, sin duplicar consultas;
4. reutilizar tipos de evidencia textual existentes donde sea posible;
5. añadir una capa de presentación didáctica que transforme **cómo se muestra** la evidencia, no **qué evidencia existe**;
6. mantener Estudio Profundo como destino de análisis avanzado;
7. no conectar el contenido didáctico a IA durante el primer incremento.

## 17. Fuentes y referencias de esta línea base

### Internas

- `__VIDA_INTERNACIONAL.md`;
- `docs/FASE_D_FUENTES_TEXTUALES_AT.md`;
- `docs/FASE_D_VALIDACION_FUENTES_TAHOT.md`;
- `docs/FASE_D_ESQUEMA_TAHOT.md`;
- `docs/FASE_D_PANEL_LEXICO.md`;
- `docs/FASE_D_REGISTRO_FUENTES.md`;
- `docs/FASE_D_ESTUDIO_PROFUNDO_BIBLIOTECA_INTERNA.md`;
- `lib/estudios/resolved-biblical-textual-study.ts`;
- `lib/estudios/biblical-textual-study.ts`;
- `components/estudios/TextualEvidencePanel.tsx`;
- `app/(app)/estudios/page.tsx`;
- `app/(app)/biblia/page.tsx`;
- `components/biblia/BibliaClient.tsx`.

### Externas consultadas para el contrato de escritura

- Unicode Standard, Chapter 9 — Middle Eastern Scripts / Hebrew;
- Unicode Standard Annex #9 — Unicode Bidirectional Algorithm;
- Unicode Names List — Hebrew U+0590–U+05FF;
- Society of Biblical Literature — Biblical Fonts / transliteration resources;
- Society of Biblical Literature — SBL Handbook of Style, transliteration/transcription guidance;
- STEPBible/STEPBible-Data — README y licencia CC BY 4.0.

Las fuentes externas anteriores se usan para estándares de escritura, interoperabilidad y atribución. No se ha importado contenido nuevo desde ellas en este incremento.

## 18. Resultado de Bloque 1 hasta este punto

Quedan fijadas estas decisiones:

1. el Centro de Hebreo será una herramienta propia dentro de Estudios;
2. no reemplazará Biblia ni Estudio Profundo;
3. reutilizará el mismo motor textual aprobado de Estudio Profundo;
4. el lector guiado será una presentación pedagógica del corpus existente;
5. Alef-bet y lecciones iniciales se modelarán primero como contenido versionado, no como filas de base de datos;
6. no se fabricará traducción literal española del AT;
7. la pronunciación se presentará como ayuda pedagógica con convención documentada;
8. las formas antiguas/pictográficas serán contexto histórico opcional, nunca un mecanismo automático para derivar significado;
9. el arameo se distinguirá explícitamente del hebreo;
10. **Bloque 1 no requiere cambios de Supabase**.

## 19. Siguiente punto dentro de FASE H

Continuar exclusivamente dentro de **Bloque 1**:

1. definir el dataset estático inicial del Alef-bet — campos, orden, formas finales y convención de transliteración;
2. fijar el primer esquema de navegación de `/estudios/hebreo`;
3. definir el contrato del lector guiado y qué función del resolver textual se reutilizará;
4. preparar un primer incremento visual de solo lectura con Alef-bet + estructura del hub, sin progreso persistente, audio nuevo ni cambios sensibles de Supabase;
5. validar ese incremento en Preview móvil antes de ampliar a lecciones o lector completo.
