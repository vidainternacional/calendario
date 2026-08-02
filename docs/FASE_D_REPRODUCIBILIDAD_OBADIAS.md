# FASE D · Bloque 4 — Reproducibilidad del paquete de Obadías

Fecha: 2026-08-02

El paquete `oba.json.gz` fue generado dos veces en ejecuciones independientes del workflow `Validar paquete TAHOT de Obadías`.

## Ejecución 1

- run: `30769458797`;
- commit: `14bb74cd3a87e4e8847c6faa48861e5d62274745`;
- tamaño del paquete: 55,413 bytes;
- SHA-256: `b49dee68303e243c0c2ef4ff3366cbd955a4a8a9b14114eb761a8f174e25940e`.

## Ejecución 2

- run: `30769579598`;
- commit: `e5797aa34eef823f37179be47329f639bec278fb`;
- tamaño del paquete: 55,413 bytes;
- SHA-256: `b49dee68303e243c0c2ef4ff3366cbd955a4a8a9b14114eb761a8f174e25940e`.

## Comparación independiente

Después de descargar ambos artefactos se confirmó:

- bytes de `oba.json.gz`: idénticos;
- contenido de `manifest.json`: idéntico;
- tamaño: idéntico;
- SHA-256 interno: idéntico;
- conteos y hashes por versículo: idénticos.

El ZIP creado por GitHub Actions puede tener un digest diferente debido al contenedor del artefacto, pero el paquete bíblico interno y su manifiesto son deterministas.

La reproducibilidad se obtiene mediante:

- JSON ordenado de forma estable;
- normalización Unicode NFC;
- `gzip.GzipFile` con `mtime=0`;
- nombre interno de gzip vacío;
- fuente fijada por commit y SHA-256.

Este documento no autoriza todavía la importación a Supabase. El siguiente control es verificar la compatibilidad del paquete con el modelo textual existente.
