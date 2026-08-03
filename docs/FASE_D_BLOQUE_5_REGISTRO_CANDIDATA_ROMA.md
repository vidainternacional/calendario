# FASE D · Bloque 5 — Registro de candidata de Roma

Fecha: 2026-08-03

La candidata SQL del piloto de Roma fue validada fuera de producción en PostgreSQL 17 mediante el PR #137 y el commit de fusión `1cbb740c94ab958da27c8ddcc572120efed087de`.

Validaciones aprobadas:

- estructura vacía de lugares, periodos, eventos y relaciones;
- restricciones de coordenadas, referencias, fechas y hashes;
- privilegios y RLS;
- triggers `updated_at`;
- rechazo de entradas inválidas;
- lectura autenticada;
- aislamiento fuera de `supabase/migrations`.

No se aplicó DDL a Supabase, no se importaron datos y no se modificó producción.

El siguiente incremento autorizado es preparar una migración activa revisable con esquema vacío y plan de recuperación, sin aplicarla todavía a Supabase.
