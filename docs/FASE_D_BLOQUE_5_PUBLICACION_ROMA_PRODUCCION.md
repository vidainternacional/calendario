# FASE D · Bloque 5 — Publicación del piloto de Roma en producción

Fecha: 2026-08-03

El usuario autorizó continuar con la publicación controlada del paquete `rome-pilot-v1` en producción.

## Migración aplicada

- archivo: `supabase/migrations/20260803170000_publish_rome_pilot_v1.sql`;
- nombre aplicado en Supabase: `publish_rome_pilot_v1`;
- proyecto: `calendariovida`;
- resultado: `success`.

## Resultado auditado

Se publicaron exclusivamente las seis filas fijadas:

- 1 lugar (`roma`);
- 1 periodo (`roma-romanos-hechos-28`);
- 2 eventos;
- 2 relaciones evento-lugar.

Estado final:

- `review_status = approved`;
- `enabled = true`;
- hashes individuales coincidentes;
- 0 filas fijadas en estado incorrecto.

## Seguridad confirmada

Las cuatro tablas mantienen:

- RLS habilitada;
- una política efectiva de lectura por tabla;
- `anon` sin `SELECT`;
- `authenticated` con `SELECT`;
- `authenticated` sin `INSERT`, `UPDATE` ni `DELETE`;
- recuperación operativa disponible en `supabase/recovery/20260803170000_unpublish_rome_pilot_v1.sql`.

La publicación no conectó todavía la interfaz, no modificó otros paquetes y no avanzó al Bloque 6.
