# FASE D · Bloque 5 — Preflight de importación de Roma

Fecha: 2026-08-03

## Alcance

Inspección de solo lectura realizada después de fusionar el PR #155 y antes de cualquier ejecución de `rome-pilot-v1` en Supabase.

## Evidencia de repositorio

- PR #155 fusionado.
- Commit de fusión: `c6b48c87bf3277e8b01ff633eaa60223c50765de`.
- Importación activa revisable: `supabase/migrations/20260803162000_import_rome_pilot_v1.sql`.
- Recuperación operativa: `supabase/recovery/20260803162000_recover_rome_pilot_v1.sql`.
- CI temporal: `success`.
- Matriz PostgreSQL 17 de esquema, paquete, importación idempotente y recuperación: `success`.

## Estado comprobado en Supabase

Proyecto: `calendariovida` (`atjtjpchslxbseayzflz`).

Conteos actuales:

- `biblical_places`: 0;
- `biblical_timeline_periods`: 0;
- `biblical_timeline_events`: 0;
- `biblical_timeline_event_places`: 0;
- filas con `metadata.package_key = 'rome-pilot-v1'`: 0 en las cuatro tablas.

Dependencias del paquete:

- fuente `pleiades-gazetteer`: exactamente 1 coincidencia aprobada, habilitada y con licencia verificada;
- fragmentos `roma-capital-romanos` y `roma-capital-hechos-28`: exactamente 2 coincidencias aprobadas, habilitadas y con hashes esperados.

Seguridad:

- RLS habilitada en las cuatro tablas;
- `anon` sin `SELECT`;
- `authenticated` con `SELECT` y sin `INSERT`;
- `service_role` con escritura administrativa.

## Resultado

El preflight queda aprobado. La base está limpia para una eventual importación controlada del paquete piloto, pero esta evidencia no autoriza la escritura.

## Bloqueo vigente

No ejecutar la migración `20260803162000_import_rome_pilot_v1.sql`, `supabase db push` ni SQL equivalente sin autorización explícita posterior del usuario. Si se autoriza, aplicar únicamente el paquete fijado, auditar inmediatamente conteos, hashes, estados `pending`, `enabled = false`, UUID, RLS e invisibilidad, y detenerse ante cualquier diferencia. No conectar la interfaz ni avanzar al Bloque 6.
