# FASE D · Bloque 5 — Auditoría previa a aplicación de Roma

Fecha: 2026-08-03

## Migración activa

El PR #142 fue fusionado mediante el commit `936f1a1b1f06e4b3db7aca13e3e909e7c6c6aee6`.

La migración activa revisable quedó versionada en:

- `supabase/migrations/20260803150000_biblical_chronologies_maps_schema.sql`;
- `docs/FASE_D_BLOQUE_5_PLAN_RECUPERACION_MIGRACION_ROMA.md`.

Validaciones aprobadas:

- CI temporal en `success`;
- workflow de PostgreSQL 17 en `success`;
- equivalencia con la candidata auditada;
- cuatro tablas vacías;
- ausencia de `insert`, `update` y `delete` embebidos;
- plan de recuperación documentado.

## Inspección de producción en modo lectura

Proyecto: `calendariovida`.

Resultado:

- PostgreSQL: 17.6;
- `public.biblical_places`: no existe;
- `public.biblical_timeline_periods`: no existe;
- `public.biblical_timeline_events`: no existe;
- `public.biblical_timeline_event_places`: no existe;
- `extensions.moddatetime`: disponible;
- `public.cuenta_activa`: disponible.

No se ejecutó DDL, no se aplicó la migración y no se importaron datos.

## Bloqueo de seguridad

El siguiente paso sería aplicar el esquema vacío a Supabase y auditar inmediatamente tablas, RLS, privilegios, triggers y recuperación. Esa escritura afecta producción y requiere autorización explícita del usuario antes de ejecutarse.
