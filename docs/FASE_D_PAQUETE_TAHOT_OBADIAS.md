# FASE D · Bloque 4 — Paquete TAHOT de Obadías

Fecha: 2026-08-02

## Objetivo

Generar el primer paquete textual completo del Antiguo Testamento usando el contrato TAHOT ya validado, sin importar todavía contenido a Supabase.

## Por qué Obadías

Obadías permite auditar un libro entero con un alcance reducido:

- un capítulo;
- 21 versículos;
- una sola fuente TAHOT;
- volumen suficiente para comprobar texto, morfología, variantes, orden y hashes sin ejecutar todavía una carga masiva.

Este paquete no define por sí solo todos los casos del Antiguo Testamento. Los casos arameos, Qere/Ketiv complejos, restauraciones y adiciones reconstruidas desde la LXX continuarán cubiertos por el contrato general y por paquetes posteriores.

## Contenido del paquete

Por cada fila fuente se conserva:

- referencia inglesa;
- referencia hebrea alternativa cuando exista;
- índice fuente sin perder ceros iniciales;
- tipo textual L, Q, R o X;
- idioma determinado desde `Grammar`;
- forma hebrea visible y puntuación;
- transliteración;
- glosa inglesa de la fuente;
- componentes alineados de texto, transliteración, traducción, dStrong y morfología;
- variantes de significado y ortografía;
- dStrong raíz, alternativo y etiquetas expandidas;
- las doce columnas activas originales;
- número de línea y SHA-256 de la línea.

Por cada versículo se genera:

- texto original ensamblado;
- transliteración ensamblada;
- secuencia de glosas inglesas;
- filas ordenadas según la fuente;
- conteo de palabras visibles y componentes;
- variantes y diferencias de alineación;
- hash estable del contenido.

## Validaciones obligatorias

- exactamente 21 referencias, de Obadías 1:1 a 1:21;
- 17 columnas en cada fila y columnas 13–17 vacías;
- solo hebreo, arameo o una omisión Qere reconocida;
- ningún hash inválido;
- ningún dato silenciosamente descartado;
- artefacto JSON comprimido con SHA-256;
- manifiesto y auditoría legible.

Las diferencias de cantidad entre componentes no se corrigen automáticamente. Se cuentan y conservan para revisión antes de definir la transformación definitiva.

## Archivos

- `scripts/stepbible/extract_ot_book.py`;
- `.github/workflows/validate-stepbible-obadiah-package.yml`.

Artefactos temporales:

- `oba.json.gz`;
- `manifest.json`;
- `audit.md`.

## Seguridad

- proceso de solo lectura;
- no modifica Supabase;
- no cambia la interfaz;
- no modifica producción;
- no utiliza proveedores de IA;
- no publica los archivos TAHOT completos.

## Criterio para importar

Obadías no se importará a Supabase hasta que:

1. las 21 referencias estén completas;
2. el texto ensamblado coincida con las filas fuente;
3. las diferencias de alineación hayan sido explicadas;
4. variantes y tipos textuales estén preservados;
5. los hashes y conteos sean reproducibles;
6. la estructura sea compatible con el modelo textual existente.
