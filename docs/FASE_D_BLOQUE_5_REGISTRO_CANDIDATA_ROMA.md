# FASE D · Bloque 5 — Registro de candidata de Roma

Fecha: 2026-08-03

Este documento acompaña el registro del hito en `__VIDA_INTERNACIONAL.md`.

La candidata SQL del piloto de Roma fue validada fuera de producción en PostgreSQL 17 mediante el PR #137 y el commit de fusión `1cbb740c94ab958da27c8ddcc572120efed087de`.

No se aplicó DDL a Supabase, no se importaron datos y la candidata permanece fuera de `supabase/migrations`.

El siguiente incremento autorizado es preparar una migración activa revisable con esquema vacío y plan de recuperación, sin aplicarla todavía a Supabase.
