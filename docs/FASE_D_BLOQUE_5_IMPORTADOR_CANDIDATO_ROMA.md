# FASE D · Bloque 5 — Importador candidato de Roma

Fecha: 2026-08-03

## Alcance

Se preparó un importador SQL candidato para el paquete `rome-pilot-v1`. Los archivos permanecen fuera de `supabase/migrations` y no están autorizados para producción.

Archivos:

- `docs/sql-candidates/FASE_D_BLOQUE_5_ROMA_DATA_IMPORT_CANDIDATE.sql`;
- `docs/sql-candidates/FASE_D_BLOQUE_5_ROMA_DATA_RECOVERY_CANDIDATE.sql`;
- `scripts/fase_d/validate_rome_data_import_candidate.sql`.

## Controles del importador

Antes de escribir, el candidato exige:

- fuente `pleiades-gazetteer` aprobada y habilitada;
- proveedor y referencia correctos;
- licencia verificada y atribución CC BY 3.0;
- versión de fuente fijada;
- fragmentos `roma-capital-romanos` y `roma-capital-hechos-28` con hashes exactos;
- catálogo canónico aprobado para Romanos y Hechos;
- ausencia de colisiones de slugs con otros paquetes.

La carga:

- se ejecuta dentro de una transacción;
- resuelve UUID mediante slugs;
- utiliza `upsert` idempotente;
- conserva `review_status = pending`;
- conserva `enabled = false`;
- marca cada fila con `package_key` y `package_hash`;
- verifica los conteos 1 lugar, 1 periodo, 2 eventos y 2 relaciones;
- aborta ante cualquier diferencia.

## Recuperación

La candidata de recuperación elimina en orden:

1. relaciones evento-lugar;
2. eventos;
3. periodos;
4. lugares.

Solo actúa sobre el paquete y hash fijados. Se cancela si detecta:

- otra versión del paquete;
- filas aprobadas;
- filas habilitadas.

No elimina la fuente Pleiades, los fragmentos contextuales ni el catálogo bíblico.

## Matriz de validación

PostgreSQL 17 debe comprobar:

- primera importación con conteos exactos;
- invisibilidad para `authenticated` por RLS;
- segunda importación sin duplicados y con los mismos UUID;
- recuperación completa;
- segunda recuperación sin efectos;
- preservación de fuente y fragmentos.

No se ha ejecutado este importador en Supabase.
