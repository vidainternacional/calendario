# FASE D · Bloque 5 — Aplicación y auditoría del piloto de Roma

Fecha: 2026-08-03

## Alcance

Se aplicó en Supabase de producción únicamente el paquete fijado `rome-pilot-v1`, después de autorización explícita del usuario y de completar la validación reproducible del importador y su recuperación.

## Resultado

- 1 lugar: Roma;
- 1 periodo relativo;
- 2 eventos;
- 2 relaciones evento-lugar;
- 6 filas totales;
- todas las filas con `review_status = pending`;
- todas las filas con `enabled = false`;
- hash global del paquete: `67efcaa4e4cae2ec6f908f60a97850a1b7fd6ee223496fbc17438a87ea3a0550`.

## Integridad

Los hashes individuales de lugar, periodo, eventos y relaciones coinciden con el paquete validado. La fuente Pleiades y los dos fragmentos contextuales requeridos permanecen intactos.

## Seguridad

- RLS permanece habilitada;
- `anon` no tiene acceso;
- `authenticated` solo conserva lectura de contenido aprobado y habilitado;
- las seis filas nuevas son invisibles para usuarios normales;
- `service_role` conserva la administración;
- no se conectó la interfaz ni se habilitó contenido.

## Recuperación

La recuperación operativa permanece en `supabase/recovery/20260803162000_recover_rome_pilot_v1.sql` y solo permite eliminar filas mientras sigan pendientes, deshabilitadas y con el hash fijado.

## Vercel

Vercel volvió a aceptar compilaciones y existen deployments de producción en estado `READY`. Este hito no introduce una interfaz visible nueva; los datos permanecen ocultos hasta una revisión y autorización posterior.
