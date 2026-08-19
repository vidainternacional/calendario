# FASE D · Bloque 4 — Validación textual piloto

Fecha: 2026-08-02

## Alcance

Validación de solo lectura para:

- Salmos 23:1 en TAHOT;
- Juan 3:16 en TAGNT.

No se modificó Supabase ni producción durante esta etapa.

## Fuentes verificadas

### Salmos 23:1

- archivo: `TAHOT Job-Sng - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt`;
- SHA-256: `84e118a97e5725e3847cdfdd593873513021c790c63cc91a0d41fca2b5db2ed5`;
- tamaño: 9,540,133 bytes;
- referencia fuente: `Psa.23.1 (Heb: 23.1b)`;
- posiciones validadas: 03–06;
- palabras validadas: 4.

Las posiciones comienzan en 03 porque STEPBible distingue el encabezado hebreo del salmo. Para la interfaz, la secuencia visible del versículo contiene cuatro palabras; para trazabilidad se conserva el índice fuente 03–06.

### Juan 3:16

- archivo: `TAGNT Mat-Jhn - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt`;
- SHA-256: `ab8eaaeb68e17a1dcfa34e1e9350358f22f03bc2a97244d848750ad81044bc8e`;
- tamaño: 14,189,032 bytes;
- referencia fuente: `Jhn.3.16`;
- posiciones validadas: 01–26;
- palabras validadas: 26.

## Resultado de continuidad

La extracción automática verificó:

- Salmos 23:1: secuencia exacta `[3, 4, 5, 6]`;
- Juan 3:16: secuencia exacta `[1, 2, ..., 26]`;
- índices duplicados: 0;
- posiciones ausentes en las fuentes: 0;
- líneas con estructura inválida: 0.

Total fuente validado: 30 palabras.

## Comparación con Supabase

Estado actual de `biblical_word_occurrences`:

- filas existentes: 7;
- coincidencias exactas de posición, Strong y morfología: 2;
- filas en posición correcta que necesitan completar o corregir morfología: 4;
- posiciones fuente sin coincidencia exacta: 24;
- fila existente fuera de posición: 1.

### Corrección de posición

`πιστεύων` (`G4100`) está guardado como palabra 17 de Juan 3:16. La fuente lo identifica como palabra 18. La palabra 17 es el artículo `ὁ` (`G3588`).

### Morfología pendiente en filas existentes

- Salmos 23:1 #03, `יְהוָה`: `HNpt`;
- Salmos 23:1 #04, `רֹעִי`: `HVqrmsc/Sp1bs`;
- Salmos 23:1 #06, `אֶחְסָר`: `HVqi1cs`;
- Juan 3:16 #05, `θεὸς`: la fuente registra `N-NSM-T`, mientras la base contiene `N-NSM`.

### Datos nuevos necesarios

Después de mover `πιστεύων` a la posición 18:

- nuevas ocurrencias: 23;
- nuevas entradas léxicas únicas estimadas: 18;
- actualizaciones de ocurrencias existentes: 5;
- ocurrencias finales esperadas: 30;
- entradas léxicas finales esperadas para el piloto: 25.

## Política de forma fuente y visualización

STEPBible incluye marcas técnicas como:

- cantilación hebrea;
- separadores de morfemas `/`;
- escape de puntuación `\`;
- puntuación griega adjunta a la palabra.

Para no degradar la lectura en la interfaz:

- `surface_form` conservará una forma limpia y legible;
- `normalized_form` seguirá sin diacríticos para búsquedas;
- la forma exacta de STEPBible, transliteración de la ocurrencia, glosa fuente, testigos y notas de variante se conservarán en `metadata`;
- `source_locator`, `provider_version` y `content_hash` permitirán verificar cada fila.

## Variante explícita encontrada

Juan 3:16 #23 registra una diferencia de forma:

- lectura principal de la fila: `ἀλλ᾽`;
- nota de variantes: varias ediciones registran `ἀλλὰ`.

La aplicación deberá mostrarla como nota textual atribuida, no como cambio doctrinal ni como una segunda traducción inventada.

## Criterio para el siguiente paso

La fuente piloto queda validada como completa. El siguiente incremento puede preparar una migración idempotente que:

1. añada 18 entradas léxicas;
2. añada 23 ocurrencias;
3. corrija la posición de `G4100`;
4. complete cuatro códigos morfológicos existentes;
5. preserve formas fuente, testigos y variantes en metadatos;
6. valide al final exactamente 30 ocurrencias continuas.