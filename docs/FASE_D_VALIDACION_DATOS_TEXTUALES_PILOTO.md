# FASE D · Bloque 4 — Validación de datos textuales piloto

Fecha: 2026-08-02

## Alcance

Validación previa a la importación de:

- Salmos 23:1 desde TAHOT;
- Juan 3:16 desde TAGNT.

No se importaron todavía palabras nuevas ni se modificó la interfaz.

## Fuente reproducible

Repositorio: `STEPBible/STEPBible-Data`

Commit fijado:

`b86d26cdb1f51729e73b5b4eb7f7ccadc5dfba39`

### TAHOT Job–Cantares

- archivo: `TAHOT Job-Sng - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt`;
- respuesta HTTP: 200;
- tamaño: 9,540,133 bytes;
- líneas: 76,191;
- SHA-256 del archivo: `84e118a97e5725e3847cdfdd593873513021c790c63cc91a0d41fca2b5db2ed5`;
- líneas de Salmos 23:1: 21,230–21,233;
- SHA-256 del extracto: `4a112c7e27da3b2a0cf76f468975f62ebef04173f2656580ecc64dd38dee7ea4`.

### TAGNT Mateo–Juan

- archivo: `TAGNT Mat-Jhn - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt`;
- respuesta HTTP: 200;
- tamaño: 14,189,032 bytes;
- líneas: 112,010;
- SHA-256 del archivo: `ab8eaaeb68e17a1dcfa34e1e9350358f22f03bc2a97244d848750ad81044bc8e`;
- líneas de Juan 3:16: 87,972–87,997;
- SHA-256 del extracto: `3b36d9f586fe932d4fa21065ab6fe556f2788d2b2fe0ac252b48099e21853cfa`.

## Salmos 23:1

TAHOT contiene cuatro palabras visibles en el versículo y cinco morfemas léxicos:

| Posición fuente | Posición visual | Forma | Lexical | Morfología | Glosa fuente |
|---|---:|---|---|---|---|
| 03 | 1 | `יְהוָ֥ה` | H3068G | HNpt | Yahweh |
| 04 | 2 | `רֹ֝עִ֗` | H7462B | HVqrmsc | pastor |
| 04 | 2 | `י` | H9020 | Sp1bs | mi |
| 05 | 3 | `לֹ֣א` | H3808 | HTn | no |
| 06 | 4 | `אֶחְסָֽר` | H2637 | HVqi1cs | careceré |

Puntuación final: `׃`.

### Observación de versificación

TAHOT conserva posiciones técnicas `#03–#06` porque las dos primeras palabras del texto hebreo pertenecen al título del salmo. Para la interfaz, las posiciones visibles deben ser 1–4.

### Variantes

Las cuatro líneas están marcadas como texto `L`. No se identificó una variante textual para este versículo en el extracto.

## Juan 3:16

TAGNT devuelve 26 líneas fuente:

- 25 palabras forman el texto base usado por NA27/NA28 y la mayoría de traducciones modernas;
- una palabra adicional corresponde a una lectura presente en Tregelles, Textus Receptus y Bizantino.

### Texto base

Las posiciones fuente base son:

`01–10, 12–26`

La posición fuente `#11` no pertenece al texto base NA27/NA28.

### Lectura adicional

- posición fuente: `#11`;
- forma: `αὐτοῦ`;
- lema: `αὐτός`;
- lexical: G0846;
- morfología: P-GSM;
- ediciones: Treg + TR + Byz;
- relación: modifica a `υἱὸν` en #10;
- clasificación propuesta: `addition`;
- importancia: añade “de él/suyo”, sin cambiar el referente dentro del contexto.

### Variante ortográfica

En #23:

- lectura base: `ἀλλ᾽`;
- lectura alternativa: `ἀλλὰ`;
- ediciones con la forma alternativa: SBL + WH + Treg + TR + Byz;
- clasificación propuesta: `orthographic`;
- importancia: elisión ortográfica sin cambio de traducción.

### Puntuación del texto base

- `κόσμον,` en #07;
- `ἔδωκεν,` en #14;
- `αἰώνιον.` en #26.

## Comparación con los siete registros actuales

### Correctos pero incompletos

- H3068G en Salmos 23:1 #03;
- H7462B en Salmos 23:1 #04;
- H2637 en Salmos 23:1 #06;
- G0025 en Juan 3:16 #03;
- G2316 en Juan 3:16 #05;
- G2889 en Juan 3:16 #07.

Sus identificadores léxicos son correctos, pero las ocurrencias todavía carecen de transliteración específica, glosa contextual, datos de testigos y versión fijada al commit.

### Incorrecto

`πιστεύων` / G4100 está guardado actualmente en `word_index = 17`.

La fuente oficial muestra:

- #17: `ὁ` / G3588;
- #18: `πιστεύων` / G4100.

La migración de datos debe mover G4100 a #18.

### Faltantes de Salmos 23:1

- morfema H9020, sufijo “mi”, dentro de la palabra visual 2;
- palabra H3808, `לֹא`, en posición visual 3;
- morfología de las cuatro posiciones fuente;
- texto original completo, transliteración completa y traducción literal.

### Faltantes de Juan 3:16

- 21 palabras del texto base;
- una ocurrencia variante para `αὐτοῦ`;
- variante ortográfica `ἀλλ᾽ / ἀλλὰ`;
- puntuación enlazada a las ocurrencias;
- texto original completo, transliteración completa y traducción literal.

## Decisión de texto base

### Hebreo

Se seguirá el texto de traductores de TAHOT, conservando las marcas de procedencia L/Q/K/R/X cuando existan. En Salmos 23:1 todas las palabras son L.

### Griego

El texto principal seguirá la lectura NA27/NA28 representada por TAGNT. Las lecturas de otras ediciones se almacenarán aparte como variantes, no se mezclarán dentro del texto principal.

## Corrección estructural validada

La clave única de `biblical_word_occurrences` fue ampliada para incluir `morpheme_index`.

Ahora la base:

- permite varios morfemas en una misma posición fuente;
- rechaza repetir el mismo morfema dentro de esa posición;
- conserva `word_index` como posición técnica;
- usa `display_word_index` como posición visible.

La prueba temporal insertó dos morfemas en una posición, rechazó el duplicado real y eliminó todas las filas de prueba.

## Próximo paso

Crear una migración idempotente que:

1. fije la fuente piloto al commit y hashes verificados;
2. complete las entradas léxicas necesarias;
3. corrija los siete registros actuales;
4. importe las cinco unidades morfológicas de Salmos 23:1;
5. importe las 25 palabras base y la lectura variante de Juan 3:16;
6. cree los dos textos completos;
7. registre las dos variantes griegas;
8. valide conteos, orden, fuentes, hashes y RLS antes de habilitar visualización.