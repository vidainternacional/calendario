# FASE D · Bloque 5 — Plan de recuperación de la migración de Roma

Fecha: 2026-08-03

## Estado

La migración activa `20260803150000_biblical_chronologies_maps_schema.sql` está preparada únicamente para revisión en el repositorio. No está autorizada para aplicarse a Supabase.

## Condiciones previas a cualquier aplicación

1. CI temporal en `success`.
2. Validación PostgreSQL 17 en `success`.
3. Confirmación de que el cuerpo SQL coincide con la candidata auditada.
4. Inspección previa de ausencia de las cuatro tablas en producción.
5. Snapshot de políticas, privilegios, extensiones y versión de PostgreSQL.
6. Autorización expresa posterior en `__VIDA_INTERNACIONAL.md`.

## Recuperación antes de importar datos

Como el esquema se crea vacío, la recuperación segura consiste en eliminar los objetos en orden inverso si la auditoría posterior falla:

```sql
begin;

drop table if exists public.biblical_timeline_event_places;
drop table if exists public.biblical_timeline_events;
drop table if exists public.biblical_timeline_periods;
drop table if exists public.biblical_places;

commit;
```

Este SQL no debe ejecutarse automáticamente. Solo se utilizará después de confirmar que las tablas continúan vacías y que ninguna función o vista externa depende de ellas.

## Recuperación después de importar datos

No está autorizada en este hito. Antes de importar Roma deberá existir:

- exportación verificable de las filas piloto;
- conteos y hashes esperados;
- importador idempotente;
- procedimiento de deshabilitación lógica antes de eliminar datos;
- auditoría de dependencias y referencias;
- aprobación específica en el documento maestro.

## Riesgo controlado

La presencia del archivo dentro de `supabase/migrations` no equivale a autorización de despliegue. Mientras el documento maestro no cambie, queda prohibido ejecutar `supabase db push`, aplicar la migración desde el panel o invocar SQL equivalente en producción.
