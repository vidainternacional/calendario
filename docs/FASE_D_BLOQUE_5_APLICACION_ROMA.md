# FASE D · Bloque 5 — Aplicación del esquema de Roma

Fecha: 2026-08-03

El esquema vacío de cronologías y mapas fue aplicado en Supabase después de la autorización explícita del usuario.

Resultado:

- migración `biblical_chronologies_maps_schema` aplicada;
- versión Supabase `20260803151613`;
- cuatro tablas creadas y todavía vacías;
- RLS habilitada en las cuatro tablas;
- una política `SELECT` por tabla para `authenticated`;
- `anon` sin acceso;
- `authenticated` únicamente con `SELECT`;
- `service_role` con administración;
- un trigger `updated_at` por tabla;
- cero datos de Roma importados.

El Performance Advisor detectó dos claves foráneas sin índice. La migración `index_biblical_chronologies_maps_foreign_keys` fue aplicada y dejó disponibles:

- `biblical_timeline_event_places_source_id_idx`;
- `biblical_timeline_events_end_book_code_idx`.

No se conectó la interfaz ni se avanzó al Bloque 6.
