# FASE D — Piloto léxico verificable

Fecha: 2026-08-01

Estado: **BACKEND IMPLEMENTADO — VISUALIZACIÓN PENDIENTE**

## Alcance

Este incremento implementa únicamente el modelo de datos, un conjunto piloto y el servicio de recuperación de palabras originales.

No modifica:

- la interfaz de Biblia;
- Leer, Estudio, Comparar o Notas;
- la autoría y los encabezados de los libros;
- el contexto histórico;
- el audio y las voces;
- el proveedor o los prompts de IA.

## Fuente aprobada

Fuente: **STEPBible Data — piloto léxico**.

- proveedor: STEP Bible;
- repositorio: `https://github.com/STEPBible/STEPBible-Data`;
- licencia: CC BY 4.0;
- datasets registrados: TAHOT, TAGNT, TBESH y TBESG;
- atribución: `STEP Bible (STEPBible.org), datos adaptados del repositorio STEPBible-Data bajo CC BY 4.0.`

El piloto usa exclusivamente:

- lema;
- transliteración;
- categoría gramatical;
- código o resumen morfológico;
- glosa breve;
- referencia y forma que aparece en el texto.

Se excluyeron expresamente:

- la columna extensa `Meaning` de TBESH;
- definiciones completas de léxicos;
- importaciones masivas;
- contenido sin licencia compatible.

Las glosas mostrables en español se registran como `editorial_translation`, no como citas literales de la fuente.

## Migración

Nombre aplicado en Supabase: `lexico_biblico_piloto`.

Archivo versionado:

- `supabase/migrations/20260802043000_lexico_biblico_piloto.sql`.

La migración es aditiva y crea:

### `public.biblical_lexical_entries`

Entradas léxicas con:

- fuente obligatoria;
- idioma hebreo, arameo o griego;
- identificador léxico y Strong cuando existe;
- lema, transliteración y categoría;
- glosa de fuente y traducción editorial separadas;
- localizador, versión y SHA-256;
- revisión, aprobación y publicación controladas.

### `public.biblical_word_occurrences`

Ocurrencias por pasaje con:

- libro, capítulo, versículo y posición de palabra;
- forma original y forma normalizada;
- entrada léxica y fuente obligatorias;
- código y resumen morfológico;
- localizador, versión y SHA-256;
- revisión, aprobación y publicación controladas.

La clave foránea compuesta impide vincular una ocurrencia con una entrada perteneciente a otra fuente.

## Seguridad

Las dos tablas tienen RLS habilitado.

Matriz validada:

| Comprobación | Resultado |
|---|---|
| `anon` puede leer | No |
| `authenticated` puede leer | Sí, únicamente registros aprobados y habilitados |
| `authenticated` puede insertar | No |
| `authenticated` puede actualizar | No |
| `authenticated` puede eliminar | No |
| cuenta activa requerida | Sí |
| fuente aprobada y habilitada requerida | Sí |
| entrada aprobada requerida para una ocurrencia | Sí |

El asesor de seguridad no reportó advertencias nuevas asociadas a `biblical_lexical_entries` ni `biblical_word_occurrences`. Los avisos restantes pertenecen a funciones, autenticación y Storage preexistentes, fuera de este incremento.

## Contenido piloto

Se cargaron siete entradas y siete ocurrencias aprobadas.

### Salmos 23:1

Tres palabras seleccionadas:

- `יְהוָה` — `H3068G` — `ye.ho.vah` — glosa de fuente `LORD` — interfaz `SEÑOR`;
- `רֹעִי` — lema `רָעָה`, `H7462B` — `ra.ah` — `to pasture` — `pastorear, cuidar`;
- `אֶחְסָר` — lema `חָסֵר`, `H2637` — `cha.ser` — `to lack` — `carecer, faltar`.

### Juan 3:16

Cuatro palabras seleccionadas:

- `ἠγάπησεν` — lema `ἀγαπάω`, `G0025` — `agapaō` — `to love` — `amar`;
- `θεὸς` — lema `θεός`, `G2316` — `theos` — `God` — `Dios`;
- `κόσμον` — lema `κόσμος`, `G2889` — `kosmos` — `world` — `mundo`;
- `πιστεύων` — lema `πιστεύω`, `G4100` — `pisteuō` — `to believe` — `creer, confiar`.

Los resúmenes españoles de morfología están identificados en los metadatos como expansiones editoriales.

## Validación de integridad

Resultado en producción:

- fuente aprobada y habilitada: 1;
- entradas léxicas aprobadas: 7;
- ocurrencias aprobadas: 7;
- Salmos 23:1: 3 ocurrencias;
- Juan 3:16: 4 ocurrencias;
- entradas sin localizador o hash: 0;
- ocurrencias sin localizador o hash: 0;
- relaciones con fuente o entrada no aprobada: 0.

## Servicio de recuperación

Archivo:

- `lib/estudios/biblical-lexicon.ts`.

Función principal:

- `listarPalabrasBiblicasParaReferencia()`.

El servicio:

- se ejecuta exclusivamente en servidor;
- exige sesión autenticada;
- normaliza libro, capítulo, versículo y límite;
- recupera únicamente ocurrencias aprobadas;
- conserva entrada, fuente, licencia, localizadores y metadatos;
- ordena por posición de palabra;
- calcula una versión SHA-256 del paquete;
- devuelve estados seguros para referencia inválida, sesión ausente o error de recuperación;
- no consulta notas, bosquejos, biblioteca ni contenido pastoral;
- no entrega estos datos a la IA.

## Estado del Bloque 4

El backend del piloto está implementado. El siguiente incremento será una visualización aislada dentro de **Biblia → Estudio**, únicamente para Salmos 23:1 y Juan 3:16, después de validar el servicio en preview y producción.

La Biblia estable no debe modificarse fuera de ese panel aislado y la herramienta debe mostrar un estado vacío claro para referencias sin cobertura.
