# FASE D · Bloque 4 — Esquema observado de TAHOT

Fecha: 2026-08-02

## Objetivo

Interpretar de forma verificable la estructura tabulada de TAHOT antes de convertir sus filas en palabras, morfemas, variantes o textos completos del Antiguo Testamento.

## Alcance de este incremento

Este incremento solo inspecciona:

- nombres exactos y orden de las columnas;
- variantes de encabezado;
- cantidad de campos por fila;
- estados incluidos en la referencia fuente;
- patrones de columnas no vacías en filas continuadas;
- ejemplos completos de filas normales y continuadas;
- referencias de control hebreas y arameas.

Referencias de control:

- Génesis 1:1;
- Salmos 23:1;
- Esdras 4:8;
- Daniel 2:4.

## Criterios

- No se asignará semántica a una columna solo por su posición.
- No se asumirá que toda fila continuada sea un morfema.
- No se inferirá hebreo o arameo únicamente por el libro.
- Ketiv y Qere se conservarán separados cuando la fuente los marque.
- Los encabezados repetidos no se tratarán como contenido bíblico.
- Cada muestra conservará número de línea, referencia heredada, patrón y valores originales.

## Implementación

`scripts/stepbible/inspect_ot_schema.py` descarga los cuatro archivos ya fijados por SHA-256 y genera:

- `schema-observation.json` con encabezados, patrones, conteos y muestras;
- `schema-observation.md` con un resumen legible;
- artefacto temporal de GitHub Actions.

## Seguridad

- proceso de solo lectura;
- no modifica Supabase;
- no importa datos;
- no cambia la interfaz;
- no modifica producción;
- no consulta un proveedor de IA.

## Criterio de cierre

Este incremento podrá cerrarse cuando:

1. los cuatro archivos compartan un encabezado interpretable o sus diferencias estén documentadas;
2. todos los estados de fila explícita estén inventariados;
3. los principales patrones de filas continuadas tengan muestras con nombres de columna;
4. las referencias hebreas y arameas puedan reconstruirse sin perder filas;
5. Ketiv/Qere pueda modelarse sin mezclar lectura escrita y lectura pronunciada.

Después se implementará el parser por libro y se probará con un libro pequeño antes de importar contenido a Supabase.
