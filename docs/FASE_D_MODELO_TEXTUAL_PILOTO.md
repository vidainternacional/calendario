# FASE D · Bloque 4 — Modelo textual piloto

Fecha: 2026-08-02

## Objetivo

Preparar una estructura segura para almacenar texto original completo, secuencia palabra por palabra, morfemas, transliteración, traducción literal y variantes textuales sin conectar estos datos a un proveedor de IA.

Este incremento es únicamente estructural. No importa todavía las palabras faltantes de Salmos 23:1 ni Juan 3:16 y no modifica la interfaz.

## Modelo reutilizado

Se conserva el modelo existente:

- `biblical_lexical_entries`: lema, Strong, transliteración, categoría gramatical, glosa, definición y fuente.
- `biblical_word_occurrences`: forma concreta de una palabra en una referencia, posición y morfología.

Los siete registros piloto existentes permanecen activos y sin cambios de significado:

- Salmos 23:1: 3 ocurrencias.
- Juan 3:16: 4 ocurrencias.

## Extensión de ocurrencias

`biblical_word_occurrences` ahora puede representar:

- posición técnica continua mediante `word_index`;
- posición visual mediante `display_word_index`;
- varios morfemas dentro de una palabra mediante `morpheme_index`;
- tipo de morfema: `word`, `prefix` o `suffix`;
- agrupación de componentes mediante `word_group_key`;
- transliteración específica de la ocurrencia;
- glosa contextual española de la ocurrencia;
- puntuación anterior y posterior sin crear entradas léxicas artificiales;
- unión gráfica con componentes anteriores o posteriores;
- estado textual `base`, `variant` o `uncertain`;
- relación con un grupo de variantes;
- datos estructurados de testigos o ediciones en `witness_data`.

Los siete registros anteriores fueron rellenados de forma compatible:

- `display_word_index = word_index`;
- `morpheme_index = 1`;
- `token_kind = word`;
- `textual_status = base`.

## Texto completo del versículo

La tabla `biblical_verse_texts` almacena una edición concreta del versículo:

- fuente y referencia;
- idioma: hebreo, arameo o griego;
- texto original completo;
- texto normalizado;
- transliteración completa;
- traducción literal editorial al español;
- dirección de escritura;
- conteo de tokens;
- estado de análisis: `partial`, `complete` o `verified`;
- localizador, versión y hash;
- aprobación, activación y metadatos.

La combinación fuente, libro, capítulo, versículo e idioma es única.

## Variantes textuales

La tabla `biblical_textual_variants` permite registrar:

- posición aproximada de la variante;
- tipo: sustitución, adición, omisión, transposición u ortografía;
- lectura base y lectura alternativa;
- resumen de testigos;
- testigos y ediciones como arreglos JSON;
- importancia explicada en español;
- fuente, versión y hash.

Una clave foránea compuesta obliga a que cada variante pertenezca a la misma fuente que el texto base.

## Seguridad

- RLS activo en las dos tablas nuevas.
- `anon` no recibe privilegios.
- `authenticated` recibe únicamente `SELECT`.
- Solo se leen filas activas y aprobadas.
- La cuenta debe estar activa.
- La fuente y el libro deben estar aprobados.
- Una variante solo es visible cuando su texto base también está aprobado.
- No existen políticas de escritura para clientes.

## Validaciones ejecutadas

- Los siete registros piloto siguen presentes.
- Las siete posiciones fueron rellenadas correctamente.
- Las tablas nuevas comienzan vacías.
- Un texto `pending` no puede activarse.
- Una variante con una fuente distinta al texto base es rechazada.
- Los datos temporales usados en las pruebas fueron eliminados.
- Se añadió un índice que cubre la clave foránea compuesta de variantes.
- El asesor de seguridad no reportó advertencias nuevas para estas tablas.

## Decisiones de diseño

La puntuación no se registra como una ocurrencia sin léxico. Se conserva:

- dentro del texto completo del versículo;
- en `punctuation_before` y `punctuation_after` cuando deba asociarse a una palabra.

Esto permite mantener la regla existente: toda ocurrencia léxica debe apuntar a una entrada léxica aprobada de la misma fuente.

## Siguiente paso

Extraer y validar desde STEPBible únicamente:

- Salmos 23:1 completo;
- Juan 3:16 completo.

Después se preparará una migración de datos que incluya:

1. texto original completo;
2. secuencia íntegra de palabras y morfemas;
3. transliteración;
4. lema y Strong;
5. morfología;
6. glosa contextual;
7. traducción literal ensamblada;
8. variantes disponibles y su soporte;
9. localizador, versión y hash verificables.